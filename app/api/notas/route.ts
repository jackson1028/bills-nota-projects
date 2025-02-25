import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")
    const date = searchParams.get("date")
    const customerId = searchParams.get("customerId")
    const createdAtFrom = searchParams.get("createdAtFrom")
    const createdAtTo = searchParams.get("createdAtTo")
    const notaDateFrom = searchParams.get("notaDateFrom")
    const notaDateTo = searchParams.get("notaDateTo")

    const client = await clientPromise
    const db = client.db("notaApp")

    const skip = (page - 1) * limit

    const query: any = {}
    if (status && status !== "all") {
      query.status = status
    }
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus
    }
    if (notaDateFrom || notaDateTo) {
      query.notaDate = {}
      if (notaDateFrom) {
        query.notaDate.$gte = new Date(notaDateFrom)
      }
      if (notaDateTo) {
        const toDate = new Date(notaDateTo)
        toDate.setDate(toDate.getDate() + 1)
        toDate.setHours(23, 59, 59, 999)
        query.notaDate.$lte = toDate
      }
    }
    if (customerId && customerId !== "all") {
      query.customerId = new ObjectId(customerId)
    }
    if (createdAtFrom || createdAtTo) {
      query.createdAt = {}
      if (createdAtFrom) {
        query.createdAt.$gte = new Date(createdAtFrom)
      }
      if (createdAtTo) {
        const toDate = new Date(createdAtTo)
        toDate.setDate(toDate.getDate() + 1)
        toDate.setHours(23, 59, 59, 999)
        query.createdAt.$lte = toDate
      }
    }

    const notas = await db.collection("notas").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    const totalItems = await db.collection("notas").countDocuments(query)

    return NextResponse.json({
      notas,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch notas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db("notaApp")

    // Validate customerId
    if (!ObjectId.isValid(body.customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    const customer = await db.collection("customers").findOne({ _id: new ObjectId(body.customerId) })
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const newNota = {
      ...body,
      customerId: new ObjectId(body.customerId),
      createdAt: new Date(),
      updatedAt: new Date(),
      notaDate: new Date(body.notaDate),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: body.status || "draft",
      paymentStatus: body.paymentStatus || "belum lunas",
      items: body.items.map((item: any) => ({
        ...item,
        qty: Number(item.qty),
        price: Number(item.price),
        unit: item.unit || "", // Add this line to include the unit
      })),
    }

    const result = await db.collection("notas").insertOne(newNota)
    return NextResponse.json({ _id: result.insertedId, ...newNota }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create nota" }, { status: 500 })
  }
}

