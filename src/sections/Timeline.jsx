import { motion } from 'framer-motion'
import {
  FiBook,
  FiCode,
  FiTrendingUp,
  FiAward,
  FiFlag,
} from 'react-icons/fi'
import { timelineEvents } from '../data/timeline'
import RevealOnScroll from '../components/ui/RevealOnScroll'

const iconByType = {
  education: FiBook,
  project: FiCode,
  learning: FiTrendingUp,
  certification: FiAward,
  achievement: FiFlag,
}

export default function Timeline() {
  return (
    <section id="timeline" className="relative py-28 md:py-36 bg-bg-secondary">
      <div className="section-container">
        <RevealOnScroll>
          <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
            Timeline
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white max-w-2xl">
            The path so far.
          </h2>
        </RevealOnScroll>

        <div className="mt-16 relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border-subtle md:left-1/2" />

          <div className="space-y-10">
            {timelineEvents.map((event, i) => {
              const Icon = iconByType[event.type] || FiFlag
              const isEven = i % 2 === 0
              return (
                <RevealOnScroll key={event.id} delay={0.05 * i}>
                  <div
                    className={`relative flex items-start gap-6 md:gap-0 ${
                      isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`hidden md:block md:w-1/2 ${
                        isEven ? 'md:pr-10 md:text-right' : 'md:pl-10'
                      }`}
                    >
                      {isEven && <TimelineCard event={event} />}
                    </div>

                    <motion.div
                      whileInView={{ scale: [0.6, 1] }}
                      viewport={{ once: true }}
                      className="relative z-10 w-10 h-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-accent-cyan shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2"
                    >
                      <Icon size={16} />
                    </motion.div>

                    <div className="flex-1 md:w-1/2 md:pl-10">
                      <div className="md:hidden">
                        <TimelineCard event={event} />
                      </div>
                      {!isEven && (
                        <div className="hidden md:block">
                          <TimelineCard event={event} />
                        </div>
                      )}
                    </div>
                  </div>
                </RevealOnScroll>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function TimelineCard({ event }) {
  return (
    <div className="inline-block rounded-xl2 glass p-5 max-w-md">
      <p className="text-xs font-mono text-accent-cyan uppercase tracking-widest mb-1">
        {event.year}
      </p>
      <h3 className="font-display text-white text-base">{event.title}</h3>
      <p className="text-text-secondary text-sm mt-1 leading-relaxed">{event.description}</p>
    </div>
  )
}
