'use client'

import { useEffect, useState } from 'react'

const DEMO_EMAILS = ['demo@inmobiliar.com', 'demo@misfinanzas.com']

export function useDemoUser(user: { email?: string | null } | null) {
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (user?.email) {
      setIsDemo(DEMO_EMAILS.includes(user.email.toLowerCase()))
    } else {
      setIsDemo(false)
    }
  }, [user?.email])

  return isDemo
}
