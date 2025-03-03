import type React from "react"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthenticatedLayout>{children}</AuthenticatedLayout>
        <Toaster />
      </body>
    </html>
  )
}

import "./globals.css"

export const metadata = {
  generator: "v0.dev",
}



import './globals.css'