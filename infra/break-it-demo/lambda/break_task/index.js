// POST /break
//
// Picks one running task in the demo ECS service and stops it. ECS's own
// scheduler then starts a replacement automatically — that recovery is
// the "self-healing" behavior being demonstrated. This function does not
// (and cannot, per its IAM policy) touch anything outside the demo
// cluster.
//
// Abuse/cost protection, in order:
//   1. API Gateway usage plan (daily quota, burst/rate limit) — configured
//      in Terraform, not here.
//   2. AWS WAF rate-based rule in front of the API — configured in
//      Terraform, not here.
//   3. Per-IP cooldown enforced here via DynamoDB conditional writes, so
//      even a single IP that's under the WAF threshold can't spam breaks.

const {
  ECSClient,
  ListTasksCommand,
  StopTaskCommand,
} = require('@aws-sdk/client-ecs')
const {
  DynamoDBClient,
} = require('@aws-sdk/client-dynamodb')
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb')
const crypto = require('crypto')

const REGION = process.env.AWS_REGION
const CLUSTER_ARN = process.env.ECS_CLUSTER_ARN
const SERVICE_NAME = process.env.ECS_SERVICE_NAME
const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE
const COUNTERS_TABLE = process.env.COUNTERS_TABLE
const COOLDOWN_SECONDS = parseInt(process.env.BREAK_COOLDOWN_SECONDS || '30', 10)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)

const ecs = new ECSClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '*'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
  }
}

function hashIp(ip) {
  // Store a hash rather than the raw IP address — enough to rate-limit
  // without retaining directly identifying data long-term.
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex')
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
  if (event.httpMethod === 'OPTIONS') {
    return respond(204, {}, origin)
  }

  // REST API (v1) puts the caller's IP at requestContext.identity.sourceIp,
  // not requestContext.http.sourceIp (that's the HTTP API/v2 shape).
  const sourceIp = event.requestContext?.identity?.sourceIp || 'unknown'
  const ipHash = hashIp(sourceIp)
  const now = Math.floor(Date.now() / 1000)

  // --- Per-IP cooldown, enforced with a conditional write so concurrent
  // requests from the same IP can't race past the check. ---
  try {
    await ddb.send(
      new PutCommand({
        TableName: RATE_LIMIT_TABLE,
        Item: {
          ipHash,
          lastBreakAt: now,
          expiresAt: now + COOLDOWN_SECONDS + 60, // TTL cleanup buffer
        },
        ConditionExpression:
          'attribute_not_exists(ipHash) OR lastBreakAt < :cutoff',
        ExpressionAttributeValues: {
          ':cutoff': now - COOLDOWN_SECONDS,
        },
      })
    )
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      const existing = await ddb.send(
        new GetCommand({ TableName: RATE_LIMIT_TABLE, Key: { ipHash } })
      )
      const retryAfter = Math.max(
        1,
        COOLDOWN_SECONDS - (now - (existing.Item?.lastBreakAt || now))
      )
      return respond(
        429,
        {
          error: 'cooldown',
          message: `Give it a moment — try again in ${retryAfter}s.`,
          retryAfterSeconds: retryAfter,
        },
        origin
      )
    }
    console.error('rate-limit check failed', err)
    return respond(500, { error: 'internal_error' }, origin)
  }

  // --- Pick a running task in the demo cluster/service and stop it. ---
  try {
    const { taskArns } = await ecs.send(
      new ListTasksCommand({
        cluster: CLUSTER_ARN,
        serviceName: SERVICE_NAME,
        desiredStatus: 'RUNNING',
      })
    )

    if (!taskArns || taskArns.length === 0) {
      return respond(
        409,
        {
          error: 'no_running_tasks',
          message:
            'The demo is currently offline (outside its scheduled hours) or scaling up — nothing to break right now.',
        },
        origin
      )
    }

    const target = taskArns[Math.floor(Math.random() * taskArns.length)]

    await ecs.send(
      new StopTaskCommand({
        cluster: CLUSTER_ARN,
        task: target,
        reason: 'break-it-demo: visitor-triggered chaos action',
      })
    )

    await ddb.send(
      new UpdateCommand({
        TableName: COUNTERS_TABLE,
        Key: { id: 'lifetime' },
        UpdateExpression:
          'SET timesBroken = if_not_exists(timesBroken, :zero) + :one',
        ExpressionAttributeValues: { ':zero': 0, ':one': 1 },
      })
    )

    return respond(
      202,
      {
        status: 'breaking',
        taskArn: target,
        message: 'Task stopped. Watch the recovery log below.',
      },
      origin
    )
  } catch (err) {
    console.error('break_task failed', err)
    return respond(500, { error: 'internal_error' }, origin)
  }
}
