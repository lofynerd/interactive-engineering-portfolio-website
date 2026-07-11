import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * Wraps its children in a button/link that subtly follows the cursor
 * when hovered, giving a "magnetic" feel. Disabled on touch devices.
 */
export default function MagneticButton({
  as: Component = 'button',
  className = '',
  children,
  strength = 0.35,
  ...props
}) {
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    setOffset({ x: relX * strength, y: relY * strength })
  }

  const handleMouseLeave = () => setOffset({ x: 0, y: 0 })

  const MotionComponent = motion(Component)

  return (
    <MotionComponent
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 12, mass: 0.2 }}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  )
}
