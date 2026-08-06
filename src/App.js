import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import { useLenis } from './hooks/useLenis'
import { useSectionTracking } from './hooks/useSectionTracking'
import { navLinks } from './data/nav'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import CustomCursor from './components/ui/CustomCursor'
import ScrollProgressBar from './components/ui/ScrollProgressBar'
import IntroLoader from './components/ui/IntroLoader'
import BreakItDemo from './components/ui/BreakItDemo'
import Hero from './sections/Hero'
import About from './sections/About'
import Experience from './sections/Experience'
import Projects from './sections/Projects'
import Skills from './sections/Skills'
import Architecture from './sections/Architecture'
import Certifications from './sections/Certifications'
import Timeline from './sections/Timeline'
import Quote from './sections/Quote'
import Contact from './sections/Contact'

const trackedSectionIds = [...navLinks.map((link) => link.id), 'quote']

function App() {
  useLenis()
  const [demoDone, setDemoDone] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  // Sections only exist in the DOM once the intro overlay is gone, so wait
  // for that before observing them.
  useSectionTracking(introDone ? trackedSectionIds : [])

  useEffect(() => {
    document.title = 'Arpan Raj — Cloud Architect & Full Stack Developer'
  }, [])

  useEffect(() => {
    // Lock scroll while the demo/intro overlays are visible.
    document.body.style.overflow = introDone ? '' : 'hidden'
    if (!demoDone || introDone) return

    const timer = setTimeout(() => setIntroDone(true), 600)
    return () => clearTimeout(timer)
  }, [demoDone, introDone])

  return (
    <ThemeProvider>
      <AnimatePresence>
        {!demoDone ? (
          <BreakItDemo key="break-it-demo" onContinue={() => setDemoDone(true)} />
        ) : !introDone ? (
          <IntroLoader key="loader" onSkip={() => setIntroDone(true)} />
        ) : (
          <div key="site">
            <ScrollProgressBar />
            <CustomCursor />
            <Navbar />
            <main>
              <Hero />
              <About />
              <Experience />
              <Projects />
              <Skills />
              <Architecture />
              <Certifications />
              <Timeline />
              <Quote />
              <Contact />
            </main>
            <Footer />
          </div>
        )}
      </AnimatePresence>
    </ThemeProvider>
  )
}

export default App
