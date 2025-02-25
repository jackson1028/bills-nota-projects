"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface CreateUnitProps {
  onUnitCreated: () => void
  onClose: () => void // Added onClose prop
}

export function CreateUnit({ onUnitCreated, onClose }: CreateUnitProps) {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error("Failed to create unit")
      }

      toast({
        title: "Success",
        description: "Unit created successfully",
      })

      setName("")
      onUnitCreated()
      onClose() // Added onClose call
    } catch (error) {
      console.error("Error creating unit:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create unit",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Unit"}
      </Button>
    </form>
  )
}

