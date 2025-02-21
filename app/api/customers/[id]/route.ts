import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("notaApp")
    const customer = await db.collection("customers").findOne({
      _id: new ObjectId(params.id),
      tags: { $ne: "deleted" },
    })
    if (customer) {
      return NextResponse.json(customer)
    } else {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, storeName, address, phone, notaCode, requireHeaderNota } = body
    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("customers").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          name,
          storeName,
          address,
          phone,
          notaCode,
          requireHeaderNota,
        },
      },
    )
    if (result.matchedCount > 0) {
      const updatedCustomer = await db.collection("customers").findOne({ _id: new ObjectId(params.id) })
      return NextResponse.json(updatedCustomer)
    } else {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("notaApp")
    const result = await db.collection("customers").deleteOne({ _id: new ObjectId(params.id) })
    if (result.deletedCount > 0) {
      return new NextResponse(null, { status: 204 })
    } else {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}

