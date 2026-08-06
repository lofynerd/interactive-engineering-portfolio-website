# Break-It Demo — Self-Healing Infrastructure

This is a **self-contained, isolated** piece of infrastructure that powers the
"Break Something" live demo on the portfolio homepage. It is intentionally
kept completely separate from any production workload (Tomasi, the AI
Analytics Assistant, etc.) — nothing here can affect those services, and
nothing in those services can affect this demo.

## What it does

1. A single ECS Fargate service (2 tasks) sits behind a small internal
   Application Load Balancer, serving a trivial `/health` endpoint.
2. The public **"Break Something"** button on the site calls an API Gateway
   endpoint → Lambda → `ecs:StopTask` on **one** randomly chosen task in
   **this** service only (IAM-scoped to this service's task ARNs).
3. ECS's own scheduler notices the task is gone and starts a replacement —
   this *is* the "self-healing" behavior; there's no custom orchestration.
4. EventBridge captures ECS task state-change events for this cluster and
   writes them to DynamoDB, which is what the frontend polls to render the
   live "break → reschedule → healthy" event log and the running
   break/heal counters.
5. A status Lambda (behind the same API) reports current desired/running
   task counts and recent latency so the UI can show "3/3 healthy" style
   copy.
6. EventBridge Scheduler scales the service to `desired_task_count` at
   9am IST and down to 0 tasks at 9pm IST every day (both configurable),
   so the demo is only "live" during the site's stated hours — this is
   the primary cost control, since the ALB's hourly cost is the dominant
   line item either way.
7. API Gateway has usage-plan throttling + an AWS WAFv2 Web ACL with a
   rate-based rule (plus AWS-managed core rule set and anonymous-IP
   list rules) in front of it, so the break-it endpoint can't be
   hammered into a cost or availability problem.
8. A scheduled `cost_sync` Lambda pulls actual month-to-date spend for
   this stack (filtered by its `Project` cost allocation tag) from Cost
   Explorer every 4 hours and caches it in DynamoDB. A public `GET /cost`
   endpoint serves that cache — this powers the live FinOps panel shown
   alongside the demo. Cost Explorer bills $0.01/request, so calling it
   from every page load would be both slow and needlessly expensive;
   caching is itself part of the FinOps story.
9. Every break → provisioning → healthy transition is written to a
   DynamoDB event log (via the EventBridge rule + `event_logger`
   Lambda) and rolled up into lifetime "times broken" / "times healed"
   counters, both surfaced in the UI.
10. The frontend fires PostHog events for every stage of the demo
    (viewed, clicked, result, healed, skipped) — see
    `src/lib/analytics.js` — so session replays show exactly how many
    visitors tried it and what happened.

## Isolation / blast radius

- Dedicated VPC, dedicated ECS cluster, dedicated ALB — not shared with any
  other workload.
- The `break_task` Lambda's IAM role can call `ecs:StopTask` **only** when
  the target task's cluster ARN matches this demo cluster (enforced via an
  IAM condition on `ecs:cluster`), and `ecs:ListTasks`/`DescribeServices`
  scoped to this one service.
- No other Lambda, and no part of this stack, has any permission that
  touches production resources.
- Per-IP + global rate limiting at the WAF layer, plus a short per-IP
  cooldown enforced inside the Lambda itself (backed by DynamoDB), so a
  single visitor (or a script) can't repeatedly trigger breaks.
- The demo service runs on Fargate Spot — if it gets reclaimed, ECS just
  reschedules it, which is itself an on-brand demonstration and keeps cost
  down (~70% cheaper than on-demand Fargate).

## Cost controls

- Fargate Spot pricing for the two demo tasks.
- Scale-to-zero outside 9am–9pm IST via EventBridge Scheduler — no
  compute or running-task cost while the demo is stated as offline. This
  window is displayed on the site itself.
- API Gateway usage plan caps total requests/day regardless of WAF.
- CloudWatch Logs retention capped (14 days) to avoid unbounded log
  storage cost.
- Budget alarm (see `budget.tf`) emails you if the demo's tagged spend
  exceeds a threshold for the month (default budget: $25/mo; estimated
  actual spend for a 9am–9pm IST window is ~$15–17/mo, dominated by the
  ALB's fixed hourly cost — see cost breakdown in project chat history).
- Cost Explorer sync runs every 4 hours, not per-request (~$1.80/mo at
  6 syncs/day vs. $0.01 per direct call).

## Frontend integration

Set these before building the site:

```
REACT_APP_BREAK_IT_API_URL=<api_endpoint output, no trailing slash>
REACT_APP_BREAK_IT_API_KEY=<api_key_value output>
```

If `REACT_APP_BREAK_IT_API_URL` is unset (e.g. local dev), the
`BreakItDemo` gate component detects this and skips itself automatically
— it never blocks access to the rest of the site.

## Layout

```
infra/break-it-demo/
├── main.tf              # provider, shared locals
├── network.tf            # dedicated VPC, subnets, routing
├── ecs.tf                # cluster, task def, service, ALB
├── iam.tf                # tightly-scoped roles for each Lambda + ECS task
├── lambda.tf             # Lambda function resources
├── apigateway.tf          # HTTP API + routes + usage plan/throttling
├── waf.tf                 # WAFv2 Web ACL + rate-based rule
├── dynamodb.tf            # event log + rate-limit table
├── eventbridge.tf         # ECS state-change rule -> event logger Lambda
├── scheduler.tf           # scale-to-zero / scale-up schedules (IST)
├── budget.tf              # AWS Budgets cost alarm
├── variables.tf
├── outputs.tf
└── lambda/
    ├── break_task/        # POST /break
    ├── status/             # GET /status
    ├── event_logger/       # EventBridge target, writes DynamoDB
    └── scheduler/          # sets ECS desired count (used by EventBridge Scheduler)
```

## Deploying

This has **not** been applied. To deploy:

```bash
cd infra/break-it-demo
terraform init
terraform plan   # review carefully
terraform apply
```

You'll need AWS credentials for the `167611893897` account (same account as
the rest of the portfolio infra) with permission to create VPC/ECS/Lambda/
API Gateway/WAF/DynamoDB/EventBridge/Budgets resources.

After applying, take the `api_endpoint` output and set it as
`REACT_APP_BREAK_IT_API_URL` in the site's environment before building.
