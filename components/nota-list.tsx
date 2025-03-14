"use client"

import { CommandInput } from "@/components/ui/command"

import { useState, useEffect, useCallback } from "react"
import { CalendarIcon, Printer, Pencil, Plus, ChevronLeft, ChevronRight, Search, Trash2, X, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import debounce from "lodash/debounce"
import { toast } from "sonner"

interface Nota {
  _id: string
  createdAt: string
  notaDate: string
  notaNumber: string
  total: number
  status: "draft" | "terbit"
  paymentStatus: "lunas" | "belum lunas"
  dueDate?: string
  createdBy: string
  items?: { name: string; qty: number; price: number; unit: string, namaMandarin:string }[]
  customerId?: string
  customer?: { requireHeaderNota: boolean; storeName: string }
}

interface Customer {
  _id: string
  storeName: string
  requireHeaderNota?: boolean
}

export function NotaList() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [openDate, setOpenDate] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState("all")
  const [openCustomer, setOpenCustomer] = useState(false)
  const [notaData, setNotaData] = useState<Nota[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "terbit">("all")
  const [paymentStatus, setPaymentStatus] = useState<"all" | "lunas" | "belum lunas">("all")
  const [isLoading, setIsLoading] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [customers, setCustomers] = useState<Customer[]>([])
  type DateRange = { from: Date | undefined; to?: Date | undefined }
  const [createdAtRange, setCreatedAtRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  })
  const [notaDateRange, setNotaDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  })

  const fetchNotas = useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: activeTab,
        paymentStatus: paymentStatus,
        customerId: selectedCustomer !== "all" ? selectedCustomer : "",
      })

      if (date) {
        queryParams.append("date", date.toISOString())
      }

      if (createdAtRange.from) {
        queryParams.append("createdAtFrom", createdAtRange.from.toISOString())
      } else {
        queryParams.delete("createdAtFrom")
      }
      if (createdAtRange.to) {
        queryParams.append("createdAtTo", createdAtRange.to.toISOString())
      } else {
        queryParams.delete("createdAtTo")
      }

      if (notaDateRange.from) {
        queryParams.append("notaDateFrom", notaDateRange.from.toISOString())
      } else {
        queryParams.delete("notaDateFrom")
      }
      if (notaDateRange.to) {
        queryParams.append("notaDateTo", notaDateRange.to.toISOString())
      } else {
        queryParams.delete("notaDateTo")
      }

      const response = await fetch(`/api/notas?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch notas")
      }
      const data = await response.json()
      setNotaData(data.notas)
      setTotalItems(data.totalItems)
    } catch (error) {
      console.error("Error fetching notas:", error)
      toast.error("Error", {
        description: "Failed to fetch notas",
      })
    } finally {
      setIsLoading(false)
    }
  }, [
    currentPage,
    itemsPerPage,
    activeTab,
    paymentStatus,
    selectedCustomer,
    date,
    createdAtRange,
    notaDateRange,
    toast,
  ])

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

    fetchCustomers()
  }, [toast])

  const debouncedFetchNotas = useCallback(debounce(fetchNotas, 300), [fetchNotas])

  useEffect(() => {
    debouncedFetchNotas()
    return () => {
      debouncedFetchNotas.cancel()
    }
  }, [debouncedFetchNotas])

  const handleDeleteNota = async (id: string) => {
    try {
      const response = await fetch(`/api/notas/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete nota")
      }

      toast.success("Success", {
        description: "Nota deleted successfully",
      })

      fetchNotas()
    } catch (error) {
      console.error("Error deleting nota:", error)
      toast.error("Error", {
        description: "Failed to delete nota",
      })
    }
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const totalLunas = notaData.reduce((sum, nota) => (nota.paymentStatus === "lunas" ? sum + nota.total : sum), 0)
  const totalBelumLunas = notaData.reduce(
    (sum, nota) => (nota.paymentStatus === "belum lunas" ? sum + nota.total : sum),
    0,
  )

  const handlePrint = (nota: Nota) => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const selectedCustomer = customers.find((c) => c._id === nota.customerId)
      const showHeader = selectedCustomer?.requireHeaderNota !== false
      const isA5 = nota.items && nota.items.length <= 10
      const pageSize = isA5 ? "A5" : "A4"
      const pageWidth = isA5 ? 148 : 210
      const pageHeight = isA5 ? 210 : 297
      const itemsPerPage = isA5 ? 10 : 40

      const pageCount = Math.ceil((nota.items?.length || 0) / itemsPerPage)

      let printContent = ""
      for (let page = 0; page < pageCount; page++) {
        const startIndex = page * itemsPerPage
        const endIndex = Math.min((page + 1) * itemsPerPage, nota.items?.length || 0)
        const pageItems = nota.items?.slice(startIndex, endIndex) || []

        if (pageItems.length === 0) continue

        printContent += `
    <div class="page ${pageSize}">
      ${nota.paymentStatus === "lunas" ? '<div class="watermark">LUNAS</div>' : ""}
      ${
        showHeader
          ? `
          <div class="header">
            <h1>Toko Yanto</h1>
            <p>
              Pasar Mitra Raya Block B No. 05, Batam Centre<br>
              Hp 082284228888
            </p>
          </div>
        `
          : ""
      }
      <table class="info-table">
        <tr>
          <td><strong>Kepada:</strong> ${selectedCustomer ? selectedCustomer.storeName : "Unknown"}</td>
          <td><strong>Nomor Nota:</strong> ${nota.notaNumber}</td>
        </tr>
        <tr>
          <td><strong>Tanggal Nota:</strong> ${new Date(nota.notaDate).toLocaleDateString()}</td>
          <td><strong>Jatuh Tempo:</strong> ${nota.dueDate ? new Date(nota.dueDate).toLocaleDateString() : "-"}</td>
        </tr>
      </table>
      <table class="items-table">
        <thead>
          <tr>
            <th>#</th>
            <th></th>
            <th>Nama Barang</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems
            .map(
              (item, index) => `
            <tr>
              <td>${startIndex + index + 1}</td>
              <td><div class="checkbox"></div></td>
              <td>${item.name}</td>
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
              <td colspan="5" class="text-right"><strong>Total:</strong></td>
              <td><strong>Rp${nota.total.toLocaleString()}</strong></td>
            </tr>
          </table>
          <p><strong>Status Pembayaran:</strong> ${nota.paymentStatus === "lunas" ? "Lunas" : "Belum Lunas"}</p>
          <div class="signature-section">
            <div class="signature-box">
              <p>Dibuat Oleh</p>
              <div class="signature-line"></div>
              <p>(______________)</p>
            </div>
            <div class="signature-box">
              <p>Pengantar</p>
              <div class="signature-line"></div>
              <p>(______________)</p>
            </div>
            <div class="signature-box">
              <p>Penerima</p>
              <div class="signature-line"></div>
              <p>(______________)</p>
            </div>
          </div>
        `
          : ""
      }
      ${pageCount > 1 ? `<div class="page-number">Halaman ${page + 1} dari ${pageCount}</div>` : ""}
    </div>
  `
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
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          font-weight: 900;
          color: rgba(0, 150, 0, 0.15); /* Warna hijau transparan */
          z-index: 9999;
          pointer-events: none;
          user-select: none;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          font-family: 'Arial', sans-serif;
          letter-spacing: 10px;
          opacity: 0.6;
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

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedCustomer("all")
    setDate(undefined)
    setCreatedAtRange({ from: undefined, to: undefined })
    setNotaDateRange({ from: undefined, to: undefined })
    setPaymentStatus("all")
    setActiveTab("all")
    setCurrentPage(1)
  }

  const handleDownload = (nota: Nota) => {
    // Show a loading toast
    const loadingToast = toast.loading("Generating PDF...")

    // Dynamically import the required libraries
    Promise.all([import("jspdf"), import("html2canvas")])
      .then(([jsPDFModule, html2canvasModule]) => {
        const jsPDF = jsPDFModule.default
        const html2canvas = html2canvasModule.default

        const selectedCustomer = customers.find((c) => c._id === nota.customerId)
        const showHeader = selectedCustomer?.requireHeaderNota !== false
        const isA5 = nota.items && nota.items.length <= 10
        const pageSize = isA5 ? "a5" : "a4"
        const orientation = "portrait"

        // Create a temporary container for rendering the content
        const container = document.createElement("div")
        container.style.position = "absolute"
        container.style.left = "-9999px"
        container.style.top = "0"
        container.style.width = isA5 ? "148mm" : "210mm" // A5/A4 width
        container.style.backgroundColor = "white"
        document.body.appendChild(container)

        // Generate HTML content for the PDF
        const itemsPerPage = isA5 ? 10 : 40

        // We'll create 3 pages: Indonesian, Mandarin, and Surat Jalan
        const pageIds = ["page-id", "page-zh", "page-surat-jalan"]

        // PAGE 1: Indonesian Invoice
        const pageDiv = document.createElement("div")
        pageDiv.id = pageIds[0]
        pageDiv.className = "pdf-page"
        pageDiv.style.width = isA5 ? "148mm" : "210mm"
        pageDiv.style.height = isA5 ? "210mm" : "297mm"
        pageDiv.style.padding = "10mm"
        pageDiv.style.boxSizing = "border-box"
        pageDiv.style.position = "relative"
        pageDiv.style.backgroundColor = "white"
        pageDiv.style.fontFamily = "Arial, sans-serif"
        pageDiv.style.fontSize = "8pt"
        pageDiv.style.display = "block"
        pageDiv.style.marginBottom = "20px"
        pageDiv.style.border = "1px solid #ddd"

        // Add watermark for paid invoices
        if (nota.paymentStatus === "lunas") {
          const watermark = document.createElement("div")
          watermark.style.position = "absolute"
          watermark.style.top = "50%"
          watermark.style.left = "50%"
          watermark.style.transform = "translate(-50%, -50%) rotate(-45deg)"
          watermark.style.fontSize = "120px"
          watermark.style.fontWeight = "900"
          watermark.style.color = "rgba(0, 150, 0, 0.15)"
          watermark.style.zIndex = "9999"
          watermark.style.pointerEvents = "none"
          watermark.style.userSelect = "none"
          watermark.style.textShadow = "2px 2px 4px rgba(0,0,0,0.1)"
          watermark.style.letterSpacing = "10px"
          watermark.style.opacity = "0.6"
          watermark.textContent = "LUNAS"
          pageDiv.appendChild(watermark)
        }

        // Add header
        if (showHeader) {
          const header = document.createElement("div")
          header.style.marginBottom = "5mm"

          const title = document.createElement("h1")
          title.style.margin = "0 0 2mm 0"
          title.style.fontSize = "12pt"
          title.textContent = "Toko Yanto"

          const address = document.createElement("p")
          address.style.margin = "0"
          address.style.lineHeight = "1.2"
          address.innerHTML = "Pasar Mitra Raya Block B No. 05, Batam Centre<br>Hp 082284228888"

          header.appendChild(title)
          header.appendChild(address)
          pageDiv.appendChild(header)
        }

        // Add info table
        const infoTable = document.createElement("table")
        infoTable.style.width = "100%"
        infoTable.style.borderCollapse = "collapse"
        infoTable.style.marginBottom = "3mm"
        infoTable.innerHTML = `
        <tr>
          <td style="border: none; padding: 1mm 0;"><strong>Kepada:</strong> ${selectedCustomer ? selectedCustomer.storeName : "Unknown"}</td>
          <td style="border: none; padding: 1mm 0;"><strong>Nomor Nota:</strong> ${nota.notaNumber}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 1mm 0;"><strong>Tanggal Nota:</strong> ${new Date(nota.notaDate).toLocaleDateString()}</td>
          <td style="border: none; padding: 1mm 0;"><strong>Jatuh Tempo:</strong> ${nota.dueDate ? new Date(nota.dueDate).toLocaleDateString() : "-"}</td>
        </tr>
      `
        pageDiv.appendChild(infoTable)

        // Add items table
        const itemsTable = document.createElement("table")
        itemsTable.style.width = "100%"
        itemsTable.style.borderCollapse = "collapse"
        itemsTable.style.marginBottom = "3mm"

        // Create table header
        const thead = document.createElement("thead")
        thead.innerHTML = `
        <tr>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">#</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;"></th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">Nama Barang</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">Qty</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">Harga</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">Jumlah</th>
        </tr>
      `
        itemsTable.appendChild(thead)

        // Create table body
        const tbody = document.createElement("tbody")
        nota.items?.forEach((item, index) => {
          const tr = document.createElement("tr")
          tr.innerHTML = `
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 0; text-align: center; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm; position: relative;">
            <div style="width: 2mm; height: 2mm; border: 0.5pt solid black; display: inline-block; position: relative; top: 0.5mm;"></div>
          </td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">${item.name}</td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">${item.qty} ${item.unit}</td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">Rp${item.price.toLocaleString()}</td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">Rp${(item.qty * item.price).toLocaleString()}</td>
        `
          tbody.appendChild(tr)
        })

        itemsTable.appendChild(tbody)
        pageDiv.appendChild(itemsTable)

        // Add total table
        const totalTable = document.createElement("table")
        totalTable.style.width = "100%"
        totalTable.style.borderCollapse = "collapse"
        totalTable.style.marginTop = "2mm"
        totalTable.innerHTML = `
        <tr>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: right; font-size: 7pt;" colspan="5"><strong>Total:</strong></td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt;"><strong>Rp${nota.total.toLocaleString()}</strong></td>
        </tr>
      `
        pageDiv.appendChild(totalTable)

        // Payment status
        const paymentStatus = document.createElement("p")
        paymentStatus.innerHTML = `<strong>Status Pembayaran:</strong> ${nota.paymentStatus === "lunas" ? "Lunas" : "Belum Lunas"}`
        pageDiv.appendChild(paymentStatus)

        // Signature section
        const signatureSection = document.createElement("div")
        signatureSection.style.display = "flex"
        signatureSection.style.justifyContent = "space-between"
        signatureSection.style.marginTop = "5mm"
        signatureSection.style.fontSize = "6pt"

        const signatures = ["Dibuat Oleh", "Pengantar", "Penerima"]
        signatures.forEach((title) => {
          const signatureBox = document.createElement("div")
          signatureBox.style.textAlign = "center"
          signatureBox.style.width = "30%"

          const titleP = document.createElement("p")
          titleP.textContent = title
          titleP.style.marginBottom = "16mm"

          const signatureLine = document.createElement("div")
          signatureLine.style.borderTop = "1px solid black"
          signatureLine.style.width = "100%"

          const nameP = document.createElement("p")
          nameP.textContent = "(______________)"

          signatureBox.appendChild(titleP)
          signatureBox.appendChild(signatureLine)
          signatureBox.appendChild(nameP)
          signatureSection.appendChild(signatureBox)
        })

        pageDiv.appendChild(signatureSection)
        container.appendChild(pageDiv)

        // PAGE 2: Mandarin Invoice
        const pageDivZh = document.createElement("div")
        pageDivZh.id = pageIds[1]
        pageDivZh.className = "pdf-page"
        pageDivZh.style.width = isA5 ? "148mm" : "210mm"
        pageDivZh.style.height = isA5 ? "210mm" : "297mm"
        pageDivZh.style.padding = "10mm"
        pageDivZh.style.boxSizing = "border-box"
        pageDivZh.style.position = "relative"
        pageDivZh.style.backgroundColor = "white"
        pageDivZh.style.fontFamily = "Arial, sans-serif"
        pageDivZh.style.fontSize = "8pt"
        pageDivZh.style.display = "block"
        pageDivZh.style.marginBottom = "20px"
        pageDivZh.style.border = "1px solid #ddd"

        // Add watermark for paid invoices (Mandarin)
        if (nota.paymentStatus === "lunas") {
          const watermark = document.createElement("div")
          watermark.style.position = "absolute"
          watermark.style.top = "50%"
          watermark.style.left = "50%"
          watermark.style.transform = "translate(-50%, -50%) rotate(-45deg)"
          watermark.style.fontSize = "120px"
          watermark.style.fontWeight = "900"
          watermark.style.color = "rgba(0, 150, 0, 0.15)"
          watermark.style.zIndex = "9999"
          watermark.style.pointerEvents = "none"
          watermark.style.userSelect = "none"
          watermark.style.textShadow = "2px 2px 4px rgba(0,0,0,0.1)"
          watermark.style.letterSpacing = "10px"
          watermark.style.opacity = "0.6"
          watermark.textContent = "已付款" // "PAID" in Mandarin
          pageDivZh.appendChild(watermark)
        }

        // Add header (Mandarin)
        if (showHeader) {
          const header = document.createElement("div")
          header.style.marginBottom = "5mm"

          const title = document.createElement("h1")
          title.style.margin = "0 0 2mm 0"
          title.style.fontSize = "12pt"
          title.textContent = "Toko Yanto" // "Toko Yanto" in Mandarin

          const address = document.createElement("p")
          address.style.margin = "0"
          address.style.lineHeight = "1.2"
          address.innerHTML = "Pasar Mitra Raya Block B No. 05, Batam Centre<br>电话：082284228888"

          header.appendChild(title)
          header.appendChild(address)
          pageDivZh.appendChild(header)
        }

        // Add info table (Mandarin)
        const infoTableZh = document.createElement("table")
        infoTableZh.style.width = "100%"
        infoTableZh.style.borderCollapse = "collapse"
        infoTableZh.style.marginBottom = "3mm"
        infoTableZh.innerHTML = `
        <tr>
          <td style="border: none; padding: 1mm 0;"><strong>客户：</strong> ${selectedCustomer ? selectedCustomer.storeName : "Unknown"}</td>
          <td style="border: none; padding: 1mm 0;"><strong>单据编号：</strong> ${nota.notaNumber}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 1mm 0;"><strong>单据日期：</strong> ${new Date(nota.notaDate).toLocaleDateString()}</td>
          <td style="border: none; padding: 1mm 0;"><strong>到期日：</strong> ${nota.dueDate ? new Date(nota.dueDate).toLocaleDateString() : "-"}</td>
        </tr>
      `
        pageDivZh.appendChild(infoTableZh)

        // Add items table (Mandarin)
        const itemsTableZh = document.createElement("table")
        itemsTableZh.style.width = "100%"
        itemsTableZh.style.borderCollapse = "collapse"
        itemsTableZh.style.marginBottom = "3mm"

        // Create table header (Mandarin)
        const theadZh = document.createElement("thead")
        theadZh.innerHTML = `
        <tr>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">#</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;"></th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">商品名称</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">数量</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">价格</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">金额</th>
        </tr>
      `
        itemsTableZh.appendChild(theadZh)

        // Create table body (Mandarin)
        const tbodyZh = document.createElement("tbody")
        nota.items?.forEach((item, index) => {
          const tr = document.createElement("tr")
          tr.innerHTML = `
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 0; text-align: center; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm; position: relative;">
            <div style="width: 2mm; height: 2mm; border: 0.5pt solid black; display: inline-block; position: relative; top: 0.5mm;"></div>
          </td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">${item.namaMandarin || item.name}</td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">${item.qty} ${item.unit}</td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">Rp${item.price.toLocaleString()}</td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">Rp${(item.qty * item.price).toLocaleString()}</td>
        `
          tbodyZh.appendChild(tr)
        })

        itemsTableZh.appendChild(tbodyZh)
        pageDivZh.appendChild(itemsTableZh)

        // Add total table (Mandarin)
        const totalTableZh = document.createElement("table")
        totalTableZh.style.width = "100%"
        totalTableZh.style.borderCollapse = "collapse"
        totalTableZh.style.marginTop = "2mm"
        totalTableZh.innerHTML = `
        <tr>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: right; font-size: 7pt;" colspan="5"><strong>总计：</strong></td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt;"><strong>Rp${nota.total.toLocaleString()}</strong></td>
        </tr>
      `
        pageDivZh.appendChild(totalTableZh)

        // Payment status (Mandarin)
        const paymentStatusZh = document.createElement("p")
        paymentStatusZh.innerHTML = `<strong>支付状态：</strong> ${nota.paymentStatus === "lunas" ? "已付款" : "未付款"}`
        pageDivZh.appendChild(paymentStatusZh)

        // Signature section (Mandarin)
        const signatureSectionZh = document.createElement("div")
        signatureSectionZh.style.display = "flex"
        signatureSectionZh.style.justifyContent = "space-between"
        signatureSectionZh.style.marginTop = "5mm"
        signatureSectionZh.style.fontSize = "6pt"

        const signaturesZh = ["制作人", "送货员", "收货人"]
        signaturesZh.forEach((title) => {
          const signatureBox = document.createElement("div")
          signatureBox.style.textAlign = "center"
          signatureBox.style.width = "30%"

          const titleP = document.createElement("p")
          titleP.textContent = title
          titleP.style.marginBottom = "16mm"

          const signatureLine = document.createElement("div")
          signatureLine.style.borderTop = "1px solid black"
          signatureLine.style.width = "100%"

          const nameP = document.createElement("p")
          nameP.textContent = "(______________)"

          signatureBox.appendChild(titleP)
          signatureBox.appendChild(signatureLine)
          signatureBox.appendChild(nameP)
          signatureSectionZh.appendChild(signatureBox)
        })

        pageDivZh.appendChild(signatureSectionZh)
        container.appendChild(pageDivZh)

        // PAGE 3: Surat Jalan (Delivery Note)
        const pageDivSJ = document.createElement("div")
        pageDivSJ.id = pageIds[2]
        pageDivSJ.className = "pdf-page"
        pageDivSJ.style.width = isA5 ? "148mm" : "210mm"
        pageDivSJ.style.height = isA5 ? "210mm" : "297mm"
        pageDivSJ.style.padding = "10mm"
        pageDivSJ.style.boxSizing = "border-box"
        pageDivSJ.style.position = "relative"
        pageDivSJ.style.backgroundColor = "white"
        pageDivSJ.style.fontFamily = "Arial, sans-serif"
        pageDivSJ.style.fontSize = "8pt"
        pageDivSJ.style.display = "block"
        pageDivSJ.style.marginBottom = "20px"
        pageDivSJ.style.border = "1px solid #ddd"

        // Add title for Surat Jalan
        const sjTitle = document.createElement("div")
        sjTitle.style.textAlign = "center"
        sjTitle.style.marginBottom = "10mm"
        sjTitle.style.fontWeight = "bold"
        sjTitle.style.fontSize = "14pt"
        sjTitle.style.textDecoration = "underline"
        sjTitle.textContent = "SURAT JALAN"
        pageDivSJ.appendChild(sjTitle)

        // Add info table for Surat Jalan
        const infoTableSJ = document.createElement("table")
        infoTableSJ.style.width = "100%"
        infoTableSJ.style.borderCollapse = "collapse"
        infoTableSJ.style.marginBottom = "5mm"
        infoTableSJ.innerHTML = `
        <tr>
          <td style="border: none; padding: 1mm 0;"><strong>Kepada:</strong> ${selectedCustomer ? selectedCustomer.storeName : "Unknown"}</td>
          <td style="border: none; padding: 1mm 0;"><strong>Tanggal Surat Jalan:</strong> ${new Date(nota.notaDate).toLocaleDateString()}</td>
          <td style="border: none; padding: 1mm 0;"><strong>Nomor Surat Jalan:</strong> ${nota.notaNumber}</td>
        </tr>
      `
        pageDivSJ.appendChild(infoTableSJ)

        // Add items table for Surat Jalan (simplified, no prices)
        const itemsTableSJ = document.createElement("table")
        itemsTableSJ.style.width = "100%"
        itemsTableSJ.style.borderCollapse = "collapse"
        itemsTableSJ.style.marginBottom = "3mm"

        // Create table header for Surat Jalan
        const theadSJ = document.createElement("thead")
        theadSJ.innerHTML = `
        <tr>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal; width: 5mm;">#</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal; width: 8mm;">Check</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal;">Nama Barang</th>
          <th style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; background-color: #f2f2f2; font-weight: normal; width: 20mm;">Qty</th>
        </tr>
      `
        itemsTableSJ.appendChild(theadSJ)

        // Create table body for Surat Jalan
        const tbodySJ = document.createElement("tbody")
        nota.items?.forEach((item, index) => {
          const tr = document.createElement("tr")
          tr.innerHTML = `
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm; width: 5mm;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 0; text-align: center; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm; position: relative; width: 8mm;">
            <div style="width: 2mm; height: 2mm; border: 0.5pt solid black; display: inline-block; position: relative; top: 0.5mm;"></div>
          </td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">${item.name}</td>
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm; width: 20mm;">${item.qty} ${item.unit}</td>
        `
          tbodySJ.appendChild(tr)
        })

        itemsTableSJ.appendChild(tbodySJ)
        pageDivSJ.appendChild(itemsTableSJ)

        // Signature section for Surat Jalan
        const signatureSectionSJ = document.createElement("div")
        signatureSectionSJ.style.display = "flex"
        signatureSectionSJ.style.justifyContent = "space-between"
        signatureSectionSJ.style.marginTop = "10mm"
        signatureSectionSJ.style.fontSize = "6pt"

        const signaturesSJ = ["Dibuat Oleh", "Pengantar", "Penerima"]
        signaturesSJ.forEach((title) => {
          const signatureBox = document.createElement("div")
          signatureBox.style.textAlign = "center"
          signatureBox.style.width = "30%"

          const titleP = document.createElement("p")
          titleP.textContent = title
          titleP.style.marginBottom = "16mm"

          const signatureLine = document.createElement("div")
          signatureLine.style.borderTop = "1px solid black"
          signatureLine.style.width = "100%"

          const nameP = document.createElement("p")
          nameP.textContent = "(______________)"

          signatureBox.appendChild(titleP)
          signatureBox.appendChild(signatureLine)
          signatureBox.appendChild(nameP)
          signatureSectionSJ.appendChild(signatureBox)
        })

        pageDivSJ.appendChild(signatureSectionSJ)
        container.appendChild(pageDivSJ)

        // Initialize PDF document
        const pdf = new jsPDF(orientation, "mm", pageSize)

        // Function to process each page
        const processPage = (pageIndex) => {
          if (pageIndex >= pageIds.length) {
            // All pages processed, save the PDF
            pdf.save(`Nota-${nota.notaNumber}.pdf`)
            document.body.removeChild(container)
            toast.dismiss(loadingToast)
            toast.success("PDF downloaded successfully")
            return
          }

          const pageElement = document.getElementById(pageIds[pageIndex])
          if (!pageElement) {
            processPage(pageIndex + 1)
            return
          }

          html2canvas(pageElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false,
            backgroundColor: "#FFFFFF",
          }).then((canvas) => {
            const imgData = canvas.toDataURL("image/jpeg", 1.0)

            // Add new page for all pages except the first one
            if (pageIndex > 0) {
              pdf.addPage()
            }

            // Calculate dimensions to fit the page
            const imgProps = pdf.getImageProperties(imgData)
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight)

            // Process next page
            processPage(pageIndex + 1)
          })
        }

        // Start processing pages
        processPage(0)
      })
      .catch((error) => {
        console.error("Error generating PDF:", error)
        toast.dismiss(loadingToast)
        toast.error("Failed to generate PDF. Please try again.")
      })
  }
  
  return (
    <div>
      <div className="mx-auto space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Daftar Nota</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Kelola dan pantau semua nota transaksi Anda di satu tempat.
          </p>
        </div>

        <Card className="shadow-md">
          <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as "all" | "draft" | "terbit")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="terbit">Terbit</TabsTrigger>
            </TabsList>
          </Tabs>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !createdAtRange?.from && !createdAtRange?.to && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />

                        {createdAtRange?.from && createdAtRange.from ? (
                          createdAtRange.to ? (
                            <>
                              {format(createdAtRange?.from, "LLL dd, y")} - {format(createdAtRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(createdAtRange?.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Tanggal Dibuat</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={createdAtRange?.from}
                        selected={createdAtRange}
                        onSelect={(range) => {
                          if (range) {
                            setCreatedAtRange(range) // Hanya set state jika range tidak undefined
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !notaDateRange?.from && !notaDateRange?.to && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />

                        {notaDateRange?.from && notaDateRange.from ? (
                          notaDateRange.to ? (
                            <>
                              {format(notaDateRange?.from, "LLL dd, y")} - {format(notaDateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(notaDateRange?.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Tanggal Nota</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={notaDateRange?.from}
                        selected={notaDateRange}
                        onSelect={(range) => {
                          if (range) {
                            setNotaDateRange(range) // Hanya set state jika range tidak undefined
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomer}
                      className="w-full sm:w-[200px] justify-between"
                    >
                      {selectedCustomer
                        ? customers.find((customer) => customer._id === selectedCustomer)?.storeName || "Semua Customer"
                        : "Semua Customer"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full sm:w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search customer..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Belum ada customer.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setSelectedCustomer("all")
                              setOpenCustomer(false)
                            }}
                          >
                            Semua Customer
                          </CommandItem>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer._id}
                              onSelect={() => {
                                setSelectedCustomer(customer._id)
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

                <Select
                  value={paymentStatus}
                  onValueChange={(value) => setPaymentStatus(value as "all" | "lunas" | "belum lunas")}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Status Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="lunas">Lunas</SelectItem>
                    <SelectItem value="belum lunas">Belum Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="mr-2 h-4 w-4" />
                  Hapus Filter
                </Button>
                <Link href="/create-nota" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Buat Nota
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Tanggal Dibuat</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Tanggal Nota</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Nomor Nota</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Jumlah</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Status Pembayaran</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Jatuh Tempo</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notaData.map((nota) => (
                      <tr key={nota._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-sm text-gray-700">
                          {new Date(nota.createdAt)
                            .toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            })
                            .split("/")
                            .join("/")}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {new Date(nota.notaDate)
                            .toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                            .split("-")
                            .join("/")}
                        </td>
                        <td className="p-3 text-sm text-gray-700">{nota.notaNumber}</td>
                        <td className="p-3 text-sm text-gray-700">Rp{nota.total.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={nota.status === "terbit" ? "default" : "secondary"}>
                            {nota.status ? nota.status.charAt(0).toUpperCase() + nota.status.slice(1) : "N/A"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={nota.paymentStatus === "lunas" ? "default" : "destructive"}>
                            {nota.paymentStatus
                              ? nota.paymentStatus.charAt(0).toUpperCase() + nota.paymentStatus.slice(1)
                              : "N/A"}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {nota.dueDate ? new Date(nota.dueDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handlePrint(nota)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800"
                              onClick={() => handleDownload(nota)}
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => router.push(`/edit-nota/${nota._id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteNota(nota._id)}
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
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-gray-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="text-gray-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
              {totalItems} entries
            </div>
            <div className="mt-6 flex justify-start space-x-4">
              <div className="bg-green-50 p-3 rounded-lg border-2 border-green-300">
                <h3 className="text-sm font-medium text-green-800 mb-1">Total Lunas</h3>
                <div className="text-lg font-semibold text-green-600">Rp{totalLunas.toLocaleString()}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-300">
                <h3 className="text-sm font-medium text-yellow-800 mb-1">Total Belum Lunas</h3>
                <div className="text-lg font-semibold text-yellow-600">Rp{totalBelumLunas.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

