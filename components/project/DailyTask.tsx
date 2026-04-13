"use client";

import { useEffect, useState } from "react";
import { Calendar, Pencil, Trash2 } from "lucide-react";

interface Task {
    id: string;
    title: string;
    description: string;
    date: string;
}

const DailyTask = ({ projectId }: { projectId: string }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [form, setForm] = useState({
        title: "",
        description: "",
        date: "",
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch all tasks for the project
    const fetchTasks = async () => {
        try {
            const res = await fetch(`/api/project-tasks?projectId=${projectId}`);
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            if (data.success) setTasks(data.tasks || []);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    // Cancel editing and reset form
    const cancelEdit = () => {
        setEditingId(null);
        setForm({ title: "", description: "", date: "" });
    };

    // Handle add or update task
    const handleSubmit = async () => {
        if (!form.title?.trim() || !form.date) return;

        setIsSubmitting(true);

        try {
            const body = JSON.stringify(form);

            if (editingId) {
                // Update existing task
                const res = await fetch(`/api/project-tasks/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body,
                });
                if (!res.ok) throw new Error("Failed to update task");
            } else {
                // Create new task
                const res = await fetch(`/api/project-tasks`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...form, projectId }),
                });
                if (!res.ok) throw new Error("Failed to create task");
            }

            // Reset form and refresh list
            setForm({ title: "", description: "", date: "" });
            setEditingId(null);
            await fetchTasks();
        } catch (error) {
            console.error("Error saving task:", error);
            // In a real app you would show a toast here
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete task with confirmation
    const deleteTask = async (id: string) => {
        if (!confirm("Delete this task permanently?")) return;

        try {
            const res = await fetch(`/api/project-tasks/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete task");
            await fetchTasks();
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    // Start editing a task (populate form)
    const startEdit = (task: Task) => {
        setEditingId(task.id);
        setForm({
            title: task.title,
            description: task.description || "",
            date: task.date.includes("T")
                ? task.date.split("T")[0]
                : task.date,
        });
    };

    // ── GROUP TASKS BY DATE (professional: YYYY-MM-DD keys + sorted) ──
    const grouped = tasks.reduce((acc: Record<string, Task[]>, task) => {
        const dateKey = new Date(task.date).toISOString().split("T")[0]; // Stable YYYY-MM-DD
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(task);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    const formatDateHeader = (dateKey: string) => {
        return new Date(dateKey).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-wrap gap-6 items-end text-black">
                    {/* Title */}
                    <div className="flex-1 min-w-[220px]">
                        <label className="block text-xs uppercase tracking-widest font-semibold text-gray-500 mb-1.5">
                            Task
                        </label>
                        <input
                            type="text"
                            placeholder="What needs to be done today?"
                            value={form.title}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            }
                            className="w-full px-5 py-4 border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-3xl outline-none text-base transition-all"
                        />
                    </div>

                    {/* Date */}
                    <div className="min-w-[170px]">
                        <label className="block text-xs uppercase tracking-widest font-semibold text-gray-500 mb-1.5">
                            Date
                        </label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) =>
                                setForm({ ...form, date: e.target.value })
                            }
                            className="w-full px-5 py-4 border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-3xl outline-none transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-xs uppercase tracking-widest font-semibold text-gray-500 mb-1.5">
                            Description
                        </label>
                        <input
                            type="text"
                            placeholder="description..."
                            value={form.description}
                            onChange={(e) =>
                                setForm({ ...form, description: e.target.value })
                            }
                            className="w-full px-5 py-4 border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-3xl outline-none text-base transition-all"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {editingId && (
                            <button
                                onClick={cancelEdit}
                                className="px-8 py-4 text-gray-700 hover:bg-gray-100 border border-gray-300 font-medium rounded-3xl transition-colors"
                            >
                                Cancel
                            </button>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !form.title?.trim() || !form.date}
                            className="px-8 py-4 bg-[var(--primary)] text-white font-semibold rounded-3xl transition-all flex items-center gap-2 shadow-inner"
                        //    style={{ background: "var(--primary)" }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-pulse">Saving...</span>
                                </>
                            ) : editingId ? (
                                "Update Task"
                            ) : (
                                "Add Task"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            {sortedDates.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-3xl py-16 text-center">
                    <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-2xl mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-xl font-medium text-gray-400">
                        No daily tasks yet
                    </p>
                    <p className="text-gray-500 mt-2">
                        Add your first task using the form above
                    </p>
                </div>
            ) : (
                <div className="space-y-10">
                    {sortedDates.map((dateKey) => (
                        <div key={dateKey}>
                            {/* Date Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-blue-600">
                                    <span className="text-2xl">📅</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700">
                                    {formatDateHeader(dateKey)}
                                </h3>
                                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                                <span className="text-xs font-medium text-gray-400 bg-white px-3 py-1 border border-gray-200 rounded-3xl">
                                    {grouped[dateKey].length} task
                                    {grouped[dateKey].length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            {/* Task Cards - Todo-list style */}
                            <div className="space-y-4">
                                {grouped[dateKey].map((task) => (
                                    <div
                                        key={task.id}
                                        className="group bg-white border border-gray-200 hover:border-gray-300 rounded-3xl p-6 flex gap-6 items-start transition-all duration-200 hover:shadow-md"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xl font-semibold text-gray-900 leading-tight break-words">
                                                {task.title}
                                            </p>
                                            {task.description && (
                                                <p className="mt-3 text-gray-600 text-[15px] leading-relaxed">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(task)}
                                                className="p-3 hover:bg-blue-50 text-blue-600 rounded-2xl transition-colors"
                                                title="Edit task"
                                            >
                                                <Pencil size={20} />
                                            </button>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-3 hover:bg-red-50 text-red-600 rounded-2xl transition-colors"
                                                title="Delete task"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DailyTask;