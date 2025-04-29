"use server"

import { getUserProfile } from "./auth-actions"
import type { AttendanceRecord } from "@/app/types"

// In a real app, this would be stored in a database
const attendanceRecords: AttendanceRecord[] = [
  {
    id: 1,
    studentName: "Santhosh",
    rollNumber: "12345678901",
    department: "Computer Science",
    date: "2025-03-11T08:00:00.000Z",
    status: "present",
  },
  {
    id: 2,
    studentName: "Saravana",
    rollNumber: "23456789012",
    department: "Electrical Engineering",
    date: "2025-03-11T08:00:00.000Z",
    status: "present",
  },
]

// Mark attendance
export async function markAttendance({
  rollNumber,
  department,
}: {
  rollNumber: string
  department: string
}) {
  try {
    // Get user profile from session
    const profile = await getUserProfile()

    if (!profile.success) {
      return {
        success: false,
        error: "Not authenticated",
      }
    }

    // Check if attendance already marked for today
    const today = new Date().toISOString().split("T")[0]
    const alreadyMarked = attendanceRecords.some(
      (record) => record.rollNumber === rollNumber && record.date.startsWith(today),
    )

    if (alreadyMarked) {
      return {
        success: false,
        error: "Attendance already marked for today",
      }
    }

    // Create new attendance record
    const newRecord: AttendanceRecord = {
      id: attendanceRecords.length + 1,
      studentName: profile.data.name,
      rollNumber,
      department,
      date: new Date().toISOString(),
      status: "present",
    }

    // Add to records
    attendanceRecords.push(newRecord)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Mark attendance error:", error)
    return {
      success: false,
      error: "Failed to mark attendance",
    }
  }
}

// Get student attendance history
export async function getStudentAttendanceHistory() {
  try {
    // Get user profile from session
    const profile = await getUserProfile()

    if (!profile.success) {
      return {
        success: false,
        error: "Not authenticated",
      }
    }

    // Filter records for this student
    const records = attendanceRecords.filter((record) => record.rollNumber === profile.data.rollNumber)

    // Sort by date (newest first)
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return {
      success: true,
      data: records,
    }
  } catch (error) {
    console.error("Get attendance history error:", error)
    return {
      success: false,
      error: "Failed to get attendance history",
    }
  }
}

// Get all attendance records (admin only)
export async function getAllAttendanceRecords() {
  try {
    // Get user profile from session
    const profile = await getUserProfile()

    if (!profile.success || !profile.data.isAdmin) {
      return {
        success: false,
        error: "Not authorized",
      }
    }

    // Sort by date (newest first)
    const sortedRecords = [...attendanceRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return {
      success: true,
      data: sortedRecords,
    }
  } catch (error) {
    console.error("Get all attendance records error:", error)
    return {
      success: false,
      error: "Failed to get attendance records",
    }
  }
}

// Export attendance data (admin only)
export async function exportAttendanceData({
  date,
  department,
}: {
  date?: string
  department?: string
}) {
  try {
    // Get user profile from session
    const profile = await getUserProfile()

    if (!profile.success || !profile.data.isAdmin) {
      return {
        success: false,
        error: "Not authorized",
      }
    }

    // Filter records based on date and department
    let filteredRecords = [...attendanceRecords]

    if (date) {
      filteredRecords = filteredRecords.filter((record) => record.date.startsWith(date))
    }

    if (department) {
      filteredRecords = filteredRecords.filter((record) => record.department === department)
    }

    // In a real app, this would generate a CSV file and return a download URL
    // For this demo, we'll just return success

    return {
      success: true,
      message: `Exported ${filteredRecords.length} records`,
    }
  } catch (error) {
    console.error("Export attendance data error:", error)
    return {
      success: false,
      error: "Failed to export attendance data",
    }
  }
}
