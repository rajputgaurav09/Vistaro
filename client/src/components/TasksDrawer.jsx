import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CheckSquare, Clock, Plus, CheckCircle, AlertCircle, X } from 'lucide-react';

export const TasksDrawer = ({ isOpen, onClose, onNavigate }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchTasks();
  }, [isOpen]);

  const toggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.createTask({
        title: newTitle,
        due_date: newDueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high'
      });
      setTasks([res.task, ...tasks]);
      setNewTitle('');
      setNewDueDate('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#1F1F1F] shadow-2xl flex flex-col border-l border-[#333333]">
      <div className="p-4 border-b border-[#2E2E2E] flex items-center justify-between bg-[#242424] text-white">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#D8FF45]" />
          <h3 className="font-semibold text-xs tracking-wider uppercase font-mono">Tasks & Deadlines</h3>
        </div>
        <button onClick={onClose} className="p-1 text-[#71717A] hover:text-white cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Task Input */}
      <form onSubmit={handleCreateTask} className="p-3 bg-[#1D1D1D] border-b border-[#2E2E2E] flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new deadline or checklist task..."
          className="flex-1 text-xs border border-[#383838] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#D8FF45] bg-[#141414] text-white placeholder-[#71717A]"
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="px-3 py-1.5 bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
        >
          Add
        </button>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {loading ? (
          <div className="text-center py-8 text-xs text-[#71717A] font-mono">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#71717A] font-mono">No active tasks. You are all caught up!</div>
        ) : (
          tasks.map(task => {
            const isDone = task.status === 'completed';
            const due = new Date(task.due_date);
            const isOverdue = due < new Date() && !isDone;

            return (
              <div
                key={task.id}
                className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                  isDone
                    ? 'bg-[#181818] border-[#2A2A2A] opacity-50'
                    : isOverdue
                    ? 'bg-[#2D1B1B] border-[#642B2B]'
                    : 'bg-[#242424] border-[#333333]'
                }`}
              >
                <button
                  onClick={() => toggleTaskStatus(task)}
                  className="mt-0.5 text-[#71717A] hover:text-[#D8FF45] transition-colors cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-[#4ADE80]" />
                  ) : (
                    <div className="w-4 h-4 rounded border border-[#4B4B4B] hover:border-[#D8FF45]" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium leading-snug ${isDone ? 'line-through text-[#71717A]' : 'text-white'}`}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#71717A] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {due.toLocaleDateString()}
                    </span>
                    {task.priority === 'urgent' && (
                      <span className="text-[10px] text-[#F87171] bg-[#2D1B1B] border border-[#642B2B] px-1.5 py-0.2 rounded font-mono">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
