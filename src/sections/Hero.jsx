import { motion } from 'framer-motion'
import { FiArrowDown } from 'react-icons/fi'
import { profile } from '../data/profile'
import { resumeUrl } from '../data/nav'
import AuroraBackground from '../components/ui/AuroraBackground'
import MagneticButton from '../components/ui/MagneticButton'
import TypingText from '../components/ui/TypingText'
import portraitImg from '../assets/Portfolio.jpeg'
import { trackHeroCta, trackResumeOpened } from '../lib/analytics'

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden"
    >
      <AuroraBackground />

      <div className="section-container relative z-10 grid lg:grid-cols-[1.5fr_0.8fr] gap-16 lg:gap-20 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm text-accent-cyan font-mono tracking-widest uppercase mb-7"
          >
            Available for select opportunities
          </motion.p>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight text-white">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              <TypingText words={profile.roles} className="gradient-text" />
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-7 text-lg text-text-secondary max-w-xl leading-relaxed"
          >
            {profile.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-12 flex flex-wrap items-center gap-6"
          >
            <MagneticButton
              as="a"
              href="#projects"
              data-cursor-hover
              onClick={() => trackHeroCta('view_projects')}
              className="inline-flex items-center rounded-full bg-white text-black text-sm font-medium px-6 py-3.5 transition-shadow hover:shadow-glow"
            >
              View Projects
            </MagneticButton>
            <MagneticButton
              as="a"
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              data-cursor-hover
              onClick={() => trackResumeOpened('hero')}
              className="inline-flex items-center rounded-full border border-border-subtle text-white text-sm font-medium px-6 py-3.5 glass hover:border-white/20"
            >
              Download Resume
            </MagneticButton>
            <MagneticButton
              as="a"
              href="#contact"
              data-cursor-hover
              onClick={() => trackHeroCta('contact_me')}
              className="inline-flex items-center text-sm font-medium px-2 py-3.5 text-text-secondary hover:text-white transition-colors"
            >
              Contact Me &rarr;
            </MagneticButton>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm aspect-square"
        >
          <div className="absolute inset-0 rounded-xl4 bg-gradient-to-br from-accent-purple/30 via-accent-blue/20 to-accent-cyan/20 blur-2xl" />
          <motion.div
            layoutId="hero-portrait"
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full rounded-xl4 glass overflow-hidden"
          >
            <img
              src={portraitImg}
              alt="Portrait"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>
      </div>

      <motion.a
        href="#about"
        data-cursor-hover
        aria-label="Scroll to About section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-secondary"
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FiArrowDown />
        </motion.span>
      </motion.a>
    </section>
  )
}
