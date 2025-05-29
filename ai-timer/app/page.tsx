import UnifiedTaskInput from "@/components/unified-task-input"
import CalendarView from "@/components/calendar-view"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">Life in Focus</h1>

        <div className="space-y-6">
          <UnifiedTaskInput />
          <CalendarView />
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>For feedback and issues please email me @ {}</p>
        </footer>
      </div>
    </main>
  )
}

