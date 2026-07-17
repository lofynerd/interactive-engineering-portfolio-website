import { useEffect } from 'react'
import { trackSectionViewed } from '../lib/analytics'

/**
 * Fires a PostHog `section_viewed` event the first time each section
 * (by id) scrolls into view. Since this is a single-page app, regular
 * pageview tracking can't tell you which sections people actually reach —
 * this fills that gap without needing routing.
 */
export function useSectionTracking(sectionIds) {
  useEffect(() => {
    const seen = new Set()
    const elements = sectionIds.map((id) => document.getElementById(id)).filter(Boolean)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !seen.has(entry.target.id)) {
            seen.add(entry.target.id)
            trackSectionViewed(entry.target.id)
          }
        })
      },
      { threshold: 0.4 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sectionIds])
}
