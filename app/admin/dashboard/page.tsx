"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Download, Search } from "lucide-react"
import { getAllAttendanceRecords, exportAttendanceData } from "@/app/actions/attendance-actions"
import { getUserProfile, logout } from "@/app/actions/auth-actions"
import { useToast } from "@/hooks/use-toast"
import type { AttendanceRecord } from "@/app/types"

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const profile = await getUserProfile()
        if (!profile.success || !profile.data.isAdmin) {
          toast({
            title: "Access Denied",
            description: "You must be an admin to access this page",
            variant: "destructive",
          })
          router.push("/login?role=admin")
          return
        }

        // Load attendance records
        const records = await getAllAttendanceRecords()
        if (records.success) {
          setAttendanceRecords(records.data)
          setFilteredRecords(records.data)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load admin data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAuth()
  }, [router, toast])

  useEffect(() => {
    // Filter records based on search, date, and department
    let filtered = [...attendanceRecords]

    if (searchQuery) {
      filtered = filtered.filter(
        (record) =>
          record.rollNumber.includes(searchQuery) ||
          record.studentName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd")
      filtered = filtered.filter((record) => record.date.startsWith(dateString))
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter((record) => record.department === selectedDepartment)
    }

    setFilteredRecords(filtered)
  }, [searchQuery, selectedDate, selectedDepartment, attendanceRecords])

  async function handleExportData() {
    setIsExporting(true)
    try {
      const result = await exportAttendanceData({
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
        department: selectedDepartment !== "all" ? selectedDepartment : undefined,
      })

      if (result.success) {
        toast({
          title: "Export Successful",
          description: "Attendance data has been exported",
        })

        // In a real app, this would trigger a file download
        // For this demo, we'll just show a success message
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to export attendance data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.push("/login?role=admin")
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>View and filter student attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search" className="sr-only">
                        Search
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="search"
                          placeholder="Search by roll number or name"
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="date-picker" className="sr-only">
                        Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date-picker"
                            variant="outline"
                            className="w-full justify-start text-left font-normal sm:w-[200px]"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="department-filter" className="sr-only">
                        Department
                      </Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger id="department-filter" className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                          <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                          <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                          <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Roll Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
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
                        {filteredRecords.length > 0 ? (
                          filteredRecords.map((record, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(record.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.rollNumber}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.studentName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.department}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Present
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              No records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Attendance Data</CardTitle>
                <CardDescription>Download attendance records as files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="export-date">Select Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="export-date"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="export-department">Department</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger id="export-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                          <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                          <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                          <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleExportData} className="w-full" disabled={isExporting}>
                    {isExporting ? (
                      "Exporting..."
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export Attendance Data
                      </>
                    )}
                  </Button>

                  <div className="bg-gray-50 p-4 rounded-md border">
                    <h3 className="font-medium mb-2">Export Information</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      <li>Exports are generated as CSV files</li>
                      <li>Files are secured with encryption</li>
                      <li>Data includes student details and attendance status</li>
                      <li>You can filter by date and department before exporting</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
