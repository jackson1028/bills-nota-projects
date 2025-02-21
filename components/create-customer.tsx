"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface CreateCustomerProps {
  onCustomerCreated: () => void
}

export function CreateCustomer({ onCustomerCreated }: CreateCustomerProps) {
  const [name, setName] = useState("")
  const [storeName, setStoreName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [notaCode, setNotaCode] = useState("")
  const [requireHeaderNota, setRequireHeaderNota] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          storeName,
          address,
          phone,
          notaCode,
          requireHeaderNota,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create customer")
      }

      toast({
        title: "Success",
        description: "Customer created successfully",
      })

      // Reset form
      setName("")
      setStoreName("")
      setAddress("")
      setPhone("")
      setNotaCode("")
      setRequireHeaderNota(true)

      // Notify parent component
      onCustomerCreated()
    } catch (error) {
      console.error("Error creating customer:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create customer",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nama</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="storeName">Nama Toko</Label>
        <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="address">Alamat (Optional)</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="phone">Telepon (Optional)</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="notaCode">Kode Nota</Label>
        <Input id="notaCode" value={notaCode} onChange={(e) => setNotaCode(e.target.value)} required />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="requireHeaderNota"
          checked={requireHeaderNota}
          onCheckedChange={(checked) => setRequireHeaderNota(checked as boolean)}
        />
        <Label htmlFor="requireHeaderNota">Wajib Header Nota</Label>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Membuat..." : "Tambah Customer"}
      </Button>
    </form>
  )
}

