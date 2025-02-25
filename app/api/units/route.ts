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
      query.name = { $regex: search, $options: "i" }
    }

    const units = await db.collection("units").find(query).toArray()

    return NextResponse.json(units)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("units").insertOne({
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ _id: result.insertedId, name }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 })
  }
}

