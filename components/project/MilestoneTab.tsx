"use client";

import { useEffect, useState } from "react";
import { Calendar, Flag, Plus, Loader2, Edit, Trash2, LucideLoader, Download, FileText, FileArchive, Image, Link as LinkIcon, X, Paperclip } from "lucide-react";
import toast from "react-hot-toast";

export default function MilestoneTab({ projectId }: any) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [fileType, setFileType] = useState("image");
  const [fileTitle, setFileTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", dueDate: "", status: "PENDING" });

  useEffect(() => {
    if (projectId) { fetchMilestones(); fetchCurrentUser(); }
  }, [projectId]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.success) setCurrentUser(data.user);
    } catch (err) { console.error("Failed to fetch current user:", err); }
  };

  const fetchMilestones = async () => {
    try {
      const res = await fetch(`/api/project/milestone?projectId=${projectId}`);
      const data = await res.json();
      if (data.success) setMilestones(data.milestones);
    } catch (err) { console.error("Milestone fetch error:", err); }
    finally { setLoading(false); }
  };

  const createMilestone = async () => {
    if (!newMilestone.title.trim() || !newMilestone.dueDate.trim()) { toast.error("Please fill in all required fields"); return; }
    try {
      setCreating(true);
      const res = await fetch("/api/project/milestone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newMilestone, projectId, adminId: currentUser?.id }) });
      const data = await res.json();
      if (data.success) { setOpen(false); setNewMilestone({ title: "", description: "", dueDate: "", status: "PENDING" }); await fetchMilestones(); toast.success("Milestone created!"); }
      else toast.error(data.message || "Failed to create milestone");
    } catch { toast.error("Error creating milestone"); }
    finally { setCreating(false); }
  };

  const editMilestone = async () => {
    if (!newMilestone.title.trim() || !newMilestone.dueDate.trim()) { toast.error("Please fill in all required fields"); return; }
    try {
      setCreating(true);
      const res = await fetch("/api/project/milestone", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, ...newMilestone }) });
      const data = await res.json();
      if (data.success) { setOpen(false); setEditMode(false); setEditingId(null); setNewMilestone({ title: "", description: "", dueDate: "", status: "PENDING" }); await fetchMilestones(); toast.success("Milestone updated!"); }
      else toast.error(data.message || "Failed to update milestone");
    } catch { toast.error("Error updating milestone"); }
    finally { setCreating(false); }
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      const res = await fetch("/api/project/milestone", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.success) { await fetchMilestones(); toast.success("Milestone deleted!"); }
      else toast.error(data.message || "Failed to delete");
    } catch { toast.error("Error deleting milestone"); }
  };

  const uploadMilestoneFile = async () => {
    if (!fileTitle.trim()) { toast.error("Please provide a title"); return; }
    if (fileType === "link" && !fileUrl.trim()) { toast.error("Please provide a URL"); return; }
    if (fileType !== "link" && !file) { toast.error("Please select a file"); return; }

    const formData = new FormData();
    formData.append("milestoneId", selectedMilestoneId || "");
    formData.append("projectId", projectId);
    formData.append("fileType", fileType);
    formData.append("fileTitle", fileTitle);

    if (fileType === "link") {
      formData.append("fileUrl", fileUrl);
    } else {
      formData.append("file", file!);
    }

    try {
      setUploading(true);
      const res = await fetch("/api/project/milestone/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setFileUploadOpen(false);
        setFile(null);
        setFileTitle("");
        setFileUrl("");
        setFileType("image");
        await fetchMilestones();
        toast.success("File uploaded to milestone!");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
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
        body: JSON.stringify({ fileId })
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
    setEditMode(true); setEditingId(m.id);
    setNewMilestone({ title: m.title, description: m.description || "", dueDate: m.dueDate.split("T")[0], status: m.status || "PENDING" });
    setOpen(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return { card: "border-green-200 bg-green-50", badge: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500", text: "text-green-600" };
      case "IN_PROGRESS": return { card: "border-blue-200 bg-blue-50", badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", text: "text-blue-600" };
      case "DELAYED": return { card: "border-orange-200 bg-orange-50", badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500", text: "text-orange-600" };
      case "CANCELLED": return { card: "border-red-200 bg-red-50", badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400", text: "text-red-500" };
      default: return { card: "border-[var(--border)] bg-[var(--primary-light)]", badge: "bg-[var(--primary-light)] border-[#ffd9a8] text-[#b87a2e]", dot: "bg-[var(--primary)]", text: "text-[var(--primary)]" };
    }
  };

  const getFileIcon = (type: string) => {
    if (type === "image") return <Image size={14} style={{ color: "var(--text-muted)" }} />;
    if (type === "zip") return <FileArchive size={14} style={{ color: "var(--text-muted)" }} />;
    if (type === "link") return <LinkIcon size={14} style={{ color: "var(--text-muted)" }} />;
    return <FileText size={14} style={{ color: "var(--text-muted)" }} />;
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white border border-[var(--border)] font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

  if (loading) return (
    <div className="w-full h-[50vh] flex justify-center items-center">
      <LucideLoader className="animate-spin" style={{ color: "var(--primary)" }} size={40} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-id" style={{ color: "var(--text-primary)" }}>Milestones</h2>
        {/* {currentUser?.role.name === "ADMIN" && ( */}
        <button onClick={() => setOpen(true)} className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm" style={{ background: "var(--primary)" }}>
          <Plus size={16} /> Add Milestone
        </button>
        {/* )} */}
      </div>

      {milestones.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 mb-4" style={{ color: "var(--border)" }} />
          <p className="font-inter text-sm" style={{ color: "var(--text-muted)" }}>No milestones created yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {milestones.map((m: any) => {
          const s = getStatusStyle(m.status || "PENDING");
          return (
            <div key={m.id} className={`p-5 border rounded-xl ${s.card}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${s.dot}`} />
                  <div className="w-full">
                    <h3 className="font-semibold font-inter" style={{ color: "var(--text-primary)" }}>{m.title}</h3>
                    {m.description && <p className="text-sm font-inter mt-1" style={{ color: "var(--text-muted)" }}>{m.description}</p>}
                    <p className="text-xs font-inter mt-2" style={{ color: "var(--text-muted)" }}>Due: {new Date(m.dueDate).toLocaleDateString()}</p>

                    {/* Files Section */}
                    {m.files && m.files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold font-inter" style={{ color: "var(--text-muted)" }}>Attachments:</p>
                        <div className="space-y-1.5">
                          {m.files.map((f: any) => (
                            <div key={f.id} className="flex items-center justify-between p-2 bg-white/50 rounded border border-[var(--border)] text-xs">
                              <div className="flex items-center gap-2">
                                {getFileIcon(f.type)}
                                <span className="font-inter text-xs" style={{ color: "var(--text-primary)" }}>{f.title}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    if (f.type === "link") {
                                      let url = f.url?.trim() || "";
                                      if (url && !url.startsWith("http")) url = "https://" + url;
                                      window.open(url, "_blank");
                                    } else {
                                      downloadFile(f.url, f.title);
                                    }
                                  }}
                                  className="p-1 hover:text-[var(--primary)] transition-colors"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  <Download size={12} />
                                </button>
                                {currentUser?.role.name === "ADMIN" && (
                                  <button
                                    onClick={() => deleteMilestoneFile(f.id)}
                                    className="p-1 hover:text-red-500 transition-colors"
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-col">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-inter font-semibold ${s.badge}`}>{m.status || "PENDING"}</span>
                  {(currentUser?.role.name === "ADMIN" || currentUser?.role.name === "EMPLOYEE") && (
                    <div className="flex gap-1">
                      {currentUser?.role.name === "ADMIN" && (
                        <button
                          onClick={() => openFileUploadModal(m.id)}
                          className="p-1 hover:text-[var(--primary)] transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          title="Add file"
                        >
                          <Paperclip size={14} />
                        </button>
                      )}
                      <button onClick={() => openEditModal(m)} className="p-1 hover:text-[var(--primary)] transition-colors" style={{ color: "var(--text-muted)" }}><Edit size={14} /></button>
                      <button onClick={() => deleteMilestone(m.id)} className="p-1 hover:text-red-500 transition-colors" style={{ color: "var(--text-muted)" }}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Milestone Modal */}
      {open && (
        // <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        //   <div className="bg-white w-full max-w-md p-6 rounded-xl border border-[var(--border)] shadow-lg">
        //     <h2 className="text-lg font-semibold font-inter mb-4" style={{ color: "var(--text-primary)" }}>
        //       {editMode ? "Edit Milestone" : "Add Milestone"}
        //     </h2>
        //     <div className="space-y-4 text-black">
        //       <div>
        //         <label className="block text-sm font-medium font-inter mb-1.5" style={{ color: "var(--text-secondary)" }}>Title *</label>
        //         <input type="text" value={newMilestone.title} onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })} className={inputCls} placeholder="Enter milestone title text-black" disabled={creating} />
        //       </div>
        //       <div>
        //         <label className="block text-sm font-medium font-inter mb-1.5" style={{ color: "var(--text-secondary)" }}>Description</label>
        //         <textarea value={newMilestone.description} onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })} className={`${inputCls} resize-none`} rows={3} placeholder="Enter description" disabled={creating} />
        //       </div>
        //       <div>
        //         <label className="block text-sm font-medium font-inter mb-1.5" style={{ color: "var(--text-secondary)" }}>Due Date *</label>
        //         <input type="date" value={newMilestone.dueDate} onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} className={inputCls} min={new Date().toISOString().split("T")[0]} disabled={creating} />
        //       </div>
        //       <div>
        //         <label className="block text-sm font-medium font-inter mb-1.5" style={{ color: "var(--text-secondary)" }}>Status</label>
        //         <select value={newMilestone.status} onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value })} className={inputCls} disabled={creating}>
        //           <option value="PENDING">Pending</option>
        //           <option value="IN_PROGRESS">In Progress</option>
        //           <option value="COMPLETED">Completed</option>
        //           <option value="DELAYED">Delayed</option>
        //           <option value="CANCELLED">Cancelled</option>
        //         </select>
        //       </div>
        //     </div>
        //     <div className="flex justify-end gap-3 mt-6">
        //       <button onClick={() => { setOpen(false); setEditMode(false); setEditingId(null); setNewMilestone({ title: "", description: "", dueDate: "", status: "PENDING" }); }} className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg font-inter text-sm" style={{ color: "var(--text-secondary)" }} disabled={creating}>Cancel</button>
        //       <button onClick={editMode ? editMilestone : createMilestone} disabled={creating || !newMilestone.title.trim() || !newMilestone.dueDate.trim()} className="px-4 py-2 text-white rounded-lg font-inter text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: "var(--primary)" }}>
        //         {creating && <Loader2 size={14} className="animate-spin" />}
        //         {editMode ? (creating ? "Updating..." : "Update") : (creating ? "Creating..." : "Create")}
        //       </button>
        //     </div>
        //   </div>
        // </div>
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full border border-[var(--border)] shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold font-inter" style={{ color: "var(--text-primary)" }}>Upload File to Milestone</h2>
              <button onClick={() => setFileUploadOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-black">
              <div>
                <label className="block text-sm font-medium font-inter mb-1.5" style={{ color: "var(--text-secondary)" }}>File Title *</label>
                <input type="text" placeholder="Enter file title" value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} className={inputCls} disabled={uploading} />
              </div>

              <div>
                <label className="block text-sm font-medium font-inter mb-1.5" style={{ color: "var(--text-secondary)" }}>File Type *</label>
                <select className={inputCls} value={fileType} onChange={(e) => setFileType(e.target.value)} disabled={uploading}>
                  <option value="image">Image</option>
                  <option value="zip">Zip</option>
                  <option value="document">Document</option>
                  <option value="link">Link</option>
                </select>
              </div>

              {fileType === "link" ? (
                <div>
                  <label className="block text-sm font-medium font-inter mb-1.5" style={{ color: "var(--text-secondary)" }}>URL *</label>
                  <input type="text" placeholder="Paste your URL" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className={inputCls} disabled={uploading} />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium font-inter mb-1.5" style={{ color: "var(--text-secondary)" }}>Select File *</label>
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm font-inter" style={{ color: "var(--text-secondary)" }} disabled={uploading} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setOpen(false); setFile(null); setFileTitle(""); setFileUrl(""); setFileType("image"); }} className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg font-inter text-sm" style={{ color: "var(--text-secondary)" }} disabled={uploading}>Cancel</button>
              <button disabled={uploading || !fileTitle.trim()} onClick={uploadMilestoneFile} className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm disabled:opacity-40" style={{ background: "var(--primary)" }}>
                {uploading && <Loader2 className="animate-spin" size={14} />} Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {/* {fileUploadOpen && ( */}
      {/* )} */}
    </div>
  );
}