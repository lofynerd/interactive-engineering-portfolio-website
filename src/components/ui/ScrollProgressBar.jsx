import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Thin fixed progress bar at the top of the viewport reflecting scroll position.
 */
export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.2 })

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60] bg-gradient-to-r from-accent-purple via-accent-blue to-accent-cyan"
    />
  )
}
