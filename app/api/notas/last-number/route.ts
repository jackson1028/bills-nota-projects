import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const notaCode = searchParams.get("notaCode")

    if (!notaCode) {
      return NextResponse.json({ error: "Nota code is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("notaApp")

    const lastNotaNumber = await db.collection("lastNotaNumbers").findOne({ notaCode })

    if (!lastNotaNumber) {
      // If no record exists, initialize with 0
      await db.collection("lastNotaNumbers").insertOne({ notaCode, lastNumber: 0 })
      return NextResponse.json({ lastNumber: 0 })
    }

    return NextResponse.json({ lastNumber: lastNotaNumber.lastNumber })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch last nota number" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { notaCode, newNumber } = await request.json()

    if (!notaCode || typeof newNumber !== "number") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("notaApp")

    await db
      .collection("lastNotaNumbers")
      .updateOne({ notaCode }, { $set: { lastNumber: newNumber } }, { upsert: true })

    return NextResponse.json({ success: true, lastNumber: newNumber })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update last nota number" }, { status: 500 })
  }
}

