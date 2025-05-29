"use server"

import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"

export async function parseTaskWithClaude(input: string) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.ANTHROPIC_API_KEY

    // Check if API key exists
    if (!apiKey) {
      throw new Error(
        "Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables.",
      )
    }

    // Create Anthropic provider with explicit API key
    const anthropicProvider = createAnthropic({
      apiKey,
    })

    const prompt = `
      I need you to parse the following task description into structured data:
      "${input}"
      
      Extract the following information:
      - task_name: The name or description of the task. Make sure to properly capitalize the task name and any names of people or places that appear in it.
      - date: The date when the task is scheduled (if specified), in ISO format (YYYY-MM-DD)
      - time: The time when the task is scheduled (if specified), in 24-hour format (HH:MM)
      - duration_minutes: The duration of the task in minutes (if specified, default to 25 if not mentioned)
      - context: Any additional context like location or people involved
      
      If the date or time is relative (like "tomorrow" or "next week"), please convert it to an actual date based on today being ${new Date().toISOString().split("T")[0]}.
      
      Return ONLY a JSON object with these fields and nothing else. Do not include any explanations or markdown formatting.
    `

    const { text } = await generateText({
      model: anthropicProvider("claude-3-5-sonnet-20240620"),
      prompt,
      temperature: 0.2,
    })

    // Parse the JSON response
    const parsedData = JSON.parse(text)

    // Create date objects from the parsed data
    const taskDate = parsedData.date ? new Date(parsedData.date) : new Date()

    if (parsedData.time) {
      const [hours, minutes] = parsedData.time.split(":").map(Number)
      taskDate.setHours(hours, minutes, 0, 0)
    }

    const duration = parsedData.duration_minutes * 60 // Convert to seconds

    const endTime = new Date(taskDate)
    endTime.setSeconds(endTime.getSeconds() + duration)

    return {
      title: parsedData.task_name,
      scheduledTime: taskDate,
      duration,
      context: parsedData.context || "",
      endTime,
    }
  } catch (error) {
    console.error("Error parsing with Claude:", error)

    // If API key is missing, provide a clear error message
    if (error instanceof Error && error.message.includes("API key")) {
      throw new Error("Anthropic API key is missing or invalid. Please check your environment configuration.")
    }

    // Fall back to a simple parsing method if Claude is unavailable
    return fallbackParsing(input)
  }
}

// Simple fallback parsing function when Claude is unavailable
function fallbackParsing(input: string) {
  console.log("Using fallback parsing method")

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Extract task name (everything before time/date indicators)
  let taskName = input.trim()

  // Apply basic capitalization in the fallback parser
  taskName = capitalizeTaskName(taskName)

  let scheduledTime = now
  let duration = 25 * 60 // Default 25 minutes

  // Very basic time detection
  if (input.toLowerCase().includes("tomorrow")) {
    scheduledTime = tomorrow
    scheduledTime.setHours(9, 0, 0, 0) // Default to 9 AM tomorrow
  }

  // Very basic duration detection
  const minutesMatch = input.match(/(\d+)\s*min/i)
  if (minutesMatch) {
    duration = Number.parseInt(minutesMatch[1]) * 60
  }

  const hoursMatch = input.match(/(\d+)\s*hour/i)
  if (hoursMatch) {
    duration = Number.parseInt(hoursMatch[1]) * 60 * 60
  }

  const endTime = new Date(scheduledTime)
  endTime.setSeconds(endTime.getSeconds() + duration)

  return {
    title: taskName,
    scheduledTime,
    duration,
    context: "Created with fallback parser due to API unavailability",
    endTime,
  }
}

// Helper function to capitalize task names and proper nouns
function capitalizeTaskName(text: string): string {
  // Common words that shouldn't be capitalized (unless they're the first word)
  const commonWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "but",
    "or",
    "for",
    "nor",
    "on",
    "at",
    "to",
    "from",
    "by",
    "with",
    "in",
    "of",
    "as",
  ])

  // Common names that should always be capitalized
  const properNouns = new Set([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ])

  return text
    .split(" ")
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }

      // Check if it's a proper noun
      if (properNouns.has(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }

      // Check if it's a common word that shouldn't be capitalized
      if (commonWords.has(word.toLowerCase())) {
        return word.toLowerCase()
      }

      // Capitalize other words that might be names or important terms
      if (word.length > 1 && !word.match(/^\d+$/)) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }

      return word
    })
    .join(" ")
}

