import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiGithub, FiExternalLink, FiX } from 'react-icons/fi'
import { projects } from '../data/projects'
import RevealOnScroll from '../components/ui/RevealOnScroll'
import TiltCard from '../components/ui/TiltCard'
import { trackProjectOpened, trackProjectLinkClicked } from '../lib/analytics'

export default function Projects() {
  const [selected, setSelected] = useState(null)

  return (
    <section id="projects" className="relative py-28 md:py-36">
      <div className="section-container">
        <RevealOnScroll>
          <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
            Projects
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white max-w-2xl">
            A few notable things I've built .
          </h2>
        </RevealOnScroll>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <RevealOnScroll key={project.id} delay={0.08 * i}>
              <TiltCard
                maxTilt={4}
                className={`group rounded-xl3 glass p-6 h-full flex flex-col justify-between cursor-pointer border border-transparent hover:border-white/20 transition-colors duration-300 ${
                  project.comingSoon ? 'opacity-60' : ''
                }`}
              >
                <div
                  onClick={() => {
                    if (!project.comingSoon) {
                      setSelected(project)
                      trackProjectOpened(project.id, project.title)
                    }
                  }}
                  data-cursor-hover
                >
                  <div className="relative rounded-xl2 bg-white/5 h-44 mb-5 flex items-center justify-center text-text-secondary text-sm overflow-hidden">
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={`${project.title} banner`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <span>{project.comingSoon ? 'Coming soon' : 'Project screenshot'}</span>
                    )}
                    {project.comingSoon && (
                      <span className="absolute bottom-2 right-2 text-xs font-mono uppercase tracking-widest text-white bg-black/60 rounded-full px-3 py-1">
                        Coming soon
                      </span>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.stopPropagation()
                          trackProjectLinkClicked(project.id, 'live')
                        }}
                        data-cursor-hover
                        aria-label={`Visit ${project.title} live site`}
                        className="absolute inset-0"
                      />
                    )}
                  </div>
                  <h3 className="font-display text-xl text-white mb-2">
                    {project.liveUrl ? (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        data-cursor-hover
                        className="hover:text-accent-cyan transition-colors"
                      >
                        {project.title}
                      </a>
                    ) : (
                      project.title
                    )}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{project.tagline}</p>
                </div>

                {!project.comingSoon && (
                  <>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="text-xs text-text-secondary bg-white/5 border border-border-subtle rounded-full px-3 py-1"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center gap-4 text-text-secondary">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          data-cursor-hover
                          onClick={() => trackProjectLinkClicked(project.id, 'github')}
                          className="hover:text-white transition-colors"
                          aria-label="GitHub repository"
                        >
                          <FiGithub />
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          data-cursor-hover
                          onClick={() => trackProjectLinkClicked(project.id, 'live')}
                          className="hover:text-white transition-colors"
                          aria-label="Live demo"
                        >
                          <FiExternalLink />
                        </a>
                      )}
                    </div>
                  </>
                )}
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl3 glass p-8"
            >
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute top-5 right-5 text-text-secondary hover:text-white"
              >
                <FiX size={22} />
              </button>

              {selected.image && (
                <div className="rounded-xl2 overflow-hidden mb-6 -mt-1">
                  <img
                    src={selected.image}
                    alt={`${selected.title} banner`}
                    className="w-full h-auto"
                  />
                </div>
              )}

              <h3 className="font-display text-2xl text-white mb-1">
                {selected.liveUrl ? (
                  <a
                    href={selected.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor-hover
                    className="hover:text-accent-cyan transition-colors"
                  >
                    {selected.title}
                  </a>
                ) : (
                  selected.title
                )}
              </h3>
              <p className="text-text-secondary mb-6">{selected.tagline}</p>

              <div className="space-y-5 text-sm">
                <DetailBlock label="Problem" text={selected.problem} />
                <DetailBlock label="Solution" text={selected.solution} />
                <DetailBlock label="Architecture" text={selected.architectureNote} />
                <DetailBlock label="Challenges" text={selected.challenges} />
                <DetailBlock label="Impact" text={selected.impact} />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {selected.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-xs text-text-secondary bg-white/5 border border-border-subtle rounded-full px-3 py-1"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function DetailBlock({ label, text }) {
  if (!text) return null
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-accent-cyan mb-1">{label}</p>
      <p className="text-text-secondary leading-relaxed">{text}</p>
    </div>
  )
}
