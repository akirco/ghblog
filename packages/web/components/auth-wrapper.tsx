"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PasswordDialog } from "./password-dialog"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated
    setTimeout(() => {
      const authenticated = sessionStorage.getItem("admin_authenticated")
      if (authenticated === "true") {
        setIsAuthenticated(true)
      } else {
        setShowDialog(true)
      }
    }, 0)
  }, [])

  const handleSuccess = () => {
    setIsAuthenticated(true)
    setShowDialog(false)
  }

  const handleCancel = () => {
    router.push("/")
  }

  if (!isAuthenticated) {
    return <PasswordDialog open={showDialog} onSuccess={handleSuccess} onCancel={handleCancel} />
  }

  return <>{children}</>
}
