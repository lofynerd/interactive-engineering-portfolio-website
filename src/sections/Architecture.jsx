import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  FiCloud,
  FiDatabase,
  FiServer,
  FiGlobe,
  FiShield,
  FiZap,
  FiActivity,
  FiMail,
  FiBox,
} from 'react-icons/fi'
import RevealOnScroll from '../components/ui/RevealOnScroll'

const flow = [
  { id: 'route53', label: 'Route53', icon: FiGlobe, desc: 'DNS routing' },
  { id: 'cloudfront', label: 'CloudFront', icon: FiZap, desc: 'Global CDN' },
  { id: 'alb', label: 'ALB', icon: FiServer, desc: 'Load balancing' },
  { id: 'ecs', label: 'ECS', icon: FiBox, desc: 'Container orchestration' },
  { id: 'ecr', label: 'ECR', icon: FiDatabase, desc: 'Container registry' },
  { id: 'lambda', label: 'Lambda', icon: FiZap, desc: 'Serverless compute' },
  { id: 's3', label: 'S3', icon: FiCloud, desc: 'Object storage' },
  { id: 'iam', label: 'IAM', icon: FiShield, desc: 'Access control' },
  { id: 'cloudwatch', label: 'CloudWatch', icon: FiActivity, desc: 'Monitoring' },
  { id: 'ses', label: 'SES', icon: FiMail, desc: 'Email delivery' },
]

export default function Architecture() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  return (
    <section id="architecture" className="relative py-28 md:py-36 bg-bg-secondary">
      <div className="section-container">
        <RevealOnScroll>
          <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
            AWS Architecture
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white max-w-2xl">
            How requests flow through production infrastructure.
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl leading-relaxed">
            A simplified view of the AWS services I use to ship and operate
            production applications — from DNS resolution down to observability.
          </p>
        </RevealOnScroll>

        <div ref={containerRef} className="mt-16 grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {flow.map((node, i) => {
            const Icon = node.icon
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-xl2 glass p-5 flex flex-col items-start gap-3 hover:border-accent-cyan/30 border border-transparent transition-colors duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{node.label}</p>
                  <p className="text-text-secondary text-xs mt-0.5">{node.desc}</p>
                </div>
                {i < flow.length - 1 && (
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.6, delay: i * 0.08 + 0.3 }}
                    className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-accent-cyan/60 to-transparent origin-left"
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
