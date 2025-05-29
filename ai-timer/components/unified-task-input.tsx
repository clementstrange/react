"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Send, Loader2, Play, Pause, Square, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useTaskStore } from "@/lib/store"
import { parseTaskWithClaude } from "@/app/actions"
import { startTaskEvent } from "./calendar-view"

type TimerState = "idle" | "session" | "break" | "paused"

export default function UnifiedTaskInput() {
  // Input and processing state
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const {
    addScheduledTask,
    addCompletedTask,
    addBreak,
    scheduledTasks,
    updateTask,
    deleteTask,
    completedTasks,
    breaks,
  } = useTaskStore()
  const inputRef = useRef<HTMLInputElement>(null)

  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [sessionCount, setSessionCount] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null)
  const [currentTaskName, setCurrentTaskName] = useState("")
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [currentTaskDuration, setCurrentTaskDuration] = useState(25 * 60) // Default 25 minutes
  const [scheduledTaskId, setScheduledTaskId] = useState<string | null>(null)

  // Auto-focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Listen for the custom start task event
  useEffect(() => {
    const handleStartTask = (event: CustomEvent) => {
      const { title, duration, scheduledTaskId } = event.detail

      // If there's already an active session, end it first
      if (timerState === "session" || timerState === "paused") {
        endSession()
      }

      // Start the new task
      startSession(title, duration, scheduledTaskId)
    }

    // Add event listener
    document.addEventListener(startTaskEvent, handleStartTask as EventListener)

    // Clean up
    return () => {
      document.removeEventListener(startTaskEvent, handleStartTask as EventListener)
    }
  }, [timerState])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerState === "session" || timerState === "break") {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Timer completed
            if (timerState === "session") {
              handleSessionComplete()
            } else {
              handleBreakComplete()
            }
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerState])

  // Handle session completion
  const handleSessionComplete = useCallback(() => {
    const completedCount = sessionCount + 1
    setSessionCount(completedCount)

    // Log completed session
    if (sessionStartTime) {
      const duration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000)

      // If we have a current task ID, remove it from scheduled tasks
      if (currentTaskId && !scheduledTaskId) {
        deleteTask(currentTaskId)
      }

      // Add to completed tasks
      addCompletedTask({
        id: Date.now().toString(),
        title: currentTaskName,
        startTime: sessionStartTime,
        endTime: new Date(),
        duration,
        completed: true,
      })

      // If this was a scheduled task, update it to show time spent
      if (scheduledTaskId) {
        const scheduledTask = scheduledTasks.find((task) => task.id === scheduledTaskId)
        if (scheduledTask) {
          updateTask(scheduledTaskId, {
            context: `Worked on for ${Math.round(duration / 60)} minutes`,
          })
        }
      }
    }

    // Play notification
    try {
      const audio = new Audio("/notification.mp3")
      audio.volume = 0.5
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Could not play notification sound:", error)
        })
      }
    } catch (error) {
      console.error("Could not create audio element:", error)
    }

    toast({
      title: "Session Complete!",
      description: "Time for a break.",
    })

    // Start break
    const isLongBreak = completedCount % 4 === 0
    const breakDuration = isLongBreak ? 15 * 60 : 5 * 60

    setTimeLeft(breakDuration)
    setTimerState("break")
    setBreakStartTime(new Date())
    setCurrentTaskId(null)
    setScheduledTaskId(null)
  }, [
    sessionCount,
    sessionStartTime,
    currentTaskName,
    currentTaskId,
    scheduledTaskId,
    scheduledTasks,
    addCompletedTask,
    deleteTask,
    updateTask,
    toast,
  ])

  // Handle break completion
  const handleBreakComplete = useCallback(() => {
    // Log completed break
    if (breakStartTime) {
      const duration = Math.round((new Date().getTime() - breakStartTime.getTime()) / 1000)
      addBreak({
        id: Date.now().toString(),
        title: "Break",
        startTime: breakStartTime,
        endTime: new Date(),
        duration,
        isBreak: true,
      })
    }

    // Play notification
    try {
      const audio = new Audio("/notification.mp3")
      audio.volume = 0.5
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Could not play notification sound:", error)
        })
      }
    } catch (error) {
      console.error("Could not create audio element:", error)
    }

    toast({
      title: "Break Complete!",
      description: "Ready for another session?",
    })

    setTimeLeft(25 * 60)
    setTimerState("idle")

    // Auto-focus the input field after break completion
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }, [breakStartTime, addBreak, toast])

  // Start a new session
  const startSession = (taskName: string, duration = 25 * 60, scheduledId: string | null = null) => {
    // If there's already an active session, end it first
    if (timerState === "session" || timerState === "paused") {
      endSession()
    }

    const now = new Date()
    const endTime = new Date(now.getTime() + duration * 1000)

    // Create a task ID for this session
    const taskId = Date.now().toString()

    // Add to scheduled tasks (will show as "in progress" in the calendar)
    // Only if this is not a scheduled task that already exists
    if (!scheduledId) {
      addScheduledTask({
        id: taskId,
        title: taskName,
        startTime: now,
        endTime: endTime,
        duration: duration,
        completed: false,
        context: "Current session",
      })
    } else {
      // If this is a scheduled task, mark it as active
      updateTask(scheduledId, {
        context: "Current session",
      })
    }

    // Update state
    setCurrentTaskName(taskName)
    setCurrentTaskId(scheduledId ? null : taskId)
    setScheduledTaskId(scheduledId)
    setCurrentTaskDuration(duration)
    setTimeLeft(duration)
    setTimerState("session")
    setSessionStartTime(now)

    toast({
      title: "Focus Session Started",
      description: `Working on: ${taskName}`,
    })
  }

  // Pause current session
  const pauseSession = () => {
    if (timerState === "session") {
      setTimerState("paused")

      // Log the time spent so far as a partial session
      if (sessionStartTime) {
        const pauseTime = new Date()
        const duration = Math.round((pauseTime.getTime() - sessionStartTime.getTime()) / 1000)

        // Start tracking break time
        setBreakStartTime(pauseTime)

        // Update the task in the calendar to show it's paused
        if (currentTaskId) {
          updateTask(currentTaskId, {
            title: `${currentTaskName} (Paused)`,
          })
        }

        // If this is a scheduled task, update it to show it's paused
        if (scheduledTaskId) {
          updateTask(scheduledTaskId, {
            context: "Paused",
          })
        }

        toast({
          title: "Session Paused",
          description: "Take a short break. Resume when you're ready.",
        })
      }
    } else if (timerState === "paused") {
      setTimerState("session")
      setSessionStartTime(new Date())

      // Update the task in the calendar to remove the paused indicator
      if (currentTaskId) {
        updateTask(currentTaskId, {
          title: currentTaskName,
        })
      }

      // If this is a scheduled task, update it to show it's active again
      if (scheduledTaskId) {
        updateTask(scheduledTaskId, {
          context: "Current session",
        })
      }

      // Log the break time
      if (breakStartTime) {
        const duration = Math.round((new Date().getTime() - breakStartTime.getTime()) / 1000)
        addBreak({
          id: Date.now().toString(),
          title: "Pause Break",
          startTime: breakStartTime,
          endTime: new Date(),
          duration,
          isBreak: true,
        })

        toast({
          title: "Session Resumed",
          description: `Continuing work on: ${currentTaskName}`,
        })
      }
    }
  }

  // End current session
  const endSession = () => {
    if (timerState === "session" && sessionStartTime) {
      // Log the completed session with actual duration
      const duration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000)

      // If we have a current task ID, remove it from scheduled tasks
      if (currentTaskId && !scheduledTaskId) {
        deleteTask(currentTaskId)
      }

      // Add to completed tasks
      addCompletedTask({
        id: Date.now().toString(),
        title: currentTaskName,
        startTime: sessionStartTime,
        endTime: new Date(),
        duration,
        completed: true,
      })

      // If this was a scheduled task, update it to show time spent
      if (scheduledTaskId) {
        const scheduledTask = scheduledTasks.find((task) => task.id === scheduledTaskId)
        if (scheduledTask) {
          updateTask(scheduledTaskId, {
            context: `Worked on for ${Math.round(duration / 60)} minutes`,
          })
        }
      }

      setSessionCount(sessionCount + 1)

      toast({
        title: "Session Ended",
        description: `You worked on "${currentTaskName}" for ${Math.round(duration / 60)} minutes.`,
      })
    } else if (timerState === "break" && breakStartTime) {
      // Log the break with actual duration
      const duration = Math.round((new Date().getTime() - breakStartTime.getTime()) / 1000)
      addBreak({
        id: Date.now().toString(),
        title: "Break",
        startTime: breakStartTime,
        endTime: new Date(),
        duration,
        isBreak: true,
      })

      toast({
        title: "Break Ended",
        description: "Break ended early.",
      })
    }

    setTimeLeft(25 * 60)
    setTimerState("idle")
    setCurrentTaskName("")
    setCurrentTaskId(null)
    setScheduledTaskId(null)

    // Auto-focus the input field after ending a session
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  // Determine if input is a simple task name or a scheduled task
  const isScheduledTask = (input: string) => {
    const schedulingKeywords = [
      "at",
      "on",
      "tomorrow",
      "later",
      "tonight",
      "today",
      "morning",
      "afternoon",
      "evening",
      "night",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
      "next week",
      "next month",
      "pm",
      "am",
      "hour",
      "minute",
    ]

    const inputLower = input.toLowerCase()

    // Check if any scheduling keywords are present
    return schedulingKeywords.some(
      (keyword) =>
        inputLower.includes(` ${keyword} `) ||
        inputLower.endsWith(` ${keyword}`) ||
        inputLower.includes(` ${keyword},`),
    )
  }

  // Extract duration from input if specified
  const extractDuration = (input: string): number | null => {
    // Look for patterns like "for 30 minutes" or "for 1 hour"
    const minutesMatch = input.match(/for\s+(\d+)\s+min(ute)?s?/i)
    if (minutesMatch) {
      return Number.parseInt(minutesMatch[1]) * 60 // Convert to seconds
    }

    const hoursMatch = input.match(/for\s+(\d+)\s+hour(s)?/i)
    if (hoursMatch) {
      return Number.parseInt(hoursMatch[1]) * 60 * 60 // Convert to seconds
    }

    return null
  }

  // Handle form submission - either start a task now or schedule it
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Check if this is a simple task name or a scheduled task
    if (!isScheduledTask(input)) {
      // Check if duration is specified
      const duration = extractDuration(input) || 25 * 60 // Default to 25 minutes

      // Extract task name (remove duration part if present)
      let taskName = input.trim()
      if (extractDuration(input)) {
        taskName = taskName.replace(/for\s+\d+\s+(minute|min|hour)s?/i, "").trim()
      }

      // Simple task name - start timer immediately
      startSession(taskName, duration)
      setInput("")
      return
    }

    // This is a scheduled task - use Claude to parse it
    setIsProcessing(true)

    try {
      const result = await parseTaskWithClaude(input)

      const newTask = {
        id: Date.now().toString(),
        title: result.title,
        startTime: new Date(result.scheduledTime),
        endTime: new Date(result.endTime),
        duration: result.duration,
        completed: false,
        context: result.context,
      }

      addScheduledTask(newTask)

      // Check if this was created with the fallback parser
      if (result.context?.includes("fallback parser")) {
        toast({
          title: "Task Scheduled (Basic Mode)",
          description: "Using simplified parsing due to API unavailability. Some details may be missing.",
          variant: "warning",
        })
      } else {
        toast({
          title: "Task Scheduled",
          description: `"${result.title}" scheduled for ${new Date(result.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        })
      }

      // Check if the task is scheduled to start now or in the next minute
      const now = new Date()
      const taskStartTime = new Date(result.scheduledTime)
      const diffInMinutes = (taskStartTime.getTime() - now.getTime()) / (1000 * 60)

      if (diffInMinutes <= 1) {
        // Start the timer for this task
        startSession(result.title, result.duration, newTask.id)
      }

      setInput("")

      // Re-focus the input field after submission
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    } catch (error) {
      toast({
        title: "Error Scheduling Task",
        description: error instanceof Error ? error.message : "Could not parse your input",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Timer Display - Always visible */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <div className="text-6xl font-bold mb-4 flex items-center">
              <Clock className="mr-2 h-8 w-8 text-primary" />
              <span className="tabular-nums">{formatTime(timeLeft)}</span>
            </div>

            {timerState !== "idle" ? (
              <>
                <div className="mb-4 text-center font-medium">{currentTaskName}</div>
                <div className="flex gap-4">
                  <Button variant={timerState === "paused" ? "default" : "outline"} onClick={pauseSession}>
                    <Pause className="mr-2 h-4 w-4" />
                    {timerState === "paused" ? "Resume" : "Pause"}
                  </Button>
                  <Button variant="destructive" onClick={endSession}>
                    <Square className="mr-2 h-4 w-4" />
                    End Session
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-2">
                <div className="flex justify-center gap-6">
                  <div>
                    <span className="text-muted-foreground text-sm">Sessions today: </span>
                    <span className="font-medium">
                      {
                        completedTasks.filter((task) => {
                          const taskDate = new Date(task.startTime)
                          const today = new Date()
                          return (
                            taskDate.getDate() === today.getDate() &&
                            taskDate.getMonth() === today.getMonth() &&
                            taskDate.getFullYear() === today.getFullYear()
                          )
                        }).length
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Breaks today: </span>
                    <span className="font-medium">
                      {
                        breaks.filter((breakItem) => {
                          const breakDate = new Date(breakItem.startTime)
                          const today = new Date()
                          return (
                            breakDate.getDate() === today.getDate() &&
                            breakDate.getMonth() === today.getMonth() &&
                            breakDate.getFullYear() === today.getFullYear()
                          )
                        }).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unified Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            {timerState === "idle" ? "Start task now or schedule for later" : "Schedule your next task"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              id="unified-task-input"
              ref={inputRef}
              placeholder={
                timerState === "idle"
                  ? "e.g., 'Write report' or 'Meeting with team tomorrow at 2pm'"
                  : "Schedule your next task..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
              disabled={isProcessing}
              autoFocus
            />
            <Button id="start-now-button" type="submit" disabled={isProcessing || !input.trim()}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : timerState === "idle" && !isScheduledTask(input) ? (
                <Play className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

