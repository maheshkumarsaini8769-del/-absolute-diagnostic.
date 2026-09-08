'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ZenuxsWidget() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    // Intercept sendBeacon & fetch to eliminate CORS wildcard errors
    if (typeof window !== 'undefined') {
      if (window.navigator && window.navigator.sendBeacon && !(window as any).__zBeaconPatched) {
        (window as any).__zBeaconPatched = true
        const origBeacon = window.navigator.sendBeacon.bind(window.navigator)
        window.navigator.sendBeacon = function(u: any, d: any) {
          try {
            const s = typeof u === 'string' ? u : (u && u.url ? u.url : '')
            if (s && s.indexOf('aistudio.zenuxs.site') !== -1 && window.fetch) {
              window.fetch(s, {
                method: 'POST',
                body: d,
                keepalive: true,
                credentials: 'omit',
                headers: { 'Content-Type': 'application/json' }
              }).catch(() => {})
              return true
            }
          } catch (e) {}
          return origBeacon(u, d)
        }
      }

      if (window.fetch && !(window as any).__zFetchPatched) {
        (window as any).__zFetchPatched = true
        const origFetch = window.fetch
        window.fetch = function(r: any, i: any) {
          try {
            const u = typeof r === 'string' ? r : (r && r.url ? r.url : '')
            if (u && u.indexOf('aistudio.zenuxs.site') !== -1) {
              i = i ? Object.assign({}, i, { credentials: 'omit' }) : { credentials: 'omit' }
            }
          } catch (e) {}
          return origFetch.call(this, r, i)
        }
      }
    }
  }, [])

  useEffect(() => {
    const zui = document.getElementById('zui')
    if (isAdmin) {
      if (zui) {
        zui.style.setProperty('display', 'none', 'important')
        zui.style.setProperty('visibility', 'hidden', 'important')
        zui.style.setProperty('pointer-events', 'none', 'important')
      }
    } else {
      if (zui) {
        zui.style.removeProperty('display')
        zui.style.removeProperty('visibility')
        zui.style.removeProperty('pointer-events')
      }
    }
  }, [isAdmin, pathname])

  if (isAdmin) return null

  return (
    <script
      src="https://aistudio.zenuxs.site/inter/widget.js?token=zinter-fb425957bffe4f409ab622b5b57de195"
      async
    />
  )
}
