# Portfolio Website — Requirements

## 1. Vision

Build a premium, award-worthy portfolio website for a senior engineer (Cloud Architect / Full Stack Developer / AWS Engineer / CTO). The site must feel handcrafted and production-grade — inspired by Apple, Linear, Vercel, Stripe, Raycast, Framer, Supabase, and Figma — not a generic template. A visitor should leave thinking: "This person understands both design and engineering, and can build production-grade systems."

## 2. Tech Stack

- React (Create React App — no Vite)
- JavaScript (not TypeScript)
- Tailwind CSS
- Framer Motion (component/UI animation)
- GSAP + ScrollTrigger (scroll-driven animation)
- Lenis (smooth scrolling)
- React Icons
- Three.js / React Three Fiber (used sparingly, for subtle premium effects only)
- Clean, reusable component architecture

## 3. Design System

- Theme: dark by default, with optional light mode toggle
- Color palette:
  - Background: `#050505`
  - Secondary background: `#0B0B0B`
  - Card surface: `#111111`
  - Border: `rgba(255,255,255,0.08)`
  - Text primary: white
  - Text secondary: `#A0A0A0`
  - Accent: electric blue / purple / cyan (used sparingly, no rainbow gradients)
- Subtle glassmorphism on cards, nav, and modals
- Border radius: 18–30px
- Soft, layered shadows — no harsh drop shadows
- Generous spacing; every section should "breathe"
- Strong, deliberate typography hierarchy
- No bright/flashy colors, no cartoonish elements, no visual clutter

## 4. Animation & Interaction Requirements

- Framer Motion for entrance/hover/tap animations; GSAP + ScrollTrigger for scroll-linked effects
- Smooth page/section transitions and scroll-reveal animations
- Mouse parallax on hero and background elements
- Magnetic buttons (CTA buttons attract slightly toward cursor)
- Hover elevation on cards, images zoom gently on hover
- Floating background particles / animated mesh gradients / aurora background
- Animated glowing borders on featured cards
- Smooth number counters (e.g. years of experience, projects shipped)
- Text reveal animations (headline, section titles)
- Blur transitions between states/sections
- Staggered card entrance animations (skills, projects, certifications)
- Smooth scrolling via Lenis, with a scroll progress indicator
- Custom animated cursor (desktop only, disabled on touch)
- Tilt effect on project/certification cards
- Section fade-ins on scroll
- All animation must be performant (GPU-friendly transforms/opacity) and never distracting; respect `prefers-reduced-motion`

## 5. Navigation

- Sticky, transparent nav with blur background; shrinks elegantly on scroll
- Links: Home, About, Experience, Projects, Skills, Architecture, Certifications, Timeline, Contact
- "Resume Download" action in nav
- Active-section highlighting on scroll
- Mobile: animated hamburger menu / drawer

## 6. Sections

### 6.1 Hero
- Large headline: "Cloud Architect. Full Stack Developer. AWS Engineer."
- Subheadline: building scalable cloud infrastructure and modern web applications
- Animated typing effect cycling through role titles
- Professional portrait placeholder (image swap-ready)
- CTA buttons: View Projects, Download Resume, Contact Me
- Animated/mouse-reactive background with floating glowing elements
- Scroll indicator

### 6.2 About
- Narrative copy (not a bullet list of facts): journey, passion, problem-solving approach, engineering mindset, cloud enthusiasm, professional goals
- Personal but professional tone

### 6.3 Skills
- Interactive cards, not plain progress bars
- Categories: Frontend, Backend, Cloud, DevOps, Programming Languages, Databases, Tools, Security
- Skills: React, Node.js, Express, MongoDB, JavaScript, TypeScript, AWS, Docker, Git, GitHub, Linux, Python, Java, REST APIs, CloudFront, S3, EC2, IAM, Lambda, CloudFormation (basics), CI/CD, Jenkins
- "Currently Learning" highlight: Kubernetes, Terraform, GCP

### 6.4 Experience
- Animated vertical timeline
- Current role: CTO @ Tomasi Design
- Achievement-oriented copy with metrics wherever possible (not just responsibilities)

### 6.5 Projects
- Premium cards with hover animation, large screenshots, tech-stack badges, GitHub link, live demo link
- Projects: Tomasi Design E-Commerce, AWS Cloud Deployment, Image Compression Lambda, Analytics Dashboard, and a placeholder slot for future AI projects
- Each project details: Problem, Solution, Tech Stack, Challenges, Architecture, Impact
- Project detail view may include an architecture diagram

### 6.6 AWS Architecture
- Dedicated, visually distinct section with animated architecture diagram(s)
- Services represented: CloudFront, S3, ALB, ECS, ECR, Route53, IAM, Lambda, CloudWatch, SES
- Diagram animates progressively as the user scrolls (data flow / connection lines)

### 6.7 Certifications
- Premium cards
- Earned: AWS Cloud Practitioner
- Placeholder ("in progress" / "planned") cards: Solutions Architect, Developer Associate, Claude Certification, Kubernetes, Terraform

### 6.8 Timeline
- Unified animated career timeline combining education, self-learning milestones, key projects, achievements, and certifications

### 6.9 GitHub
- Contribution graph, pinned repositories, commit statistics, top languages, profile summary
- Data can be sourced live from GitHub's API or use a static snapshot if rate limits are a concern

### 6.10 Contact
- Glassmorphic contact form with client-side validation and animated submit state
- Social links: GitHub, LinkedIn, Email, Location

### 6.11 Footer
- Minimal, elegant, subtly animated
- Personal quote, copyright, social icons

## 7. Microinteractions

- Every interactive element responds to hover/focus
- Cards lift slightly on hover; buttons magnetize toward cursor
- Images zoom gently on hover; icons animate on hover
- Smooth, consistent transition timing across the entire site

## 8. Performance & Quality Bar

- Target Lighthouse score 95+ across Performance, Best Practices, SEO
- Accessibility: WCAG AA target (full compliance requires manual testing with assistive tech, which is out of scope for automated build)
- SEO optimized (meta tags, semantic HTML, structured data where relevant)
- Lazy loading for images and below-the-fold sections
- Image optimization and code splitting (route/section-level where applicable)
- Fully responsive: mobile, tablet, laptop, desktop, ultra-wide

## 9. Content & Copy Style

- Confident, minimal, professional senior-engineer voice
- No generic portfolio filler text, no exaggeration or hype language
- Metrics and specifics preferred over vague claims

## 10. Out of Scope (for initial build)

- Backend/CMS for content — content will live in structured JS/JSON data files for easy editing
- Real contact form email delivery (can stub or integrate a simple form service like Formspree/EmailJS later)
- Full WCAG AA certification (manual audit)
