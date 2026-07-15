import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import { useLenis } from './hooks/useLenis'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import CustomCursor from './components/ui/CustomCursor'
import ScrollProgressBar from './components/ui/ScrollProgressBar'
import IntroLoader from './components/ui/IntroLoader'
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

function App() {
  useLenis()
  const [introDone, setIntroDone] = useState(false)

  useEffect(() => {
    document.title = 'Arpan Raj — Cloud Architect & Full Stack Developer'
  }, [])

  useEffect(() => {
    // Lock scroll while the intro overlay is visible.
    document.body.style.overflow = introDone ? '' : 'hidden'
    if (introDone) return

    const timer = setTimeout(() => setIntroDone(true), 600)
    return () => clearTimeout(timer)
  }, [introDone])

  return (
    <ThemeProvider>
      <AnimatePresence>
        {!introDone ? (
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
