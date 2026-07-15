import resumePdf from '../assets/Latest-Resume.pdf'

export const navLinks = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'about', label: 'About', href: '#about' },
  { id: 'experience', label: 'Experience', href: '#experience' },
  { id: 'projects', label: 'Projects', href: '#projects' },
  { id: 'skills', label: 'Skills', href: '#skills' },
  { id: 'architecture', label: 'Architecture', href: '#architecture' },
  { id: 'certifications', label: 'Certifications', href: '#certifications' },
  { id: 'timeline', label: 'Timeline', href: '#timeline' },
  { id: 'contact', label: 'Contact', href: '#contact' },
]

// Bundled locally so it's always reachable without S3 permissions/CORS.
export const resumeUrl = resumePdf
