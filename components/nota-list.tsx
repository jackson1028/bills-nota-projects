"use client"

import { CommandInput } from "@/components/ui/command"

import { useState, useEffect, useCallback } from "react"
import { CalendarIcon, Printer, Pencil, Plus, ChevronLeft, ChevronRight, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format, enUS } from "date-fns"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import debounce from "lodash/debounce"

interface Nota {
  _id: string
  createdAt: string
  notaDate: string
  notaNumber: string
  total: number
  status: "draft" | "published"
  paymentStatus: "lunas" | "belum lunas"
  dueDate?: string
  createdBy: string
  items?: { name: string; qty: number; price: number }[]
  customerId?: string
}

interface Customer {
  _id: string
  storeName: string
}

const NotaPreview = `
  function NotaPreview({ notaNumber, customerName, notaDate, dueDate, items, total, paymentStatus, language }) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat(language, { style: 'currency', currency: 'IDR' }).format(amount);
    };

    return (
      <div className="nota-container">
        <h1>Toko Yanto</h1>
        <p>
          menjual: sayur - mayur, bakso-bakso & buah-buahan<br>
          Pasar Mitra Raya Block B No 05, Batam Centre<br>
          Hp 082284228888
        </p>
        <table>
          <tr>
            <td><strong>Customer:</strong> {customerName}</td>
            <td><strong>Nomor Nota:</strong> {notaNumber}</td>
          </tr>
          <tr>
            <td><strong>Tanggal Nota:</strong> {notaDate}</td>
            <td><strong>Jatuh Tempo:</strong> {dueDate || "-"}</td>
          </tr>
        </table>
        <table style="margin-top: 20px;">
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
            {items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td><div style="width: 20px; height: 20px; border: 1px solid black;"></div></td>
                <td>{item.name}</td>
                <td>{item.qty}</td>
                <td>{formatCurrency(item.price)}</td>
                <td>{formatCurrency(item.qty * item.price)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="5" style="text-align: right;"><strong>Total:</strong></td>
              <td><strong>{formatCurrency(total)}</strong></td>
            </tr>
          </tbody>
        </table>
        <p><strong>Status Pembayaran:</strong> {paymentStatus === "lunas" ? "Lunas" : "Belum Lunas"}</p>
        <div className="signature-section">
          <div className="signature-box">
            <p>Dibuat Oleh</p>
            <div className="signature-line"></div>
            <p>(______________)</p>
          </div>
          <div className="signature-box">
            <p>Pengantar</p>
            <div className="signature-line"></div>
            <p>(______________)</p>
          </div>
          <div className="signature-box">
            <p>Penerima</p>
            <div className="signature-line"></div>
            <p>(______________)</p>
          </div>
        </div>
      </div>
    );
  }
`

export function NotaList() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [openDate, setOpenDate] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState("all")
  const [openCustomer, setOpenCustomer] = useState(false)
  const [notaData, setNotaData] = useState<Nota[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "published">("all")
  const [paymentStatus, setPaymentStatus] = useState<"all" | "lunas" | "belum lunas">("all")
  const [isLoading, setIsLoading] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [customers, setCustomers] = useState<Customer[]>([])
  const { toast } = useToast()
  const [createdAtRange, setCreatedAtRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [notaDateRange, setNotaDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch notas",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, itemsPerPage, activeTab, paymentStatus, selectedCustomer, date, createdAtRange, notaDateRange, toast])

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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch customers",
        })
      }
    }

    fetchCustomers()
  }, [toast])

  const debouncedFetchNotas = useCallback(
    debounce(() => {
      fetchNotas()
    }, 300),
    [fetchNotas],
  )

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

      toast({
        title: "Success",
        description: "Nota deleted successfully",
      })

      fetchNotas()
    } catch (error) {
      console.error("Error deleting nota:", error)
      toast({
        variant: "destructive",
        title: "Error",
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
      printWindow.document.write(`
      <html>
        <head>
          <title>Print Nota</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .nota-container { max-width: 800px; margin: 0 auto; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .signature-section { display: flex; justify-content: space-between; margin-top: 50px; }
            .signature-box { text-align: center; width: 30%; }
            .signature-line { border-top: 1px solid black; margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="nota-container">
            <h1>Toko Yanto</h1>
            <p>
              menjual: sayur - mayur, bakso-bakso & buah-buahan<br>
              Pasar Mitra Raya Block B No 05, Batam Centre<br>
              Hp 082284228888
            </p>
            <table>
              <tr>
                <td><strong>Customer:</strong> ${selectedCustomer ? selectedCustomer.storeName : "Unknown"}</td>
                <td><strong>Nomor Nota:</strong> ${nota.notaNumber}</td>
              </tr>
              <tr>
                <td><strong>Tanggal Nota:</strong> ${new Date(nota.notaDate).toLocaleDateString()}</td>
                <td><strong>Jatuh Tempo:</strong> ${nota.dueDate ? new Date(nota.dueDate).toLocaleDateString() : "-"}</td>
              </tr>
            </table>
            <table style="margin-top: 20px;">
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
                ${
                  nota.items
                    ? nota.items
                        .map(
                          (item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td><div style="width: 20px; height: 20px; border: 1px solid black;"></div></td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>Rp${item.price.toLocaleString()}</td>
                    <td>Rp${(item.qty * item.price).toLocaleString()}</td>
                  </tr>
                `,
                        )
                        .join("")
                    : ""
                }
                <tr>
                  <td colspan="5" style="text-align: right;"><strong>Total:</strong></td>
                  <td><strong>Rp${nota.total.toLocaleString()}</strong></td>
                </tr>
              </tbody>
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
          </div>
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
          <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as "all" | "draft" | "published")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>
          </Tabs>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomer}
                      className="w-full sm:w-[200px] justify-between"
                    >
                      {selectedCustomer
                        ? customers.find((customer) => customer._id === selectedCustomer)?.storeName || "All Customers"
                        : "All Customers"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full sm:w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search customer..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setSelectedCustomer("all")
                              setOpenCustomer(false)
                            }}
                          >
                            All Customers
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
                        onSelect={setNotaDateRange}
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
                          <span>Nota Dibuat</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={createdAtRange?.from}
                        selected={createdAtRange}
                        onSelect={setCreatedAtRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
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
                  Clear Filters
                </Button>
                <Link href="/create-nota" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Create Nota
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
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Tanggal Nota</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Nomor Nota</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Jumlah</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Status Pembayaran</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Jatuh Tempo</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Created At</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notaData.map((nota) => (
                      <tr key={nota._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-sm text-gray-700">{new Date(nota.notaDate).toLocaleDateString()}</td>
                        <td className="p-3 text-sm text-gray-700">{nota.notaNumber}</td>
                        <td className="p-3 text-sm text-gray-700">Rp{nota.total.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={nota.status === "published" ? "default" : "secondary"}>
                            {nota.status ? nota.status.charAt(0).toUpperCase() + nota.status.slice(1) : "N/A"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={nota.paymentStatus === "lunas" ? "success" : "warning"}>
                            {nota.paymentStatus
                              ? nota.paymentStatus.charAt(0).toUpperCase() + nota.paymentStatus.slice(1)
                              : "N/A"}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {nota.dueDate ? new Date(nota.dueDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-3 text-sm text-gray-700">{new Date(nota.createdAt).toLocaleString()}</td>
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
                            {nota.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => router.push(`/edit-nota/${nota._id}`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
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
                    <SelectItem value="5">5</SelectItem>
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

