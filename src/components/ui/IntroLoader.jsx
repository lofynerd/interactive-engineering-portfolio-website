import { motion } from 'framer-motion'
import posthog from 'posthog-js'
import portraitImg from '../../assets/Portfolio.jpeg'

/**
 * Full-screen intro overlay shown on first load.
 *
 * The portrait box below shares `layoutId="hero-portrait"` with the real
 * portrait box rendered inside <Hero />. When this component unmounts,
 * Framer Motion automatically animates the shared element from its
 * fullscreen, centered position here into its final resting position in
 * the Hero grid — producing a seamless "zoom out into the page" effect.
 */
export default function IntroLoader({ onSkip }) {
  function handleSkip() {
    posthog.capture('intro_skipped')
    onSkip()
  }

  return (
    <motion.div
      key="intro-loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleSkip}
      className="fixed inset-0 z-[200] bg-bg flex items-center justify-center cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute w-[28rem] h-[28rem] rounded-full bg-accent-purple/20 blur-[110px]"
      />

      <motion.div
        layoutId="hero-portrait"
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[440px] sm:w-[600px] aspect-square rounded-xl4 glass overflow-hidden"
      >
        <img
          src={portraitImg}
          alt="Portrait"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute bottom-16 flex items-center gap-2 text-text-secondary text-xs font-mono uppercase tracking-widest"
      >
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1.5 h-1.5 rounded-full bg-accent-cyan"
        />
        Loading
      </motion.div>
    </motion.div>
  )
}
