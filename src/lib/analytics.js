import posthog from 'posthog-js'

/**
 * Thin wrapper around posthog-js so the rest of the app never imports
 * posthog directly and every custom event stays consistently named.
 *
 * Covered out of the box via posthog.init (see src/index.js):
 * - Autocapture (clicks, form field changes, etc.)
 * - Session recording / replay
 * - Pageview + pageleave capture
 * - Web vitals / performance
 * - Heatmaps & rageclick detection
 *
 * Custom events added on top (see calls to trackEvent below throughout
 * the app) to capture portfolio-specific intent signals that autocapture
 * alone won't cleanly summarize: which sections get seen, which projects
 * get opened, whether the resume was viewed, which contact channel was
 * used, etc.
 */

function isReady() {
  return typeof window !== 'undefined' && !!posthog.__loaded
}

export function trackEvent(name, properties = {}) {
  if (!isReady()) return
  posthog.capture(name, properties)
}

export function trackSectionViewed(sectionId) {
  trackEvent('section_viewed', { section: sectionId })
}

export function trackNavClick(sectionId, label) {
  trackEvent('nav_link_clicked', { section: sectionId, label })
}

export function trackResumeOpened(source) {
  trackEvent('resume_opened', { source })
}

export function trackHeroCta(cta) {
  trackEvent('hero_cta_clicked', { cta })
}

export function trackProjectOpened(projectId, projectTitle) {
  trackEvent('project_opened', { project_id: projectId, project_title: projectTitle })
}

export function trackProjectLinkClicked(projectId, linkType) {
  // linkType: 'live' | 'github'
  trackEvent('project_link_clicked', { project_id: projectId, link_type: linkType })
}

export function trackCertificateCredentialClicked(certId, certTitle) {
  trackEvent('certificate_credential_clicked', { cert_id: certId, cert_title: certTitle })
}

export function trackContactChannelClicked(channel) {
  // channel: 'email' | 'github' | 'linkedin'
  trackEvent('contact_channel_clicked', { channel })
}

export function trackFooterSocialClicked(channel) {
  trackEvent('footer_social_clicked', { channel })
}

export function trackArchitectureNodeHovered(nodeId) {
  trackEvent('architecture_node_hovered', { node: nodeId })
}

export function trackSkillCategoryViewed(categoryId) {
  trackEvent('skill_category_viewed', { category: categoryId })
}

// --- Break-it / self-healing infrastructure demo -------------------------
// These are the events referenced when reviewing PostHog session replays
// to see how many visitors actually tried the demo, and what happened
// when they did.

export function trackBreakItViewed() {
  trackEvent('break_it_demo_viewed')
}

export function trackBreakItClicked() {
  trackEvent('break_it_clicked')
}

export function trackBreakItResult(status, extra = {}) {
  // status: 'breaking' | 'cooldown' | 'offline' | 'error'
  trackEvent('break_it_result', { status, ...extra })
}

export function trackBreakItHealed(durationMs) {
  trackEvent('break_it_healed', { duration_ms: durationMs })
}

export function trackBreakItSkipped() {
  trackEvent('break_it_skipped')
}
