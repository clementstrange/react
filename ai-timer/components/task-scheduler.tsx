"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useTaskStore } from "@/lib/store"
import { parseTaskWithClaude } from "@/app/actions"

export default function TaskScheduler() {
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { addScheduledTask, scheduledTasks } = useTaskStore()
  const [currentTask, setCurrentTask] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return
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
        // Set this as the current task for the timer
        setCurrentTask(result.title)

        // Trigger the timer to start (we'll implement this communication later)
        const timerInput = document.getElementById("task-name") as HTMLInputElement
        if (timerInput) {
          timerInput.value = result.title
          // Simulate a change event to update the timer's task name
          const event = new Event("input", { bubbles: true })
          timerInput.dispatchEvent(event)
        }

        toast({
          title: "Starting Task Now",
          description: `"${result.title}" is scheduled to start now. Timer is ready!`,
        })
      }

      setInput("")
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

  // Function to update the tasks list in the UI
  const updateTasksList = () => {
    const tasksListElement = document.getElementById("scheduled-tasks-list")
    if (!tasksListElement) return

    if (scheduledTasks.length === 0) {
      tasksListElement.innerHTML = `<p class="text-muted-foreground text-center py-4">No tasks scheduled yet. Try adding one above!</p>`
      return
    }

    // Sort tasks by start time
    const sortedTasks = [...scheduledTasks].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )

    tasksListElement.innerHTML = sortedTasks
      .map((task) => {
        const startTime = new Date(task.startTime)
        const endTime = new Date(task.endTime)
        const durationMinutes = Math.round(task.duration / 60)
        const now = new Date()
        const isStartingSoon = startTime <= new Date(now.getTime() + 5 * 60 * 1000) && startTime > now
        const isPast = startTime < now && !task.completed

        return `
        <div class="p-3 rounded-lg border ${isStartingSoon ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900" : isPast ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900" : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900"}">
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <div class="font-medium">${task.title}</div>
              <div class="text-sm text-muted-foreground">
                ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                - ${endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div class="text-xs text-muted-foreground mt-1">${durationMinutes} min</div>
              ${task.context && !task.context.includes("fallback parser") ? `<div class="text-xs italic mt-1">${task.context}</div>` : ""}
              ${
                isStartingSoon
                  ? `
                <div class="mt-2">
                  <button 
                    class="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md inline-flex items-center"
                    onclick="document.getElementById('task-name').value = '${task.title.replace(/'/g, "\\'")}'; document.getElementById('task-name').dispatchEvent(new Event('input', {bubbles:true}));"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Start Now
                  </button>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      `
      })
      .join("")
  }

  // Update the tasks list when the component mounts or tasks change
  useEffect(() => {
    updateTasksList()

    // Set up an interval to update the task list every minute
    // This ensures that "starting soon" status is updated
    const interval = setInterval(updateTasksList, 60000)

    return () => clearInterval(interval)
  }, [scheduledTasks])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Schedule with Natural Language</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="e.g., Lunch with Sarah downtown tomorrow at 1:30pm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing || !input.trim()}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Try conversational phrases like "Call mom tomorrow afternoon" or "30 minute yoga session after work"
        </p>
      </CardContent>
    </Card>
  )
}

