// EventBridge Scheduler target, invoked twice a day (scale-up at
// scale_up_hour_ist, scale-down at scale_down_hour_ist). The desired
// count and direction are passed in as the scheduler's input payload, so
// this single Lambda handles both directions.
//
// IAM: this role can ONLY call ecs:UpdateService, and ONLY scoped to the
// demo cluster (see iam.tf) — it cannot create/delete services or touch
// any other cluster.

const { ECSClient, UpdateServiceCommand } = require('@aws-sdk/client-ecs')

const REGION = process.env.AWS_REGION
const CLUSTER_ARN = process.env.ECS_CLUSTER_ARN
const SERVICE_NAME = process.env.ECS_SERVICE_NAME

const ecs = new ECSClient({ region: REGION })

exports.handler = async (event) => {
  const desiredCount = typeof event?.desiredCount === 'number' ? event.desiredCount : 0

  await ecs.send(
    new UpdateServiceCommand({
      cluster: CLUSTER_ARN,
      service: SERVICE_NAME,
      desiredCount,
    })
  )

  console.log(`Set desiredCount=${desiredCount} on ${SERVICE_NAME}`)
  return { statusCode: 200, desiredCount }
}
