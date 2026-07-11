import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiGithub, FiLinkedin, FiMail, FiMapPin, FiSend, FiCheck } from 'react-icons/fi'
import { profile } from '../data/profile'
import RevealOnScroll from '../components/ui/RevealOnScroll'
import MagneticButton from '../components/ui/MagneticButton'

const initialForm = { name: '', email: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.email.trim()) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address.'
    }
    if (!form.message.trim()) next.message = 'Message is required.'
    return next
  }

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    // Placeholder submit — wire up to Formspree / EmailJS / a backend endpoint.
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setStatus('success')
    setForm(initialForm)
    setTimeout(() => setStatus('idle'), 4000)
  }

  return (
    <section id="contact" className="relative py-28 md:py-36">
      <div className="section-container grid lg:grid-cols-[0.9fr_1.1fr] gap-14">
        <div>
          <RevealOnScroll>
            <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
              Contact
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white">
              Let's build something.
            </h2>
            <p className="mt-4 text-text-secondary leading-relaxed max-w-md">
              Open to select freelance work, cloud architecture consulting, and
              interesting full-time roles. Reach out and I'll get back to you.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.15}>
            <div className="mt-10 space-y-4">
              <ContactLink icon={FiMail} label={profile.email} href={`mailto:${profile.email}`} />
              <ContactLink icon={FiGithub} label="GitHub" href={profile.github} external />
              <ContactLink icon={FiLinkedin} label="LinkedIn" href={profile.linkedin} external />
              <ContactLink icon={FiMapPin} label={profile.location} />
            </div>
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={0.1}>
          <form onSubmit={handleSubmit} className="rounded-xl3 glass p-8 space-y-5">
            <Field
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Field
              label="Message"
              name="message"
              as="textarea"
              rows={5}
              value={form.message}
              onChange={handleChange}
              error={errors.message}
            />

            <MagneticButton
              as="button"
              type="submit"
              disabled={status === 'submitting'}
              data-cursor-hover
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black text-sm font-medium px-6 py-3.5 transition-shadow hover:shadow-glow disabled:opacity-70"
            >
              {status === 'success' ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2"
                >
                  <FiCheck /> Message sent
                </motion.span>
              ) : status === 'submitting' ? (
                'Sending...'
              ) : (
                <>
                  <FiSend /> Send message
                </>
              )}
            </MagneticButton>
          </form>
        </RevealOnScroll>
      </div>
    </section>
  )
}

function ContactLink({ icon: Icon, label, href, external }) {
  const content = (
    <span className="flex items-center gap-3 text-text-secondary hover:text-white transition-colors duration-300">
      <span className="w-9 h-9 rounded-full glass flex items-center justify-center">
        <Icon size={15} />
      </span>
      {label}
    </span>
  )

  if (!href) return <div>{content}</div>

  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} data-cursor-hover>
      {content}
    </a>
  )
}

function Field({ label, name, value, onChange, error, as = 'input', type = 'text', rows }) {
  const Component = as
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-mono uppercase tracking-widest text-text-secondary mb-2">
        {label}
      </label>
      <Component
        id={name}
        name={name}
        type={as === 'input' ? type : undefined}
        rows={rows}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className="w-full rounded-xl2 bg-white/5 border border-border-subtle px-4 py-3 text-white placeholder:text-text-secondary/60 focus:outline-none focus:border-accent-cyan/50 transition-colors duration-300 resize-none"
      />
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
