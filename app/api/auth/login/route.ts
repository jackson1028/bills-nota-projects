import { NextResponse } from "next/server"
import { compare } from "bcryptjs"

const users = [
  {
    id: "1",
    email: "yantosupplier@gmail.com",
    password: "$2a$12$Wn/S7kZmBFVqaXO59I6v8.PWyfSrxODulicbEm.AbujcDqzvlbW8i", // hashed version of "Admin123!"
  },
]

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const user = users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid password" }, { status: 401 })
    }

    const response = NextResponse.json({ message: "Login successful", userId: user.id }, { status: 200 })

    // Set a cookie with an expiration of 7 days
    response.cookies.set("authToken", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

