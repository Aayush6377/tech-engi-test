"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Paperclip,
  User,
  Calendar,
  X,
  Plus,
  Search,
  LucideLoader,
  LucideXCircle,
  BellElectric,
} from "lucide-react";
// import { SidePanel } from '@/app/(admin)/(main)/kanban/page';
import toast from "react-hot-toast";
import TextArea from "../form/input/TextArea";
// import Loader from '../common/Loading';
// import RichTextEditor from '../common/editor/Editor';
// import { htmlToText } from '../common/editor/htmlToText';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: Date;
}

interface Task {
  id: string;
  title: string;
  description: string;
  Project: { name: string; id: string };
  assignee: string;
  assigneeAvatar: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  projectId?: string | null;
  dueDate: string;
  tags: string[];
  comments: Comment[];
  attachments: Array<{ id: string; name: string; size: string; type: string }>;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
}

const priorityClasses = {
  LOW: "bg-blue-50 text-blue-700 border-blue-200",
  MEDIUM: "bg-[var(--primary-light)] text-[#b87a2e] border-[#ffd9a8]",
  HIGH: "bg-red-50 text-red-700 border-red-200",
} as const;

type NewTaskShape = {
  title: string;
  description: string;
  assignee: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string;
  tags: string[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  attachments: File[] | null;
  projectId: string;
};

interface KanbanTabProps {
  projectId: string;
}

const NewTaskModal: React.FC<{
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  newTask: NewTaskShape;
  setNewTask: React.Dispatch<React.SetStateAction<NewTaskShape>>;
  handleCreateTask: () => void;
  handleAddTag: (tag: string) => void;
  handleRemoveTag: (tag: string) => void;
  currentUser: { name: string; id: string } | null;
  mode: string;
}> = ({
  isOpen,
  onClose,
  newTask,
  isLoading,
  setNewTask,
  handleCreateTask,
  handleAddTag,
  handleRemoveTag,
  currentUser,
  mode,
}) => {
  if (!isOpen) return null;
  const removeAttachment = (index: number) => {
    setNewTask((prev: NewTaskShape) => {
      if (!prev.attachments) return prev;

      const updated = prev.attachments.filter((_, i) => i !== index);

      return {
        ...prev,
        attachments: updated.length ? updated : null,
      };
    });
  };
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto bg-white">
        <div className="sticky top-0 z-10 border-b px-6 py-4 border-[var(--border)] bg-white">
          <div className="flex items-center justify-between">
            <h2
              className="text-xl font-bold font-id"
              style={{ color: "var(--text-primary)" }}
            >
              Create New Task
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg)] transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label
              className="block text-sm font-semibold font-inter mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Task Title *
            </label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              placeholder="Enter task title..."
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold font-inter mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Describe Your Task
            </label>
            <TextArea
              value={newTask.description}
              className="bg-white! text-black! border-1! outline-none! ring-0! border-border!"
              onChange={(e) => setNewTask({ ...newTask, description: e })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-semibold font-inter mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Assignee
              </label>
              <div className="flex items-center gap-2 pl-1">
                <User
                  className="w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <p
                  className="font-inter text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {currentUser?.name || newTask.assignee || "Loading..."}
                </p>
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-semibold font-inter mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Due Date
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border)] bg-white font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-semibold font-inter mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Priority
              </label>
              <div className="flex gap-2">
                {(["LOW", "MEDIUM", "HIGH"] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setNewTask({ ...newTask, priority })}
                    className={`flex-1 px-4 py-3 rounded-lg border font-inter text-sm capitalize transition-all ${
                      newTask.priority === priority
                        ? priority === "LOW"
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : priority === "MEDIUM"
                          ? "bg-[var(--primary-light)] text-[#b87a2e] border-[#ffd9a8]"
                          : "bg-red-50 text-red-700 border-red-300"
                        : "bg-white border-[var(--border)] hover:bg-[var(--bg)]"
                    }`}
                    style={
                      newTask.priority !== priority
                        ? { color: "var(--text-muted)" }
                        : {}
                    }
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-semibold font-inter mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Status
              </label>
              <select
                value={newTask.status}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    status: e.target.value as Task["status"],
                  })
                }
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={{ color: "var(--text-primary)" }}
              >
                <option value="NOT_STARTED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-semibold font-inter mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {newTask.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg text-xs font-inter flex items-center gap-2 bg-[var(--primary-light)] border border-[#ffd9a8]"
                  style={{ color: "var(--primary)" }}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add tags (press Enter)..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer border-[var(--border)] bg-[var(--bg)]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files || []);
              if (!files.length) return;

              setNewTask((prev) => {
                const existing = prev.attachments ?? [];

                return {
                  ...prev,
                  attachments: [...existing, ...files],
                };
              });
            }}
            onClick={() => document.getElementById("task-file-input")?.click()}
          >
            <Paperclip
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "var(--text-muted)" }}
            />
            <p
              className="text-sm mb-1 font-inter"
              style={{ color: "var(--text-muted)" }}
            >
              Click to upload or drag and drop
            </p>
            <p
              className="text-xs font-inter"
              style={{ color: "var(--text-muted)" }}
            >
              PDF, DOC, Images up to 10MB each
            </p>

            <input
              id="task-file-input"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;

                setNewTask((prev) => {
                  const existing = prev.attachments ?? [];

                  return {
                    ...prev,
                    attachments: [...existing, ...files],
                  };
                });

                e.target.value = "";
              }}
            />
          </div>

          {(newTask.attachments?.length ?? 0) > 0 && (
            <div className="mt-3 space-y-2">
              {newTask.attachments?.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between text-sm px-4 pr-3 py-3.5 rounded-lg bg-white border border-[var(--border)] font-inter"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span className="truncate max-w-[80%]">{file.name}</span>

                  <button type="button" onClick={() => removeAttachment(index)}>
                    <LucideXCircle size={18} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg font-inter text-sm bg-[var(--bg)] border border-[var(--border)]"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
            <button
              onClick={isLoading ? () => {} : handleCreateTask}
              disabled={
                isLoading ||
                !newTask.title.trim() ||
                !newTask.description.trim() ||
                !newTask.dueDate
              }
              className="flex-1 px-6 py-3 text-white rounded-lg font-inter text-sm disabled:opacity-40 disabled:cursor-not-allowed grid place-items-center"
              style={{ background: "var(--primary)" }}
            >
              {isLoading ? (
                <LucideLoader className="animate-spin text-white" size={20} />
              ) : mode === "edit" ? (
                "Update Task"
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function KanbanTab({ projectId }: KanbanTabProps) {
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    employeeId: string;
    id: string;
    role: string;
  } | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [reportMessages, setReportMessages] = useState<{ message: string }[]>(
    []
  );
  const [taskMode, setTaskMode] = useState<"create" | "edit">("create");
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [transition, setTransition] = useState(false);

  const [newTask, setNewTask] = useState<NewTaskShape>({
    title: "",
    description: "",
    assignee: "",
    priority: "MEDIUM",
    dueDate: "",
    tags: [],
    status: "NOT_STARTED",
    attachments: null,
    projectId: "",
  });
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          setNewTask((prev) => ({
            ...prev,
            assignee: data.user.name,
          }));
        }
      })
      .catch(() => {});

    // const res = localStorage.getItem("user");
    // const data = res ? JSON.parse(res) : null;
    // if (data) {
    //   setCurrentUser(data);
    //   console.log(data);
    //   setNewTask((prev) => ({
    //     ...prev,
    //     assignee: data.name,
    //   }));
    // }
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/kanban?projectId=${projectId}`);
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { id: "ON_HOLD", title: "On Hold", icon: BellElectric, color: "orange" },
    { id: "NOT_STARTED", title: "Not Started", icon: User, color: "blue" },
    { id: "IN_PROGRESS", title: "In Progress", icon: Clock, color: "yellow" },
    { id: "COMPLETED", title: "Completed", icon: CheckCircle2, color: "green" },
  ];

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: Task["status"]) => {
    if (!draggedTask) return;

    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((task) =>
        task.id === draggedTask.id ? { ...task, status: newStatus } : task
      )
    );

    try {
      const res = await fetch(`/api/kanban/${draggedTask.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draggedTask.id,
          status: newStatus,
        }),
      });

      if (draggedTask.projectId && newStatus === "COMPLETED") {
        await fetch("/api/project/work-done", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: draggedTask.projectId,
            taskId: draggedTask.id,
            title: draggedTask.title,
            description: draggedTask.description,
            priority: draggedTask.priority,
            dueDate: draggedTask.dueDate,
            tags: draggedTask.tags,
            userId: currentUser?.id,
          }),
        });
      }

      if (
        draggedTask.projectId &&
        draggedTask.status === "COMPLETED" &&
        newStatus !== "COMPLETED"
      ) {
        await fetch(`/api/project/work-done?taskId=${draggedTask.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!res.ok) {
        throw new Error("Failed to update");
      }
    } catch (err) {
      console.error("API Update Failed:", err);
      setTasks(prevTasks);
    }

    setDraggedTask(null);
  };

  const handleEditTask = (task: Task) => {
    setTaskMode("edit");
    setTaskToEdit(task);

    setNewTask({
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      priority: task.priority,
      dueDate: task.dueDate.split("T")[0],
      tags: task.tags,
      status: task.status,
      attachments: null,
      projectId: task.Project.id,
    });

    setShowNewTaskModal(true);
  };

  const handleUpdateTask = async () => {
    if (!taskToEdit) return;

    try {
      setTransition(true);
      const formData = new FormData();
      formData.append("id", taskToEdit.id);
      formData.append("title", newTask.title.trim());
      formData.append("description", newTask.description.trim());
      formData.append("assignee", newTask.assignee);
      formData.append("priority", newTask.priority);
      formData.append("dueDate", newTask.dueDate);
      formData.append("status", newTask.status);
      formData.append("tags", newTask.tags.join(","));
      formData.append("projectId", newTask.projectId);

      if (newTask.attachments?.length) {
        newTask.attachments.forEach((file) => {
          formData.append("attachment", file);
        });
      }
      const res = await fetch("/api/kanban/task", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Update failed");
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === data.task.id ? data.task : t))
      );

      setSelectedTask(data.task);
      setShowNewTaskModal(false);
      setTaskMode("create");
      setTaskToEdit(null);
      toast.success("Task updated");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setTransition(false);
    }
  };

  const handleSubmitTask = async () => {
    if (taskMode === "edit") {
      await handleUpdateTask();
    } else {
      await handleCreateTask();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/kanban/task", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete task");
        return;
      }

      toast.success("Task deleted successfully");

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedTask(null);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Something went wrong");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedTask) return;

    const res = await fetch("/api/kanban/comment", {
      method: "POST",
      body: JSON.stringify({
        content: commentText,
        taskId: selectedTask.id,
      }),
    });

    const data = await res.json();
    if (!data.success) return;

    const newComment = data.comment;
    setTasks(
      tasks.map((task) =>
        task.id === selectedTask.id
          ? { ...task, comments: [...task.comments, newComment] }
          : task
      )
    );

    setSelectedTask({
      ...selectedTask,
      comments: [...selectedTask.comments, newComment],
    });

    setCommentText("");
  };
  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!selectedTask) return;

    try {
      const res = await fetch("/api/kanban/comment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          content: newContent,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedComments = selectedTask.comments.map((c: Comment) =>
          c.id === commentId ? { ...c, content: newContent } : c
        );

        setTasks(
          tasks.map((task) =>
            task.id === selectedTask.id
              ? { ...task, comments: updatedComments }
              : task
          )
        );

        setSelectedTask({
          ...selectedTask,
          comments: updatedComments,
        });
      }
    } catch (err) {
      console.error("Failed to edit comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTask) return;

    try {
      const res = await fetch("/api/kanban/comment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedComments = selectedTask.comments.filter(
          (c: Comment) => c.id !== commentId
        );

        setTasks(
          tasks.map((task) =>
            task.id === selectedTask.id
              ? { ...task, comments: updatedComments }
              : task
          )
        );

        setSelectedTask({
          ...selectedTask,
          comments: updatedComments,
        });
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const fetchReports = async (taskId: string) => {
    try {
      setReportsLoading(true);
      setReportMessages([]);

      const res = await fetch(`/api/kanban/report?taskId=${taskId}`);
      const data = await res.json();

      if (data.success) {
        setReportCount(data.count || 0);
        setReportMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedTask) return;
    fetchReports(selectedTask.id);
  }, [selectedTask?.id]);

  const handleReport = async () => {
    if (!message.trim() || !selectedTask) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/kanban/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          taskId: selectedTask.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setReportCount((prev) => prev + 1);
        toast.success("Report submitted successfully");
        setMessage("");
        setOpen(false);
        await fetchReports(selectedTask.id);
      } else {
        toast.error(data.error || "Failed to send report");
      }
    } catch (err) {
      console.error("Report error:", err);
      toast.error("Something went wrongg");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      setTransition(true);
      const formData = new FormData();
      const assigneeName = newTask.assignee || "Unassigned";
      formData.append("title", newTask.title.trim());
      formData.append("description", newTask.description.trim());
      formData.append("assignee", assigneeName);
      formData.append(
        "assigneeAvatar",
        newTask.assignee
          ? newTask.assignee
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          : ""
      );
      formData.append("priority", newTask.priority);
      formData.append("dueDate", newTask.dueDate);
      formData.append("status", newTask.status);
      formData.append("tags", newTask.tags.join(","));
      formData.append("projectId", projectId);
      formData.append("employeeId", currentUser?.employeeId ?? "");

      if (newTask.attachments?.length) {
        newTask.attachments.forEach((file) => {
          formData.append("attachment", file);
        });
      }

      const res = await fetch("/api/kanban", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Create Task Error:", data);
        return;
      }

      setTasks((prev) => [...prev, data.task]);
      setShowNewTaskModal(false);
      setNewTask({
        title: "",
        description: "",
        assignee: "",
        priority: "MEDIUM",
        dueDate: "",
        tags: [],
        status: "NOT_STARTED",
        attachments: newTask.attachments,
        projectId: "",
      });
      await fetchTasks();
    } catch (error) {
      console.error("Create Task Exception:", error);
    } finally {
      setTransition(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !newTask.tags.includes(tag.trim())) {
      setNewTask({ ...newTask, tags: [...newTask.tags, tag.trim()] });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTask({
      ...newTask,
      tags: newTask.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTasksByStatus = (status: Task["status"]) => filteredTasks.filter((task) => task.status === status);
  console.log(filteredTasks);
  if (loading) {
    return (
      <div className="w-full h-[50vh] flex justify-center items-center">
        <LucideLoader
          className="animate-spin"
          style={{ color: "var(--primary)" }}
          size={40}
        />
      </div>
    );
  }
  return (
    <div className="min-h-screen transition-colors duration-200">
      <div className="border-b border-[var(--border)] sticky top-0 z-10 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1
              className="text-2xl font-bold font-id"
              style={{ color: "var(--text-primary)" }}
            >
              Project Kanban Board
            </h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-white font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-80"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
              {
                currentUser?.role!=="CLIENT" && 
                <button
                onClick={() => setShowNewTaskModal(true)}
                className="px-4 py-2 text-white rounded-lg font-inter text-sm flex items-center gap-2"
                style={{ background: "var(--primary)" }}
                >
                <Plus className="w-4 h-4" />
                New Task
              </button>
              }
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-6">
          {columns.map((column) => {
            const Icon = column.icon;
            const columnTasks = getTasksByStatus(column.id as Task["status"]);
            return (
              <div key={column.id} className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        column.color === "blue"
                          ? "bg-blue-50 text-blue-600"
                          : column.color === "yellow"
                          ? "bg-yellow-50 text-yellow-600"
                          : column.color === "orange"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2
                      className="font-semibold text-base font-inter"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {column.title}
                    </h2>
                  </div>
                  <h2
                    className="font-medium text-sm font-inter mr-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {columnTasks.length}
                  </h2>
                </div>

                <div
                  onDragOver={currentUser?.role!=="CLIENT" ? handleDragOver: undefined}
                  onDrop={currentUser?.role!=="CLIENT" ? () => handleDrop(column.id as Task["status"]):undefined}
                  className={`flex-1 space-y-3 min-h-[200px] p-1 rounded-lg ${
                    draggedTask && draggedTask.status !== column.id
                      ? "bg-[var(--bg)]"
                      : ""
                  }`}
                >
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={currentUser?.role!=="CLIENT"}
                      onDragStart={currentUser?.role!=="CLIENT" ? () => handleDragStart(task):undefined}
                      onClick={() => setSelectedTask(task)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all bg-white border-[var(--border)] hover:shadow-md ${
                        draggedTask?.id === task.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-4 items-start justify-between mb-3">
                        <h3
                          className="font-semibold font-inter line-clamp-2"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {task.title}
                        </h3>
                        <p
                          className="font-inter text-sm line-clamp-2"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {task.description}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium border ${
                            priorityClasses[task.priority]
                          } flex-shrink-0`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      {/* <p className="text-sm mb-3 line-clamp-2 text-gray-600 dark:text-gray-400">{htmlToText(task.description)}</p> */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-md text-xs font-inter bg-[var(--primary-light)] border border-[#ffd9a8]"
                            style={{ color: "var(--primary)" }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {/* <MessageSquare
                              className="w-4 h-4"
                              style={{ color: "var(--text-muted)" }}
                            /> */}
                            <span
                              className="text-sm font-inter"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {task.comments?.length}
                            </span>
                          </div>
                          {task.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip
                                className="w-4 h-4"
                                style={{ color: "var(--text-muted)" }}
                              />
                              <span
                                className="text-sm font-inter"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {task.attachments.length}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                            style={{ background: "var(--primary)" }}
                          >
                            {task?.assignee?.charAt(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* <SidePanel
        selectedTask={selectedTask}
        onClose={() => setSelectedTask(null)}
        onEditTask={handleEditTask as any}
        onDeleteTask={handleDeleteTask}
        commentText={commentText}
        setCommentText={setCommentText}
        handleAddComment={handleAddComment}
        reportsLoading={reportsLoading}
        loading={loading}
        open={open}
        setOpen={setOpen}
        message={message}
        setMessage={setMessage}
        handleReport={handleReport}
        reportCount={reportCount}
        reportMessages={reportMessages}
        currentUserId={currentUser?.id || ''}
        handleEditComment={handleEditComment}
        handleDeleteComment={handleDeleteComment}
      /> */}

      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        newTask={newTask}
        setNewTask={setNewTask}
        handleCreateTask={handleSubmitTask}
        currentUser={currentUser}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
        mode={taskMode}
        isLoading={transition}
      />
    </div>
  );
}
