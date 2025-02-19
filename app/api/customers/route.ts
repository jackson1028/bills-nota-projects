import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const client = await clientPromise
    const db = client.db("notaApp")

    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { storeName: { $regex: search, $options: "i" } },
        { notaCode: { $regex: search, $options: "i" } },
      ]
    }

    const customers = await db.collection("customers").find(query).toArray()

    return NextResponse.json(customers)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("customers").insertOne(body)
    return NextResponse.json({ _id: result.insertedId, ...body }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}

