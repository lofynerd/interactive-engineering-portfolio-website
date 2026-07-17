import RevealOnScroll from '../components/ui/RevealOnScroll'
import { profile } from '../data/profile'

export default function Quote() {
  return (
    <section id="quote" className="relative py-28 md:py-36">
      <div className="section-container">
        <RevealOnScroll>
          <blockquote className="font-display text-3xl md:text-5xl text-white/90 max-w-3xl leading-tight text-center mx-auto">
            {profile.quote}
          </blockquote>
        </RevealOnScroll>
      </div>
    </section>
  )
}
