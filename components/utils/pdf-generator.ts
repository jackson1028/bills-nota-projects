import { toast } from "sonner"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface LineItem {
  id?: number
  itemId?: string
  name: string
  namaMandarin?: string
  qty: number
  price: number
  unit: string
}

interface Nota {
  _id: string
  notaNumber: string
  notaDate: string
  dueDate?: string
  paymentStatus: string
  items: LineItem[]
  total: number
  customerId: string
}

interface Customer {
  _id: string
  storeName: string
  requireHeaderNota?: boolean
}

// Add proper Promise handling to the function
export function generatePDF(nota: Nota, customers: Customer[] = [], loadingToast: any = null): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Safety checks
      if (!nota || !customers || customers.length === 0) {
        console.error("Missing required data for PDF generation:", {
          notaExists: !!nota,
          customersExists: !!customers,
          customersLength: customers?.length,
        })

        if (loadingToast) {
          toast.dismiss(loadingToast)
        }

        toast.error("Failed to generate PDF: Missing required data")
        return reject(new Error("Missing required data for PDF generation"))
      }

      const selectedCustomer = customers.find((c) => c._id === nota.customerId)

      // Safety check for the selected customer
      if (!selectedCustomer) {
        console.error("Customer not found:", {
          customerId: nota.customerId,
          availableCustomers: customers.map((c) => c._id),
        })

        if (loadingToast) {
          toast.dismiss(loadingToast)
        }

        toast.error("Failed to generate PDF: Customer not found")
        return reject(new Error("Customer not found for PDF generation"))
      }

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
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">${`${item.name} ${item.namaMandarin ?? ""}`}</td>
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
          <td style="border: 1px solid #ddd; padding: 2mm 1mm; text-align: left; font-size: 7pt; vertical-align: middle; line-height: 1.2; height: 5mm;">${`${item.name} ${item.namaMandarin ?? ""}`}</td>
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
      // Modify the processPage function to handle Promise resolution
      const processPage = (pageIndex: number) => {
        if (pageIndex >= pageIds.length) {
          // All pages processed, save the PDF
          pdf.save(`Nota-${nota.notaNumber}.pdf`)
          document.body.removeChild(container)
          if (loadingToast) {
            toast.dismiss(loadingToast)
          }
          toast.success("PDF downloaded successfully")
          resolve() // Resolve the promise when done
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
        })
          .then((canvas) => {
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
          .catch((error) => {
            console.error("Error processing page:", error)
            document.body.removeChild(container)
            if (loadingToast) {
              toast.dismiss(loadingToast)
            }
            toast.error("Failed to generate PDF: Error processing page")
            reject(error) // Reject the promise on error
          })
      }

      // Start processing pages
      processPage(0)
    } catch (error) {
      console.error("Error in PDF generation:", error)
      if (loadingToast) {
        toast.dismiss(loadingToast)
      }
      toast.error("Failed to generate PDF: Unexpected error")
      reject(error) // Reject the promise on any unexpected error
    }
  })
}

