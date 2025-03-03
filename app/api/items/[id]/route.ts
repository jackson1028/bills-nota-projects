import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("notaApp")
    const item = await db.collection("items").findOne({ _id: new ObjectId(params.id) })
    if (item) {
      return NextResponse.json(item)
    } else {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, namaMandarin } = body
    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("items").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          nama,
          namaMandarin,
          updatedAt: new Date(),
        },
      },
    )
    if (result.matchedCount > 0) {
      const updatedItem = await db.collection("items").findOne({ _id: new ObjectId(params.id) })
      return NextResponse.json(updatedItem)
    } else {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("items").deleteOne({ _id: new ObjectId(params.id) })
    if (result.deletedCount > 0) {
      return new NextResponse(null, { status: 204 })
    } else {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}

