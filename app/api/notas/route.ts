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
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      query.notaDate = { $gte: startDate, $lt: endDate }
    }
    if (customerId && customerId !== "all") {
      query.customerId = new ObjectId(customerId)
    }

    const notas = await db.collection("notas").find(query).sort({ notaDate: -1 }).skip(skip).limit(limit).toArray()

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
    }

    const result = await db.collection("notas").insertOne(newNota)
    return NextResponse.json({ _id: result.insertedId, ...newNota }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create nota" }, { status: 500 })
  }
}

