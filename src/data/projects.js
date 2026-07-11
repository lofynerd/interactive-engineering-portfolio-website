import tomasiImg from '../assets/tomasi.png'
import cloudDeploymentImg from '../assets/Cloud-Deployment.png'
import compressionImg from '../assets/compression.png'
import dashboardImg from '../assets/Dashboard.png'
import aiPoweredImg from '../assets/ai-powered.png'

export const projects = [
  {
    id: 'tomasi-ecommerce',
    title: 'Tomasi Design E-Commerce',
    tagline: 'Full-stack e-commerce platform deployed on AWS.',
    problem:
      'The existing storefront was slow, difficult to scale, and expensive to maintain on shared hosting.',
    solution:
      'Rebuilt the storefront as a React application backed by a Node.js/Express API, deployed on a cloud-native AWS stack with CDN-backed asset delivery.',
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'AWS S3', 'CloudFront'],
    challenges:
      'Migrating live product and order data with zero downtime while keeping SEO rankings intact.',
    architectureNote: 'CloudFront in front of S3 for static assets, with an EC2-hosted API behind an ALB.',
    impact: 'Faster page loads and a maintainable, cloud-native foundation for future growth.',
    githubUrl: '',
    liveUrl: 'https://tomasi.design',
    image: tomasiImg,
  },
  {
    id: 'aws-cloud-deployment',
    title: 'AWS Cloud Deployment',
    tagline: 'Reference cloud architecture for scalable web app hosting.',
    problem: 'Needed a repeatable, secure deployment pattern for containerized web applications.',
    solution:
      'Designed an ECS/ECR-based deployment pipeline with Route53 DNS, ALB routing, and CloudWatch monitoring.',
    techStack: ['AWS ECS', 'ECR', 'ALB', 'Route53', 'CloudWatch', 'IAM'],
    challenges: 'Balancing least-privilege IAM policies with operational simplicity.',
    architectureNote: 'Route53 → ALB → ECS services, with CloudWatch alarms feeding SES notifications.',
    impact: 'A reusable deployment template that cut new-service setup time from days to hours.',
    githubUrl: '',
    liveUrl: '',
    image: cloudDeploymentImg,
  },
  {
    id: 'image-compression-lambda',
    title: 'Image Compression Lambda',
    tagline: 'Serverless image optimization pipeline.',
    problem: 'Uploaded images were consuming excessive storage and slowing down page loads.',
    solution:
      'Built an S3-triggered Lambda function that compresses and resizes images on upload, storing optimized variants automatically.',
    techStack: ['AWS Lambda', 'S3', 'Node.js'],
    challenges: 'Handling large batch uploads without hitting Lambda concurrency and timeout limits.',
    architectureNote: 'S3 upload event → Lambda → optimized output written back to a dedicated S3 prefix.',
    impact: 'Meaningful reduction in storage footprint and faster image delivery across the site.',
    githubUrl: '',
    liveUrl: '',
    image: compressionImg,
  },
  {
    id: 'analytics-dashboard',
    title: 'Analytics Dashboard',
    tagline: 'Internal dashboard for tracking key business metrics.',
    problem: 'Business stakeholders lacked a single view of traffic, sales, and performance metrics.',
    solution:
      'Built a React dashboard consuming REST APIs, with data visualizations and role-based access.',
    techStack: ['React', 'Node.js', 'Express', 'MongoDB'],
    challenges: 'Designing data aggregation queries that stayed performant as data volume grew.',
    architectureNote: 'API layer aggregates data from MongoDB and exposes cached endpoints to the dashboard.',
    impact: 'Gave the team real-time visibility into metrics previously tracked manually in spreadsheets.',
    githubUrl: '',
    liveUrl: '',
    image: dashboardImg,
  },
  {
    id: 'ai-insights-bot',
    title: 'AI Analytics Assistant',
    tagline: 'AI-powered analytics assistant with automated Telegram reporting.',
    problem:
      'Marketing teams relied on multiple PostHog dashboards and manual analysis to extract actionable business insights.',
    solution:
      'Built an AI-powered analytics assistant that aggregates PostHog data, generates intelligent insights, and delivers automated reports through Telegram.',
    techStack: ['PostHog', 'HogQL', 'AWS S3', 'AWS ECS Fargate', 'Telegram Bot API'],
    challenges:
      'Designing reusable analytics queries, maintaining historical comparisons, and generating accurate AI-driven business insights.',
    architectureNote:
      'PostHog → HogQL → Metrics Engine → Amazon S3 (Historical Snapshots) → AI Insight Engine → Telegram Bot (AWS ECS Fargate).',
    impact:
      'Reduced manual reporting effort while providing automated, conversational business intelligence for marketing and product teams.',
    githubUrl: '',
    liveUrl: '',
    image: aiPoweredImg,
  },
]
