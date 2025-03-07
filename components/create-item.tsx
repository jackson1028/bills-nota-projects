"use client"

import type React from "react"
 
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export function CreateItem() {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, price: Number.parseFloat(price) }),
      })

      if (response.ok) {
        toast({
          title: "Barang berhasil ditambahkan",
          description: `${name} telah ditambahkan ke daftar barang.`,
        })
        setName("")
        setPrice("")
        router.refresh()
      } else {
        throw new Error("Failed to create item")
      }
    } catch (error) {
      console.error("Error creating item:", error)
      toast({
        title: "Error",
        description: "Gagal menambahkan barang. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <div>
        <Label htmlFor="name">Nama Barang</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="price">Harga</Label>
        <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>
      <Button type="submit">Tambah Barang</Button>
    </form>
  )
}

