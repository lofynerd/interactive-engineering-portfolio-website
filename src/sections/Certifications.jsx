import { FiAward, FiClock, FiExternalLink } from 'react-icons/fi'
import { certifications } from '../data/certifications'
import RevealOnScroll from '../components/ui/RevealOnScroll'
import TiltCard from '../components/ui/TiltCard'

export default function Certifications() {
  return (
    <section id="certifications" className="relative py-28 md:py-36">
      <div className="section-container">
        <RevealOnScroll>
          <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
            Certifications
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white max-w-2xl">
            Validating what I already practice.
          </h2>
        </RevealOnScroll>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certifications.map((cert, i) => {
            const earned = cert.status === 'earned'
            return (
              <RevealOnScroll key={cert.id} delay={0.06 * i}>
                <TiltCard
                  maxTilt={5}
                  className={`rounded-xl3 p-6 h-full border transition-colors duration-300 ${
                    earned
                      ? 'glass border-accent-cyan/30 shadow-glow-cyan'
                      : 'border-border-subtle bg-white/[0.02] opacity-70'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${
                      earned ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-white/5 text-text-secondary'
                    }`}
                  >
                    {earned ? <FiAward size={18} /> : <FiClock size={18} />}
                  </div>
                  <h3 className="font-display text-white text-lg mb-1">{cert.title}</h3>
                  <p className="text-text-secondary text-sm">{cert.issuer}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs font-mono uppercase tracking-widest">
                      {earned ? (
                        <span className="text-accent-cyan">Earned &middot; {cert.year}</span>
                      ) : (
                        <span className="text-text-secondary">Planned</span>
                      )}
                    </p>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        data-cursor-hover
                        aria-label={`View credential for ${cert.title}`}
                        className="text-text-secondary hover:text-white transition-colors"
                      >
                        <FiExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </TiltCard>
              </RevealOnScroll>
            )
          })}
        </div>
      </div>
    </section>
  )
}
