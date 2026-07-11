import RevealOnScroll from '../components/ui/RevealOnScroll'
import AnimatedCounter from '../components/ui/AnimatedCounter'

const stats = [
  { value: 3, suffix: '+', label: 'Years building production software' },
  { value: 2, suffix: '', label: 'Projects shipped end-to-end' },
  { value: 1, suffix: '', label: 'AWS certification earned' },
]

export default function About() {
  return (
    <section id="about" className="relative py-28 md:py-36">
      <div className="section-container">
        <RevealOnScroll>
          <p className="text-sm font-mono text-accent-purple uppercase tracking-widest mb-4">
            About
          </p>
        </RevealOnScroll>

        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-16">
          <div className="space-y-6 text-lg text-text-secondary leading-relaxed">
            <RevealOnScroll>
              <p>
                I began coding out of sheer curiosity—simply because I wanted to build, with no specific goal in mind. Over time, that curiosity evolved into a fascination with what happens beneath the surface: how systems stay fast, reliable, and cost-efficient as they grow.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <p>
                Today I'm Tech Lead at Tomasi Design, where I oversee everything from our React front end to the AWS back end (CloudFront, S3, Lambda, IAM and the CI/CD pipelines in between). 
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.2}>
              <p>
                I've built Tomasi's stack to be as lean and robust as possible: minimal components that scale smoothly and stay easy for anyone to understand. My team and I focus on correctness and maintainability; clean architecture and documentation mean fewer bugs and faster development. 
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.3}>
              <p>
                Right now I'm deepening our cloud expertise with Kubernetes, Terraform, and GCP, aiming to make our infrastructure portable across providers. In the long run, I plan to keep innovating at the intersection of hands-on engineering and high-level architecture, wherever that takes us.
              </p>
            </RevealOnScroll>
          </div>

          <div className="flex flex-col gap-6">
            {stats.map((stat, i) => (
              <RevealOnScroll key={stat.label} delay={0.1 * i}>
                <div className="rounded-xl3 glass p-6">
                  <div className="font-display text-4xl text-white font-semibold">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{stat.label}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
