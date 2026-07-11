import { FiGithub, FiLinkedin, FiMail } from 'react-icons/fi'
import { profile } from '../../data/profile'
import RevealOnScroll from '../ui/RevealOnScroll'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-border-subtle mt-32">
      <div className="section-container py-14">
        <RevealOnScroll>
          <p className="font-display text-xl md:text-2xl text-white/90 max-w-2xl">
            {profile.quote}
          </p>
        </RevealOnScroll>

        <div className="mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <p className="text-sm text-text-secondary">
            &copy; {year} {profile.name}. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              data-cursor-hover
              aria-label="GitHub"
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-text-secondary hover:text-white hover:-translate-y-0.5 transition-all duration-300"
            >
              <FiGithub />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              data-cursor-hover
              aria-label="LinkedIn"
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-text-secondary hover:text-white hover:-translate-y-0.5 transition-all duration-300"
            >
              <FiLinkedin />
            </a>
            <a
              href={`mailto:${profile.email}`}
              data-cursor-hover
              aria-label="Email"
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-text-secondary hover:text-white hover:-translate-y-0.5 transition-all duration-300"
            >
              <FiMail />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
