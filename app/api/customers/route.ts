import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { escapeRegex } from "@/lib/utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const client = await clientPromise
    const db = client.db("notaApp")

    const query: any = {}

    if (search) {
      const escapedSearch = escapeRegex(search)
      query.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { storeName: { $regex: escapedSearch, $options: "i" } },
        { notaCode: { $regex: escapedSearch, $options: "i" } },
      ]
    }

    const customers = await db
      .collection("customers")
      .find(query)
      .project({
        name: 1,
        storeName: 1,
        address: 1,
        phone: 1,
        notaCode: 1,
        requireHeaderNota: 1,
      })
      .toArray()

    return NextResponse.json(customers)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, storeName, address, phone, notaCode, requireHeaderNota } = body

    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("customers").insertOne({
      name,
      storeName,
      address,
      phone,
      notaCode,
      requireHeaderNota: requireHeaderNota ?? true, // Default to true if not provided
    })

    return NextResponse.json({ _id: result.insertedId, ...body }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}

