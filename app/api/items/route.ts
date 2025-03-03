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
      query.$or = [{ nama: { $regex: search, $options: "i" } }, { namaMandarin: { $regex: search, $options: "i" } }]
    }

    const items = await db.collection("items").find(query).toArray()

    return NextResponse.json(items)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nama, namaMandarin } = body

    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("items").insertOne({
      nama,
      namaMandarin,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ _id: result.insertedId, nama, namaMandarin }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}

