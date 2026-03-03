'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (data?.role !== 'admin') {
      router.replace('/my-tasks')
    }
    setChecking(false)
  }

  if (checking) return null
  return <>{children}</>
}