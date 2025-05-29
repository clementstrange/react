"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Task {
  id: string
  title: string
  startTime: Date
  endTime: Date
  duration: number // in seconds
  completed: boolean
  context?: string // Additional context from Claude
}

export interface Break {
  id: string
  title: string
  startTime: Date
  endTime: Date
  duration: number // in seconds
  isBreak: boolean
}

interface TaskStore {
  scheduledTasks: Task[]
  completedTasks: Task[]
  breaks: Break[]
  addScheduledTask: (task: Task) => void
  addCompletedTask: (task: Task) => void
  addBreak: (breakItem: Break) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTasksInRange: (startDate: Date, endDate: Date) => Task[]
  getBreaksInRange: (startDate: Date, endDate: Date) => Break[]
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      scheduledTasks: [],
      completedTasks: [],
      breaks: [],

      addScheduledTask: (task) =>
        set((state) => ({
          scheduledTasks: [...state.scheduledTasks, task],
        })),

      addCompletedTask: (task) =>
        set((state) => ({
          completedTasks: [...state.completedTasks, task],
        })),

      addBreak: (breakItem) =>
        set((state) => ({
          breaks: [...state.breaks, breakItem],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          scheduledTasks: state.scheduledTasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
          completedTasks: state.completedTasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
        })),

      deleteTask: (id) =>
        set((state) => ({
          scheduledTasks: state.scheduledTasks.filter((task) => task.id !== id),
          completedTasks: state.completedTasks.filter((task) => task.id !== id),
        })),

      getTasksInRange: (startDate: Date, endDate: Date) => {
        const start = startDate.getTime()
        const end = endDate.getTime()

        return [
          ...get().scheduledTasks.filter((task) => {
            const taskTime = new Date(task.startTime).getTime()
            return taskTime >= start && taskTime <= end
          }),
          ...get().completedTasks.filter((task) => {
            const taskTime = new Date(task.startTime).getTime()
            return taskTime >= start && taskTime <= end
          }),
        ]
      },

      getBreaksInRange: (startDate: Date, endDate: Date) => {
        const start = startDate.getTime()
        const end = endDate.getTime()

        return get().breaks.filter((breakItem) => {
          const breakTime = new Date(breakItem.startTime).getTime()
          return breakTime >= start && breakTime <= end
        })
      },
    }),
    {
      name: "life-in-focus-storage",
      // Add serialization for Date objects
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => {
        const parsed = JSON.parse(str)

        // Convert date strings back to Date objects
        const convertDates = (tasks) => {
          return tasks.map((task) => ({
            ...task,
            startTime: new Date(task.startTime),
            endTime: new Date(task.endTime),
          }))
        }

        return {
          ...parsed,
          scheduledTasks: convertDates(parsed.scheduledTasks || []),
          completedTasks: convertDates(parsed.completedTasks || []),
          breaks: convertDates(parsed.breaks || []),
        }
      },
    },
  ),
)

