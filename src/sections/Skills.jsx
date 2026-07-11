import { motion } from 'framer-motion'
import { skillCategories, learningNow } from '../data/skills'
import RevealOnScroll from '../components/ui/RevealOnScroll'
import TiltCard from '../components/ui/TiltCard'

export default function Skills() {
  return (
    <section id="skills" className="relative py-28 md:py-36">
      <div className="section-container">
        <RevealOnScroll>
          <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
            Skills
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white max-w-2xl">
            Tools I reach for to design, build, and ship.
          </h2>
        </RevealOnScroll>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {skillCategories.map((category, i) => (
            <RevealOnScroll key={category.id} delay={0.05 * i}>
              <TiltCard className="rounded-xl3 glass p-6 h-full hover:border-white/20 border border-transparent transition-colors duration-300">
                <h3 className="font-display text-white text-lg mb-4">{category.label}</h3>
                <ul className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <li
                      key={skill}
                      className="text-xs text-text-secondary bg-white/5 border border-border-subtle rounded-full px-3 py-1.5"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll delay={0.2}>
          <div className="mt-8 rounded-xl3 border border-accent-purple/30 bg-gradient-to-br from-accent-purple/10 via-transparent to-accent-cyan/10 p-6">
            <p className="text-sm font-mono text-accent-cyan uppercase tracking-widest mb-3">
              Currently learning
            </p>
            <div className="flex flex-wrap gap-3">
              {learningNow.map((item) => (
                <motion.span
                  key={item}
                  whileHover={{ y: -2 }}
                  className="text-sm text-white bg-white/8 border border-border-subtle rounded-full px-4 py-2"
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
