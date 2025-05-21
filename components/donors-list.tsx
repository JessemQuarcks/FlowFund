"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function DonorsList({ eventId }: { eventId: string }) {
  const [sortBy, setSortBy] = useState("recent")

  // In a real app, this would be fetched from an API
  const donors = [
    { id: "1", name: "John Doe", amount: 50, date: "2 hours ago", initials: "JD" },
    { id: "2", name: "Anonymous Supporter", amount: 100, date: "5 hours ago", initials: "AS" },
    { id: "3", name: "Maria Smith", amount: 25, date: "1 day ago", initials: "MS" },
    { id: "4", name: "Robert Johnson", amount: 200, date: "2 days ago", initials: "RJ" },
    { id: "5", name: "Anonymous Supporter", amount: 75, date: "3 days ago", initials: "AS" },
    { id: "6", name: "Emily Davis", amount: 150, date: "4 days ago", initials: "ED" },
    { id: "7", name: "Michael Brown", amount: 50, date: "5 days ago", initials: "MB" },
    { id: "8", name: "Sarah Wilson", amount: 300, date: "1 week ago", initials: "SW" },
    { id: "9", name: "Anonymous Supporter", amount: 25, date: "1 week ago", initials: "AS" },
    { id: "10", name: "David Miller", amount: 100, date: "2 weeks ago", initials: "DM" },
  ]

  // Sort donors based on selected option
  const sortedDonors = [...donors].sort((a, b) => {
    if (sortBy === "highest") return b.amount - a.amount
    if (sortBy === "lowest") return a.amount - b.amount
    // Default: recent
    return 0 // In a real app, would sort by date
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Donors</CardTitle>
          <CardDescription>People who have supported this fundraiser</CardDescription>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="highest">Highest Amount</SelectItem>
            <SelectItem value="lowest">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedDonors.map((donor) => (
            <div key={donor.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{donor.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{donor.name}</div>
                  <div className="text-xs text-muted-foreground">{donor.date}</div>
                </div>
              </div>
              <div className="font-medium">${donor.amount}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
