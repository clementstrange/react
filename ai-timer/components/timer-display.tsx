"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Pause, Square, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useTaskStore } from "@/lib/store"
import { Input } from "@/components/ui/input"

type TimerState = "idle" | "session" | "break" | "paused"

export default function TimerDisplay() {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [sessionCount, setSessionCount] = useState(0)
  const { toast } = useToast()
  const { addCompletedTask, addBreak } = useTaskStore()

  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null)
  const [currentTaskName, setCurrentTaskName] = useState("Focus Session")

  // Add task name input state
  const [taskNameInput, setTaskNameInput] = useState("")

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
      addCompletedTask({
        id: Date.now().toString(),
        title: currentTaskName,
        startTime: sessionStartTime,
        endTime: new Date(),
        duration,
        completed: true,
      })
    }

    // Play notification
    try {
      const audio = new Audio("/notification.mp3")
      audio.play()
    } catch (error) {
      console.error("Could not play notification sound:", error)
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
  }, [sessionCount, sessionStartTime, currentTaskName, addCompletedTask, toast])

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
      audio.play()
    } catch (error) {
      console.error("Could not play notification sound:", error)
    }

    toast({
      title: "Break Complete!",
      description: "Ready for another session?",
    })

    setTimeLeft(25 * 60)
    setTimerState("idle")
  }, [breakStartTime, addBreak, toast])

  // Start a new session
  const startSession = () => {
    setTimeLeft(25 * 60)
    setTimerState("session")
    setSessionStartTime(new Date())
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
      }
    } else if (timerState === "paused") {
      setTimerState("session")
      setSessionStartTime(new Date())

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
      }
    }
  }

  // End current session
  const endSession = () => {
    if (timerState === "session" && sessionStartTime) {
      // Log the completed session with actual duration
      const duration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000)
      addCompletedTask({
        id: Date.now().toString(),
        title: currentTaskName,
        startTime: sessionStartTime,
        endTime: new Date(),
        duration,
        completed: true,
      })

      setSessionCount(sessionCount + 1)
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
    }

    setTimeLeft(25 * 60)
    setTimerState("idle")
  }

  // Update the render section to include task name input
  return (
    <Card className="shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
            {timerState === "idle"
              ? "Ready to focus"
              : timerState === "session"
                ? "Focus Session"
                : timerState === "break"
                  ? "Break Time"
                  : "Session Paused"}
          </div>

          <div className="text-6xl font-bold mb-8 flex items-center">
            <Clock className="mr-2 h-8 w-8 text-primary" />
            <span className="tabular-nums">{formatTime(timeLeft)}</span>
          </div>

          {timerState === "idle" ? (
            <div className="w-full space-y-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="task-name" className="text-sm font-medium">
                  What are you working on?
                </label>
                <Input
                  id="task-name"
                  placeholder="Enter task name to start focusing"
                  value={taskNameInput}
                  onChange={(e) => setTaskNameInput(e.target.value)}
                />
              </div>
              <Button
                size="lg"
                onClick={() => {
                  if (taskNameInput.trim()) {
                    setCurrentTaskName(taskNameInput.trim())
                    startSession()
                  } else {
                    toast({
                      title: "Task name required",
                      description: "Please enter what you're working on",
                      variant: "destructive",
                    })
                  }
                }}
                className="w-full"
                disabled={!taskNameInput.trim()}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Focus Session
              </Button>
            </div>
          ) : (
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
          )}
        </div>
      </CardContent>
    </Card>
  )
}

