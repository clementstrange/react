"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTaskStore } from "@/lib/store"

export default function DailyStats() {
  const { completedTasks, breaks } = useTaskStore()
  const [stats, setStats] = useState({
    sessionsCompleted: 0,
    totalFocusTime: 0,
    totalBreakTime: 0,
    goalProgress: 0,
  })

  // Daily goal (in minutes)
  const dailyGoal = 120

  useEffect(() => {
    // Filter for today's completed sessions and breaks
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysTasks = completedTasks.filter((task) => {
      const taskDate = new Date(task.startTime)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === today.getTime()
    })

    const todaysBreaks = breaks.filter((breakItem) => {
      const breakDate = new Date(breakItem.startTime)
      breakDate.setHours(0, 0, 0, 0)
      return breakDate.getTime() === today.getTime()
    })

    // Calculate statistics
    const sessionsCompleted = todaysTasks.length
    const totalFocusTime = todaysTasks.reduce((total, task) => total + task.duration, 0)
    const totalBreakTime = todaysBreaks.reduce((total, breakItem) => total + breakItem.duration, 0)

    // Calculate progress toward daily goal (in minutes)
    const focusTimeMinutes = Math.round(totalFocusTime / 60)
    const goalProgress = Math.min(100, Math.round((focusTimeMinutes / dailyGoal) * 100))

    setStats({
      sessionsCompleted,
      totalFocusTime,
      totalBreakTime,
      goalProgress,
    })
  }, [completedTasks, breaks])

  // Format seconds as HH:MM
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Today's Focus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sessions</p>
            <p className="text-2xl font-bold">{stats.sessionsCompleted}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Focus Time</p>
            <p className="text-2xl font-bold">{formatDuration(stats.totalFocusTime)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Break Time</p>
            <p className="text-2xl font-bold">{formatDuration(stats.totalBreakTime)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Daily Goal</p>
            <p className="text-2xl font-bold">
              {Math.round(stats.totalFocusTime / 60)}/{dailyGoal}m
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{stats.goalProgress}%</span>
          </div>
          <Progress value={stats.goalProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}

