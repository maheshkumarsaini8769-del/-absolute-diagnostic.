'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import GlobalSearchModal from '@/components/GlobalSearchModal'

interface NavItem {
  label: string
  href: string
  icon: string
}

const navItems: NavItem[] = [
  // Operations & Core LIMS
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Bookings', href: '/admin/bookings', icon: 'bookings' },
  { label: 'Prescriptions', href: '/admin/prescriptions', icon: 'prescriptions' },
  { label: 'Home Collections', href: '/admin/collections', icon: 'collections' },
  { label: 'Sample Accession', href: '/admin/samples', icon: 'samples' },
  { label: 'Lab Worklist', href: '/admin/lab-worklist', icon: 'worklist' },
  { label: 'Pathologist Review', href: '/admin/pathologist', icon: 'pathologist' },
  { label: 'Reports', href: '/admin/reports', icon: 'reports' },

  // Catalog & Marketing
  { label: 'Tests', href: '/admin/tests', icon: 'tests' },
  { label: 'Packages', href: '/admin/packages', icon: 'packages' },
  { label: 'Discount Coupons', href: '/admin/coupons', icon: 'coupons' },
  { label: 'Services', href: '/admin/services', icon: 'services' },
  { label: 'Branches', href: '/admin/branches', icon: 'branches' },

  // Lab Quality & Supply Chain
  { label: 'Quality Control (QC)', href: '/admin/qc', icon: 'qc' },
  { label: 'Inventory & Reagents', href: '/admin/inventory', icon: 'inventory' },
  { label: 'Equipment & Calibration', href: '/admin/equipment', icon: 'equipment' },

  // Patients, Doctors & Corporate
  { label: 'Patients', href: '/admin/patients', icon: 'patients' },
  { label: 'Referring Doctors', href: '/admin/doctors', icon: 'doctors' },
  { label: 'Corporate B2B', href: '/admin/corporate', icon: 'corporate' },
  { label: 'Billing & Invoices', href: '/admin/billing', icon: 'billing' },

  // System & Marketing
  { label: 'Notifications', href: '/admin/notifications', icon: 'notifications' },
  { label: 'CMS Content', href: '/admin/cms', icon: 'cms' },
  { label: 'Media Library', href: '/admin/media', icon: 'media' },
  { label: 'FAQs', href: '/admin/faqs', icon: 'faq' },
  { label: 'Testimonials', href: '/admin/testimonials', icon: 'testimonial' },
  { label: 'Health Blogs', href: '/admin/blogs', icon: 'blog' },
  { label: 'Authorized Admins', href: '/admin/authorized-admins', icon: 'auth_admins' },
  { label: 'Devices', href: '/admin/devices', icon: 'devices' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings' },
  { label: 'Audit Trail', href: '/admin/audit', icon: 'audit' },
]

const mobileNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Bookings', href: '/admin/bookings', icon: 'bookings' },
  { label: 'Tests', href: '/admin/tests', icon: 'tests' },
  { label: 'Reports', href: '/admin/reports', icon: 'reports' },
  { label: 'More', href: '/admin/settings', icon: 'more' },
]

function NavIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.JSX.Element> = {
    dashboard: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    bookings: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    tests: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    packages: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    services: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    branches: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    reports: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    patients: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    notifications: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    cms: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    media: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    settings: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    audit: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    more: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    faq: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    testimonial: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    blog: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    devices: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    auth_admins: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    collections: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    samples: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    worklist: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    pathologist: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    qc: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    inventory: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    equipment: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    doctors: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    corporate: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    billing: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
    prescriptions: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    coupons: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  }
  return icons[icon] || icons.dashboard
}

import { playNotificationSound } from '@/lib/sound'

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const previousNotificationsRef = React.useRef<Set<string>>(new Set())
  const isFirstLoadRef = React.useRef(true)

  useEffect(() => {
    // Load sound preference
    const saved = localStorage.getItem('admin_sound_alert')
    if (saved !== null) {
      setSoundEnabled(saved === 'true')
    }
  }, [])

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    localStorage.setItem('admin_sound_alert', String(next))
    if (next) {
      playNotificationSound('chime')
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const checkNewNotifications = async () => {
      try {
        const res = await fetch('/api/admin/notifications?unread=true')
        if (!res.ok) return
        const data = await res.json()
        const unreadList: Array<{ id: string; type?: string }> = data.notifications || []
        setUnreadCount(unreadList.length)

        if (isFirstLoadRef.current) {
          isFirstLoadRef.current = false
          unreadList.forEach(n => previousNotificationsRef.current.add(n.id))
          return
        }

        // Detect brand new notifications that arrived since last check
        const brandNew = unreadList.filter(n => !previousNotificationsRef.current.has(n.id))
        if (brandNew.length > 0) {
          brandNew.forEach(n => previousNotificationsRef.current.add(n.id))
          if (soundEnabled) {
            const hasUrgent = brandNew.some(n => n.type === 'night_request' || n.type === 'emergency')
            playNotificationSound(hasUrgent ? 'urgent' : 'booking')
          }
        }
      } catch { /* ignore */ }
    }

    checkNewNotifications()
    // Poll every 5 seconds for fast instant real-time sound feedback!
    const interval = setInterval(checkNewNotifications, 5000)
    return () => clearInterval(interval)
  }, [soundEnabled])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      router.push('/admin/login')
    } catch { /* ignore */ }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-navy text-white z-40 transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">Lab Admin</span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg transition-colors ${soundEnabled ? 'text-emerald-400 hover:bg-white/10' : 'text-gray-400 hover:bg-white/10'}`}
              title={soundEnabled ? '🔊 Sound Alerts ON (Click to Mute)' : '🔇 Sound Alerts MUTED (Click to Enable)'}
              aria-label="Toggle sound alerts"
            >
              {soundEnabled ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Global Search */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition-all"
            title="Search bookings, patients, samples (Ctrl+K)"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Quick Search...</span>
                <kbd className="text-[10px] px-1 py-0.5 rounded bg-white/10 text-white/60">⌘K</kbd>
              </>
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'bg-blue/20 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue rounded-r" />
                )}
                <NavIcon icon={item.icon} />
                {!collapsed && <span>{item.label}</span>}
                {item.icon === 'notifications' && unreadCount > 0 && (
                  <span className="absolute top-1 right-2 bg-error text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile top bar with search and hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-navy z-50 flex items-center justify-between px-4 h-14">
        <span className="text-white font-bold text-sm">Lab Admin</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-emerald-400 hover:bg-white/10' : 'text-gray-400 hover:bg-white/10'}`}
            title={soundEnabled ? '🔊 Sound Alerts ON (Click to Mute)' : '🔇 Sound Alerts MUTED (Click to Enable)'}
            aria-label="Toggle sound alerts"
          >
            {soundEnabled ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Search"
            title="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="16" y2="12" />
                <line x1="4" y1="17" x2="12" y2="17" />
              </>
            )}
          </svg>
        </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-navy/60 backdrop-blur-xs z-[65] transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-[310px] max-w-[85vw] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="h-14 px-4 bg-navy flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm tracking-tight">Admin Menu</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue/20 text-blue-300 font-medium">All Sections</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-contain">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue/10 text-blue font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
                }`}
              >
                <NavIcon icon={item.icon} />
                <span className="flex-1">{item.label}</span>
                {item.icon === 'notifications' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Drawer Footer with Logout */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200/60"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout from Admin</span>
          </button>
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 mobile-bottom-bar shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            if (item.icon === 'more') {
              return (
                <button
                  key="mobile-more-btn"
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors relative ${
                    mobileMenuOpen ? 'text-blue font-bold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <div className="relative">
                    <NavIcon icon="more" />
                  </div>
                  <span className="mt-0.5">Menu</span>
                </button>
              )
            }
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors relative ${
                  isActive ? 'text-blue font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <NavIcon icon={item.icon} />
                  {item.icon === 'notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-error text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} isAdmin={true} />
    </>
  )
}
