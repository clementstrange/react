"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar, Clock, CheckCircle2, PauseCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTaskStore } from "@/lib/store"

export default function ScheduleView() {
  // Add a new state for review mode
  const [viewMode, setViewMode] = useState<"today" | "week" | "review">("today")
  const { scheduledTasks, completedTasks, breaks } = useTaskStore()

  // Combine all tasks and breaks for display
  const allItems = [
    ...scheduledTasks.map((task) => ({ ...task, type: "scheduled" })),
    ...completedTasks.map((task) => ({ ...task, type: "completed" })),
    ...breaks.map((breakItem) => ({ ...breakItem, type: "break" })),
  ]

  // Filter items based on selected view
  const filteredItems = allItems.filter((item) => {
    const itemDate = new Date(item.startTime)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (viewMode === "today") {
      const itemDay = new Date(itemDate)
      itemDay.setHours(0, 0, 0, 0)
      return itemDay.getTime() === today.getTime()
    } else {
      // Week view - show next 7 days
      const weekFromNow = new Date(today)
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      return itemDate >= today && itemDate <= weekFromNow
    }
  })

  // Sort items by start time
  const sortedItems = filteredItems.sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  })

  // Group items by date for week view
  const groupedByDate = sortedItems.reduce(
    (groups, item) => {
      const date = format(new Date(item.startTime), "yyyy-MM-dd")
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(item)
      return groups
    },
    {} as Record<string, typeof sortedItems>,
  )

  // Add helper functions for the review calculations
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const calculateWeeklyFocusTime = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return completedTasks
      .filter((task) => new Date(task.startTime) >= weekAgo)
      .reduce((total, task) => total + task.duration, 0)
  }

  const calculateWeeklySessions = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return completedTasks.filter((task) => new Date(task.startTime) >= weekAgo).length
  }

  const calculateAvgSessionLength = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weeklyTasks = completedTasks.filter((task) => new Date(task.startTime) >= weekAgo)

    if (weeklyTasks.length === 0) return 0

    const totalDuration = weeklyTasks.reduce((total, task) => total + task.duration, 0)
    return Math.round(totalDuration / weeklyTasks.length)
  }

  const calculateWeeklyBreakTime = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return breaks
      .filter((breakItem) => new Date(breakItem.startTime) >= weekAgo)
      .reduce((total, breakItem) => total + breakItem.duration, 0)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Schedule</CardTitle>
          {/* Add a new tab for Review mode */}
          <Tabs
            defaultValue="today"
            onValueChange={(value) => {
              if (value === "review") {
                setViewMode("review")
              } else {
                setViewMode(value as "today" | "week")
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Next 7 Days</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
        {viewMode === "today" ? (
          <div className="space-y-4">
            {sortedItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tasks scheduled for today</p>
            ) : (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${
                    item.type === "break"
                      ? "bg-gray-50 dark:bg-gray-800"
                      : item.type === "completed"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.type === "break" ? (
                        <PauseCircle className="h-5 w-5 text-gray-500" />
                      ) : item.type === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.startTime), "h:mm a")} - {format(new Date(item.endTime), "h:mm a")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{Math.round(item.duration / 60)} min</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : viewMode === "week" ? (
          <div className="space-y-6">
            {Object.keys(groupedByDate).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tasks scheduled for the next 7 days</p>
            ) : (
              Object.entries(groupedByDate).map(([date, items]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{format(new Date(date), "EEEE, MMMM d")}</h3>
                  </div>

                  <div className="space-y-2 pl-6">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border ${
                          item.type === "break"
                            ? "bg-gray-50 dark:bg-gray-800"
                            : item.type === "completed"
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {item.type === "break" ? (
                              <PauseCircle className="h-5 w-5 text-gray-500" />
                            ) : item.type === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(item.startTime), "h:mm a")} - {format(new Date(item.endTime), "h:mm a")}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {Math.round(item.duration / 60)} min
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Add the review content
          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Weekly Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Focus Time</p>
                  <p className="text-xl font-bold">{formatDuration(calculateWeeklyFocusTime())}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessions Completed</p>
                  <p className="text-xl font-bold">{calculateWeeklySessions()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Session Length</p>
                  <p className="text-xl font-bold">{formatDuration(calculateAvgSessionLength())}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Break Time</p>
                  <p className="text-xl font-bold">{formatDuration(calculateWeeklyBreakTime())}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">AI Insights</h3>
              <div className="space-y-3">
                <p className="text-sm">
                  Based on your patterns this week, you're most productive in the
                  <span className="font-medium"> morning</span>. Consider scheduling your most important tasks before
                  noon.
                </p>
                <p className="text-sm">
                  Your average focus session is <span className="font-medium">shorter than last week</span>. You might
                  be experiencing more interruptions.
                </p>
                <p className="text-sm">
                  You completed <span className="font-medium">3 more sessions</span> this week compared to last week.
                  Great improvement!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

