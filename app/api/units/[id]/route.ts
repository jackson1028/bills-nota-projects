import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("notaApp")
    const unit = await db.collection("units").findOne({ _id: new ObjectId(params.id) })
    if (unit) {
      return NextResponse.json(unit)
    } else {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch unit" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name } = body
    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("units").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          name,
          updatedAt: new Date(),
        },
      },
    )
    if (result.matchedCount > 0) {
      const updatedUnit = await db.collection("units").findOne({ _id: new ObjectId(params.id) })
      return NextResponse.json(updatedUnit)
    } else {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("units").deleteOne({ _id: new ObjectId(params.id) })
    if (result.deletedCount > 0) {
      return new NextResponse(null, { status: 204 })
    } else {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 })
  }
}

