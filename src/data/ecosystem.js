// Fixed-layout data model for the Engineering Architecture Explorer.
//
// This is NOT a force-directed graph. Every node has a hand-placed (x, y)
// coordinate in a fixed 1600x1000 canvas space. Node positions never
// change between renders/sessions — only the camera (pan/zoom) moves.
//
// Layout bands (top to bottom):
//   y ~ 80    Applications (largest nodes)
//   y ~ 300   AWS Platform (shared infrastructure)
//   y ~ 560   DevOps pipeline (horizontal strip)
//   y ~ 760   External services
//
// Every id is unique across the whole graph (nodes + services + external +
// pipeline) so hover/highlight/search logic can work off one flat lookup.

export const CANVAS_WIDTH = 1650
export const CANVAS_HEIGHT = 940

// ---------------------------------------------------------------------------
// Applications — the three real production systems (largest nodes)
// ---------------------------------------------------------------------------

export const applications = [
  {
    id: 'tomasi',
    kind: 'application',
    label: 'Tomasi E-Commerce Platform',
    shortLabel: 'Tomasi',
    emoji: '🛒',
    x: 260,
    y: 90,
    width: 300,
    height: 120,
    projectRef: 'tomasi-ecommerce',
    connections: [
      'route53',
      'cloudfront',
      'alb',
      'ecs',
      'iam',
      'cloudwatch',
      's3',
      'mongodb',
      'stripe',
    ],
  },
  {
    id: 'ai-assistant',
    kind: 'application',
    label: 'AI-Powered PostHog Analytics Assistant',
    shortLabel: 'AI Assistant',
    emoji: '🤖',
    x: 660,
    y: 90,
    width: 300,
    height: 120,
    projectRef: 'ai-insights-bot',
    connections: ['ecs', 'cloudwatch', 'iam', 'posthog', 's3'],
  },
  {
    id: 'image-pipeline',
    kind: 'application',
    label: 'Serverless Image Compression Pipeline',
    shortLabel: 'Image Pipeline',
    emoji: '⚡',
    x: 1060,
    y: 90,
    width: 300,
    height: 120,
    projectRef: 'image-compression-lambda',
    connections: ['s3', 'lambda', 'cloudwatch', 'iam'],
  },
]

// ---------------------------------------------------------------------------
// AWS Platform — shared infrastructure, each node exists exactly once
// ---------------------------------------------------------------------------

export const awsServices = [
  {
    id: 'route53',
    kind: 'aws',
    label: 'Amazon Route 53',
    shortLabel: 'Route53',
    category: 'Networking',
    purpose: 'Authoritative DNS routing traffic to the right origin.',
    x: 40,
    y: 300,
    usedBy: ['tomasi'],
    connections: ['cloudfront', 'acm'],
    resources: ['1 Hosted Zone', 'Health Checks'],
  },
  {
    id: 'cloudfront',
    kind: 'aws',
    label: 'Amazon CloudFront',
    shortLabel: 'CloudFront',
    category: 'Networking',
    purpose: 'Global CDN caching static assets close to visitors.',
    x: 214,
    y: 300,
    usedBy: ['tomasi'],
    connections: ['route53', 'acm', 'alb', 's3'],
    resources: ['1 Distribution', 'Edge Caching'],
  },
  {
    id: 'acm',
    kind: 'aws',
    label: 'AWS Certificate Manager',
    shortLabel: 'ACM',
    category: 'Networking',
    purpose: 'Provisions and renews TLS certificates for every public endpoint.',
    x: 388,
    y: 300,
    usedBy: ['tomasi'],
    connections: ['cloudfront', 'route53', 'alb'],
    resources: ['Managed TLS Certificates', 'Auto-Renewal'],
  },
  {
    id: 'alb',
    kind: 'aws',
    label: 'Application Load Balancer',
    shortLabel: 'ALB',
    category: 'Networking',
    purpose: 'Distributes incoming requests across healthy containers.',
    x: 562,
    y: 300,
    usedBy: ['tomasi'],
    connections: ['ecs', 'acm', 'cloudwatch'],
    resources: ['2 Target Groups', 'Health Checks'],
  },
  {
    id: 'ecs',
    kind: 'aws',
    label: 'Amazon ECS (Fargate)',
    shortLabel: 'ECS Fargate',
    category: 'Compute',
    purpose: 'Runs containerized workloads without managing servers. Shared by every deployed application.',
    x: 736,
    y: 300,
    usedBy: ['tomasi', 'ai-assistant'],
    connections: ['ecr', 'alb', 'iam', 'cloudwatch'],
    resources: ['2 Services', '4 Tasks', 'Docker Containers'],
  },
  {
    id: 'ecr',
    kind: 'aws',
    label: 'Elastic Container Registry',
    shortLabel: 'ECR',
    category: 'Compute',
    purpose: 'Stores and versions Docker images built by the CI/CD pipeline.',
    x: 910,
    y: 300,
    usedBy: ['tomasi', 'ai-assistant'],
    connections: ['ecs', 'iam', 'jenkins', 'docker'],
    resources: ['3 Repositories'],
  },
  {
    id: 's3',
    kind: 'aws',
    label: 'Amazon S3',
    shortLabel: 'S3',
    category: 'Storage',
    purpose: 'Object storage for static assets, media, and analytics snapshots.',
    x: 1084,
    y: 300,
    usedBy: ['tomasi', 'image-pipeline', 'ai-assistant'],
    connections: ['cloudfront', 'lambda', 'iam'],
    resources: ['4 Buckets', 'Lifecycle Policies'],
  },
  {
    id: 'lambda',
    kind: 'aws',
    label: 'AWS Lambda',
    shortLabel: 'Lambda',
    category: 'Compute',
    purpose: 'Serverless functions triggered by S3 upload events.',
    x: 1258,
    y: 300,
    usedBy: ['image-pipeline'],
    connections: ['s3', 'cloudwatch', 'iam'],
    resources: ['1 Function', 'S3 Event Trigger'],
  },
  {
    id: 'iam',
    kind: 'aws',
    label: 'AWS IAM',
    shortLabel: 'IAM',
    category: 'Security',
    purpose: 'Least-privilege access control used by every AWS service in the platform.',
    x: 1432,
    y: 300,
    usedBy: ['tomasi', 'ai-assistant', 'image-pipeline'],
    connections: ['ecs', 'lambda', 's3', 'ecr'],
    resources: ['Scoped Roles', 'Service Policies'],
  },
  {
    id: 'cloudwatch',
    kind: 'aws',
    label: 'Amazon CloudWatch',
    shortLabel: 'CloudWatch',
    category: 'Observability',
    purpose: 'Collects logs, metrics, and alarms from ECS, Lambda, and Jenkins.',
    x: 736,
    y: 440,
    usedBy: ['tomasi', 'ai-assistant', 'image-pipeline'],
    connections: ['alb', 'ecs', 'lambda', 'jenkins'],
    resources: ['Alarms', 'Dashboards', 'Log Groups'],
  },
  {
    id: 'ec2',
    kind: 'aws',
    label: 'Amazon EC2 (Jenkins Host)',
    shortLabel: 'EC2',
    category: 'Compute',
    purpose: 'Hosts the self-managed Jenkins server that runs every deployment.',
    x: 910,
    y: 440,
    usedBy: ['tomasi', 'ai-assistant'],
    connections: ['jenkins', 'iam', 'cloudwatch'],
    resources: ['1 Instance', 'Jenkins Server'],
  },
]

// ---------------------------------------------------------------------------
// DevOps pipeline — horizontal strip, permanently visible
// ---------------------------------------------------------------------------

export const pipeline = [
  {
    id: 'github',
    kind: 'pipeline',
    label: 'GitHub',
    subtitle: 'Source control',
    purpose: 'Hosts application source code and triggers deployments on push.',
    x: 60,
    y: 620,
    connections: ['webhook'],
  },
  {
    id: 'webhook',
    kind: 'pipeline',
    label: 'GitHub Webhook',
    subtitle: 'Event trigger',
    purpose: 'Notifies Jenkins the moment new code lands on the deploy branch.',
    x: 260,
    y: 620,
    connections: ['github', 'jenkins'],
  },
  {
    id: 'jenkins',
    kind: 'pipeline',
    label: 'Jenkins',
    subtitle: 'Hosted on EC2',
    purpose: 'Runs the build, test, and deployment pipeline for every application.',
    x: 460,
    y: 620,
    relatedAws: 'ec2',
    connections: ['webhook', 'docker', 'ec2'],
  },
  {
    id: 'docker',
    kind: 'pipeline',
    label: 'Docker Build',
    subtitle: 'Image build',
    purpose: 'Builds a versioned container image from the latest source.',
    x: 660,
    y: 620,
    connections: ['jenkins', 'ecr'],
  },
  {
    id: 'ecr-deploy',
    kind: 'pipeline',
    label: 'Amazon ECR',
    subtitle: 'Image registry',
    purpose: 'Receives and stores the freshly built Docker image.',
    x: 860,
    y: 620,
    relatedAws: 'ecr',
    connections: ['docker', 'ecs-deploy'],
  },
  {
    id: 'ecs-deploy',
    kind: 'pipeline',
    label: 'Amazon ECS',
    subtitle: 'Rolling deployment',
    purpose: 'Rolls the new image out across running services with zero downtime.',
    x: 1060,
    y: 620,
    relatedAws: 'ecs',
    deploysTo: ['tomasi', 'ai-assistant'],
    connections: ['ecr-deploy', 'tomasi', 'ai-assistant'],
  },
]

// ---------------------------------------------------------------------------
// External services — visually distinct from AWS
// ---------------------------------------------------------------------------

export const externalServices = [
  {
    id: 'mongodb',
    kind: 'external',
    label: 'MongoDB Atlas',
    shortLabel: 'MongoDB Atlas',
    category: 'Managed Database',
    purpose: 'Fully managed document database for product, order, and user data.',
    x: 260,
    y: 800,
    usedBy: ['tomasi'],
    connections: ['stripe'],
    resources: ['1 Cluster', 'Automated Backups'],
  },
  {
    id: 'stripe',
    kind: 'external',
    label: 'Stripe',
    shortLabel: 'Stripe',
    category: 'Payments',
    purpose: 'Handles checkout, payment processing, and order fulfillment.',
    x: 460,
    y: 800,
    usedBy: ['tomasi'],
    connections: ['mongodb'],
    resources: ['Payment Intents', 'Webhooks'],
  },
  {
    id: 'posthog',
    kind: 'external',
    label: 'PostHog',
    shortLabel: 'PostHog',
    category: 'Product Analytics',
    purpose: 'Source of product analytics events consumed by the AI insight engine.',
    x: 700,
    y: 800,
    usedBy: ['ai-assistant'],
    connections: [],
    resources: ['HogQL Queries', 'Event Warehouse'],
  },
]

// ---------------------------------------------------------------------------
// Flat lookups + explicit edge list (built once from the connection arrays
// above so every node's "connections" only needs to be declared in one
// direction — edges are deduplicated automatically).
// ---------------------------------------------------------------------------

export const allNodes = [...applications, ...awsServices, ...pipeline, ...externalServices]
export const nodeById = Object.fromEntries(allNodes.map((n) => [n.id, n]))

function buildEdges() {
  const seen = new Set()
  const edges = []
  allNodes.forEach((node) => {
    ;(node.connections || []).forEach((targetId) => {
      const key = [node.id, targetId].sort().join('::')
      if (seen.has(key)) return
      seen.add(key)
      if (nodeById[targetId]) {
        edges.push({ id: key, from: node.id, to: targetId })
      }
    })
  })
  return edges
}

export const edges = buildEdges()

// Adjacency map for fast "what's connected to X" lookups (used by hover
// highlighting) — includes both directions regardless of which node
// declared the connection.
export const adjacency = allNodes.reduce((acc, node) => {
  acc[node.id] = acc[node.id] || new Set()
  ;(node.connections || []).forEach((targetId) => {
    acc[node.id].add(targetId)
    acc[targetId] = acc[targetId] || new Set()
    acc[targetId].add(node.id)
  })
  return acc
}, {})

// ---------------------------------------------------------------------------
// Per-application zoomed architecture diagrams (fixed mini-layouts used
// when a project node is focused).
// ---------------------------------------------------------------------------

export const applicationDiagrams = {
  tomasi: {
    title: 'Tomasi E-Commerce Platform',
    flow: [
      { id: 'internet', label: 'Internet', kind: 'root' },
      { id: 'route53', label: 'Route 53', kind: 'aws' },
      { id: 'cloudfront', label: 'CloudFront', kind: 'aws' },
      { id: 'alb', label: 'Application Load Balancer', kind: 'aws' },
      {
        id: 'ecs',
        label: 'Amazon ECS',
        kind: 'aws',
        children: [
          { id: 'react-container', label: 'React Container' },
          { id: 'node-container', label: 'Node API Container' },
        ],
      },
      { id: 'mongodb', label: 'MongoDB Atlas', kind: 'external' },
      { id: 'stripe', label: 'Stripe', kind: 'external' },
      { id: 's3', label: 'Amazon S3', kind: 'aws' },
      { id: 'cloudwatch', label: 'CloudWatch', kind: 'aws' },
      { id: 'iam', label: 'IAM', kind: 'aws' },
    ],
  },
  'ai-assistant': {
    title: 'AI-Powered PostHog Analytics Assistant',
    flow: [
      { id: 'posthog', label: 'PostHog', kind: 'external' },
      { id: 'analytics-collector', label: 'Analytics Collector', kind: 'plain' },
      { id: 'historical-comparison', label: 'Historical Comparison', kind: 'plain' },
      { id: 'gemini-ai', label: 'Gemini AI', kind: 'plain' },
      { id: 'summary-generator', label: 'Summary Generator', kind: 'plain' },
      { id: 'notification-telegram', label: 'Notification (Telegram)', kind: 'plain' },
    ],
  },
  'image-pipeline': {
    title: 'Serverless Image Compression Pipeline',
    flow: [
      { id: 'upload', label: 'S3 Upload', kind: 'plain' },
      { id: 'lambda-trigger', label: 'Lambda Trigger', kind: 'aws', relatedAws: 'lambda' },
      { id: 'compression', label: 'Image Compression', kind: 'plain' },
      { id: 'optimized', label: 'Optimized Image', kind: 'plain' },
      { id: 'cloudwatch-logs', label: 'CloudWatch Logs', kind: 'aws', relatedAws: 'cloudwatch' },
    ],
  },
}

export const ciCdDiagram = {
  title: 'Continuous Deployment',
  flow: [
    { id: 'github', label: 'GitHub', kind: 'pipeline' },
    { id: 'webhook', label: 'Webhook', kind: 'pipeline' },
    { id: 'jenkins', label: 'Jenkins', kind: 'pipeline' },
    { id: 'docker', label: 'Docker Build', kind: 'pipeline' },
    { id: 'ecr', label: 'Amazon ECR', kind: 'aws' },
    { id: 'ecs', label: 'Amazon ECS', kind: 'aws' },
    { id: 'tomasi', label: 'Tomasi', kind: 'application' },
    { id: 'ai-assistant', label: 'AI Assistant', kind: 'application' },
  ],
}

// ---------------------------------------------------------------------------
// Animated trace flows (buttons that highlight a path across the fixed
// canvas in sequence).
// ---------------------------------------------------------------------------

export const traceFlows = [
  {
    id: 'user-request',
    label: 'Trace User Request',
    path: ['route53', 'cloudfront', 'alb', 'ecs', 'mongodb'],
  },
  {
    id: 'deployment',
    label: 'Trace Deployment',
    path: ['github', 'webhook', 'jenkins', 'docker', 'ecr-deploy', 'ecs-deploy'],
  },
  {
    id: 'image-upload',
    label: 'Trace Image Upload',
    path: ['s3', 'lambda', 'cloudwatch'],
  },
  {
    id: 'analytics',
    label: 'Trace Analytics',
    path: ['posthog', 'ai-assistant'],
  },
]
