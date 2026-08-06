// EventBridge target for ECS Task State Change events, scoped (via the
// EventBridge rule's event pattern) to just the demo cluster.
//
// Writes a row to the events table for the frontend's live recovery log,
// and increments the "timesHealed" counter whenever a task transitions to
// RUNNING with a healthy status — i.e. the moment a replacement task
// actually comes back up after a break.

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb')

const REGION = process.env.AWS_REGION
const EVENTS_TABLE = process.env.EVENTS_TABLE
const COUNTERS_TABLE = process.env.COUNTERS_TABLE
const EVENTS_TTL_DAYS = parseInt(process.env.EVENTS_TTL_DAYS || '30', 10)

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

function mapEventType(detail) {
  // The task definition doesn't configure a container-level health check,
  // so ECS's own healthStatus field stays UNKNOWN — the ALB target group
  // health check (separate from this event stream) is what actually
  // gates traffic. RUNNING is therefore treated as "healed": the
  // replacement task has successfully started after a break.
  if (detail.lastStatus === 'STOPPED') return 'task_stopped'
  if (detail.lastStatus === 'PENDING') return 'task_provisioning'
  if (detail.lastStatus === 'RUNNING') return 'task_healthy'
  return 'task_state_change'
}

exports.handler = async (event) => {
  const detail = event.detail || {}
  const eventType = mapEventType(detail)
  const now = Date.now()
  const nowSeconds = Math.floor(now / 1000)

  await ddb.send(
    new PutCommand({
      TableName: EVENTS_TABLE,
      Item: {
        pk: 'EVENT',
        sk: `${now}#${detail.taskArn || 'unknown'}`,
        eventType,
        taskArn: detail.taskArn,
        reason: detail.stoppedReason || null,
        at: new Date(now).toISOString(),
        expiresAt: nowSeconds + EVENTS_TTL_DAYS * 24 * 60 * 60,
      },
    })
  )

  if (eventType === 'task_healthy') {
    await ddb.send(
      new UpdateCommand({
        TableName: COUNTERS_TABLE,
        Key: { id: 'lifetime' },
        UpdateExpression:
          'SET timesHealed = if_not_exists(timesHealed, :zero) + :one',
        ExpressionAttributeValues: { ':zero': 0, ':one': 1 },
      })
    )
  }

  return { statusCode: 200 }
}
