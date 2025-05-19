react daily goals roadmap (5 days/week, 1 hour sessions)
week 1: react foundations

- [x] **day 1: set up development environment with vite**

    - install node.js if needed
    - create first react project with `npm create vite@latest my-react-app -- --template react-ts`
    - start the dev server with `npm run dev`
    - make one simple change to App.tsx and see it live

- [x] **day 2: create and render your first component**

    - create a new file for a custom component (e.g., Button.tsx)
    - implement a basic component that returns jsx
    - import and use it in App.tsx
    - pass a text prop to your component

- [ ] **day 3: implement useState hook**

    - add a counter component with a number and + button
    - use useState to track and update the count
    - implement a reset button that sets count to 0

- [ ] **day 4: add conditional rendering**

    - display different text based on counter value
    - implement a "toggle" button that shows/hides content
    - use the ternary operator and && for conditional rendering

- [ ] **day 5: handle user events**

    - create a form with a text input
    - track input value with useState
    - add a submit button that alerts the input value
    - prevent default form submission


week 2: lists, effects, and styling

- [ ] **day 6: work with lists and keys**

    - create an array of items (e.g., todo tasks)
    - render the list with map()
    - add a unique key to each item
    - style list items differently based on index

- [ ] **day 7: implement useEffect hook**

    - add useEffect that runs on first render
    - create effect that runs when a state value changes
    - implement a cleanup function in useEffect
    - log lifecycle to understand when effects run

- [ ] **day 8: add css styling approaches**

    - style components using regular css import
    - try inline styles with react
    - implement conditional class names
    - experiment with css modules

- [ ] **day 9: lift state up**

    - create parent and child components
    - pass state from parent to child
    - create callbacks for children to update parent state
    - implement shared state between sibling components

- [ ] **day 10: build a mini todo component**

    - combine previous concepts into a todo list
    - implement add todo functionality
    - add ability to mark todos as complete
    - style completed todos differently


week 3: forms, custom hooks and final project (part 1)

- [ ] **day 11: form handling**

    - create a form with multiple fields
    - implement controlled components for each input
    - validate user input
    - display validation errors

- [ ] **day 12: create custom hooks**

    - extract form logic to custom hook (useForm)
    - create a useLocalStorage hook
    - implement useToggle hook
    - refactor components to use your custom hooks

- [ ] **day 13: start todo app project**

    - scaffold your final todo app components
    - create data model for todo items
    - implement basic layout and component structure
    - set up initial state management

- [ ] **day 14: todo app basic features**

    - implement add todo functionality
    - create todo list rendering
    - add delete todo feature
    - implement toggle completion

- [ ] **day 15: todo app styling and ux**

    - add proper css styling
    - implement empty state for no todos
    - add validation for empty inputs
    - improve focus management for form


week 4: final project (part 2) and deployment

- [ ] **day 16: implement todo filters**

    - add "all/active/completed" filters
    - implement filter state management
    - style active filter differently
    - persist filter preference

- [ ] **day 17: add local storage persistence**

    - save todos to localStorage
    - load todos from localStorage on startup
    - handle serialization edge cases
    - implement persistence error handling

- [ ] **day 18: add edit functionality**

    - implement inline editing for todos
    - add cancel/save for edit mode
    - implement validation for edits
    - improve edit mode ux

- [ ] **day 19: add finishing touches**

    - implement clear completed button
    - add todo count display
    - implement keyboard shortcuts
    - add responsive design improvements

- [ ] **day 20: deploy your project**

    - prepare app for production
    - run build process
    - deploy to vercel or netlify
    - test deployed application thoroughly


bonus challenges if you finish early:

- add due dates to todos
- implement categories or tags
- add drag and drop reordering
- implement dark/light mode toggle
- add animations for list changes

this roadmap follows a progressive approach where each day builds on the previous one, and you're constantly building something tangible. by the end of 4 weeks, you'll have a fully functional todo app and solid react fundamentals before moving on to fastapi.
