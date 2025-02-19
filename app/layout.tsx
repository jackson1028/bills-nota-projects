import type React from "react"
import { AuthenticatedLayout } from "@/components/authenticated-layout"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthenticatedLayout>{children}</AuthenticatedLayout>
      </body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
