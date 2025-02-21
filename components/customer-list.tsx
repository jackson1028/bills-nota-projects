"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Trash2, Plus, ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditCustomer } from "@/components/edit-customer"
import { Checkbox } from "@/components/ui/checkbox"

interface Customer {
  _id: string
  name: string
  storeName: string
  address?: string
  phone?: string
  notaCode: string
  tags?: string[]
  requireHeaderNota?: boolean
}

export function CustomerList() {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "active">("all")
  const { toast } = useToast()
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const totalPages = Math.ceil(customers.length / itemsPerPage)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      let url = `/api/customers?search=${searchTerm}`
      if (activeTab !== "all") {
        url += `&status=${activeTab}`
      }
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch customers",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete customer")
      }

      await fetchCustomers()
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete customer",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCustomer = async (customerData: Omit<Customer, "_id">) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        throw new Error("Failed to create customer")
      }

      await fetchCustomers()
      toast({
        title: "Success",
        description: "Customer created successfully",
      })
      setIsCreateDialogOpen(false)
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

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const paginatedCustomers = customers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as "all" | "active")}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
              </TabsList>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Customer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Customer Baru</DialogTitle>
                  </DialogHeader>
                  <CreateCustomerForm onSubmit={handleCreateCustomer} />
                </DialogContent>
              </Dialog>
            </div>
          </Tabs>
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Nama</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Nama Toko</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Kode Nota</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-sm text-gray-700">{customer.name}</td>
                    <td className="p-3 text-sm text-gray-700">{customer.storeName}</td>
                    <td className="p-3 text-sm text-gray-700">{customer.notaCode}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteCustomer(customer._id)}
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
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, customers.length)} of {customers.length} entries
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <EditCustomer
              customer={editingCustomer}
              onCustomerUpdated={() => {
                setEditingCustomer(null)
                fetchCustomers()
              }}
              onCancel={() => setEditingCustomer(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CreateCustomerFormProps {
  onSubmit: (customerData: Omit<Customer, "_id">) => void
}

function CreateCustomerForm({ onSubmit }: CreateCustomerFormProps) {
  const [name, setName] = useState("")
  const [storeName, setStoreName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [notaCode, setNotaCode] = useState("")
  const [requireHeaderNota, setRequireHeaderNota] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, storeName, address, phone, notaCode, requireHeaderNota })
    // Reset form fields
    setName("")
    setStoreName("")
    setAddress("")
    setPhone("")
    setNotaCode("")
    setRequireHeaderNota(true)
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
      <Button type="submit">Tambah Customer</Button>
    </form>
  )
}

