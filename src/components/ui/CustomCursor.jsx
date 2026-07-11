import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * Custom glowing cursor dot + ring, desktop-only (fine pointer devices).
 * Falls back to the native cursor on touch devices.
 */
export default function CustomCursor() {
  const [isFinePointer, setIsFinePointer] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springX = useSpring(cursorX, { damping: 25, stiffness: 300 })
  const springY = useSpring(cursorY, { damping: 25, stiffness: 300 })

  useEffect(() => {
    const mql = window.matchMedia('(pointer: fine)')
    setIsFinePointer(mql.matches)
  }, [])

  useEffect(() => {
    if (!isFinePointer) return

    const move = (e) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    const handleOver = (e) => {
      const target = e.target
      if (target.closest('a, button, [data-cursor-hover]')) {
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', handleOver)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', handleOver)
    }
  }, [isFinePointer, cursorX, cursorY])

  if (!isFinePointer) return null

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 z-[999] pointer-events-none rounded-full bg-white"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          width: 6,
          height: 6,
        }}
      />
      <motion.div
        className="fixed top-0 left-0 z-[998] pointer-events-none rounded-full border border-white/40"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 56 : 32,
          height: isHovering ? 56 : 32,
          opacity: isHovering ? 0.6 : 0.35,
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      />
    </>
  )
}
