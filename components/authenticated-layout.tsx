"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { useRouter, usePathname } from "next/navigation"

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", { method: "GET" })
        if (response.ok) {
          setIsAuthenticated(true)
          if (pathname === "/login") {
            router.push("/nota")
          }
        } else {
          setIsAuthenticated(false)
          if (pathname !== "/login") {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthenticated(false)
        if (pathname !== "/login") {
          router.push("/login")
        }
      }
    }

    checkAuth()
  }, [router, pathname])

  if (isAuthenticated === null) {
    return <div>Loading...</div> // Or a more sophisticated loading component
  }

  return (
    <>
      {isAuthenticated && <Navbar />}
      <main className={`flex-grow container mx-auto p-6 ${isAuthenticated ? "mt-16" : ""}`}>{children}</main>
    </>
  )
}

