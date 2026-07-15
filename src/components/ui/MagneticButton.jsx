import { useMemo } from 'react'
import { motion } from 'framer-motion'

// Cache motion-wrapped components per tag/component so we never create a
// new component type on every render (which would force React to unmount
// and remount the element).
const motionComponentCache = new Map()

function getMotionComponent(Component) {
  if (!motionComponentCache.has(Component)) {
    motionComponentCache.set(Component, motion(Component))
  }
  return motionComponentCache.get(Component)
}

/**
 * Button/link with a subtle hover lift. Previously followed the cursor
 * position ("magnetic" effect), but that relied on per-pixel mousemove
 * state updates which caused visible jitter/misalignment — replaced with
 * a simple, stable whileHover/whileTap scale instead.
 */
export default function MagneticButton({
  as: Component = 'button',
  className = '',
  children,
  ...props
}) {
  const MotionComponent = useMemo(() => getMotionComponent(Component), [Component])

  return (
    <MotionComponent
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  )
}
