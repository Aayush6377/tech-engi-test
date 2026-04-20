"use client";

import { useEffect, useState } from "react";
import { Calendar, Pencil, Trash2, Lock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Task {
    id: string;
    title: string;
    description: string;
    date: string;
    createdAt: string;
    createdBy: {
        id: string;
        name: string;
        image?: string;
    };
}

interface CurrentUser {
    id: string;
    name: string;
    role: "ADMIN" | "ENGINEER" | "CLIENT";
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
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    // Fetch current user
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.success) setCurrentUser(data.user);
            } catch (error) {
                console.error("Error fetching current user:", error);
            }
        };
        fetchCurrentUser();
    }, []);

    // Fetch all tasks for the project
    const fetchTasks = async () => {
        try {
            const res = await fetch(`/api/daily-task?projectId=${projectId}`);
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            if (data.success) setTasks(data.tasks || []);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            toast.error("Failed to load tasks");
        }
    };

    useEffect(() => {
        fetchTasks();
        // Refresh tasks every minute to update edit status
        const interval = setInterval(fetchTasks, 60000);
        return () => clearInterval(interval);
    }, [projectId]);

    // Check if task is editable (within 24 hours)
    const isTaskEditable = (createdAt: string): boolean => {
        const created = new Date(createdAt);
        const now = new Date();
        const hoursDifference = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        return hoursDifference <= 24;
    };

    // Get hours remaining for edit
    const getHoursRemaining = (createdAt: string): number => {
        const created = new Date(createdAt);
        const now = new Date();
        const hoursDifference = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        return Math.max(0, Math.round((24 - hoursDifference) * 10) / 10);
    };

    // Cancel editing and reset form
    const cancelEdit = () => {
        setEditingId(null);
        setForm({ title: "", description: "", date: "" });
    };

    // Handle add or update task
    const handleSubmit = async () => {
        if (!form.title?.trim() || !form.date) {
            toast.error("Please fill in title and date");
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingId) {
                // Update existing task
                const res = await fetch(`/api/daily-task/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });

                const data = await res.json();

                if (!res.ok) {
                    if (res.status === 403) {
                        toast.error(data.message || "Cannot edit: 24-hour limit exceeded");
                    } else {
                        throw new Error(data.message || "Failed to update task");
                    }
                    return;
                }

                toast.success("Task updated!");
            } else {
                // Create new task
                const res = await fetch(`/api/daily-task`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...form, projectId }),
                });

                if (!res.ok) throw new Error("Failed to create task");

                toast.success("Task created!");
            }

            // Reset form and refresh list
            setForm({ title: "", description: "", date: "" });
            setEditingId(null);
            await fetchTasks();
        } catch (error) {
            console.error("Error saving task:", error);
            toast.error(error instanceof Error ? error.message : "Error saving task");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete task with confirmation
    const deleteTask = async (id: string) => {
        if (!confirm("Delete this task permanently?")) return;

        try {
            const res = await fetch(`/api/daily-task/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete task");
            await fetchTasks();
            toast.success("Task deleted!");
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Failed to delete task");
        }
    };

    // Start editing a task (populate form)
    const startEdit = (task: Task) => {
        if (!isTaskEditable(task.createdAt)) {
            toast.error("Cannot edit: 24-hour limit exceeded");
            return;
        }

        setEditingId(task.id);
        setForm({
            title: task.title,
            description: task.description || "",
            date: task.date.includes("T")
                ? task.date.split("T")[0]
                : task.date,
        });
    };

    // ── GROUP TASKS BY DATE ──
    const grouped = tasks.reduce((acc: Record<string, Task[]>, task) => {
        const dateKey = new Date(task.date).toISOString().split("T")[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(task);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a)); // Most recent first

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
            {/* Form */}
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
                            className="px-8 py-4 bg-[var(--primary)] text-white font-semibold rounded-3xl transition-all flex items-center gap-2 shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
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
                                    <span className="text-2xl">
                                        <Calendar className="w-8 h-8 text-gray-400" />
                                    </span>
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

                            {/* Task Cards */}
                            <div className="space-y-4">
                                {grouped[dateKey].map((task) => {
                                    const canEdit = isTaskEditable(task.createdAt) || isAdmin;
                                    const hoursRemaining = getHoursRemaining(task.createdAt);
                                    const isOwnTask = currentUser?.id === task.createdBy?.id;
                                    const isAdmin = currentUser?.role === "ADMIN";

                                    return (
                                        <div
                                            key={task.id}
                                            className={`group bg-white border rounded-3xl p-6 flex gap-6 items-start transition-all duration-200 ${canEdit
                                                ? "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                                : "border-gray-200 bg-gray-50"
                                                }`}
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
                                                <div className="mt-2 text-xs text-gray-500">
                                                    By {task.createdBy?.name || "Unknown"}
                                                </div>

                                                {/* Edit Status Indicator */}
                                                {!canEdit && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 bg-gray-100 w-fit px-2 py-1 rounded">
                                                        <Lock size={12} />
                                                        <span>Edit limit expired</span>
                                                    </div>
                                                )}

                                                {canEdit && hoursRemaining < 2 && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded">
                                                        <AlertCircle size={12} />
                                                        <span>{hoursRemaining}h remaining</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col sm:flex-row items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                {(isOwnTask && canEdit) || isAdmin ? (
                                                    <>
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
                                                    </>
                                                ) : isOwnTask && !canEdit && !isAdmin ? (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-2xl">
                                                        <Lock size={16} className="text-gray-500" />
                                                        <span className="text-xs text-gray-600 font-medium">Locked</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DailyTask;