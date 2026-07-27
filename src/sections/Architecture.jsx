import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, animate } from 'framer-motion'
import {
  FiGlobe,
  FiZap,
  FiServer,
  FiBox,
  FiDatabase,
  FiCloud,
  FiShield,
  FiActivity,
  FiHardDrive,
  FiLock,
  FiGithub,
  FiRadio,
  FiX,
  FiArrowLeft,
  FiSearch,
  FiPlus,
  FiMinus,
  FiMaximize,
  FiMaximize2,
  FiMinimize2,
} from 'react-icons/fi'
import { SiJenkins, SiDocker, SiMongodb, SiStripe, SiPosthog } from 'react-icons/si'
import RevealOnScroll from '../components/ui/RevealOnScroll'
import { projects } from '../data/projects'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  allNodes,
  nodeById,
  edges,
  adjacency,
  applicationDiagrams,
  ciCdDiagram,
  traceFlows,
} from '../data/ecosystem'
import { trackEvent, trackArchitectureNodeHovered } from '../lib/analytics'

const AWS_ICONS = {
  route53: FiGlobe,
  cloudfront: FiZap,
  acm: FiLock,
  alb: FiServer,
  ecs: FiBox,
  ecr: FiDatabase,
  lambda: FiZap,
  s3: FiCloud,
  iam: FiShield,
  cloudwatch: FiActivity,
  ec2: FiHardDrive,
}

const EXTERNAL_ICONS = {
  mongodb: SiMongodb,
  stripe: SiStripe,
  posthog: SiPosthog,
}

const PIPELINE_ICONS = {
  github: FiGithub,
  webhook: FiRadio,
  jenkins: SiJenkins,
  docker: SiDocker,
  'ecr-deploy': FiDatabase,
  'ecs-deploy': FiBox,
}

const projectById = Object.fromEntries(projects.map((p) => [p.id, p]))

function iconFor(node) {
  if (!node) return FiBox
  if (node.kind === 'aws') return AWS_ICONS[node.id] || FiBox
  if (node.kind === 'external') return EXTERNAL_ICONS[node.id] || FiBox
  if (node.kind === 'pipeline') return PIPELINE_ICONS[node.id] || FiBox
  return FiBox
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2

export default function Architecture() {
  const viewportRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)

  const [hoveredId, setHoveredId] = useState(null)
  const [selectedPanel, setSelectedPanel] = useState(null) // { type, node } | null
  const [focusedAppId, setFocusedAppId] = useState(null) // zoomed-into application id, or null
  const [focusedCiCd, setFocusedCiCd] = useState(false) // zoomed into the CI/CD flow
  const [activeTrace, setActiveTrace] = useState(null)
  const [query, setQuery] = useState('')
  const [isPanning, setIsPanning] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    trackEvent('architecture_section_viewed')
  }, [])

  function fitToViewport() {
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const initialScale = Math.min(1, rect.width / CANVAS_WIDTH) * 0.95
    scale.set(initialScale)
    x.set((rect.width - CANVAS_WIDTH * initialScale) / 2)
    y.set(24)
  }

  // Center the canvas in the viewport on mount.
  useEffect(() => {
    fitToViewport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fit whenever the viewport size changes (e.g. entering/exiting
  // fullscreen) so the camera framing stays correct for the new size.
  useEffect(() => {
    // Wait a frame for the layout to actually resize before refitting.
    const id = requestAnimationFrame(fitToViewport)
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen])

  // Lock page scroll and allow Escape to exit while fullscreen.
  useEffect(() => {
    if (!isFullscreen) return
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  function toggleFullscreen() {
    setIsFullscreen((v) => {
      trackEvent('architecture_fullscreen_toggled', { enabled: !v })
      return !v
    })
  }

  const highlighted = useMemo(() => {
    if (!hoveredId) return null
    const set = new Set([hoveredId, ...(adjacency[hoveredId] || [])])
    return set
  }, [hoveredId])

  const tracedSet = useMemo(() => {
    if (!activeTrace) return null
    const flow = traceFlows.find((t) => t.id === activeTrace)
    return flow ? new Set(flow.path) : null
  }, [activeTrace])

  const panToNode = useCallback((nodeId, targetScale = 1.15) => {
    const node = nodeById[nodeId]
    const el = viewportRef.current
    if (!node || !el) return
    const rect = el.getBoundingClientRect()
    const nx = -(node.x + (node.width ? node.width / 2 : 90)) * targetScale + rect.width / 2
    const ny = -(node.y + (node.height ? node.height / 2 : 40)) * targetScale + rect.height / 2
    animate(x, nx, { duration: 0.7, ease: [0.16, 1, 0.3, 1] })
    animate(y, ny, { duration: 0.7, ease: [0.16, 1, 0.3, 1] })
    animate(scale, targetScale, { duration: 0.7, ease: [0.16, 1, 0.3, 1] })
  }, [x, y, scale])

  function resetView() {
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const initialScale = Math.min(1, rect.width / CANVAS_WIDTH) * 0.95
    animate(scale, initialScale, { duration: 0.6, ease: [0.16, 1, 0.3, 1] })
    animate(x, (rect.width - CANVAS_WIDTH * initialScale) / 2, { duration: 0.6, ease: [0.16, 1, 0.3, 1] })
    animate(y, 24, { duration: 0.6, ease: [0.16, 1, 0.3, 1] })
  }

  function handleNodeClick(node) {
    if (node.kind === 'application') {
      setFocusedAppId(node.id)
      setFocusedCiCd(false)
      setSelectedPanel(null)
      panToNode(node.id, 1.3)
      trackEvent('architecture_project_zoomed', { project_id: node.projectRef })
      return
    }
    // Lambda and PostHog have their own dedicated zoomed diagrams (image
    // pipeline / analytics assistant) rather than opening a plain AWS panel.
    if (node.id === 'lambda') {
      setFocusedAppId('image-pipeline')
      setFocusedCiCd(false)
      setSelectedPanel(null)
      panToNode('image-pipeline', 1.3)
      trackEvent('architecture_project_zoomed', { project_id: 'image-compression-lambda' })
      return
    }
    if (node.id === 'posthog') {
      setFocusedAppId('ai-assistant')
      setFocusedCiCd(false)
      setSelectedPanel(null)
      panToNode('ai-assistant', 1.3)
      trackEvent('architecture_project_zoomed', { project_id: 'ai-insights-bot' })
      return
    }
    // Jenkins zooms into the full CI/CD pipeline diagram.
    if (node.id === 'jenkins') {
      setFocusedCiCd(true)
      setFocusedAppId(null)
      setSelectedPanel(null)
      panToNode('jenkins', 1.3)
      trackEvent('architecture_cicd_zoomed')
      return
    }
    if (node.kind === 'aws') {
      setSelectedPanel({ type: 'aws', node })
      trackArchitectureNodeHovered(node.id)
      trackEvent('architecture_service_panel_opened', { service: node.id })
      return
    }
    if (node.kind === 'external') {
      setSelectedPanel({ type: 'external', node })
      trackEvent('architecture_external_panel_opened', { service: node.id })
      return
    }
    if (node.kind === 'pipeline') {
      setSelectedPanel({ type: 'pipeline', node })
      trackEvent('architecture_pipeline_step_opened', { step: node.id })
    }
  }

  function backToEcosystem() {
    setFocusedAppId(null)
    setFocusedCiCd(false)
    setSelectedPanel(null)
    resetView()
  }

  function handleSearch(e) {
    e.preventDefault()
    const q = query.trim().toLowerCase()
    if (!q) return
    const match = allNodes.find(
      (n) => n.label.toLowerCase().includes(q) || n.shortLabel?.toLowerCase().includes(q)
    )
    if (match) {
      setFocusedAppId(null)
      panToNode(match.id, 1.3)
      setHoveredId(match.id)
      trackEvent('architecture_search', { query: q, matched: match.id })
    }
  }

  function zoomBy(factor) {
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.get() * factor))
    animate(scale, next, { duration: 0.35, ease: [0.16, 1, 0.3, 1] })
  }

  const focusedApp = focusedAppId ? nodeById[focusedAppId] : null

  return (
    <section id="architecture" className="relative py-28 md:py-36 bg-[#0B0B0D] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(56,189,248,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.5) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full bg-[#38BDF8]/10 blur-[140px]" />
      </div>

      <div className="section-container relative z-10">
        <RevealOnScroll>
          <p className="text-sm font-mono text-[#38BDF8] uppercase tracking-widest mb-4">
            Engineering Architecture Explorer
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white max-w-2xl">
            One connected engineering ecosystem.
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl leading-relaxed">
            Applications, shared AWS infrastructure, the CI/CD pipeline, and
            external services — all on one canvas. Pan, zoom, search, or
            click any node. Nothing here navigates away from the page.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px] max-w-xs">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
                size={14}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search CloudWatch, Stripe, Jenkins…"
                className="w-full rounded-full bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-text-secondary/60 focus:outline-none focus:border-[#38BDF8]/50 transition-colors duration-300"
              />
            </form>

            <div className="flex items-center gap-2">
              {traceFlows.map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  data-cursor-hover
                  onClick={() => setActiveTrace(activeTrace === flow.id ? null : flow.id)}
                  className={`text-xs font-mono uppercase tracking-widest rounded-full px-3.5 py-2 border transition-colors duration-300 ${
                    activeTrace === flow.id
                      ? 'border-[#38BDF8]/60 text-[#38BDF8] bg-[#38BDF8]/10'
                      : 'border-white/10 text-text-secondary hover:text-white hover:border-white/20'
                  }`}
                >
                  {flow.label}
                </button>
              ))}
            </div>
          </div>
        </RevealOnScroll>

        {!isFullscreen && (
          <RevealOnScroll delay={0.15}>
            <ExplorerViewport
              viewportRef={viewportRef}
              isPanning={isPanning}
              isFullscreen={false}
              x={x}
              y={y}
              scale={scale}
              setIsPanning={setIsPanning}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              highlighted={highlighted}
              tracedSet={tracedSet}
              onNodeClick={handleNodeClick}
              focusedAppId={focusedAppId}
              focusedCiCd={focusedCiCd}
              focusedApp={focusedApp}
              backToEcosystem={backToEcosystem}
              zoomBy={zoomBy}
              resetView={resetView}
              onToggleFullscreen={toggleFullscreen}
            />
          </RevealOnScroll>
        )}

        <RevealOnScroll delay={0.2}>
          <p className="mt-4 text-xs text-text-secondary text-center">
            Drag to pan &middot; scroll or use the controls to zoom &middot; click any node to
            explore &middot; press <FiMaximize2 className="inline -mt-0.5" size={11} /> to go
            fullscreen
          </p>
        </RevealOnScroll>
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            key="fullscreen-explorer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[95] bg-[#0B0B0D] p-4 md:p-6"
          >
            <ExplorerViewport
              viewportRef={viewportRef}
              isPanning={isPanning}
              isFullscreen
              x={x}
              y={y}
              scale={scale}
              setIsPanning={setIsPanning}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              highlighted={highlighted}
              tracedSet={tracedSet}
              onNodeClick={handleNodeClick}
              focusedAppId={focusedAppId}
              focusedCiCd={focusedCiCd}
              focusedApp={focusedApp}
              backToEcosystem={backToEcosystem}
              zoomBy={zoomBy}
              resetView={resetView}
              onToggleFullscreen={toggleFullscreen}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPanel?.type === 'aws' && (
          <AwsPanel
            key="aws-panel"
            node={selectedPanel.node}
            onClose={() => setSelectedPanel(null)}
            onSelectRelated={(id) => handleNodeClick(nodeById[id])}
          />
        )}
        {selectedPanel?.type === 'external' && (
          <ExternalPanel
            key="external-panel"
            node={selectedPanel.node}
            onClose={() => setSelectedPanel(null)}
            onSelectRelated={(id) => handleNodeClick(nodeById[id])}
          />
        )}
        {selectedPanel?.type === 'pipeline' && (
          <PipelinePanel
            key="pipeline-panel"
            node={selectedPanel.node}
            onClose={() => setSelectedPanel(null)}
            onOpenService={(id) => handleNodeClick(nodeById[id])}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Explorer viewport: the canvas + focus overlays + controls + minimap.
// Rendered either inline (normal) or inside a fixed fullscreen wrapper —
// the markup itself is identical either way, only the container differs.
// ---------------------------------------------------------------------------

function ExplorerViewport({
  viewportRef,
  isPanning,
  isFullscreen,
  x,
  y,
  scale,
  setIsPanning,
  hoveredId,
  setHoveredId,
  highlighted,
  tracedSet,
  onNodeClick,
  focusedAppId,
  focusedCiCd,
  focusedApp,
  backToEcosystem,
  zoomBy,
  resetView,
  onToggleFullscreen,
}) {
  return (
    <div
      ref={viewportRef}
      className={`relative rounded-xl3 glass overflow-hidden select-none ${
        isFullscreen ? 'w-full h-full' : 'mt-8 h-[560px] md:h-[640px]'
      } ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <EcosystemCanvas
        x={x}
        y={y}
        scale={scale}
        setIsPanning={setIsPanning}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
        highlighted={highlighted}
        tracedSet={tracedSet}
        onNodeClick={onNodeClick}
        focusedAppId={focusedAppId || (focusedCiCd ? 'cicd' : null)}
      />

      <AnimatePresence>
        {focusedApp && (
          <ProjectFocusOverlay
            key="focus-overlay"
            app={focusedApp}
            onBack={backToEcosystem}
            onOpenService={(id) => {
              const node = nodeById[id]
              if (node) onNodeClick(node)
            }}
          />
        )}
        {focusedCiCd && <CiCdFocusOverlay key="cicd-overlay" onBack={backToEcosystem} />}
      </AnimatePresence>

      {/* Zoom + fullscreen controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
        <ZoomButton icon={FiPlus} onClick={() => zoomBy(1.25)} label="Zoom in" />
        <ZoomButton icon={FiMinus} onClick={() => zoomBy(0.8)} label="Zoom out" />
        <ZoomButton icon={FiMaximize} onClick={resetView} label="Reset view" />
        <ZoomButton
          icon={isFullscreen ? FiMinimize2 : FiMaximize2}
          onClick={onToggleFullscreen}
          label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        />
      </div>

      {/* Minimap */}
      <Minimap x={x} y={y} scale={scale} viewportRef={viewportRef} isFullscreen={isFullscreen} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Canvas: fixed-layout nodes + SVG edges, draggable/zoomable camera
// ---------------------------------------------------------------------------

function EcosystemCanvas({
  x,
  y,
  scale,
  setIsPanning,
  hoveredId,
  setHoveredId,
  highlighted,
  tracedSet,
  onNodeClick,
  focusedAppId,
}) {
  const viewportElRef = useRef(null)
  const panState = useRef(null)

  function handleWheel(e) {
    e.preventDefault()
    const delta = -e.deltaY * 0.0012
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.get() + delta * scale.get()))
    scale.set(next)
  }

  function handlePointerDown(e) {
    if (focusedAppId) return
    // Don't start a pan gesture (and don't steal pointer capture) when the
    // press begins on a node — otherwise the browser retargets the
    // resulting click to this wrapper instead of the node's own button,
    // and clicking a node silently does nothing.
    if (e.target.closest('button')) return
    panState.current = { startX: e.clientX, startY: e.clientY, x0: x.get(), y0: y.get() }
    setIsPanning(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!panState.current) return
    const { startX, startY, x0, y0 } = panState.current
    x.set(x0 + (e.clientX - startX))
    y.set(y0 + (e.clientY - startY))
  }

  function handlePointerUp() {
    panState.current = null
    setIsPanning(false)
  }

  return (
    <motion.div
      ref={viewportElRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="absolute inset-0"
      animate={{ opacity: focusedAppId ? 0.15 : 1, filter: focusedAppId ? 'blur(4px)' : 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ pointerEvents: focusedAppId ? 'none' : 'auto', touchAction: 'none' }}
    >
      <motion.div
        className="absolute top-0 left-0"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          x,
          y,
          scale,
          transformOrigin: '0 0',
        }}
      >
        {/* Section labels (fixed within canvas space) */}
        <CanvasSectionLabel x={20} y={40} label="Applications" />
        <CanvasSectionLabel x={20} y={260} label="Shared AWS Platform" />
        <CanvasSectionLabel x={20} y={580} label="DevOps Pipeline" />
        <CanvasSectionLabel x={20} y={760} label="External Services" />

        {/* Edges */}
        <svg
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="absolute top-0 left-0 pointer-events-none"
        >
          <defs>
            <linearGradient id="edgeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {edges.map((edge) => (
            <Edge
              key={edge.id}
              edge={edge}
              highlighted={highlighted}
              tracedSet={tracedSet}
            />
          ))}
        </svg>

        {/* Nodes */}
        {allNodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            isHovered={hoveredId === node.id}
            isDimmed={!!highlighted && !highlighted.has(node.id)}
            isTraced={!!tracedSet && tracedSet.has(node.id)}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onNodeClick(node)}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}

function CanvasSectionLabel({ x, y, label }) {
  return (
    <div
      className="absolute text-[11px] font-mono uppercase tracking-widest text-text-secondary/70"
      style={{ left: x, top: y }}
    >
      {label}
    </div>
  )
}

function nodeCenter(node) {
  const w = node.width || 170
  const h = node.height || 74
  return { cx: node.x + w / 2, cy: node.y + h / 2 }
}

function Edge({ edge, highlighted, tracedSet }) {
  const from = nodeById[edge.from]
  const to = nodeById[edge.to]
  if (!from || !to) return null
  const a = nodeCenter(from)
  const b = nodeCenter(to)

  const isRelated =
    !!highlighted && highlighted.has(edge.from) && highlighted.has(edge.to)
  const isTraceHop =
    !!tracedSet && tracedSet.has(edge.from) && tracedSet.has(edge.to)
  const dimmed = (highlighted && !isRelated) || (tracedSet && !isTraceHop)

  const midX = (a.cx + b.cx) / 2
  const midY = (a.cy + b.cy) / 2
  const path = `M ${a.cx} ${a.cy} Q ${midX} ${midY} ${b.cx} ${b.cy}`
  const isFlowing = isRelated || isTraceHop

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="url(#edgeGradient)"
        strokeWidth={isFlowing ? 2 : 1}
        opacity={dimmed ? 0.08 : isFlowing ? 0.9 : 0.35}
      />
      {isFlowing && (
        <motion.path
          d={path}
          fill="none"
          stroke="#38BDF8"
          strokeWidth={2}
          strokeDasharray="6 14"
          animate={{ strokeDashoffset: [0, -40] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </g>
  )
}

function CanvasNode({ node, isHovered, isDimmed, isTraced, onMouseEnter, onMouseLeave, onClick }) {
  const Icon = iconFor(node)
  const isApp = node.kind === 'application'
  const isAws = node.kind === 'aws'
  const isExternal = node.kind === 'external'
  const isPipeline = node.kind === 'pipeline'

  const width = node.width || (isApp ? 300 : 158)
  const height = node.height || (isApp ? 120 : 78)

  const accent = isExternal ? '#c084fc' : '#38BDF8'

  return (
    <motion.button
      type="button"
      data-cursor-hover
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      animate={{
        opacity: isDimmed ? 0.25 : 1,
        scale: isHovered ? 1.05 : isTraced ? 1.03 : 1,
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute text-left rounded-xl2 flex flex-col items-start gap-2 px-4 py-3 border transition-colors duration-300 ${
        isApp ? 'rounded-xl3 py-4' : ''
      } ${
        isExternal
          ? 'border-dashed border-purple-400/25 bg-white/[0.02] hover:border-purple-400/50'
          : 'glass border-white/[0.07] hover:border-[#38BDF8]/40'
      }`}
      style={{
        left: node.x,
        top: node.y,
        width,
        height,
        boxShadow:
          isHovered || isTraced
            ? `0 0 32px ${isExternal ? 'rgba(192,132,252,0.3)' : 'rgba(56,189,248,0.3)'}`
            : undefined,
        zIndex: isHovered ? 10 : 1,
      }}
    >
      <div className="flex items-center gap-2.5 w-full">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
          style={{
            backgroundColor: isExternal ? 'rgba(192,132,252,0.12)' : 'rgba(56,189,248,0.12)',
            color: accent,
          }}
        >
          {isApp ? node.emoji : <Icon size={15} />}
        </span>
        <div className="min-w-0">
          <p className={`text-white font-medium truncate ${isApp ? 'text-sm' : 'text-xs'}`}>
            {isApp ? node.shortLabel : isPipeline ? node.label : node.shortLabel}
          </p>
          {(isAws || isExternal) && (
            <p className="text-[10px] text-text-secondary truncate">{node.category}</p>
          )}
          {isPipeline && <p className="text-[10px] text-text-secondary truncate">{node.subtitle}</p>}
        </div>
      </div>
      {isApp && (
        <>
          <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">
            {projectById[node.projectRef]?.tagline}
          </p>
          <StatusPill />
        </>
      )}
    </motion.button>
  )
}

function StatusPill() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#38BDF8]">
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"
      />
      Live
    </span>
  )
}

function ZoomButton({ icon: Icon, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-cursor-hover
      className="w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:border-white/20 transition-colors duration-300"
    >
      <Icon size={14} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Minimap — bottom-right overview, mirrors current camera position
// ---------------------------------------------------------------------------

function Minimap({ x, y, scale, viewportRef, isFullscreen }) {
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const mapWidth = 150
  const mapHeight = (mapWidth * CANVAS_HEIGHT) / CANVAS_WIDTH
  const mapScale = mapWidth / CANVAS_WIDTH

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setViewport({ w: rect.width, h: rect.height })
    }
    // Re-measure on mount, on window resize, and whenever the viewport
    // switches between inline and fullscreen (which resizes it without
    // firing a window resize event).
    const id = requestAnimationFrame(update)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', update)
    }
  }, [viewportRef, isFullscreen])

  const cx = useMotionValue(0)
  const cy = useMotionValue(0)
  const cw = useMotionValue(0)
  const ch = useMotionValue(0)

  useEffect(() => {
    const update = () => {
      const s = scale.get()
      cx.set(-x.get() / s)
      cy.set(-y.get() / s)
      cw.set(viewport.w / s)
      ch.set(viewport.h / s)
    }
    const unsubs = [x.on('change', update), y.on('change', update), scale.on('change', update)]
    update()
    return () => unsubs.forEach((u) => u())
  }, [x, y, scale, viewport, cx, cy, cw, ch])

  return (
    <div
      className="absolute bottom-4 right-4 rounded-xl2 glass border border-white/10 p-2 z-20"
      style={{ width: mapWidth + 16, height: mapHeight + 16 }}
    >
      <div
        className="relative rounded-lg bg-white/[0.03] overflow-hidden"
        style={{ width: mapWidth, height: mapHeight }}
      >
        {allNodes.map((node) => (
          <span
            key={node.id}
            className="absolute rounded-[1px]"
            style={{
              left: node.x * mapScale,
              top: node.y * mapScale,
              width: Math.max(2, (node.width || 158) * mapScale),
              height: Math.max(2, (node.height || 78) * mapScale),
              backgroundColor:
                node.kind === 'external' ? 'rgba(192,132,252,0.5)' : 'rgba(56,189,248,0.5)',
            }}
          />
        ))}
        <motion.div
          className="absolute border border-white/70 rounded-[2px]"
          style={{
            left: useTransformedValue(cx, mapScale),
            top: useTransformedValue(cy, mapScale),
            width: useTransformedValue(cw, mapScale),
            height: useTransformedValue(ch, mapScale),
          }}
        />
      </div>
    </div>
  )
}

function useTransformedValue(motionValue, factor) {
  const [value, setValue] = useState(motionValue.get() * factor)
  useEffect(() => {
    const unsub = motionValue.on('change', (v) => setValue(v * factor))
    return unsub
  }, [motionValue, factor])
  return value
}

// ---------------------------------------------------------------------------
// Project focus overlay: fixed mini-diagram shown when an application is
// clicked. Rendered above the (blurred/faded) main canvas.
// ---------------------------------------------------------------------------

function ProjectFocusOverlay({ app, onBack, onOpenService }) {
  const diagram = applicationDiagrams[app.id]
  const project = projectById[app.projectRef]
  if (!diagram) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-20 flex items-center justify-center p-6 overflow-y-auto"
    >
      <div className="w-full max-w-lg my-auto rounded-xl3 glass p-8 border border-white/10">
        <button
          type="button"
          onClick={onBack}
          data-cursor-hover
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-6"
        >
          <FiArrowLeft size={14} /> Back to ecosystem
        </button>

        <p className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest mb-2">
          System diagram
        </p>
        <h3 className="font-display text-2xl text-white mb-6">{diagram.title}</h3>

        <div className="flex flex-col items-center gap-1.5">
          {diagram.flow.map((step, i) => (
            <div key={step.id} className="w-full flex flex-col items-center">
              <FocusNode step={step} onOpenService={onOpenService} />
              {i < diagram.flow.length - 1 && <VerticalPulseLine delay={i * 0.08} />}
            </div>
          ))}
        </div>

        {project && (
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-sm">
            <p className="text-xs font-mono uppercase tracking-widest text-[#38BDF8] mb-1">
              Impact
            </p>
            <p className="text-text-secondary leading-relaxed">{project.impact}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function FocusNode({ step, onOpenService }) {
  const isAws = step.kind === 'aws'
  const isExternal = step.kind === 'external'
  const clickable = isAws && nodeById[step.relatedAws || step.id]
  const accent = isExternal ? 'text-purple-300' : 'text-[#38BDF8]'
  const bg = isExternal ? 'bg-purple-400/10' : 'bg-[#38BDF8]/10'

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={!clickable}
        data-cursor-hover={!!clickable}
        onClick={() => clickable && onOpenService(step.relatedAws || step.id)}
        className={`w-full flex items-center gap-3 rounded-xl2 px-4 py-3 border transition-colors duration-300 ${
          clickable
            ? `glass border-white/[0.08] ${
                isExternal ? 'hover:border-purple-400/40' : 'hover:border-[#38BDF8]/40'
              } cursor-pointer`
            : 'bg-white/[0.03] border-white/[0.06]'
        }`}
      >
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isAws || isExternal ? `${bg} ${accent}` : 'bg-white/5 text-text-secondary'
          }`}
        >
          <FiBox size={14} />
        </span>
        <span className="text-sm text-white font-medium">{step.label}</span>
      </button>
      {step.children && (
        <div className="flex gap-2 mt-1.5 pl-8">
          {step.children.map((child) => (
            <span
              key={child.id}
              className="flex-1 text-center text-[11px] text-text-secondary bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-2"
            >
              {child.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function CiCdFocusOverlay({ onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-20 flex items-center justify-center p-6 overflow-y-auto"
    >
      <div className="w-full max-w-lg my-auto rounded-xl3 glass p-8 border border-white/10">
        <button
          type="button"
          onClick={onBack}
          data-cursor-hover
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-6"
        >
          <FiArrowLeft size={14} /> Back to ecosystem
        </button>

        <p className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest mb-2">
          Deployment pipeline
        </p>
        <h3 className="font-display text-2xl text-white mb-6">{ciCdDiagram.title}</h3>

        <div className="flex flex-col items-center gap-1.5">
          {ciCdDiagram.flow.map((step, i) => (
            <div key={step.id} className="w-full flex flex-col items-center">
              <div
                className={`w-full flex items-center gap-3 rounded-xl2 px-4 py-3 border glass border-white/[0.08] ${
                  step.kind === 'application' ? 'border-[#38BDF8]/20' : ''
                }`}
              >
                <span className="w-8 h-8 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0">
                  <FiBox size={14} />
                </span>
                <span className="text-sm text-white font-medium">{step.label}</span>
              </div>
              {i < ciCdDiagram.flow.length - 1 && <VerticalPulseLine delay={i * 0.08} />}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function VerticalPulseLine({ delay = 0 }) {
  return (
    <div className="relative w-px h-6">
      <div className="absolute inset-0 bg-white/[0.08]" />
      <motion.div
        className="absolute left-0 top-0 w-px h-2.5 bg-[#38BDF8]"
        animate={{ y: [0, 24, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Side panels — AWS / External / Pipeline (same slide-in treatment)
// ---------------------------------------------------------------------------

function PanelShell({ onClose, accentColor, children }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 right-0 z-[90] h-full w-full max-w-sm bg-[#0B0B0D]/95 border-l border-white/[0.08] backdrop-blur-2xl p-8 overflow-y-auto"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          data-cursor-hover
          className="absolute top-6 right-6 text-text-secondary hover:text-white transition-colors"
        >
          <FiX size={20} />
        </button>
        {children}
      </motion.aside>
    </>
  )
}

function PanelSection({ label, children }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-mono uppercase tracking-widest text-text-secondary mb-1">
        {label}
      </p>
      {children}
    </div>
  )
}

function AwsPanel({ node, onClose, onSelectRelated }) {
  const Icon = AWS_ICONS[node.id] || FiBox
  return (
    <PanelShell onClose={onClose}>
      <div className="w-12 h-12 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center mb-5">
        <Icon size={20} />
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-[#38BDF8] mb-1">
        {node.category}
      </p>
      <h3 className="font-display text-2xl text-white mb-6">{node.label}</h3>

      <PanelSection label="Purpose">
        <p className="text-text-secondary text-sm leading-relaxed">{node.purpose}</p>
      </PanelSection>

      <PanelSection label="Used By">
        <ul className="mt-2 space-y-2">
          {node.usedBy.map((appId) => {
            const app = nodeById[appId]
            if (!app) return null
            return (
              <li key={appId} className="flex items-center gap-2 text-sm text-white">
                <span>{app.emoji}</span>
                {app.shortLabel}
              </li>
            )
          })}
        </ul>
      </PanelSection>

      <PanelSection label="Connected Services">
        <div className="flex flex-wrap gap-2 mt-2">
          {node.connections.map((id) => {
            const rel = nodeById[id]
            if (!rel) return null
            return (
              <button
                key={id}
                type="button"
                data-cursor-hover
                onClick={() => onSelectRelated(id)}
                className="text-xs text-white bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:border-[#38BDF8]/40 hover:text-[#38BDF8] transition-colors duration-300"
              >
                {rel.shortLabel || rel.label}
              </button>
            )
          })}
        </div>
      </PanelSection>

      <PanelSection label="Resources">
        <ul className="mt-2 space-y-1.5">
          {node.resources.map((res) => (
            <li key={res} className="text-sm text-text-secondary flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#38BDF8]" />
              {res}
            </li>
          ))}
        </ul>
      </PanelSection>
    </PanelShell>
  )
}

function ExternalPanel({ node, onClose, onSelectRelated }) {
  const Icon = EXTERNAL_ICONS[node.id] || FiBox
  return (
    <PanelShell onClose={onClose}>
      <div className="w-12 h-12 rounded-full bg-purple-400/10 text-purple-300 flex items-center justify-center mb-5">
        <Icon size={20} />
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-purple-300 mb-1">
        {node.category} &middot; External
      </p>
      <h3 className="font-display text-2xl text-white mb-6">{node.label}</h3>

      <PanelSection label="Purpose">
        <p className="text-text-secondary text-sm leading-relaxed">{node.purpose}</p>
      </PanelSection>

      <PanelSection label="Used By">
        <ul className="mt-2 space-y-2">
          {node.usedBy.map((appId) => {
            const app = nodeById[appId]
            if (!app) return null
            return (
              <li key={appId} className="flex items-center gap-2 text-sm text-white">
                <span>{app.emoji}</span>
                {app.shortLabel}
              </li>
            )
          })}
        </ul>
      </PanelSection>

      {node.connections.length > 0 && (
        <PanelSection label="Connected Services">
          <div className="flex flex-wrap gap-2 mt-2">
            {node.connections.map((id) => {
              const rel = nodeById[id]
              if (!rel) return null
              return (
                <button
                  key={id}
                  type="button"
                  data-cursor-hover
                  onClick={() => onSelectRelated(id)}
                  className="text-xs text-white bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:border-purple-400/40 hover:text-purple-300 transition-colors duration-300"
                >
                  {rel.shortLabel || rel.label}
                </button>
              )
            })}
          </div>
        </PanelSection>
      )}

      <PanelSection label="Resources">
        <ul className="mt-2 space-y-1.5">
          {node.resources.map((res) => (
            <li key={res} className="text-sm text-text-secondary flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-purple-300" />
              {res}
            </li>
          ))}
        </ul>
      </PanelSection>
    </PanelShell>
  )
}

function PipelinePanel({ node, onClose, onOpenService }) {
  const Icon = PIPELINE_ICONS[node.id] || FiBox
  const linked = node.relatedAws ? nodeById[node.relatedAws] : null

  return (
    <PanelShell onClose={onClose}>
      <div className="w-12 h-12 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center mb-5">
        <Icon size={20} />
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-[#38BDF8] mb-1">
        CI/CD Pipeline &middot; {node.subtitle}
      </p>
      <h3 className="font-display text-2xl text-white mb-6">{node.label}</h3>

      <PanelSection label="Purpose">
        <p className="text-text-secondary text-sm leading-relaxed">{node.purpose}</p>
      </PanelSection>

      {node.deploysTo && (
        <PanelSection label="Deploys To">
          <ul className="mt-2 space-y-2">
            {node.deploysTo.map((appId) => {
              const app = nodeById[appId]
              if (!app) return null
              return (
                <li key={appId} className="flex items-center gap-2 text-sm text-white">
                  <span>{app.emoji}</span>
                  {app.shortLabel}
                </li>
              )
            })}
          </ul>
        </PanelSection>
      )}

      {linked && (
        <PanelSection label="Backed By">
          <button
            type="button"
            data-cursor-hover
            onClick={() => onOpenService(linked.id)}
            className="text-xs text-white bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:border-[#38BDF8]/40 hover:text-[#38BDF8] transition-colors duration-300"
          >
            {linked.shortLabel}
          </button>
        </PanelSection>
      )}
    </PanelShell>
  )
}
