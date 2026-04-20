"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Flag,
  Plus,
  Loader2,
  Edit,
  Trash2,
  LucideLoader,
  Download,
  FileText,
  FileArchive,
  Image,
  Link as LinkIcon,
  X,
  Paperclip,
  Pencil,
  Delete,
} from "lucide-react";
import toast from "react-hot-toast";

export default function MilestoneTab({ projectId }: any) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null
  );
  const [completing, setCompleting] = useState(false);
  const [fileType, setFileType] = useState("IMAGE");
  const [fileTitle, setFileTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    type: "IMAGE",
    status: "PENDING",
    content: "",
  });
  const completeMileStone = async (id: string) => {
    try {
      setCompleting(true);
      const fd = new FormData();
      fd.append("completed", "true");
      const request = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        body: fd,
      });
      const response = await request.json();
      if (response.success) {
        await fetchMilestones();
      }
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setCompleting(false);
    }
  };
  useEffect(() => {
    if (projectId) {
      fetchMilestones();
      fetchCurrentUser();
    }
  }, [projectId]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.success) setCurrentUser(data.user);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  };

  const fetchMilestones = async () => {
    try {
      const res = await fetch(`/api/milestones?projectId=${projectId}`);
      const data = await res.json();
      if (data.success) setMilestones(data.milestones);
    } catch (err) {
      console.error("Milestone fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // const createMilestone = async () => {
  //   if (!newMilestone.title.trim() || !newMilestone.dueDate.trim()) {
  //     toast.error("Please fill in all required fields");
  //     return;
  //   }
  //   try {
  //     setCreating(true);
  //     const res = await fetch("/api/project/milestone", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         ...newMilestone,
  //         projectId,
  //         adminId: currentUser?.id,
  //       }),
  //     });
  //     const data = await res.json();
  //     if (data.success) {
  //       setOpen(false);
  //       setNewMilestone({
  //         title: "",
  //         description: "",
  //         dueDate: "",
  //         status: "PENDING",
  //       });
  //       await fetchMilestones();
  //       toast.success("Milestone created!");
  //     } else toast.error(data.message || "Failed to create milestone");
  //   } catch {
  //     toast.error("Error creating milestone");
  //   } finally {
  //     setCreating(false);
  //   }
  // };

  const editMilestone = async () => {
    if (!newMilestone.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (newMilestone.type === "LINK" && !newMilestone.content?.trim()) {
      toast.error("URL required");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("id", editingId!);
      formData.append("title", newMilestone.title);
      formData.append("type", newMilestone.type);

      // 🔥 HANDLE CONTENT PROPERLY
      if (newMilestone.type === "LINK") {
        let url = newMilestone.content.trim();

        if (!url.startsWith("http")) {
          url = "https://" + url;
        }

        formData.append("content", url);
      } else {
        if (file) {
          // new file uploaded
          formData.append("file", file);
        } else if (newMilestone.content) {
          // keep old file URL
          formData.append("content", newMilestone.content);
        }
      }

      const res = await fetch(`/api/milestones/${editingId}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Milestone updated!");

        // ✅ RESET STATE CLEANLY
        setOpen(false);
        setEditMode(false);
        setEditingId(null);
        setFile(null);

        setNewMilestone({
          title: "",
          type: "IMAGE",
          content: "",
          status: "PENDING",
        });

        await fetchMilestones();
      } else {
        toast.error(data.message || "Failed to update milestone");
      }
    } catch {
      toast.error("Error updating milestone");
    } finally {
      setUploading(false); // ✅ ALWAYS resets now
    }
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/milestones/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMilestones();
        toast.success("Milestone deleted!");
      } else toast.error(data.message || "Failed to delete");
    } catch {
      toast.error("Error deleting milestone");
    } finally {
      setDeleting(false);
    }
  };

  const uploadMilestoneFile = async () => {
    if (!newMilestone.title.trim()) {
      return toast.error("Title required");
    }

    if (newMilestone.type === "LINK" && !newMilestone.content?.trim()) {
      return toast.error("URL required");
    }

    if (newMilestone.type !== "LINK" && !file) {
      return toast.error("File required");
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("title", newMilestone.title);
      formData.append("type", newMilestone.type);
      formData.append("projectId", projectId);

      if (newMilestone.type === "LINK") {
        let url = newMilestone.content.trim();

        if (!url.startsWith("http")) {
          url = "https://" + url;
        }

        formData.append("content", url);
      } else {
        formData.append("file", file as File);
      }

      const res = await fetch("/api/milestones", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Milestone added");

        // RESET STATE (IMPORTANT)
        setOpen(false);
        setFile(null);

        setNewMilestone({
          title: "",
          type: "IMAGE",
          content: "",
          status: "PENDING",
        });

        fetchMilestones();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Failed");
    } finally {
      setUploading(false);
    }
  };
  const deleteMilestoneFile = async (fileId: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      const res = await fetch("/api/project/milestone/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMilestones();
        toast.success("File deleted!");
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting file");
    }
  };

  const downloadFile = async (fileUrl: string, title: string) => {
    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Downloaded successfully");
    } catch {
      toast.error("Download failed");
    }
  };

  const openFileUploadModal = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
    setFileUploadOpen(true);
  };

  const openEditModal = (m: any) => {
    setEditMode(true);
    setEditingId(m.id);
    setNewMilestone({
      title: m.title,
      type: m.type,
      status: m.completed ? "COMPLETED" : "PENDING",
      content: m.content,
    });
    setOpen(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          card: "border-green-200 bg-green-50",
          badge: "bg-green-50 text-green-700 border-green-200",
          dot: "bg-green-500",
          text: "text-green-600",
        };
      case "IN_PROGRESS":
        return {
          card: "border-blue-200 bg-blue-50",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          text: "text-blue-600",
        };
      case "DELAYED":
        return {
          card: "border-orange-200 bg-orange-50",
          badge: "bg-orange-50 text-orange-700 border-orange-200",
          dot: "bg-orange-500",
          text: "text-orange-600",
        };
      case "CANCELLED":
        return {
          card: "border-red-200 bg-red-50",
          badge: "bg-red-50 text-red-700 border-red-200",
          dot: "bg-red-400",
          text: "text-red-500",
        };
      default:
        return {
          card: "border-[var(--border)] bg-[var(--primary-light)]",
          badge: "bg-[var(--primary-light)] border-[#ffd9a8] text-[#b87a2e]",
          dot: "bg-[var(--primary)]",
          text: "text-[var(--primary)]",
        };
    }
  };

  const getFileIcon = (type: string) => {
    if (type === "image")
      return <Image size={14} style={{ color: "var(--text-muted)" }} />;
    if (type === "zip")
      return <FileArchive size={14} style={{ color: "var(--text-muted)" }} />;
    if (type === "link")
      return <LinkIcon size={14} style={{ color: "var(--text-muted)" }} />;
    return <FileText size={14} style={{ color: "var(--text-muted)" }} />;
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-white border border-[var(--border)] font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

  if (loading)
    return (
      <div className="w-full h-[50vh] flex justify-center items-center">
        <LucideLoader
          className="animate-spin"
          style={{ color: "var(--primary)" }}
          size={40}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2
          className="text-2xl font-bold font-id"
          style={{ color: "var(--text-primary)" }}
        >
          Milestones
        </h2>
        {currentUser?.role === "ENGINEER" && (
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm"
            style={{ background: "var(--primary)" }}
          >
            <Plus size={16} /> Add Milestone
          </button>
        )}
      </div>

      {milestones.length === 0 && (
        <div className="text-center py-12">
          <Calendar
            className="mx-auto h-12 w-12 mb-4"
            style={{ color: "var(--border)" }}
          />
          <p
            className="font-inter text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            No milestones created yet.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {milestones.map((m: any) => {
          const s = getStatusStyle(m.completed ? "COMPLETED" : "PENDING");
          return (
            <div
              key={m.id}
              className={`p-5 flex flex-col border rounded-xl ${s.card}`}
            >
              <div className="flex justify-between items-start">
                {/* LEFT */}
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${s.dot}`}
                  />

                  <div className="w-full space-y-2">
                    {/* TITLE */}
                    <h3
                      className="font-semibold font-inter"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {m.title}
                    </h3>

                    {/* CONTENT BASED ON TYPE */}
                    <div
                      className="text-sm font-inter"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {m.type === "LINK" ? (
                        <a
                          href={
                            m.content.startsWith("http")
                              ? m.content
                              : `https://${m.content}`
                          }
                          target="_blank"
                          className="underline hover:text-[var(--primary)]"
                        >
                          {m.content}
                        </a>
                      ) : m.type === "IMAGE" ? (
                        <img
                          src={m.content}
                          alt="milestone"
                          className="mt-2 max-h-40 rounded-lg border border-[var(--border)]"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {getFileIcon(m.type)}
                          <span>{m.content}</span>

                          <button
                            onClick={() => downloadFile(m.content, m.title)}
                            className="p-1 hover:text-[var(--primary)]"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* META INFO */}
                    <p
                      className="text-xs font-inter"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Added on {new Date(m.createdAt).toLocaleDateString()}
                    </p>

                    <p
                      className="text-xs font-inter"
                      style={{ color: "var(--text-muted)" }}
                    >
                      By {m.addedBy?.name}
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* TYPE BADGE */}
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-inter font-semibold ${s.badge}`}
                  >
                    {m.type}
                  </span>

                  {/* COMPLETION BADGE */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-inter ${
                      m.completed
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {m.completed ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
              {currentUser.role === "ENGINEER" && (
                <div className="self-end space-x-2">
                  <button
                    onClick={() => {
                      openEditModal(m);
                    }}
                    className="bg-[var(--primary)] rounded-lg px-4 py-2"
                  >
                    Edit
                  </button>
                  <button
                    disabled={deleting}
                    onClick={() => deleteMilestone(m.id)}
                    className="bg-[var(--destructive)] rounded-lg px-4 py-2"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                  {m.completed ? (
                    <button
                      disabled={true}
                      className="bg-[var(--primary)] uppercase rounded-lg px-4 py-2"
                    >
                      completed
                    </button>
                  ) : (
                    <button
                      disabled={completing}
                      onClick={() => completeMileStone(m.id)}
                      className="bg-[var(--primary)] rounded-lg px-4 py-2"
                    >
                      {completing ? "Completing..." : "Mark as Completed"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Milestone Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full border border-[var(--border)] shadow-lg">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-lg font-semibold font-inter"
                style={{ color: "var(--text-primary)" }}
              >
                {currentUser?.role === "ENGINEER"
                  ? editMode
                    ? "Edit Milestone"
                    : "Add Milestone"
                  : "View Milestone"}
              </h2>

              <button
                onClick={() => {
                  setOpen(false);
                  setEditMode(false);
                  setEditingId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}
            <div className="space-y-4 text-black">
              {/* TITLE */}
              <div>
                <label className="block text-sm font-medium font-inter mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, title: e.target.value })
                  }
                  className={inputCls}
                  disabled={uploading || currentUser?.role !== "ENGINEER"}
                />
              </div>

              {/* TYPE */}
              <div>
                <label className="block text-sm font-medium font-inter mb-1.5">
                  Type *
                </label>
                <select
                  className={inputCls}
                  value={newMilestone.type}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, type: e.target.value })
                  }
                  disabled={
                    uploading || currentUser?.role !== "ENGINEER" || editMode
                  }
                  // 🔥 lock type in edit mode (important)
                >
                  <option value="IMAGE">Image</option>
                  <option value="ZIP">Zip</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="LINK">Link</option>
                </select>
              </div>

              {/* CONTENT */}
              {newMilestone.type === "LINK" ? (
                <div>
                  <label className="block text-sm font-medium font-inter mb-1.5">
                    URL *
                  </label>
                  <input
                    type="text"
                    value={newMilestone.content || ""}
                    onChange={(e) =>
                      setNewMilestone({
                        ...newMilestone,
                        content: e.target.value,
                      })
                    }
                    className={inputCls}
                    disabled={uploading || currentUser?.role !== "ENGINEER"}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium font-inter mb-1.5">
                    {editMode ? "Replace File (optional)" : "Upload File *"}
                  </label>

                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm font-inter"
                    disabled={uploading || currentUser?.role !== "ENGINEER"}
                  />

                  {/* EXISTING FILE PREVIEW (EDIT MODE) */}
                  {editMode && !file && newMilestone.content && (
                    <div className="mt-2 text-xs text-[var(--text-muted)]">
                      Current file:
                      <button
                        onClick={() =>
                          window.open(newMilestone.content, "_blank")
                        }
                        className="ml-2 underline hover:text-[var(--primary)]"
                      >
                        View
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACTIONS */}
            {currentUser?.role === "ENGINEER" && (
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setOpen(false);
                    setEditMode(false);
                    setEditingId(null);
                    setFile(null);
                    setNewMilestone({
                      title: "",
                      type: "IMAGE",
                      content: "",
                      status: "PENDING",
                    });
                  }}
                  className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg font-inter text-sm"
                >
                  Cancel
                </button>

                <button
                  disabled={
                    uploading ||
                    !newMilestone.title.trim() ||
                    (newMilestone.type === "LINK"
                      ? !newMilestone.content?.trim()
                      : !editMode && !file) // 🔥 only require file in create mode
                  }
                  onClick={editMode ? editMilestone : uploadMilestoneFile}
                  className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm disabled:opacity-40"
                  style={{ background: "var(--primary)" }}
                >
                  {uploading && <Loader2 className="animate-spin" size={14} />}
                  {editMode ? "Update" : "Save"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {/* {fileUploadOpen && ( */}
      {/* )} */}
    </div>
  );
}
