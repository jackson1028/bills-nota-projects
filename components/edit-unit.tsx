"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"


interface Unit {
  _id: string
  name: string
}

interface EditUnitProps {
  unit: Unit
  onUnitUpdated: () => void
  onCancel: () => void
}

export function EditUnit({ unit, onUnitUpdated, onCancel }: EditUnitProps) {
  const [name, setName] = useState(unit.name)
  const [isLoading, setIsLoading] = useState(false)
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/units/${unit._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error("Failed to update unit")
      }

      toast.success("Success", {
        description: "Unit updated successfully",
      })

      onUnitUpdated()
    } catch (error) {
      console.error("Error updating unit:", error)
      toast.error("Error", {
        description: "Failed to update unit",
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
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Unit"}
        </Button>
      </div>
    </form>
  )
}

