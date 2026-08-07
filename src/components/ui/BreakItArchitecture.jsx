import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FiGlobe,
  FiShield,
  FiZap,
  FiServer,
  FiBox,
  FiDatabase,
  FiActivity,
} from 'react-icons/fi'

/**
 * A small, self-contained diagram of the break-it demo's OWN architecture
 * (not the main portfolio's) — Browser -> WAF/API Gateway -> Lambda ->
 * ECS Task (behind the ALB), with DynamoDB and EventBridge as the
 * supporting event/state path.
 *
 * Driven entirely by the same /status polling data BreakItDemo already
 * has (no new endpoint): while a break is in flight, the ECS Task node
 * and everything downstream of "the thing that just got stopped" greys
 * out and its connection lines stop flowing. Once healthy again, it
 * lights back up. This exists so visitors who don't want to parse the
 * text recovery log can still see, at a glance, what's actually
 * happening mechanically.
 */
export default function BreakItArchitecture({ phase }) {
  // phase: 'idle' | 'breaking' | 'recovering' | 'healed'
  const taskDown = phase === 'breaking' || phase === 'recovering'
  const provisioning = phase === 'recovering'

  const nodes = useMemo(
    () => [
      { id: 'browser', label: 'Browser', icon: FiGlobe, x: 40, y: 100 },
      { id: 'waf', label: 'WAF + API Gateway', icon: FiShield, x: 190, y: 100 },
      { id: 'lambda', label: 'Lambda', icon: FiZap, x: 340, y: 100 },
      { id: 'alb', label: 'ALB', icon: FiServer, x: 490, y: 60 },
      { id: 'task', label: 'ECS Task', icon: FiBox, x: 640, y: 60 },
      { id: 'events', label: 'EventBridge', icon: FiActivity, x: 490, y: 150 },
      { id: 'ddb', label: 'DynamoDB', icon: FiDatabase, x: 640, y: 150 },
    ],
    []
  )

  const edges = [
    { from: 'browser', to: 'waf', down: false },
    { from: 'waf', to: 'lambda', down: false },
    { from: 'lambda', to: 'alb', down: taskDown },
    { from: 'alb', to: 'task', down: taskDown },
    { from: 'task', to: 'events', down: taskDown },
    { from: 'events', to: 'ddb', down: false },
  ]

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]))

  return (
    <div className="rounded-xl2 glass p-4">
      <p className="text-[11px] font-mono uppercase tracking-widest text-text-secondary mb-3">
        How this demo works — live
      </p>
      <svg viewBox="0 0 700 200" className="w-full h-auto" role="img" aria-label="Live architecture diagram of the break-it demo">
        <defs>
          <linearGradient id="biEdgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {edges.map((edge) => (
          <FlowEdge key={`${edge.from}-${edge.to}`} edge={edge} nodeById={nodeById} />
        ))}

        {nodes.map((node) => {
          const isTaskNode = node.id === 'task'
          const isDown = isTaskNode && taskDown
          const isProvisioning = isTaskNode && provisioning
          return (
            <FlowNode
              key={node.id}
              node={node}
              isDown={isDown}
              isProvisioning={isProvisioning}
            />
          )
        })}
      </svg>

      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-cyan" /> Live / transmitting
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/20" /> Stopped / recovering
        </span>
      </div>
    </div>
  )
}

function nodeCenter(node) {
  return { cx: node.x, cy: node.y }
}

function FlowEdge({ edge, nodeById }) {
  const from = nodeById[edge.from]
  const to = nodeById[edge.to]
  if (!from || !to) return null
  const a = nodeCenter(from)
  const b = nodeCenter(to)
  const path = `M ${a.cx} ${a.cy} L ${b.cx} ${b.cy}`

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={edge.down ? 'rgba(255,255,255,0.12)' : 'url(#biEdgeGradient)'}
        strokeWidth={2}
      />
      {!edge.down && (
        <motion.path
          d={path}
          fill="none"
          stroke="#38BDF8"
          strokeWidth={2}
          strokeDasharray="5 12"
          animate={{ strokeDashoffset: [0, -34] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </g>
  )
}

function FlowNode({ node, isDown, isProvisioning }) {
  const Icon = node.icon
  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <motion.circle
        r={20}
        fill={isDown ? 'rgba(255,255,255,0.04)' : 'rgba(56,189,248,0.08)'}
        stroke={isDown ? 'rgba(255,255,255,0.15)' : '#38BDF8'}
        strokeWidth={1.5}
        animate={
          isProvisioning
            ? { scale: [1, 1.08, 1] }
            : { scale: 1 }
        }
        transition={
          isProvisioning
            ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
      />
      <foreignObject x={-9} y={-9} width={18} height={18}>
        <Icon
          size={18}
          color={isDown ? 'rgba(255,255,255,0.35)' : '#38BDF8'}
          style={{ filter: isDown ? 'grayscale(1)' : 'none' }}
        />
      </foreignObject>
      <text
        x={0}
        y={34}
        textAnchor="middle"
        fontSize={9}
        fill={isDown ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)'}
        fontFamily="monospace"
      >
        {node.label}
      </text>
    </g>
  )
}
