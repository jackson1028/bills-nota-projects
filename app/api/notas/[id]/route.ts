import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("notaApp")
    const nota = await db.collection("notas").findOne({ _id: new ObjectId(params.id) })
    if (nota) {
      return NextResponse.json(nota)
    } else {
      return NextResponse.json({ error: "Nota not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch nota" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db("notaApp")

    // Validate customerId if it's being updated
    if (body.customerId && !ObjectId.isValid(body.customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    const existingNota = await db.collection("notas").findOne({ _id: new ObjectId(params.id) })
    if (!existingNota) {
      return NextResponse.json({ error: "Nota not found" }, { status: 404 })
    }

    // Remove this condition
    // if (existingNota.status !== "draft") {
    //   return NextResponse.json({ error: "Only draft notas can be edited" }, { status: 400 })
    // }

    // In the PUT function, update the updateData object
    // Add a new field to track edits on published notas
    const updateData = {
      ...body,
      updatedAt: new Date(),
      customerId: new ObjectId(body.customerId),
      notaDate: new Date(body.notaDate),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      items: body.items.map((item: any) => ({
        ...item,
        qty: Number(item.qty),
        price: Number(item.price),
        unit: item.unit || "",
      })),
      lastEditedAt: existingNota.status === "terbit" ? new Date() : undefined,
    }

    const result = await db.collection("notas").updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })
    if (result.matchedCount > 0) {
      const updatedNota = await db.collection("notas").findOne({ _id: new ObjectId(params.id) })
      return NextResponse.json(updatedNota)
    } else {
      return NextResponse.json({ error: "Nota not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update nota" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("notas").deleteOne({ _id: new ObjectId(params.id) })
    if (result.deletedCount > 0) {
      return new NextResponse(null, { status: 204 })
    } else {
      return NextResponse.json({ error: "Nota not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to delete nota" }, { status: 500 })
  }
}

