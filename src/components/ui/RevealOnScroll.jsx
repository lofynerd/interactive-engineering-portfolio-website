import { motion } from 'framer-motion'

/**
 * Generic scroll-reveal wrapper: fades and slides content in once it
 * enters the viewport. Use `delay` to stagger sibling elements.
 */
export default function RevealOnScroll({
  children,
  delay = 0,
  y = 24,
  once = true,
  className = '',
  as = 'div',
}) {
  const Component = motion[as] || motion.div

  return (
    <Component
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </Component>
  )
}
