"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface Customer {
  _id: string
  name: string
  storeName: string
  address?: string
  phone?: string
  notaCode: string
  requireHeaderNota?: boolean
}

interface EditCustomerProps {
  customer: Customer
  onCustomerUpdated: () => void
  onCancel: () => void
}

export function EditCustomer({ customer, onCustomerUpdated, onCancel }: EditCustomerProps) {
  const [name, setName] = useState(customer.name)
  const [storeName, setStoreName] = useState(customer.storeName)
  const [address, setAddress] = useState(customer.address || "")
  const [phone, setPhone] = useState(customer.phone || "")
  const [notaCode, setNotaCode] = useState(customer.notaCode)
  const [requireHeaderNota, setRequireHeaderNota] = useState(customer.requireHeaderNota)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/customers/${customer._id}`, {
        method: "PUT",
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
        throw new Error("Failed to update customer")
      }

      toast.success("Sukses", {
        description: "Data pelanggan berhasil diperbarui",
      })

      onCustomerUpdated()
    } catch (error) {
      console.error("Error updating customer:", error)
      toast.error("Error", {
        description: "Gagal memperbarui data pelanggan",
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
        <Label htmlFor="address">Alamat</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="phone">Telepon</Label>
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
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Memperbarui..." : "Perbarui Pelanggan"}
        </Button>
      </div>
    </form>
  )
}

