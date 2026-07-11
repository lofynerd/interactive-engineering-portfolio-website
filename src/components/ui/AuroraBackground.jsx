/**
 * Subtle animated aurora / mesh-gradient background used behind the hero
 * and other key sections. Pure CSS, GPU-friendly (transform/opacity only).
 */
export default function AuroraBackground({ className = '' }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute -top-1/3 left-1/4 w-[40rem] h-[40rem] rounded-full bg-accent-purple/20 blur-[120px] animate-float" />
      <div className="absolute top-1/3 -right-1/4 w-[36rem] h-[36rem] rounded-full bg-accent-cyan/15 blur-[130px] animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/3 w-[30rem] h-[30rem] rounded-full bg-accent-blue/15 blur-[110px] animate-pulse-slow" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050505_75%)]" />
    </div>
  )
}
