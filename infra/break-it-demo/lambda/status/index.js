// GET /status
//
// Read-only. Reports current ECS service health (desired/running/pending
// task counts) and the lifetime break/heal counters, plus the most recent
// events for the frontend's recovery log. Polled by the browser every
// couple of seconds while the demo panel is open.

const { ECSClient, DescribeServicesCommand } = require('@aws-sdk/client-ecs')
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')

const REGION = process.env.AWS_REGION
const CLUSTER_ARN = process.env.ECS_CLUSTER_ARN
const SERVICE_NAME = process.env.ECS_SERVICE_NAME
const EVENTS_TABLE = process.env.EVENTS_TABLE
const COUNTERS_TABLE = process.env.COUNTERS_TABLE
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)

const ecs = new ECSClient({ region: REGION })
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
    const [serviceResult, countersResult, eventsResult] = await Promise.all([
      ecs.send(
        new DescribeServicesCommand({ cluster: CLUSTER_ARN, services: [SERVICE_NAME] })
      ),
      ddb.send(new GetCommand({ TableName: COUNTERS_TABLE, Key: { id: 'lifetime' } })),
      ddb.send(
        new QueryCommand({
          TableName: EVENTS_TABLE,
          KeyConditionExpression: 'pk = :pk',
          ExpressionAttributeValues: { ':pk': 'EVENT' },
          ScanIndexForward: false, // most recent first
          Limit: 25,
        })
      ),
    ])

    const service = serviceResult.services?.[0]
    const online = !!service && service.desiredCount > 0

    return respond(
      200,
      {
        online,
        desiredCount: service?.desiredCount ?? 0,
        runningCount: service?.runningCount ?? 0,
        pendingCount: service?.pendingCount ?? 0,
        timesBroken: countersResult.Item?.timesBroken ?? 0,
        timesHealed: countersResult.Item?.timesHealed ?? 0,
        recentEvents: (eventsResult.Items || []).map((item) => ({
          type: item.eventType,
          taskArn: item.taskArn,
          reason: item.reason,
          at: item.at,
        })),
      },
      origin
    )
  } catch (err) {
    console.error('status lambda failed', err)
    return respond(500, { error: 'internal_error' }, origin)
  }
}
