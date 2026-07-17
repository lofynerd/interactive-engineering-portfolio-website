import { FiGithub, FiLinkedin, FiMail } from 'react-icons/fi'
import posthog from 'posthog-js'
import { profile } from '../data/profile'
import RevealOnScroll from '../components/ui/RevealOnScroll'
import MagneticButton from '../components/ui/MagneticButton'

const links = [
  { icon: FiMail, label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
  { icon: FiGithub, label: 'GitHub', value: 'View profile', href: profile.github, external: true },
  { icon: FiLinkedin, label: 'LinkedIn', value: 'View profile', href: profile.linkedin, external: true },
]

export default function Contact() {
  return (
    <section id="contact" className="relative py-28 md:py-36">
      <div className="section-container">
        <RevealOnScroll>
          <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
            Contact
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white">
            Let's build something.
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed max-w-md">
            Open to select freelance work, cloud architecture consulting, and
            interesting full-time roles. Reach out through any of the channels below.
          </p>
        </RevealOnScroll>

        <div className="mt-12 grid sm:grid-cols-3 gap-5">
          {links.map((link, i) => (
            <RevealOnScroll key={link.label} delay={0.1 * i}>
              <MagneticButton
                as="a"
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                data-cursor-hover
                onClick={() => posthog.capture('contact_link_clicked', { channel: link.label.toLowerCase() })}
                className="group flex flex-col items-start gap-4 rounded-xl3 glass p-6 h-full hover:border-white/20 border border-transparent transition-colors duration-300"
              >
                <span className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:text-accent-cyan transition-colors duration-300">
                  <link.icon size={18} />
                </span>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">
                    {link.label}
                  </p>
                  <p className="mt-1 text-white font-medium">{link.value}</p>
                </div>
              </MagneticButton>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
