import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LineItem {
  id: number
  name: string
  qty: number
  price: number
}

interface PrintableNotaProps {
  notaNumber: string
  customerName: string
  transactionDate: string
  dueDate?: string
  items: LineItem[]
  total: number
  paymentStatus: "lunas" | "belum lunas"
  language: "id" | "zh"
}

export function PrintableNota({
  notaNumber,
  customerName,
  transactionDate,
  dueDate,
  items,
  total,
  paymentStatus,
  language,
}: PrintableNotaProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">{language === "id" ? "Toko Yanto" : "燕涛商店"}</CardTitle>
        <p className="text-sm text-muted-foreground">
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
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{language === "id" ? "Customer" : "客户"}</div>
            <div>{customerName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{language === "id" ? "Nomor Nota" : "单据编号"}</div>
            <div style={{ color: "red" }}>{notaNumber}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm">#</th>
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
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{item.qty}</td>
                  <td className="py-2">Rp{item.price.toLocaleString()}</td>
                  <td className="py-2 text-right">Rp{(item.qty * item.price).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="font-medium">
                <td colSpan={4} className="py-2 text-right">
                  {language === "id" ? "Total:" : "总计："}
                </td>
                <td className="py-2 text-right">Rp{total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{language === "id" ? "Tanggal Transaksi" : "交易日期"}</div>
            <div>{transactionDate}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{language === "id" ? "Jatuh Tempo" : "到期日"}</div>
            <div>{dueDate || "-"}</div>
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{language === "id" ? "Status Pembayaran" : "支付状态"}</div>
          <div>
            {paymentStatus === "lunas"
              ? language === "id"
                ? "Lunas"
                : "已付款"
              : language === "id"
                ? "Belum Lunas"
                : "未付款"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

