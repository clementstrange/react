"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar, Clock, CheckCircle2, PauseCircle, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTaskStore } from "@/lib/store"

// Create a custom event for starting tasks
export const startTaskEvent = "start-scheduled-task"

export default function CalendarView() {
  const [viewMode, setViewMode] = useState<"today" | "week">("today")
  const { scheduledTasks, completedTasks, breaks } = useTaskStore()

  // Combine all tasks and breaks for display
  const allItems = [
    ...scheduledTasks.map((task) => ({
      ...task,
      type: "scheduled",
      isActive: task.context === "Current session",
    })),
    ...completedTasks.map((task) => ({ ...task, type: "completed" })),
    ...breaks.filter((breakItem) => breakItem.duration >= 60).map((breakItem) => ({ ...breakItem, type: "break" })),
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
    // Ensure we're comparing Date objects
    const dateA = a.startTime instanceof Date ? a.startTime : new Date(a.startTime)
    const dateB = b.startTime instanceof Date ? b.startTime : new Date(b.startTime)
    return dateA.getTime() - dateB.getTime()
  })

  // Group items by date for week view
  const groupedByDate = sortedItems.reduce(
    (groups, item) => {
      // Ensure we're working with a Date object
      const itemDate = item.startTime instanceof Date ? item.startTime : new Date(item.startTime)
      const date = format(itemDate, "yyyy-MM-dd")

      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(item)
      return groups
    },
    {} as Record<string, typeof sortedItems>,
  )

  // Function to start a task now
  const startTaskNow = (task: any) => {
    // Dispatch a custom event with the task data
    const startEvent = new CustomEvent(startTaskEvent, {
      detail: {
        taskId: task.id,
        title: task.title,
        duration: task.duration,
        scheduledTaskId: task.id,
      },
    })
    document.dispatchEvent(startEvent)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Calendar</CardTitle>
          <Tabs defaultValue="today" onValueChange={(value) => setViewMode(value as "today" | "week")}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Next 7 Days</TabsTrigger>
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
                        : item.isActive
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900"
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.type === "break" ? (
                        <PauseCircle className="h-5 w-5 text-gray-500" />
                      ) : item.type === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : item.isActive ? (
                        <Play className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.title}
                        {item.isActive && (
                          <span className="ml-2 text-yellow-600 dark:text-yellow-400">(In Progress)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.startTime), "h:mm a")} - {format(new Date(item.endTime), "h:mm a")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{Math.round(item.duration / 60)} min</div>
                      {item.type === "scheduled" && !item.isActive && (
                        <div className="mt-2">
                          <button
                            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md inline-flex items-center"
                            onClick={() => startTaskNow(item)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-1"
                            >
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Start Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedByDate).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tasks scheduled for the next 7 days</p>
            ) : (
              Object.entries(groupedByDate)
                .sort(([dateA], [dateB]) => {
                  return new Date(dateA).getTime() - new Date(dateB).getTime()
                })
                .map(([date, items]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{format(new Date(date), "EEEE, MMMM d")}</h3>
                    </div>

                    <div className="space-y-2 pl-6">
                      {items
                        .sort((a, b) => {
                          const timeA = new Date(a.startTime).getTime()
                          const timeB = new Date(b.startTime).getTime()
                          return timeA - timeB
                        })
                        .map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border ${
                              item.type === "break"
                                ? "bg-gray-50 dark:bg-gray-800"
                                : item.type === "completed"
                                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                                  : item.isActive
                                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900"
                                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {item.type === "break" ? (
                                  <PauseCircle className="h-5 w-5 text-gray-500" />
                                ) : item.type === "completed" ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : item.isActive ? (
                                  <Play className="h-5 w-5 text-yellow-500" />
                                ) : (
                                  <Clock className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">
                                  {item.title}
                                  {item.isActive && (
                                    <span className="ml-2 text-yellow-600 dark:text-yellow-400">(In Progress)</span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(item.startTime), "h:mm a")} -{" "}
                                  {format(new Date(item.endTime), "h:mm a")}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {Math.round(item.duration / 60)} min
                                </div>
                                {item.type === "scheduled" && !item.isActive && (
                                  <div className="mt-2">
                                    <button
                                      className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md inline-flex items-center"
                                      onClick={() => startTaskNow(item)}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="mr-1"
                                      >
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                      </svg>
                                      Start Now
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

