"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// In a real app, this would be stored in a database
const users: any[] = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123", // In a real app, this would be hashed
    isAdmin: true,
  },
  // Add a sample student user for easier testing
  {
    id: 2,
    name: "Student User",
    email: "student@example.com",
    rollNumber: "12345678901",
    phone: "1234567890",
    department: "Computer Science",
    password: "student123",
    isAdmin: false,
  },
]

// Register user
export async function registerUser(userData: {
  name: string
  email: string
  rollNumber: string
  phone: string
  department: string
  password: string
}) {
  try {
    // Check if user already exists
    const existingUser = users.find((user) => user.email === userData.email || user.rollNumber === userData.rollNumber)

    if (existingUser) {
      return {
        success: false,
        error: "User with this email or roll number already exists",
      }
    }

    // In a real app, you would hash the password before storing it
    const newUser = {
      id: users.length + 1,
      ...userData,
      isAdmin: false,
    }

    // Add user to our "database"
    users.push(newUser)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      error: "Failed to register user",
    }
  }
}

// Login user
export async function loginUser({
  email,
  password,
  isAdmin = false,
}: {
  email: string
  password: string
  isAdmin?: boolean
}) {
  try {
    // Find user
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      return {
        success: false,
        error: "Invalid credentials",
      }
    }

    // Check if admin login but user is not admin
    if (isAdmin && !user.isAdmin) {
      return {
        success: false,
        error: "You do not have admin privileges",
      }
    }

    // Create session
    const session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      department: user.department,
      isAdmin: user.isAdmin,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    }

    // In a real app, you would encrypt this session data
    const sessionStr = JSON.stringify(session)

    // Set cookie
    cookies().set("session", sessionStr, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      error: "Failed to login",
    }
  }
}

// Get user profile from session
export async function getUserProfile() {
  try {
    const sessionCookie = cookies().get("session")

    if (!sessionCookie) {
      return {
        success: false,
        error: "Not authenticated",
      }
    }

    // In a real app, you would decrypt the session data
    const session = JSON.parse(sessionCookie.value)

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      cookies().delete("session")
      return {
        success: false,
        error: "Session expired",
      }
    }

    return {
      success: true,
      data: {
        name: session.name,
        email: session.email,
        rollNumber: session.rollNumber,
        department: session.department,
        isAdmin: session.isAdmin,
      },
    }
  } catch (error) {
    console.error("Get user profile error:", error)
    return {
      success: false,
      error: "Failed to get user profile",
    }
  }
}

// Logout user
export async function logout() {
  cookies().delete("session")
}

// Middleware to check if user is authenticated
export async function requireAuth() {
  const profile = await getUserProfile()

  if (!profile.success) {
    redirect("/login")
  }

  return profile.data
}

// Middleware to check if user is admin
export async function requireAdmin() {
  const profile = await getUserProfile()

  if (!profile.success || !profile.data.isAdmin) {
    redirect("/login?role=admin")
  }

  return profile.data
}
