import React, { useState } from 'react';
import './App.css';

// ViewItems Component
const ViewItems = ({ todoId, itemData, markDone, deleteItem }) => {
  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  return (
    <div className="todo-item">
      <input 
        type="checkbox" 
        className="todo-checkbox"
        checked={itemData.completed} 
        onChange={() => markDone(todoId, !itemData.completed)} 
      />
      <h2 className={`todo-text ${itemData.completed ? 'completed' : ''} ${getPriorityClass(itemData.priority)}`}>
        {itemData.name} : {itemData.priority.toUpperCase()}
        {itemData.due && <span className='due-date'> Due: {itemData.due}</span>}
      </h2>
      <button className="delete-button" onClick={() => deleteItem(todoId)}>
        DELETE
      </button>
    </div>
  );
};

// NewItem Component
const NewItem = ({ addTodo }) => {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("low");
  const [due, setDue] = useState("");

  return (
    <div className="add-todo-section">
      <input 
        className="todo-input"
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Enter mission name"
      />
      <select className="priority-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="low">LOW PRIORITY</option>
        <option value="mid">MID PRIORITY</option>
        <option value="high">HIGH PRIORITY</option>
      </select>
      <input 
        className = "todo-input" 
        value = {due} 
        onChange={(e) => setDue(e.target.value)}
        placeholder="Enter due date"/>
      <button className="add-button" onClick={() => {
        if (name.trim()) {
          addTodo(name, priority,due);
          setName("");
          setPriority("low");
          setDue("")
        }
      }}>
        ADD MISSION
      </button>
    </div>
  );
};

// App Component
const App = () => {
  const [todos, setTodos] = useState({});

  const addTodo = (name, priority, due) => {  // Add due parameter
    const id = `${Math.floor(Math.random() * 1000)}_${Date.now()}`;
    const dateAdded = new Date().toISOString().split('T')[0];
    const completed = false;
    
    const newTodo = {
      name,
      dateAdded,
      priority,
      due,        // Now 'due' is defined
      completed
    };
    
    setTodos({
      ...todos,
      [id]: newTodo
    });
  };

  const markDone = (todoId, newCompletedStatus) => {
    // Fill in your markDone logic here
    const currentTodo = todos[todoId];
    const updatedTodo = {
      ...currentTodo,
      completed: newCompletedStatus
    };
    setTodos({
      ...todos,
      [todoId]: updatedTodo
    });
  };

  const deleteItem = (todoId) => {
    // Fill in your deleteItem logic here
    const filteredEntries = Object.entries(todos).filter((item) => item[0] !== todoId);
    const newTodos = Object.fromEntries(filteredEntries);
    setTodos(newTodos);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">MISSION CONTROL</h1>
      <NewItem addTodo={addTodo} />
      
      <div className="todo-list-section">
        <h2 className="section-title">ACTIVE MISSIONS</h2>
        {Object.entries(todos).length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            No missions assigned. Ready for deployment.
          </p>
        ) : (
          Object.entries(todos).map(([todoId, itemData]) => (
            <ViewItems 
              key={todoId}
              todoId={todoId}
              itemData={itemData}
              markDone={markDone}
              deleteItem={deleteItem}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default App;