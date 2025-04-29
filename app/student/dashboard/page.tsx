"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { markAttendance, getStudentAttendanceHistory } from "@/app/actions/attendance-actions"
import { useToast } from "@/hooks/use-toast"
import type { AttendanceRecord } from "@/app/types"
import { getUserProfile, logout } from "@/app/actions/auth-actions"
import { useRouter } from "next/navigation"

export default function StudentDashboard() {
  const { toast } = useToast()
  const router = useRouter()
  const [department, setDepartment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [userProfile, setUserProfile] = useState<{ name: string; rollNumber: string; department: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      try {
        const profile = await getUserProfile()
        if (!profile.success) {
          toast({
            title: "Authentication Error",
            description: "Please login to continue",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        setUserProfile(profile.data)
        setDepartment(profile.data.department)

        // Load attendance history
        const history = await getStudentAttendanceHistory()
        if (history.success) {
          setAttendanceHistory(history.data)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    loadUserData()
  }, [router, toast])

  async function handleMarkAttendance() {
    if (!userProfile) return

    setIsSubmitting(true)
    try {
      const result = await markAttendance({
        rollNumber: userProfile.rollNumber,
        department,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Your attendance has been recorded",
        })

        // Refresh attendance history
        const history = await getStudentAttendanceHistory()
        if (history.success) {
          setAttendanceHistory(history.data)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark attendance",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <div className="flex items-center space-x-4">
            {userProfile && <p className="text-gray-600">Welcome, {userProfile.name}</p>}
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>Record your attendance for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <p className="p-2 border rounded-md bg-gray-50">{userProfile?.rollNumber}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                        <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                        <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleMarkAttendance} className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Mark Attendance"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>Your recent attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceHistory.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceHistory.map((record, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Present
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No attendance records found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
