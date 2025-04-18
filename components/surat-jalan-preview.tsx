interface LineItem {
  name: string
  qty: number
}

interface SuratJalanPreviewProps {
  notaNumber: string
  customerName: string
  notaDate: string
  items: LineItem[]
  language: "id" | "zh"
}

export function SuratJalanPreview({ notaNumber, customerName, notaDate, items, language }: SuratJalanPreviewProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{language === "id" ? "Toko Yanto" : "Toko Yanto"}</h1>
        <p className="text-sm text-gray-600">
          {language === "id" ? (
            <>
              Pasar Mitra Raya Block B No 05, Batam Centre
              <br />
              Hp 082284228888
            </>
          ) : (
            <>
              Pasar Mitra Raya Block B No 05, Batam Centre
              <br />
              电话：082284228888
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">{language === "id" ? "Customer" : "客户"}</p>
          <p className="font-semibold">{customerName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{language === "id" ? "Nomor Nota" : "单据编号"}</p>
          <p className="font-semibold" style={{ color: "red" }}>
            {notaNumber}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{language === "id" ? "Tanggal Nota" : "单据日期"}</p>
          <p className="font-semibold">{notaDate}</p>
        </div>
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2 text-sm">#</th>
            <th className="text-left py-2 text-sm"></th>
            <th className="text-left py-2 text-sm">{language === "id" ? "Nama Barang" : "商品名称"}</th>
            <th className="text-left py-2 text-sm">{language === "id" ? "Qty" : "数量"}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{index + 1}</td>
              <td className="py-2">
                <div className="w-4 h-4 border border-gray-300"></div>
              </td>
              <td className="py-2">{item.name}</td>
              <td className="py-2">{item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="text-center">
          <p className="mb-16">{language === "id" ? "Dibuat Oleh" : "制作人"}</p>
          <div className="border-t border-gray-300 pt-2">(______________)</div>
        </div>
        <div className="text-center">
          <p className="mb-16">{language === "id" ? "Pengantar" : "送货员"}</p>
          <div className="border-t border-gray-300 pt-2">(______________)</div>
        </div>
        <div className="text-center">
          <p className="mb-16">{language === "id" ? "Penerima" : "收货人"}</p>
          <div className="border-t border-gray-300 pt-2">(______________)</div>
        </div>
      </div>
    </div>
  )
}

