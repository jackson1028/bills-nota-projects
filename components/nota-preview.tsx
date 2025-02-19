interface LineItem {
  name: string
  qty: number
  price: number
}

interface NotaPreviewProps {
  notaNumber: string
  customerName: string
  notaDate: string
  dueDate?: string
  items: LineItem[]
  total: number
  paymentStatus: "lunas" | "belum lunas"
  language: "id" | "zh"
}

export function NotaPreview({
  notaNumber,
  customerName,
  notaDate,
  dueDate,
  items,
  total,
  paymentStatus,
  language,
}: NotaPreviewProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{language === "id" ? "Toko Yanto" : "燕涛商店"}</h1>
        <p className="text-sm text-gray-600">
          {language === "id" ? (
            <>
              menjual: sayur - mayur, bakso-bakso & buah-buahan
              <br />
              Pasar Mitra Raya Block B No 05, Batam Centre
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
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">{language === "id" ? "Customer" : "客户"}</p>
          <p className="font-semibold">{customerName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{language === "id" ? "Nomor Nota" : "单据编号"}</p>
          <p className="font-semibold">{notaNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{language === "id" ? "Tanggal Nota" : "单据日期"}</p>
          <p className="font-semibold">{notaDate}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{language === "id" ? "Jatuh Tempo" : "到期日"}</p>
          <p className="font-semibold">{dueDate || "-"}</p>
        </div>
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-gray-300">
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
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{index + 1}</td>
              <td className="py-2">
                <div className="w-4 h-4 border border-gray-300"></div>
              </td>
              <td className="py-2">{item.name}</td>
              <td className="py-2">{item.qty}</td>
              <td className="py-2">Rp{item.price.toLocaleString()}</td>
              <td className="py-2 text-right">Rp{(item.qty * item.price).toLocaleString()}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td colSpan={5} className="py-2 text-right">
              {language === "id" ? "Total:" : "总计："}
            </td>
            <td className="py-2 text-right">Rp{total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div className="mb-6">
        <p className="text-sm text-gray-600">{language === "id" ? "Status Pembayaran" : "支付状态"}</p>
        <p className="font-semibold">
          {paymentStatus === "lunas"
            ? language === "id"
              ? "Lunas"
              : "已付款"
            : language === "id"
              ? "Belum Lunas"
              : "未付款"}
        </p>
      </div>

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

