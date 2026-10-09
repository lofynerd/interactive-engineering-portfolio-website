import RevealOnScroll from '../components/ui/RevealOnScroll'

export default function About() {
  return (
    <section id="about" className="relative py-28 md:py-36">
      <div className="section-container">
        <RevealOnScroll>
          <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
            About
          </p>
        </RevealOnScroll>

        <div className="space-y-6 text-lg text-text-secondary leading-relaxed max-w-3xl">
          <RevealOnScroll>
            <p>
              Lead Software Engineer at Tomasi Design. I built our platform and cloud infrastructure from scratch, and I'm responsible for how it all fits together—from application architecture to production deployments.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <p>
              I enjoy solving the problems that sit between software and infrastructure, making systems work well without making them unnecessarily complicated.
            </p>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  )
}
