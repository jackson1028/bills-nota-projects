"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

interface Item {
  _id: string
  nama: string
  namaMandarin: string
}

export function ItemList() {
  const [items, setItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/items?search=${searchTerm}`)
      if (!response.ok) {
        throw new Error("Failed to fetch items")
      }
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error("Error fetching items:", error)
      toast.error("Error", {
        description: "Failed to fetch items",
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete item")
      }

      toast.success("Success", {
        description: "Item deleted successfully",
      })

      fetchItems()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Error", {
        description: "Failed to delete item",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <CreateItemForm
                onItemCreated={() => {
                  fetchItems()
                  setIsCreateDialogOpen(false)
                }}
                onClose={() => setIsCreateDialogOpen(false)}
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
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Mandarin Name</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-sm text-gray-700">{item.nama}</td>
                    <td className="p-3 text-sm text-gray-700">{item.namaMandarin}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setEditingItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteItem(item._id)}
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
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <EditItemForm
              item={editingItem}
              onItemUpdated={() => {
                setEditingItem(null)
                fetchItems()
              }}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

interface CreateItemFormProps {
  onItemCreated: () => void
  onClose: () => void
}

function CreateItemForm({ onItemCreated, onClose }: CreateItemFormProps) {
  const [nama, setNama] = useState("")
  const [namaMandarin, setNamaMandarin] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nama, namaMandarin }),
      })

      if (!response.ok) {
        throw new Error("Failed to create item")
      }

      toast.success("Success", {
        description: "Item created successfully",
      })

      onItemCreated()
    } catch (error) {
      console.error("Error creating item:", error)
      toast.error("Error", {
        description: "Failed to create item",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input placeholder="Name" value={nama} onChange={(e) => setNama(e.target.value)} required />
      </div>
      <div>
        <Input
          placeholder="Mandarin Name"
          value={namaMandarin}
          onChange={(e) => setNamaMandarin(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Item"}
        </Button>
      </div>
    </form>
  )
}

interface EditItemFormProps {
  item: Item
  onItemUpdated: () => void
  onCancel: () => void
}

function EditItemForm({ item, onItemUpdated, onCancel }: EditItemFormProps) {
  const [nama, setNama] = useState(item.nama)
  const [namaMandarin, setNamaMandarin] = useState(item.namaMandarin)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/items/${item._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nama, namaMandarin }),
      })

      if (!response.ok) {
        throw new Error("Failed to update item")
      }

      toast.success("Success", {
        description: "Item updated successfully",
      })

      onItemUpdated()
    } catch (error) {
      console.error("Error updating item:", error)
      toast.error("Error", {
        description: "Failed to update item",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input placeholder="Name" value={nama} onChange={(e) => setNama(e.target.value)} required />
      </div>
      <div>
        <Input
          placeholder="Mandarin Name"
          value={namaMandarin}
          onChange={(e) => setNamaMandarin(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Item"}
        </Button>
      </div>
    </form>
  )
}

