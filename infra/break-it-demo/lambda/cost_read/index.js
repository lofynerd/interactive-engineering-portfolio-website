// GET /cost — read-only. Serves the cached cost snapshot written by
// cost_sync (see that function for why this reads from a cache instead
// of calling Cost Explorer directly on every request).

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb')

const REGION = process.env.AWS_REGION
const COST_CACHE_TABLE = process.env.COST_CACHE_TABLE
const MONTHLY_BUDGET_USD = parseFloat(process.env.MONTHLY_BUDGET_USD || '25')
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '*'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
  }
}

function respond(statusCode, body, origin) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    body: JSON.stringify(body),
  }
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || ''
  // REST API (v1) proxy integrations put the method on event.httpMethod,
  // not event.requestContext.http.method (that's the HTTP API/v2 shape).
  if (event.httpMethod === 'OPTIONS') return respond(204, {}, origin)

  try {
    const cached = await ddb.send(
      new GetCommand({ TableName: COST_CACHE_TABLE, Key: { id: 'latest' } })
    )

    if (!cached.Item) {
      return respond(
        200,
        {
          totalMonthToDate: 0,
          byService: [],
          monthlyBudget: MONTHLY_BUDGET_USD,
          updatedAt: null,
          note: 'Cost data has not synced yet — check back shortly.',
        },
        origin
      )
    }

    return respond(
      200,
      {
        totalMonthToDate: cached.Item.totalMonthToDate,
        byService: cached.Item.byService,
        currency: cached.Item.currency,
        monthlyBudget: MONTHLY_BUDGET_USD,
        periodStart: cached.Item.periodStart,
        periodEnd: cached.Item.periodEnd,
        updatedAt: cached.Item.updatedAt,
      },
      origin
    )
  } catch (err) {
    console.error('cost_read failed', err)
    return respond(500, { error: 'internal_error' }, origin)
  }
}
