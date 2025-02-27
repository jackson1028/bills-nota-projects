"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"


// Update the LineItem interface
interface LineItem {
  id: number
  name: string
  qty: number
  price: number
  unit: string
}

interface Customer {
  _id: string
  name: string
  storeName: string
  requireHeaderNota?: boolean
}

interface Unit {
  _id: string
  name: string
}

interface Nota {
  _id: string
  customerId: string
  notaNumber: string
  items: LineItem[]
  total: number
  status: "draft" | "terbit"
  notaDate: string
  dueDate?: string
  paymentStatus: "lunas" | "belum lunas"
}

export function EditNota({ notaId }: { notaId: string }) {
  const [nota, setNota] = useState<Nota | null>(null)
  const [items, setItems] = useState<LineItem[]>([])
  // Update the newItem state
  const [newItem, setNewItem] = useState({
    name: "",
    qty: 1,
    price: 0,
    unit: "",
  })

  const [isMandarin, setIsMandarin] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [notaNumber, setNotaNumber] = useState("")
  const [notaDate, setNotaDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"lunas" | "belum lunas">("belum lunas")
  const [isLoading, setIsLoading] = useState(false)
  // Add a warning message when editing a published nota
  const [showPublishedWarning, setShowPublishedWarning] = useState(false)

  const router = useRouter()
  

  useEffect(() => {
    const fetchNota = async () => {
      try {
        const response = await fetch(`/api/notas/${notaId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch nota")
        }
        const data = await response.json()
        setNota(data)
        setItems(data.items)
        setSelectedCustomer(data.customerId)
        setNotaNumber(data.notaNumber)
        setNotaDate(new Date(data.notaDate).toISOString().split("T")[0])
        setDueDate(data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : "")
        setPaymentStatus(data.paymentStatus)
      } catch (error) {
        console.error("Error fetching nota:", error)
        toast.error("Error", {
          description: "Failed to fetch nota",
        })
      }
    }

    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers")
        if (!response.ok) {
          throw new Error("Failed to fetch customers")
        }
        const data = await response.json()
        setCustomers(data)
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast.error("Error", {
          description: "Failed to fetch customers",
        })
      }
    }

    const fetchUnits = async () => {
      try {
        const response = await fetch("/api/units")
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
      }
    }

    fetchNota()
    fetchCustomers()
    fetchUnits()
  }, [notaId, toast])

  // In the addNewItem function, make sure to include the unit
  const addNewItem = (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== "Enter") return
    if (!newItem.name || newItem.qty <= 0 || !newItem.unit) {
      return
    }

    setItems([
      ...items,
      {
        id: items.length + 1,
        name: newItem.name,
        qty: newItem.qty,
        price: newItem.price,
        unit: newItem.unit,
      },
    ])

    // Reset form
    setNewItem({
      name: "",
      qty: 1,
      price: 0,
      unit: "",
    })
  }

  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleUpdateNota = async () => {
    if (!selectedCustomer) {
      toast.error("Error", {
        description: "Please select a customer",
      })
      return
    }

    if (!notaDate) {
      toast.error("Error", {
        description: "Please set the nota date",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/notas/${notaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer,
          notaNumber,
          items,
          total,
          notaDate,
          dueDate,
          paymentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update nota")
      }

      const updatedNota = await response.json()

      toast.success("Success", {
        description: "Nota updated successfully",
      })

      // Redirect to the nota list page
      router.push("/nota")
    } catch (error) {
      console.error("Error updating nota:", error)
      toast.error("Error", {
        description: "Failed to update nota",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishNota = async () => {
    if (total === 0) {
      toast.error("Error", {
        description: "Cannot publish a nota with a total price of 0",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/notas/${notaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer,
          notaNumber,
          items,
          total,
          notaDate,
          dueDate,
          paymentStatus,
          status: "terbit",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to publish nota")
      }

      toast.success("Success", {
        description: "Nota published successfully",
      })

      // Redirect to the nota list page
      router.push("/nota")
    } catch (error) {
      console.error("Error publishing nota:", error)
      toast.error("Error", {
        description: "Failed to publish nota",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const selectedCustomerObj = customers.find((c) => c._id === selectedCustomer)
      const showHeader = selectedCustomerObj?.requireHeaderNota !== false
      const isA5 = items.length <= 10
      const pageSize = isA5 ? "A5" : "A4"
      const pageWidth = isA5 ? 148 : 210
      const pageHeight = isA5 ? 210 : 297
      const itemsPerPage = isA5 ? 10 : 40

      const pageCount = Math.ceil(items.length / itemsPerPage)

      let printContent = ""
      for (let page = 0; page < pageCount; page++) {
        const startIndex = page * itemsPerPage
        const endIndex = Math.min((page + 1) * itemsPerPage, items.length)
        const pageItems = items.slice(startIndex, endIndex)

        if (pageItems.length === 0) continue

       // Di dalam handlePrint
printContent = `
<div class="page ${pageSize}">
  ${
    showHeader
      ? `
      <div class="header">
        <h1>${!isMandarin ? 'Toko Yanto' : '燕涛商店'}</h1>
        <p>
          ${
            !isMandarin 
              ? `Menjual: Sayur - Mayur, Bakso-Bakso & Buah-Buahan<br>
                 Pasar Mitra Raya Block B No. 05, Batam Centre<br>
                 Hp 082284228888`
              : `销售：蔬菜、肉丸和水果<br>
                 巴淡岛中心Mitra Raya市场B座05号<br>
                 电话：082284228888`
          }
        </p>
      </div>`
      : ""
  }
  <table class="info-table">
    <tr>
      <td><strong>${!isMandarin ? 'Kepada:' : '客户：'}</strong> ${selectedCustomerObj ? selectedCustomerObj.storeName : "Unknown"}</td>
      <td><strong>${!isMandarin ? 'Nomor Nota:' : '单据编号：'}</strong> ${notaNumber}</td>
    </tr>
    <tr>
      <td><strong>${!isMandarin ? 'Tanggal Nota:' : '单据日期：'}</strong> ${notaDate}</td>
      <td><strong>${!isMandarin ? 'Jatuh Tempo:' : '到期日：'}</strong> ${dueDate || "-"}</td>
    </tr>
  </table>
  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th></th>
        <th>${!isMandarin ? 'Nama Barang' : '商品名称'}</th>
        <th>${!isMandarin ? 'Qty' : '数量'}</th>
        <th>${!isMandarin ? 'Harga' : '价格'}</th>
        <th>${!isMandarin ? 'Jumlah' : '金额'}</th>
      </tr>
    </thead>
    <tbody>
      ${pageItems.map((item, index) => `
        <tr>
          <td>${startIndex + index + 1}</td>
          <td><div class="checkbox"></div></td>
          <td>${item.name}</td>
          <td>${item.qty} ${item.unit}</td>
          <td>Rp${item.price.toLocaleString()}</td>
          <td>Rp${(item.qty * item.price).toLocaleString()}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ${
    page === pageCount - 1
      ? `
      <table class="total-table">
        <tr>
          <td colspan="5" class="text-right"><strong>${!isMandarin ? 'Total:' : '总计：'}</strong></td>
          <td><strong>Rp${total.toLocaleString()}</strong></td>
        </tr>
      </table>
      <p><strong>${!isMandarin ? 'Status Pembayaran:' : '支付状态：'}</strong> ${
        paymentStatus === "lunas" 
          ? (!isMandarin ? 'Lunas' : '已付款') 
          : (!isMandarin ? 'Belum Lunas' : '未付款')
      }</p>
      <div class="signature-section">
        <div class="signature-box">
          <p>${!isMandarin ? 'Dibuat Oleh' : '制作人'}</p>
          <div class="signature-line"></div>
          <p>(______________)</p>
        </div>
        <div class="signature-box">
          <p>${!isMandarin ? 'Pengantar' : '送货员'}</p>
          <div class="signature-line"></div>
          <p>(______________)</p>
        </div>
        <div class="signature-box">
          <p>${!isMandarin ? 'Penerima' : '收货人'}</p>
          <div class="signature-line"></div>
          <p>(______________)</p>
        </div>
      </div>`
      : ""
  }
  ${pageCount > 1 ? `<div class="page-number">${!isMandarin ? 'Halaman' : '页'} ${page + 1} ${!isMandarin ? 'dari' : '共'} ${pageCount}</div>` : ""}
</div>
`;
      }

      printWindow.document.write(`
  <html>
    <head>
      <title>Print Nota</title>
      <style>
        @page {
          size: ${pageSize};
          margin: 0;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 8pt;
        }
        .page {
          width: ${pageWidth}mm;
          height: ${pageHeight}mm;
          padding: 10mm;
          box-sizing: border-box;
          page-break-after: always;
        }
        .header {
          margin-bottom: 5mm;
        }
        .header h1 {
          margin: 0 0 2mm 0;
          font-size: 12pt;
        }
        .header p {
          margin: 0;
          line-height: 1.2;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 3mm;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 1mm;
          text-align: left;
          font-size: 7pt;
        }
        th {
          background-color: #f2f2f2;
          font-weight: normal;
        }
        .info-table td {
          border: none;
          padding: 1mm 0;
        }
        .items-table th, .items-table td {
          padding: 0.5mm;
        }
        .total-table {
          margin-top: 2mm;
        }
        .checkbox {
          width: 2mm;
          height: 2mm;
          border: 0.5pt solid black;
          display: inline-block;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 5mm;
          font-size: 6pt;
        }
        .signature-box {
          text-align: center;
          width: 30%;
        }
        .signature-line {
          border-top: 1px solid black;
          margin-top: 10mm;
          width: 100%;
        }
        .page-number {
          text-align: center;
          margin-top: 2mm;
          font-size: 6pt;
        }
      </style>
    </head>
    <body>
      ${printContent}
    </body>
  </html>
`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const NotaPreview = ({ language }: { language: "id" | "zh" }) => {
    const selectedCustomerObj = customers.find((c) => c._id === selectedCustomer)
    const showHeader = selectedCustomerObj?.requireHeaderNota !== false

    return (
      <Card className={!showHeader ? "pt-6" : ""}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-xl">{language === "id" ? "Toko Yanto" : "燕涛商店"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {language === "id" ? (
                <>
                  Menjual: Sayur - Mayur, Bakso-Bakso & Buah-Buahan
                  <br />
                  Pasar Mitra Raya Block B No. 05, Batam Centre
                  <br />
                  Hp 082284228888
                </>
              ) : (
                <>
                  销售：蔬菜、肉丸和水果
                  <br />
                  巴淡岛中心Mitra Raya市场B座05号
                  <br />
                  电话：082284228888
                </>
              )}
            </p>
          </CardHeader>
        )}
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">{language === "id" ? "Customer" : "客户"}</div>
              <div>{customers.find((c) => c._id === selectedCustomer)?.storeName || "Not selected"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{language === "id" ? "Tanggal Nota" : "单据日期"}</div>
              <div>{notaDate || "Not set"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{language === "id" ? "Nomor Nota" : "单据编号"}</div>
              <div style={{ color: 'red' }}>{notaNumber || "Not set"}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm">#</th>
                  <th className="text-left py-2 text-sm"></th>
                  <th className="text-left py-2 text-sm">{language === "id" ? "Nama Barang" : "商品名称"}</th>
                  <th className="text-left py-2 text-sm">{language === "id" ? "Qty" : "数量"}</th>
                  <th className="text-left py-2 text-sm">{language === "id" ? "Harga" : "价格"}</th>
                  <th className="text-right py-2 text-sm">{language === "id" ? "Jumlah" : "金额"}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{index + 1}</td>
                    <td className="py-2">
                      <div className="border border-gray-300 w-4 h-4"></div>
                    </td>
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">
                      {item.qty} {item.unit}
                    </td>
                    <td className="py-2">Rp{item.price.toLocaleString()}</td>
                    <td className="py-2 text-right">Rp{(item.qty * item.price).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td colSpan={5} className="py-2 text-right">
                    {language === "id" ? "Total:" : "总计："}
                  </td>
                  <td className="py-2 text-right">Rp{total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <div className="text-sm text-muted-foreground">{language === "id" ? "Jatuh Tempo" : "到期日"}</div>
              <div>{dueDate || "-"}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{language === "id" ? "Status Pembayaran" : "支付状态"}</div>
            <div>
              {paymentStatus === "lunas" ? (
                <span style={{ color: 'green' }}>
                  {language === "id" ? "Lunas" : "已付款"}
                </span>
              ) : (
                <span style={{ color: 'red' }}>
                  {language === "id" ? "Belum Lunas" : "未付款"}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <div className="mb-16">{language === "id" ? "Dibuat Oleh" : "制作人"}</div>
              <div className="border-t border-black pt-2">(______________)</div>
            </div>
            <div className="text-center">
              <div className="mb-16">{language === "id" ? "Pengantar" : "送货员"}</div>
              <div className="border-t border-black pt-2">(______________)</div>
            </div>
            <div className="text-center">
              <div className="mb-16">{language === "id" ? "Penerima" : "收货人"}</div>
              <div className="border-t border-black pt-2">(______________)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  useEffect(() => {
    if (nota && nota.status === "terbit") {
      setShowPublishedWarning(true)
    }
  }, [nota])

  if (!nota) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <h1 className="text-xl font-semibold mb-4 sm:mb-0">Edit Nota</h1>
          <Button variant="ghost" className="text-muted-foreground">
            Do you need help? <X className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Nota Details */}
          <div className="space-y-6">
            {showPublishedWarning && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                <p className="font-bold">Warning</p>
                <p>Anda sedang meng-edit nota yang telah diterbitkan. Perubahan dapat memengaruhi catatan yang ada.</p>
              </div>
            )}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Nota Details</h2>

              <div className="space-y-2">
                <Label htmlFor="customer">Pilih Customer *</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.storeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nota-number">Nomor Nota</Label>
                <Input id="nota-number" value={notaNumber} onChange={(e) => setNotaNumber(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nota-date">Tanggal Nota *</Label>
                <Input
                  id="nota-date"
                  type="date"
                  value={notaDate}
                  onChange={(e) => setNotaDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-status">Status Pembayaran</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(value) => setPaymentStatus(value as "lunas" | "belum lunas")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lunas">Lunas</SelectItem>
                    <SelectItem value="belum lunas">Belum Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentStatus === "belum lunas" && (
                <div className="space-y-2">
                  <Label htmlFor="due-date">Jatuh Tempo</Label>
                  <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Barang</h2>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm">#</th>
                      <th className="text-left p-3 text-sm">Nama Barang</th>
                      <th className="text-left p-3 text-sm">Qty</th>
                      <th className="text-left p-3 text-sm">Satuan</th>
                      <th className="text-left p-3 text-sm">Harga</th>
                      <th className="text-left p-3 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3">{item.name}</td>
                        <td className="p-3">{item.qty}</td>
                        <td className="p-3">{item.unit}</td>
                        <td className="p-3">Rp{item.price.toLocaleString()}</td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 h-8 w-8 p-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="item-name">Nama Barang</Label>
                    <Input
                      id="item-name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addNewItem(e)}
                      placeholder="Masukkan nama barang"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-qty">Qty</Label>
                    <Input
                      id="item-qty"
                      type="number"
                      min="1"
                      value={newItem.qty}
                      onChange={(e) => setNewItem({ ...newItem, qty: Number.parseInt(e.target.value) || 0 })}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addNewItem(e)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-unit">Satuan</Label>
                    <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                      <SelectTrigger id="item-unit">
                        <SelectValue placeholder="Pilih satuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit._id} value={unit.name}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-price">Harga</Label>
                    <Input
                      id="item-price"
                      type="number"
                      min="0"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: Number.parseInt(e.target.value) || 0 })}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addNewItem(e)}
                      placeholder="Rp"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => addNewItem()} disabled={!newItem.name || newItem.qty <= 0 || !newItem.unit}>
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div></div>
                <div className="text-right">
                  <div className="font-medium">Total:</div>
                  <div className="text-lg">Rp{total.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Nota Preview</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Indonesia</span>
                <Switch checked={isMandarin} onCheckedChange={setIsMandarin} />
                <span className="text-sm text-muted-foreground">中文</span>
              </div>
            </div>

            <NotaPreview language={isMandarin ? "zh" : "id"} />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button onClick={handleUpdateNota} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Nota"}
              </Button>
              <Button
                onClick={handlePublishNota}
                disabled={isLoading || total === 0}
                variant="secondary"
                title={total === 0 ? "Cannot publish a nota with a total price of 0" : ""}
              >
                {isLoading ? "Publishing..." : "Publish Nota"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

