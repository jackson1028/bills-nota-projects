"use client"

import { useState, useEffect, useCallback } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateUnit } from "@/components/create-unit"
import { EditUnit } from "@/components/edit-unit"
import { toast } from "sonner"

interface Unit {
  _id: string
  name: string
}

export function UnitList() {
  const [units, setUnits] = useState<Unit[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  

  const fetchUnits = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/units?search=${searchTerm}`)
      if (!response.ok) {
        throw new Error("Failed to fetch units")
      }
      const data = await response.json()
      setUnits(data)
    } catch (error) {
      console.error("Error fetching units:", error)
      toast.error("Error", {
        description: "Failed to fetch units",
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, toast])

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  const handleDeleteUnit = async (id: string) => {
    try {
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete unit")
      }

      toast.error("Success", {
        description: "Unit deleted successfully",
      })

      fetchUnits()
    } catch (error) {
      console.error("Error deleting unit:", error)
      toast.error("Error", {
        description: "Failed to delete unit",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Units</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Unit</DialogTitle>
              </DialogHeader>
              <CreateUnit
                onUnitCreated={() => {
                  fetchUnits()
                  setIsCreateDialogOpen(false) // Close the dialog after creation
                }}
                onClose={() => setIsCreateDialogOpen(false)} // Pass onClose function
              />
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-sm text-gray-700">{unit.name}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setEditingUnit(unit)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteUnit(unit._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <Dialog open={!!editingUnit} onOpenChange={() => setEditingUnit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
          </DialogHeader>
          {editingUnit && (
            <EditUnit
              unit={editingUnit}
              onUnitUpdated={() => {
                setEditingUnit(null)
                fetchUnits()
              }}
              onCancel={() => setEditingUnit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

