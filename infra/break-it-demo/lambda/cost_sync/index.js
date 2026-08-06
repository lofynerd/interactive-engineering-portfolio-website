// Invoked on a schedule (every few hours, not per-request) to pull actual
// cost-by-service data for this stack from AWS Cost Explorer and cache it
// in DynamoDB. The public /cost endpoint just reads this cache — Cost
// Explorer's API bills $0.01 per request, so calling it from every page
// load would be both slow and needlessly expensive; caching is itself
// part of the FinOps story this panel is telling.

const {
  CostExplorerClient,
  GetCostAndUsageCommand,
} = require('@aws-sdk/client-cost-explorer')
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb')

const REGION = process.env.AWS_REGION
const COST_CACHE_TABLE = process.env.COST_CACHE_TABLE
const COST_TAG_VALUE = process.env.COST_TAG_VALUE || 'portfolio-break-it-demo'

const ce = new CostExplorerClient({ region: 'us-east-1' }) // Cost Explorer is a global/us-east-1 service
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

exports.handler = async () => {
  const end = new Date()
  const start = new Date()
  start.setDate(1) // month-to-date, resets the "this month so far" framing each month

  const result = await ce.send(
    new GetCostAndUsageCommand({
      TimePeriod: { Start: isoDate(start), End: isoDate(end) },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      Filter: {
        Tags: { Key: 'Project', Values: [COST_TAG_VALUE] },
      },
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    })
  )

  const group = result.ResultsByTime?.[0]
  const byService = (group?.Groups || [])
    .map((g) => ({
      service: g.Keys?.[0] || 'Unknown',
      amount: parseFloat(g.Metrics?.UnblendedCost?.Amount || '0'),
    }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const totalMonthToDate = byService.reduce((sum, entry) => sum + entry.amount, 0)

  await ddb.send(
    new PutCommand({
      TableName: COST_CACHE_TABLE,
      Item: {
        id: 'latest',
        totalMonthToDate: Math.round(totalMonthToDate * 100) / 100,
        byService: byService.map((entry) => ({
          service: entry.service,
          amount: Math.round(entry.amount * 100) / 100,
        })),
        currency: group?.Total?.UnblendedCost?.Unit || 'USD',
        periodStart: isoDate(start),
        periodEnd: isoDate(end),
        updatedAt: new Date().toISOString(),
      },
    })
  )

  console.log(`Cost cache updated: $${totalMonthToDate.toFixed(2)} month-to-date`)
  return { statusCode: 200 }
}
