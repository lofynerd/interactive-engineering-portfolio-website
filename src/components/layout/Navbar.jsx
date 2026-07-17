import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiMenu, HiX } from 'react-icons/hi'
import { navLinks, resumeUrl } from '../../data/nav'
import MagneticButton from '../ui/MagneticButton'
import { trackNavClick, trackResumeOpened } from '../../lib/analytics'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const sections = navLinks.map((l) => document.getElementById(l.id)).filter(Boolean)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4"
      >
        <nav
          className={`w-full max-w-6xl flex items-center justify-between rounded-full transition-all duration-500 ease-premium glass ${
            scrolled ? 'mt-3 px-5 py-2.5 shadow-soft' : 'mt-5 px-6 py-3.5'
          }`}
        >
          <a href="#home" className="font-display font-semibold tracking-tight text-white text-lg" data-cursor-hover>
            AR<span className="text-accent-purple">.</span>
          </a>

          <ul className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  data-cursor-hover
                  onClick={() => trackNavClick(link.id, link.label)}
                  className={`relative px-3.5 py-2 text-sm rounded-full transition-colors duration-300 ${
                    activeSection === link.id
                      ? 'text-white'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {activeSection === link.id && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-white/8 border border-border-subtle"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <MagneticButton
              as="a"
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              data-cursor-hover
              onClick={() => trackResumeOpened('navbar')}
              className="inline-flex items-center rounded-full bg-white text-black text-sm font-medium px-4 py-2 transition-shadow hover:shadow-glow"
            >
              Resume
            </MagneticButton>
          </div>

          <button
            className="lg:hidden text-white text-2xl"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <HiMenu />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-bg/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-end p-6">
              <button
                className="text-white text-3xl"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <HiX />
              </button>
            </div>
            <ul className="flex flex-col items-center gap-6 mt-8">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <a
                    href={link.href}
                    onClick={() => {
                      setMobileOpen(false)
                      trackNavClick(link.id, link.label)
                    }}
                    className="text-2xl font-display text-white"
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
              <motion.li initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * navLinks.length }}>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackResumeOpened('mobile_menu')}
                  className="inline-flex items-center rounded-full bg-white text-black text-sm font-medium px-5 py-2.5 mt-2"
                >
                  View Resume
                </a>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
