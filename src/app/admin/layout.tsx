'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminContextType {
  admin: { id: string; email: string; name: string } | null
}

const AdminContext = createContext<AdminContextType>({ admin: null })
export const useAdmin = () => useContext(AdminContext)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<{ id: string; email: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/notifications')
        if (res.status === 401) {
          localStorage.removeItem('admin_device_token')
          router.push('/admin/login')
          return
        }
        const data = await res.json()
        if (data.admin) {
          setAdmin(data.admin)
        } else {
          setAdmin({ id: 'admin', email: 'admin@lab.com', name: 'Admin' })
        }
      } catch {
        router.push('/admin/login')
        return
      }
      setLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <AdminContext.Provider value={{ admin }}>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="lg:ml-60 pt-14 pb-20 lg:pb-0">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AdminContext.Provider>
  )
}
