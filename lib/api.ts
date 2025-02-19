"use client"

import { useRouter } from "next/navigation"

export async function apiRequest(url: string, options: RequestInit = {}) {
  const router = useRouter()
  const response = await fetch(url, options)

  if (response.status === 401) {
    router.push("/login?unauthorized=true")
    throw new Error("Unauthorized")
  }

  return response
}

