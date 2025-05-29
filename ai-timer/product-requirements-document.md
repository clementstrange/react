# Life in Focus - AI Timer App
## Product Requirements Document (Comprehensive)

### Overview
Life in Focus is an AI-powered productivity application that helps users manage their time effectively through a combination of focus sessions, breaks, and intelligent task scheduling. The app uses natural language processing to understand user intent and provides a seamless experience for tracking and managing tasks.

## Core Features

### 1. Unified Task Input System
#### Description
A single input field that allows users to enter tasks to start immediately or schedule for later using natural language.

#### Detailed Requirements
- **Single Input Field**: Users can enter tasks to start immediately or schedule for later using the same input field
- **Natural Language Processing**: Powered by Claude AI to interpret scheduling information from conversational inputs
- **Custom Duration Support**: Users can specify custom durations (e.g., "Write report for 45 minutes")
- **Intelligent Detection**: Automatically determines if input is for immediate focus or future scheduling
- **Minimalist Interface**: Clean UI without redundant descriptions and status indicators
- **Input Placeholders**: Clear examples showing the expected input format
- **Auto-Focus**: Input field is automatically focused when the component loads and after sessions end

#### Implementation Details
- Uses Claude API via server-side actions to parse natural language
- Fallback parsing mechanism when API is unavailable
- Regular expression patterns to detect scheduling keywords and duration specifications
- Input field auto-focuses when component mounts and after task submission

#### Input Parsing
- **Immediate Tasks**: Simple task names trigger immediate timer start
- **Scheduled Tasks**: Input containing time-related keywords is sent to Claude API for parsing
- **Duration Detection**: Input containing "for X minutes/hours" extracts custom duration
- **Capitalization**: Task titles and proper nouns are automatically capitalized

#### User Experience
- Placeholder text provides examples of valid inputs
- Visual indication of whether input will start immediately or be scheduled
- Button icon changes based on input type (play for immediate, send for scheduled)
- Automatic focus on input field for quick task entry

### 2. Timer Functionality
#### Description
A customizable countdown timer for focus sessions and breaks with control options.

#### Detailed Requirements
- **Focus Timer**: Countdown timer for focus sessions (default: 25 minutes)
- **Break Timer**: Short breaks (5 minutes) after sessions, long breaks (15 minutes) after 4 sessions
- **Pause/Resume**: Ability to pause and resume sessions
- **End Early**: Option to end sessions before the timer completes
- **Audio Notifications**: Sound alerts when sessions or breaks end (with volume control)
- **Clean Timer Display**: Simplified timer interface showing only essential information
- **Task Name Display**: Current task name is displayed during active sessions
- **Session Stats**: Display of relevant session statistics when timer is idle
- **Daily Counters**: Shows number of completed sessions and breaks for the current day

#### Timer States
- **Idle**: Ready to start a new session
- **Session**: Active focus time
- **Break**: Rest period between sessions
- **Paused**: Temporarily stopped session

#### Session Tracking
- Records start and end times for all sessions
- Tracks actual duration of completed sessions
- Maintains count of completed sessions for break scheduling
- Shows current task name during active sessions
- Displays daily statistics (sessions completed, breaks taken)

#### Implementation Details
- Uses React's useEffect for timer functionality
- Stores session data in Zustand store
- Handles audio playback with error recovery
- Manages timer state transitions automatically

### 3. Calendar View
#### Description
A visual representation of scheduled tasks, active sessions, completed tasks, and breaks.

#### Detailed Requirements
- **Today View**: Shows all tasks and breaks scheduled for the current day
- **Next 7 Days View**: Displays upcoming tasks for the week ahead
- **Visual Differentiation**:
  - Active sessions: Yellow background with "In Progress" label
  - Scheduled tasks: Blue background
  - Completed tasks: Green background
  - Breaks: Gray background (over 1 minute duration only)
- **Start Now Button**: Option to start scheduled tasks immediately while keeping them in the calendar
- **Time Tracking**: Tracks and displays time spent on scheduled tasks across multiple sessions
- **Proper Time Sorting**: Events are correctly sorted by start time
- **Date Grouping**: Week view groups tasks by date with clear date headers

#### Calendar Item Display
- **Title**: Primary task name
- **Time**: Start and end time displayed in readable format
- **Duration**: Session length in minutes
- **Status Indicator**: Icon showing the current state (scheduled, active, completed, break)
- **Action Buttons**: Contextual actions like "Start Now" for scheduled tasks

#### Implementation Details
- Custom event system for communication between calendar and timer components
- Date handling with proper conversion between string and Date objects
- Filtering logic to show only relevant items based on selected view
- Responsive design for various screen sizes

### 4. Task Management System
#### Description
Backend functionality for tracking, updating, and organizing tasks and sessions.

#### Detailed Requirements
- **Automatic Tracking**: Records completed sessions and breaks
- **Session Stats**: Tracks duration, start and end times
- **Cumulative Time Tracking**: Tracks total time spent on scheduled tasks across multiple sessions
- **Data Persistence**: Local storage for task history with proper date serialization
- **Break Filtering**: Short breaks (under 1 minute) are filtered from the calendar view
- **Task Editing**: Ability to update task status and context
- **Session Continuation**: Option to resume paused sessions
- **Multi-Session Tracking**: Support for working on the same task in multiple sessions

#### Task Data Structure
- **ID**: Unique identifier
- **Title**: Task name (properly capitalized)
- **Start Time**: Scheduled/actual start time
- **End Time**: Expected/actual end time
- **Duration**: Length in seconds
- **Status**: Scheduled, completed, or in progress
- **Context**: Additional information or tracking details

#### Task Operations
- **Add**: Schedule new tasks via natural language
- **Start**: Begin working on a task immediately
- **Complete**: Mark tasks as finished
- **Track**: Record time spent on tasks
- **Delete**: Remove tasks from the system (automatic for completed tasks)

#### Break Tracking
- Records all breaks between sessions
- Tracks pause breaks separately from scheduled breaks
- Filters out very short breaks from the calendar view

#### Implementation Details
- Zustand store for state management
- Local storage persistence with proper date serialization
- Server actions for AI processing
- Custom event system for component communication

### 5. AI Integration
#### Description
Integration with Claude AI for natural language understanding and task parsing.

#### Detailed Requirements
- **Claude Integration**: Uses Anthropic's Claude for natural language understanding
- **Fallback Mechanism**: Simple parsing when API is unavailable
- **Server-Side Processing**: Secure API key handling on the server
- **Error Handling**: Graceful degradation when API unavailable
- **Date/Time Parsing**: Accurate interpretation of relative and absolute dates/times
- **Duration Extraction**: Ability to understand various duration formats
- **Context Extraction**: Identifying additional context like location or people involved

#### AI Prompt Structure
- Clearly defined prompt that extracts task name, date, time, duration, and context
- Instructions for converting relative dates based on current date
- Formatting requirements for structured return data

#### Implementation Details
- Server-side API calls using Next.js Server Actions
- Environment variable management for API keys
- Error handling with informative user feedback
- Prompt engineering for optimal parsing results

#### Fallback Mechanism
- Simple regex-based parsing when API is unavailable
- Basic date/time detection for common patterns
- Default duration assignment when not specified
- Clear user notification when operating in fallback mode

## User Interface

### Layout and Navigation
- **Single Page Application**: All functionality available without page navigation
- **Responsive Design**: Mobile and desktop friendly layout
- **Component Organization**: 
  - Timer section at the top
  - Task input below timer
  - Calendar view at the bottom
- **Footer**: Contact information for feedback and support

### Visual Design
- **Color Coding**:
  - Active sessions: Yellow
  - Scheduled tasks: Blue
  - Completed tasks: Green
  - Breaks: Gray
- **Typography**:
  - Large timer display
  - Clear task titles
  - Subtle timestamps and secondary information
- **Icons**:
  - Clock for timer
  - Play/pause controls
  - Calendar indicators
- **Whitespace**: Generous spacing for readability

### Interactions
- **Input Behaviors**:
  - Auto-focus for the input field
  - Clear input after submission
  - Placeholder text for guidance
- **Button States**:
  - Disabled state for empty inputs
  - Loading state during API calls
  - Contextual button labels (Resume/Pause)
- **Notifications**:
  - Toast notifications for session events
  - Audio alerts with user-friendly volume

## Technical Implementation

### Frontend Architecture
- **Framework**: Next.js with App Router
- **UI Components**: shadcn/ui component library
- **State Management**: Zustand for persistent state
- **Styling**: Tailwind CSS
- **Event System**: Custom events for component communication
- **Audio Handling**: HTML5 Audio API with error handling

#### Component Structure
- **UnifiedTaskInput**: Main component for task input and timer display
- **CalendarView**: Component for displaying scheduled and completed tasks
- **DailyStats**: Component for showing productivity statistics
- **UI Components**: Buttons, cards, inputs, etc. from shadcn/ui

### Backend
- **Server Actions**: Next.js Server Actions for API calls
- **AI Integration**: AI SDK with Claude integration
- **Data Persistence**: Local storage for task history
- **API Key Management**: Server-side environment variables

#### Data Flow
- Client input → Server action → Claude API → Parsed result → Client state

### Data Structure
- **Task Store**: Zustand store with persisted state
- **Session Data**: Tracking of current and completed sessions
- **Break Data**: Tracking of break periods
- **Custom Serialization**: Proper handling of Date objects in storage
- **State Hydration**: Proper loading of persisted state

### Accessibility
- **Keyboard Navigation**: All actions accessible via keyboard
- **Screen Reader Support**: Proper labels and ARIA attributes
- **Focus Management**: Clear focus indicators and logical tabbing
- **Color Contrast**: WCAG compliant color combinations

## User Flows

### Starting an Immediate Task
1. User enters task name in the input field
2. System detects it's an immediate task (no scheduling keywords)
3. User clicks the Play button or presses Enter
4. Timer starts with the specified task name
5. Task appears in the calendar with "In Progress" status
6. When timer completes, task moves to completed status

### Scheduling a Future Task
1. User enters task with scheduling information (e.g., "Meeting tomorrow at 2pm")
2. System detects scheduling keywords
3. User submits the input
4. System processes with Claude API to extract details
5. Task is added to the calendar at the specified time
6. User receives confirmation toast

### Starting a Scheduled Task
1. User views a scheduled task in the calendar
2. User clicks "Start Now" button on the task
3. Timer begins with the task name and duration
4. Task remains in the calendar but shows "In Progress"
5. When completed, task shows time spent information

### Pausing and Resuming
1. During an active session, user clicks Pause
2. Timer stops and session is marked as paused
3. System begins tracking break time
4. User clicks Resume to continue
5. Break is recorded and session continues

### Completing a Session
1. Timer counts down to zero
2. System plays notification sound
3. Session is marked as completed
4. Break timer begins automatically
5. Statistics are updated to reflect the completed session

## Recent Changes and Improvements

1. **Improved Start Now Functionality**:
 - Fixed the "Start Now" button on scheduled tasks
 - Tasks remain in the calendar when started
 - Tracks cumulative time spent on scheduled tasks

2. **Streamlined UI**:
 - Removed redundant timer state text
 - Removed unnecessary descriptions
 - Updated card title to "Start task now or schedule for later"
 - Cleaner, more focused interface

3. **Enhanced Task Tracking**:
 - Tasks show "In Progress" when active
 - Completed tasks show time spent
 - Scheduled tasks track total time worked across sessions

4. **Added Status Counters**:
 - Display of completed sessions today
 - Display of breaks taken today
 - Dynamic updating as new sessions complete

5. **Improved Date Handling**:
 - Fixed date serialization issues
 - Ensured proper date comparisons for sorting
 - Improved time display formatting

6. **Notification Improvements**:
 - Fixed audio playback issues
 - Added volume control
 - Better error handling for audio playback

7. **Footer Update**:
 - Added contact information for feedback and issues

8. **Bug Fixes**:
 - Fixed issue with start button occasionally being disabled
 - Fixed issue with adding future tasks while another is active
 - Fixed time sorting for future events
 - Fixed display of short breaks as large cards

## Future Enhancements (Backlog)

1. **Analytics Dashboard**:
 - Detailed productivity insights and patterns
 - Weekly and monthly reports
 - Trend visualization
 - Goal setting and tracking

2. **Task Categories**:
 - Ability to categorize tasks
 - Track time by category
 - Color coding by category
 - Filtering and sorting options

3. **Integration with Calendar Services**:
 - Support for Google Calendar, Outlook, etc.
 - Two-way synchronization
 - Conflict detection
 - Calendar event import/export

4. **Mobile App**:
 - Native mobile experience
 - Push notifications
 - Offline support
 - Touch-optimized interface

5. **Team Collaboration**:
 - Shared focus sessions
 - Task assignments
 - Team dashboards
 - Progress sharing

## Data Models

### Task
\`\`\`typescript
interface Task {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  completed: boolean;
  context?: string; // Additional context from Claude
}
\`\`\`

### Break
\`\`\`typescript
interface Break {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  isBreak: boolean;
}
\`\`\`

### TaskStore
\`\`\`typescript
interface TaskStore {
  scheduledTasks: Task[];
  completedTasks: Task[];
  breaks: Break[];
  addScheduledTask: (task: Task) => void;
  addCompletedTask: (task: Task) => void;
  addBreak: (breakItem: Break) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTasksInRange: (startDate: Date, endDate: Date) => Task[];
  getBreaksInRange: (startDate: Date, endDate: Date) => Break[];
}
\`\`\`

