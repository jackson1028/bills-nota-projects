"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Printer, X, Search, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { toast } from "sonner"
// Add this import at the top of the file
import { generatePDF } from "./utils/pdf-generator"

interface LineItem {
  id: number
  itemId: string
  name: string
  namaMandarin: string
  qty: number
  price: number
  unit: string
}

interface Customer {
  _id: string
  name: string
  storeName: string
  notaCode: string
  requireHeaderNota: boolean
}

interface Unit {
  _id: string
  name: string
}

interface Item {
  _id: string
  nama: string
  namaMandarin: string
}

export function CreateNota() {
  const [items, setItems] = useState<LineItem[]>([])
  const [newItem, setNewItem] = useState({
    itemId: "",
    name: "",
    namaMandarin: "",
    qty: 1,
    price: 0,
    unit: "",
  })
  const [editingItemId, setEditingItemId] = useState<number | null>(null)

  const [isMandarin, setIsMandarin] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [notaNumber, setNotaNumber] = useState("")
  const [notaDate, setNotaDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [dueDate, setDueDate] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"lunas" | "belum lunas">("belum lunas")
  const [includeSuratJalan, setIncludeSuratJalan] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [openCustomer, setOpenCustomer] = useState(false)
  const [openItem, setOpenItem] = useState(false)

  // Add a new state to store translated items
  const [translatedItems, setTranslatedItems] = useState<Record<string, string>>({})

  // Add a function to translate text using Google Translate API
  const translateText = async (text: string, targetLang: string) => {
    try {
      // Using Google Translate API through a proxy endpoint
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

      const response = await fetch(url)
      const data = await response.json()

      // The response structure is a nested array where the first element contains translation segments
      // and the first element of each segment is the translated text
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0]
      }

      throw new Error("Unexpected response format")
    } catch (error) {
      console.error("Translation error:", error)
      // Return original text if translation fails
      return text
    }
  }

  // Add a function to translate all items
  const translateItems = async () => {
    // if (!isMandarin) return
    // const newTranslations: Record<string, string> = { ...translatedItems }
    // // Only translate items that haven't been translated yet
    // const untranslatedItems = items.filter((item) => !translatedItems[item.name])
    // console.log(untranslatedItems)
    // if (untranslatedItems.length === 0) return
    // try {
    //   for (const item of untranslatedItems) {
    //     if (!newTranslations[item.name]) {
    //       const translatedName = await translateText(item.name, "zh")
    //       const translatedUnit = await translateText(item.unit, "zh")
    //       newTranslations[item.name] = translatedName
    //       newTranslations[item.unit] = translatedUnit
    //     }
    //   }
    //   setTranslatedItems(newTranslations)
    // } catch (error) {
    //   console.error("Error translating items:", error)
    //   toast.error("Error", {
    //     description: "Failed to translate items",
    //   })
    // }
  }

  useEffect(() => {
    // if (isMandarin && items.length > 0) {
    //   translateItems()
    // }
  }, [isMandarin])

  const getItemName = (name: string) => {
    // if (isMandarin && translatedItems[name]) {
    //   return translatedItems[name]
    // }
    return name
  }
  const getUnitName = (name: string) => {
    // if (isMandarin && translatedItems[name]) {
    //   return translatedItems[name]
    // }
    return name
  }

  const router = useRouter()

  useEffect(() => {
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

    const fetchItems = async () => {
      try {
        const response = await fetch("/api/items")
        if (!response.ok) {
          throw new Error("Failed to fetch items")
        }
        const data = await response.json()
        setAvailableItems(data)
      } catch (error) {
        console.error("Error fetching items:", error)
        toast.error("Error", {
          description: "Failed to fetch items",
        })
      }
    }

    fetchCustomers()
    fetchUnits()
    fetchItems()
  }, [])

  const addNewItem = (e?: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== "Enter") return
    if (!newItem.itemId || newItem.qty <= 0 || !newItem.unit) {
      return
    }

    const selectedItem = availableItems.find((item) => item._id === newItem.itemId)
    if (!selectedItem) return

    if (editingItemId !== null) {
      // Update existing item
      setItems(
        items.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                itemId: selectedItem._id,
                name: selectedItem.nama,
                namaMandarin: selectedItem.namaMandarin,
                qty: newItem.qty,
                price: newItem.price,
                unit: newItem.unit,
              }
            : item
        )
      )
      setEditingItemId(null)
    } else {
      // Add new item
      setItems([
        ...items,
        {
          id: items.length + 1,
          itemId: selectedItem._id,
          name: selectedItem.nama,
          namaMandarin: selectedItem.namaMandarin,
          qty: newItem.qty,
          price: newItem.price,
          unit: newItem.unit,
        },
      ])
    }

    // Reset form
    setNewItem({
      itemId: "",
      name: "",
      namaMandarin: "",
      qty: 1,
      price: 0,
      unit: "",
    })
  }

  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const editItem = (id: number) => {
    // If clicking the same item that's already being edited, cancel edit mode
    if (editingItemId === id) {
      setEditingItemId(null);
      // Reset form
      setNewItem({
        itemId: "",
        name: "",
        namaMandarin: "",
        qty: 1,
        price: 0,
        unit: "",
      });
      return;
    }
    
    const itemToEdit = items.find((item) => item.id === id)
    if (!itemToEdit) return

    setNewItem({
      itemId: itemToEdit.itemId,
      name: itemToEdit.name,
      namaMandarin: itemToEdit.namaMandarin,
      qty: itemToEdit.qty,
      price: itemToEdit.price,
      unit: itemToEdit.unit,
    })
    setEditingItemId(id)
  }

  const generateNotaNumber = async (customerId: string) => {
    const customer = customers.find((c) => c._id === customerId)
    if (customer) {
      try {
        const response = await fetch(`/api/notas/last-number?notaCode=${customer.notaCode}`)
        if (!response.ok) {
          throw new Error("Failed to fetch last nota number")
        }
        const data = await response.json()
        const nextNumber = data.lastNumber + 1
        return `${customer.notaCode}${nextNumber.toString().padStart(4, "0")}`
      } catch (error) {
        console.error("Error generating nota number:", error)
        toast.error("Error", {
          description: "Failed to generate nota number",
        })
      }
    }
    return ""
  }

  const updateLastNotaNumber = async (notaCode: string, newNumber: number) => {
    try {
      const response = await fetch("/api/notas/last-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notaCode, newNumber }),
      })

      if (!response.ok) {
        throw new Error("Failed to update last nota number")
      }
    } catch (error) {
      console.error("Error updating last nota number:", error)
    }
  }

  // Update the handleCreateNota function to ensure customers are available before generating PDF
  const handleCreateNota = async (status: "draft" | "terbit") => {
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

    if (status === "terbit" && total === 0) {
      toast.error("Error", {
        description: "Cannot publish a nota with a total price of 0",
      })
      return
    }

    setIsLoading(true)

    try {
      const notaData = {
        customerId: selectedCustomer,
        notaNumber,
        items,
        total,
        status,
        notaDate,
        paymentStatus,
        dueDate: "",
      }

      if (dueDate) {
        notaData.dueDate = dueDate
      }

      const response = await fetch("/api/notas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notaData),
      })

      if (!response.ok) {
        throw new Error("Failed to create nota")
      }

      const createdNota = await response.json()

      // Update last nota number
      const customer = customers.find((c) => c._id === selectedCustomer)
      if (customer) {
        const newNumber = Number.parseInt(notaNumber.slice(-4))
        await updateLastNotaNumber(customer.notaCode, newNumber)
      }

      if (status === "terbit") {
        toast.success("Success", {
          description: `Nota terbit successfully`,
        })

        // Auto-generate PDF for published nota
        const createdNotaWithItems = {
          ...createdNota,
          items: items,
          customerId: selectedCustomer,
        }

        // Show a loading toast for PDF generation
        const pdfLoadingToast = toast.loading("Generating PDF...")

        // Make sure customers array is available before generating PDF
        if (customers && customers.length > 0) {
          try {
            await generatePDF(createdNotaWithItems, customers, pdfLoadingToast)
            toast.success("PDF generated successfully!")
          } catch (error) {
            console.error("Error generating PDF:", error)
            toast.error("Failed to generate PDF. Please try again.")
          }
        } else {
          toast.dismiss(pdfLoadingToast)
          toast.error("Failed to generate PDF: Customer data not available")
          console.error("Customer data not available for PDF generation")
        }

        // Redirect to the nota list page
        router.push("/nota")
      } else {
        toast.success("Success", {
          description: `Nota ${status === "draft" ? "saved as draft" : "terbit"} successfully`,
        })

        // Redirect to the nota list page
        router.push("/nota")
      }
    } catch (error) {
      console.error("Error creating nota:", error)
      toast.error("Error", {
        description: "Failed to create nota",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    const selectedCustomerObj = customers.find((c) => c._id === selectedCustomer)
    const showHeader = selectedCustomerObj?.requireHeaderNota !== false
    const isA5 = items.length <= 10
    const pageSize = isA5 ? "A5" : "A4"
    const pageWidth = isA5 ? 148 : 210
    const pageHeight = isA5 ? 210 : 297
    const itemsPerPage = isA5 ? 10 : 40
    const pageCount = Math.ceil(items.length / itemsPerPage)

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      let printContent = ""

      // Nota content
      for (let page = 0; page < pageCount; page++) {
        const startIndex = page * itemsPerPage
        const endIndex = Math.min((page + 1) * itemsPerPage, items.length)
        const pageItems = items.slice(startIndex, endIndex)

        if (pageItems.length === 0) continue

        printContent += `
      <div class="page ${pageSize}">
        ${
          showHeader
            ? `
              <div class="header">
                <h1>${isMandarin ? "Toko Yanto" : "Toko Yanto"}</h1>
                <p>
                  ${
                    isMandarin
                      ? `Pasar Mitra Raya Block B No. 05, Batam Centre<br>
                         Hp 082284228888`
                      : `Pasar Mitra Raya Block B No. 05, Batam Centre<br>
                         Hp 082284228888`
                  }
                </p>
              </div>`
            : ""
        }
        <table class="info-table">
          <tr>
            <td><strong>${isMandarin ? "客户" : "Kepada:"}</strong> ${
              selectedCustomerObj ? selectedCustomerObj.storeName : "Unknown"
            }</td>
            <td><strong>${isMandarin ? "单据编号" : "Nomor Nota"}</strong> ${notaNumber}</td>
          </tr>
          <tr>
            <td><strong>${isMandarin ? "单据日期" : "Tanggal Nota"}</strong> ${notaDate}</td>
            <td><strong>${isMandarin ? "到期日" : "Jatuh Tempo"}</strong> ${dueDate || "-"}</td>
          </tr>
        </table>
        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th></th>
              <th>${isMandarin ? "商品名称" : "Nama Barang"}</th>
              <th>${isMandarin ? "数量" : "Qty"}</th>
              <th>${isMandarin ? "价格" : "Harga"}</th>
              <th>${isMandarin ? "金额" : "Jumlah"}</th>
            </tr>
          </thead>
         <tbody>
        ${pageItems
          .map(
            (item, index) => `
          <tr>
            <td>${startIndex + index + 1}</td>
            <td><div class="checkbox"></div></td>
            <td>${isMandarin ? `${item.name} ${item.namaMandarin}` : item.name}</td>
            <td>${item.qty} ${item.unit}</td>
            <td>Rp${item.price.toLocaleString()}</td>
            <td>Rp${(item.qty * item.price).toLocaleString()}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
        </table>
        ${
          page === pageCount - 1
            ? `
              <table class="total-table">
                <tr>
                  <td colspan="5" class="text-right"><strong>${isMandarin ? "总计：" : "Total:"}</strong></td>
                  <td><strong>Rp${total.toLocaleString()}</strong></td>
                </tr>
              </table>
              <p><strong>${isMandarin ? "支付状态" : "Status Pembayaran"}:</strong> ${
                paymentStatus === "lunas" ? (isMandarin ? "已付款" : "Lunas") : isMandarin ? "未付款" : "Belum Lunas"
              }</p>
              <div class="signature-section">
                <div class="signature-box">
                  <p>${isMandarin ? "制作人" : "Dibuat Oleh"}</p>
                  <div class="signature-line"></div>
                  <p>(______________)</p>
                </div>
                <div class="signature-box">
                  <p>${isMandarin ? "送货员" : "Pengantar"}</p>
                  <div class="signature-line"></div>
                  <p>(______________)</p>
                </div>
                <div class="signature-box">
                  <p>${isMandarin ? "收货人" : "Penerima"}</p>
                  <div class="signature-line"></div>
                  <p>(______________)</p>
                </div>
              </div>`
            : ""
        }
      </div>`
      }

      // Surat Jalan content (if includeSuratJalan is true)
      if (includeSuratJalan) {
        printContent += `
      <div class="page ${pageSize}">
        <div class="document-title">${isMandarin ? "送货单" : "SURAT JALAN"}</div>
        <table class="info-table">
          <tr>
            <td><strong>${isMandarin ? "客户" : "Kepada:"}</strong> ${
              selectedCustomerObj ? selectedCustomerObj.storeName : "Not selected"
            }</td>
            <td><strong>${isMandarin ? "送货单日期" : "Tanggal Surat Jalan"}</strong> ${new Date(notaDate)
              .toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
              .split("-")
              .join("/")}</td>
            <td><strong>${isMandarin ? "送货单编号" : "Nomor Surat Jalan"}</strong> ${notaNumber}</td>
          </tr>
        </table>
        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${isMandarin ? "核对" : "Check"}</th>
              <th>${isMandarin ? "商品名称" : "Nama Barang"}</th>
              <th>${isMandarin ? "数量" : "Qty"}</th>
            </tr>
          </thead>
         <tbody>
        ${items
          .map(
            (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td><div class="checkbox"></div></td>
            <td>${isMandarin ? `${item.name} ${item.namaMandarin}` : item.name}</td>
            <td>${item.qty} ${item.unit}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
        </table>
        <div class="signature-section">
          <div class="signature-box">
            <p>${isMandarin ? "制作人" : "Dibuat Oleh"}</p>
            <div class="signature-line"></div>
            <p>(______________)</p>
          </div>
          <div class="signature-box">
            <p>${isMandarin ? "送货员" : "Pengantar"}</p>
            <div class="signature-line"></div>
            <p>(______________)</p>
          </div>
          <div class="signature-box">
            <p>${isMandarin ? "收货人" : "Penerima"}</p>
            <div class="signature-line"></div>
            <p>(______________)</p>
          </div>
        </div>
      </div>`
      }

      printWindow.document.write(`
<html>
  <head>
    <title>Print Nota ${includeSuratJalan ? "and Surat Jalan" : ""}</title>
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
      .document-title {
        font-size: 14pt;
        font-weight: bold;
        text-align: center;
        margin: 5mm 0;
        text-decoration: underline;
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
        width: 3mm;
        height: 3mm;
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
            <CardTitle className="text-xl">{language === "id" ? "Toko Yanto" : "Toko Yanto"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {language === "id" ? (
                <>
                  Pasar Mitra Raya Block B No. 05, Batam Centre
                  <br />
                  Hp 082284228888
                </>
              ) : (
                <>
                  Pasar Mitra Raya Block B No. 05, Batam Centre
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
              <div className="text-sm text-muted-foreground">{language === "id" ? "Kepada" : "客户"}</div>
              <div>{customers.find((c) => c._id === selectedCustomer)?.storeName || "Not selected"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{language === "id" ? "Tanggal Nota" : "单据日期"}</div>
              <div>{notaDate || "Not set"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{language === "id" ? "Nomor Nota" : "单据编号"}</div>
              <div style={{ color: "red" }}>{notaNumber || "Not set"}</div>
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
                    {isMandarin ? (
                      <td className="py-2">{item.name} {item.namaMandarin}</td>
                    ) : (
                      <td className="py-2">{item.name}</td>
                    )}
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
            {dueDate && (
              <div>
                <div className="text-sm text-muted-foreground">{language === "id" ? "Jatuh Tempo" : "到期日"}</div>
                <div>{dueDate}</div>
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{language === "id" ? "Status Pembayaran" : "支付状态"}</div>
            <div>
              {paymentStatus === "lunas" ? (
                <span style={{ color: "green" }}>{language === "id" ? "Lunas" : "已付款"}</span>
              ) : (
                <span style={{ color: "red" }}>{language === "id" ? "Belum Lunas" : "未付款"}</span>
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

  const SuratJalanPreview = ({ language }: { language: "id" | "zh" }) => {
    const selectedCustomerObj = customers.find((c) => c._id === selectedCustomer)
    const showHeader = selectedCustomerObj?.requireHeaderNota !== false

    return (
      <Card className={"pt-6"}>
        <CardContent className="space-y-6">
          <div className="text-center font-bold text-xl underline mb-4">
            {language === "id" ? "SURAT JALAN" : "送货单"}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">{language === "id" ? "Kepada" : "客户"}</div>
              <div>{customers.find((c) => c._id === selectedCustomer)?.storeName || "Not selected"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {language === "id" ? "Tanggal Surat Jalan" : "送货单日期"}
              </div>
              <div>
                {notaDate
                  ? new Date(notaDate)
                      .toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                      .split("-")
                      .join("/")
                  : "Not set"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {language === "id" ? "Nomor Surat Jalan" : "送货单编号"}
              </div>
              <div style={{ color: "red" }}>{notaNumber || "Not set"}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm">#</th>
                  <th className="text-left py-2 text-sm">{language === "id" ? "Check" : "核对"}</th>
                  <th className="text-left py-2 text-sm">{language === "id" ? "Nama Barang" : "商品名称"}</th>
                  <th className="text-left py-2 text-sm">{language === "id" ? "Qty" : "数量"}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{index + 1}</td>
                    <td className="py-2">
                      <div className="border border-gray-300 w-5 h-5"></div>
                    </td>
                    {isMandarin ? (
                      <td className="py-2">{item.name} {item.namaMandarin}</td>
                    ) : (
                      <td className="py-2">{item.name}</td>
                    )}
                    <td className="py-2">
                      {item.qty} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <h1 className="text-xl font-semibold mb-4 sm:mb-0">Buat Nota</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Nota Details */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Details Nota</h2>

              <div className="space-y-2">
                <Label htmlFor="customer">Pilih Customer *</Label>
                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomer}
                      className="w-full justify-between"
                    >
                      {selectedCustomer
                        ? customers.find((customer) => customer._id === selectedCustomer)?.storeName
                        : "Select customer"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search customer..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer._id}
                              onSelect={async () => {
                                setSelectedCustomer(customer._id)
                                const newNotaNumber = await generateNotaNumber(customer._id)
                                setNotaNumber(newNotaNumber)
                                setOpenCustomer(false)
                              }}
                            >
                              {customer.storeName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nota-number">Nomor Nota</Label>
                <Input id="nota-number" value={notaNumber} readOnly className="bg-gray-100 text-gray-600" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nota-date">Tanggal Nota *</Label>
                <Input
                  id="nota-date"
                  type="date"
                  value={notaDate}
                  onChange={(e) => setNotaDate(e.target.value)}
                  defaultValue={notaDate}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-status">Status Pembayaran (Optional)</Label>
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
                  <Label htmlFor="due-date">Jatuh Tempo (Optional)</Label>
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
                        <td className="p-3">{isMandarin ? item.namaMandarin : item.name}</td>
                        <td className="p-3">{item.qty}</td>
                        <td className="p-3">{item.unit}</td>
                        <td className="p-3">Rp{item.price.toLocaleString()}</td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-500 h-8 w-8 p-0"
                              onClick={() => editItem(item.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 h-8 w-8 p-0"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
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
                    <Popover open={openItem} onOpenChange={setOpenItem}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openItem}
                          className="w-full justify-between"
                        >
                          {newItem.itemId
                            ? availableItems.find((item) => item._id === newItem.itemId)?.nama
                            : "Select item"}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search item..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No item found.</CommandEmpty>
                            <CommandGroup>
                              {availableItems.map((item) => (
                                <CommandItem
                                  key={item._id}
                                  onSelect={() => {
                                    setNewItem({
                                      ...newItem,
                                      itemId: item._id,
                                      name: item.nama,
                                      namaMandarin: item.namaMandarin,
                                    })
                                    setOpenItem(false)
                                  }}
                                >
                                  {item.nama} ({item.namaMandarin})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-qty">Qty</Label>
                    <Input
                      id="item-qty"
                      type="number"
                      min="1"
                      value={newItem.qty}
                      onChange={(e) => setNewItem({ ...newItem, qty: Number(e.target.value) || 0 })}
                      onKeyPress={(e) => e.key === "Enter" && addNewItem()}
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
                      onKeyPress={(e) => e.key === "Enter" && addNewItem()}
                      placeholder="Rp"
                    />
                  </div>
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <Button
                    type="button"
                    onClick={addNewItem}
                    className="w-full"
                    disabled={!newItem.itemId || newItem.qty <= 0 || !newItem.unit}
                  >
                    {editingItemId !== null ? "Update Item" : "Add Item"}
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
              <h2 className="text-lg font-semibold">Preview</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Indonesia</span>
                <Switch checked={isMandarin} onCheckedChange={setIsMandarin} />
                <span className="text-sm text-muted-foreground">中文</span>
              </div>
            </div>

            {includeSuratJalan ? (
              <div className="space-y-4">
                <h3 className="text-md font-medium">Nota</h3>
                <NotaPreview language={isMandarin ? "zh" : "id"} />

                <h3 className="text-md font-medium mt-6">Surat Jalan</h3>
                <SuratJalanPreview language={isMandarin ? "zh" : "id"} />
              </div>
            ) : (
              <NotaPreview language={isMandarin ? "zh" : "id"} />
            )}

            <div className="flex justify-end space-x-2">
              <div className="flex items-center mr-auto">
                <Switch
                  id="include-surat-jalan"
                  checked={includeSuratJalan}
                  onCheckedChange={setIncludeSuratJalan}
                  className="mr-2"
                />
                <Label htmlFor="include-surat-jalan">Include Surat Jalan</Label>
              </div>
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button onClick={() => handleCreateNota("draft")} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                onClick={() => handleCreateNota("terbit")}
                disabled={isLoading || total === 0}
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

