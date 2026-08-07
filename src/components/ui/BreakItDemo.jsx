import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiZap,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
  FiDollarSign,
  FiClock,
  FiChevronDown,
  FiWifi,
  FiWifiOff,
} from 'react-icons/fi'
import AuroraBackground from './AuroraBackground'
import MagneticButton from './MagneticButton'
import BreakItArchitecture from './BreakItArchitecture'
import { fetchStatus, fetchCost, breakSomething, isBreakItConfigured } from '../../lib/breakItApi'
import {
  trackBreakItViewed,
  trackBreakItClicked,
  trackBreakItResult,
  trackBreakItHealed,
  trackBreakItSkipped,
} from '../../lib/analytics'

// 6s (not 3s) keeps a single visitor's steady polling well under the WAF
// rate-based rule's per-5-minute threshold — see waf_rate_limit_per_5min.
const STATUS_POLL_MS = 6000
const COST_POLL_MS = 5 * 60 * 1000
// TEMPORARY: hides the "9am-9pm IST" scheduling disclaimer while the demo
// is running always-on for the trial window. Flip REACT_APP_BREAK_IT_ALWAYS_ON
// back off (or unset it) once reverting to the normal daily schedule.
const ALWAYS_ON = process.env.REACT_APP_BREAK_IT_ALWAYS_ON === 'true'

/**
 * Full-viewport gate shown before the portrait/intro sequence: a live,
 * self-healing infrastructure demo running on a dedicated, isolated ECS
 * Fargate service. Visitors can stop a running task with one click and
 * watch ECS's own scheduler replace it in real time, alongside a running
 * count of breaks/heals and a live FinOps cost panel for the stack.
 *
 * Renders a minimal "demo unavailable" fallback if the API isn't
 * configured (e.g. local dev without REACT_APP_BREAK_IT_API_URL set) —
 * it never blocks access to the rest of the site.
 */
export default function BreakItDemo({ onContinue }) {
  const configured = isBreakItConfigured()
  const [status, setStatus] = useState(null)
  const [cost, setCost] = useState(null)
  const [breaking, setBreaking] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'info'|'error', text }
  const [elapsedMs, setElapsedMs] = useState(0)
  const [lastHealDurationMs, setLastHealDurationMs] = useState(null)
  const breakStartedAt = useRef(null)
  const wasHealthyRef = useRef(true)

  // Live-ticking "time since break" timer, shown so visitors don't have to
  // guess how long recovery takes — it counts up while breaking/recovering
  // and freezes the instant healed() fires below.
  useEffect(() => {
    if (!breaking) return
    const tick = () => {
      if (breakStartedAt.current) setElapsedMs(Date.now() - breakStartedAt.current)
    }
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [breaking])

  useEffect(() => {
    trackBreakItViewed()
  }, [])

  const pollStatus = useCallback(async () => {
    try {
      const data = await fetchStatus()
      setStatus(data)

      const isHealthy = data.online && data.runningCount >= data.desiredCount
      if (isHealthy && !wasHealthyRef.current && breakStartedAt.current) {
        const durationMs = Date.now() - breakStartedAt.current
        trackBreakItHealed(durationMs)
        breakStartedAt.current = null
        setBreaking(false)
        setLastHealDurationMs(durationMs)
        setMessage({ type: 'info', text: 'Healed — traffic restored to all healthy tasks.' })
      }
      wasHealthyRef.current = isHealthy
    } catch {
      // Silently retry on the next poll — a transient network error here
      // shouldn't block the demo experience.
    }
  }, [])

  const pollCost = useCallback(async () => {
    try {
      setCost(await fetchCost())
    } catch {
      // Cost panel is a nice-to-have; fail quietly.
    }
  }, [])

  useEffect(() => {
    if (!configured) return
    pollStatus()
    pollCost()
    const statusInterval = setInterval(pollStatus, STATUS_POLL_MS)
    const costInterval = setInterval(pollCost, COST_POLL_MS)
    return () => {
      clearInterval(statusInterval)
      clearInterval(costInterval)
    }
  }, [configured, pollStatus, pollCost])

  async function handleBreak() {
    trackBreakItClicked()
    setMessage(null)
    try {
      const result = await breakSomething()
      breakStartedAt.current = Date.now()
      wasHealthyRef.current = false
      setBreaking(true)
      setElapsedMs(0)
      setLastHealDurationMs(null)
      trackBreakItResult('breaking')
      setMessage({ type: 'info', text: result.message || 'Task stopped — watch it recover below.' })
    } catch (err) {
      if (err.status === 429) {
        trackBreakItResult('cooldown', { retry_after: err.data?.retryAfterSeconds })
        setMessage({ type: 'error', text: err.message })
      } else if (err.status === 409) {
        trackBreakItResult('offline')
        setMessage({ type: 'error', text: err.message })
      } else {
        trackBreakItResult('error')
        setMessage({ type: 'error', text: "Couldn't reach the demo right now — try again shortly." })
      }
    }
  }

  function handleContinue() {
    trackBreakItSkipped()
    onContinue()
  }

  // If the API isn't configured at all (e.g. local dev), skip the gate
  // entirely rather than showing a broken demo. Handled as an effect
  // (not a conditional early-return-before-hooks) to keep hook call
  // order stable across renders.
  useEffect(() => {
    if (!configured) onContinue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured])

  if (!configured) return null

  const online = status?.online
  const healthy = online && status?.runningCount >= status?.desiredCount
  // The diagram must reflect SERVER truth, not just this browser's local
  // `breaking` flag — otherwise a page reload, a second tab, or someone
  // else's break leaves the diagram stuck showing "idle" while the
  // status pill above correctly shows "Recovering". Any online-but-not-
  // fully-healthy state greys out the task node, regardless of who
  // triggered it or whether this session even saw the click happen.
  const architecturePhase = !online
    ? 'idle'
    : !healthy
      ? 'recovering'
      : 'healed'

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[210] bg-bg overflow-y-auto"
      data-lenis-prevent
    >
      <AuroraBackground />

      <div className="relative z-10 min-h-full flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-start">
          {/* Left half: the interactive demo itself */}
          <div className="w-full max-w-2xl mx-auto lg:mx-0">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left text-sm text-accent-cyan font-mono tracking-widest uppercase mb-4"
            >
              Live infrastructure demo
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-center lg:text-left font-display text-3xl sm:text-4xl font-semibold text-white leading-tight"
            >
              This infrastructure heals itself.
              <br />
              <span className="text-text-secondary text-xl sm:text-2xl font-normal">
                Break it and watch.
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex items-center justify-center lg:justify-start gap-2"
            >
              <StatusPill online={online} healthy={healthy} status={status} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-8 flex flex-col items-center lg:items-start gap-4"
            >
              <MagneticButton
                as="button"
                type="button"
                onClick={handleBreak}
                disabled={breaking || !online}
                data-cursor-hover
                className="inline-flex items-center gap-2 rounded-full bg-white text-black text-base font-semibold px-8 py-4 transition-shadow hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiZap />
                {breaking ? 'Recovering…' : 'Break Something'}
              </MagneticButton>

              {breaking && <RecoveryTimer elapsedMs={elapsedMs} />}
              {!breaking && lastHealDurationMs != null && (
                <p className="text-xs text-text-secondary">
                  Last recovery took <span className="text-accent-cyan font-mono">{formatDuration(lastHealDurationMs)}</span>
                </p>
              )}

              <AnimatePresence mode="wait">
                {message && (
                  <motion.p
                    key={message.text}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`text-sm ${
                      message.type === 'error' ? 'text-red-400' : 'text-accent-cyan'
                    }`}
                  >
                    {message.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-10 grid grid-cols-3 gap-3"
            >
              <StatCard label="Times broken" value={status?.timesBroken ?? 0} />
              <StatCard label="Times healed" value={status?.timesHealed ?? 0} />
              <StatCard
                label="Tasks running"
                value={online ? `${status?.runningCount ?? 0}/${status?.desiredCount ?? 0}` : '—'}
              />
            </motion.div>

            <RecoveryLog events={status?.recentEvents} />

            <CostPanel cost={cost} />
          </div>

          {/* Right half: live visual diagram of the demo's own architecture */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="w-full max-w-2xl mx-auto lg:mx-0 lg:sticky lg:top-16"
          >
            <p className="text-center lg:text-left text-xs text-text-secondary/80 mb-3 max-w-md mx-auto lg:mx-0">
              Not sure what the log means? Watch it happen: when you break something,
              the affected service below greys out and stops passing traffic — then
              lights back up the moment it's replaced.
            </p>
            <BreakItArchitecture phase={architecturePhase} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex flex-col items-center gap-2"
        >
          <button
            type="button"
            onClick={handleContinue}
            data-cursor-hover
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-white transition-colors"
          >
            Continue to portfolio <FiChevronDown />
          </button>
          <p className="text-xs text-text-secondary/70 text-center max-w-md">
            Runs on a dedicated, isolated AWS ECS Fargate service.
            {!ALWAYS_ON && ' Active 9am\u20139pm IST daily.'} It can't affect (and
            isn't affected by) anything else on this site.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

function RecoveryTimer({ elapsedMs }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-mono text-yellow-300">
      <FiClock className="animate-pulse" />
      <span>Recovering for {formatDuration(elapsedMs)}…</span>
    </div>
  )
}

function StatusPill({ online, healthy, status }) {
  if (online === undefined) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-secondary">
        <FiActivity className="animate-pulse" /> Connecting…
      </span>
    )
  }

  if (!online) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-secondary bg-white/5 border border-white/10 rounded-full px-4 py-2">
        <FiWifiOff /> {ALWAYS_ON ? 'Offline' : 'Offline — active 9am–9pm IST'}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest rounded-full px-4 py-2 border ${
        healthy
          ? 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30'
          : 'text-yellow-300 bg-yellow-400/10 border-yellow-400/30'
      }`}
    >
      <FiWifi />
      {healthy
        ? `Healthy — ${status.runningCount}/${status.desiredCount} tasks`
        : `Recovering — ${status.runningCount}/${status.desiredCount} tasks`}
    </span>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl2 glass p-4 text-center">
      <div className="font-display text-2xl text-white font-semibold">{value}</div>
      <p className="mt-1 text-[11px] text-text-secondary uppercase tracking-wide">{label}</p>
    </div>
  )
}

const EVENT_LABELS = {
  task_stopped: { label: 'Task stopped', icon: FiAlertTriangle, color: 'text-red-400' },
  task_provisioning: { label: 'Provisioning replacement', icon: FiClock, color: 'text-yellow-300' },
  task_healthy: { label: 'Task running — traffic restored', icon: FiCheckCircle, color: 'text-accent-cyan' },
  task_running: { label: 'Task running', icon: FiCheckCircle, color: 'text-accent-cyan' },
}

function RecoveryLog({ events }) {
  if (!events || events.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-8 rounded-xl2 glass p-4 max-h-48 overflow-y-auto"
    >
      <p className="text-[11px] font-mono uppercase tracking-widest text-text-secondary mb-3">
        Recovery log
      </p>
      <ul className="space-y-2">
        {events.slice(0, 8).map((event, i) => {
          const meta = EVENT_LABELS[event.type] || {
            label: event.type,
            icon: FiActivity,
            color: 'text-text-secondary',
          }
          const Icon = meta.icon
          return (
            <li key={`${event.at}-${i}`} className="flex items-center gap-2 text-xs">
              <Icon className={meta.color} size={13} />
              <span className="text-white">{meta.label}</span>
              <span className="ml-auto text-text-secondary">
                {new Date(event.at).toLocaleTimeString()}
              </span>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

function CostPanel({ cost }) {
  if (!cost) return null

  const pct = cost.monthlyBudget
    ? Math.min(100, Math.round((cost.totalMonthToDate / cost.monthlyBudget) * 100))
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mt-4 rounded-xl2 glass p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
          <FiDollarSign size={12} /> FinOps — actual spend, this month
        </p>
        <p className="text-xs text-white font-medium">
          ${cost.totalMonthToDate?.toFixed(2) ?? '0.00'} / ${cost.monthlyBudget}
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-accent-cyan transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {cost.byService && cost.byService.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cost.byService.slice(0, 4).map((entry) => (
            <span
              key={entry.service}
              className="text-[10px] text-text-secondary bg-white/5 border border-white/10 rounded-full px-2 py-1"
            >
              {entry.service}: ${entry.amount.toFixed(2)}
            </span>
          ))}
        </div>
      )}
      {cost.note && <p className="mt-2 text-xs text-text-secondary">{cost.note}</p>}
    </motion.div>
  )
}
