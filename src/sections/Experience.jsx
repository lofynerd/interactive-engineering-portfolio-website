import { experience } from '../data/experience'
import RevealOnScroll from '../components/ui/RevealOnScroll'

export default function Experience() {
  return (
    <section id="experience" className="relative py-28 md:py-36">
      <div className="section-container">
        <RevealOnScroll>
          <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
            Experience
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white max-w-2xl">
            Where I've put this into practice.
          </h2>
        </RevealOnScroll>

        <div className="mt-14 relative pl-8 border-l border-border-subtle space-y-14">
          {experience.map((role, i) => (
            <RevealOnScroll key={role.id} delay={0.1 * i}>
              <div className="relative">
                <span className="absolute -left-[41px] top-1 w-3 h-3 rounded-full bg-accent-cyan shadow-glow-cyan" />
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  <h3 className="font-display text-xl text-white">{role.role}</h3>
                  <span className="text-text-secondary">&middot;</span>
                  <span className="text-white/80">{role.company}</span>
                  <span className="ml-auto text-sm text-text-secondary font-mono">
                    {role.period}
                  </span>
                </div>
                <ul className="mt-4 space-y-3">
                  {role.achievements.map((achievement, idx) => (
                    <li
                      key={idx}
                      className="text-text-secondary leading-relaxed pl-4 border-l border-border-subtle"
                    >
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
