export interface AttendanceRecord {
  id: number
  studentName: string
  rollNumber: string
  department: string
  date: string
  status: "present" | "absent" | "late"
}

export interface User {
  id: number
  name: string
  email: string
  rollNumber: string
  phone: string
  department: string
  isAdmin: boolean
}
