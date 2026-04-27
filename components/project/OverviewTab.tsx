"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUp, CheckCheck, LucideCheckCheck, LucideCopy, LucideEdit3,
  User, X, DollarSign, Palette, Send, CreditCard
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/app/hooks/useAuth";

const T = {
  bg: "#f4f4f4", card: "#ffffff", border: "#e5e5e5", primary: "#FFAE58",
  primaryLight: "#fff4e6", text: "#050A30", textSec: "#4B4B4B", textMuted: "#6F6F6F",
  danger: "#ef4444", purple: "#8b5cf6", success: "#16a34a"
} as const;

const inputCls = "w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white text-[#050A30] border-[#e5e5e5]";
const selectCls = "w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white text-[#050A30]";
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 4 };

const getApiBase = (role: string) => {
  if (role === "CLIENT") return "/api/client/projects";
  if (role === "ENGINEER") return "/api/engineer/projects";
  return "/api/admin/project"; 
};

const EditModal = ({ showModel, projectData, userRole }: { showModel: (v: boolean) => void; projectData: any, userRole: string }) => {
  const [loading, setLoading] = useState(false);
  const [instruments, setInstruments] = useState<string[]>(projectData.instruments || []);
  const [newInstrument, setNewInstrument] = useState("");
  const isAdmin = userRole === "ADMIN";

  const [formData, setFormData] = useState({
    title: projectData.title || "",
    description: projectData.description || "",
    startDate: projectData.startDate || "",
    endDate: projectData.endDate || "",
    priority: projectData.priority || "LOW",
    repository: projectData.repository || "",
    budget: projectData.budget || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const apiBase = getApiBase(userRole);
    
    try {
      const payload: any = { 
        projectId: projectData.id, 
        ...formData, 
        instruments 
      };
      
      if (!isAdmin) {
        delete payload.repository;
        delete payload.budget;
      }

      const res = await fetch(`${apiBase}/${projectData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Project updated successfully");
        showModel(false);
        window.location.reload();
      } else {
        toast.error(data.message || "Failed to update project");
      }
    } catch {
      toast.error("Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,10,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
      <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 660, maxHeight: "82vh", overflowY: "auto", border: `1px solid ${T.border}`, boxShadow: "0 8px 40px rgba(5,10,48,0.12)" }}>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: T.text, margin: 0 }}>Edit Project Details</h2>
            <button onClick={() => showModel(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.textMuted }}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              
              <div><label style={labelStyle}>Project Title *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputCls} required /></div>
              
              <div><label style={labelStyle}>Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className={selectCls}>
                  <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                </select>
              </div>

              <div><label style={labelStyle}>Start Date</label><input type="date" value={formData.startDate?.split("T")[0]} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={inputCls} /></div>
              <div><label style={labelStyle}>Deadline</label><input type="date" value={formData.endDate?.split("T")[0]} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className={inputCls} /></div>
              
              {isAdmin && (
                <>
                  <div><label style={labelStyle}>Budget (₹) *</label><input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })} className={inputCls} required /></div>
                  <div><label style={labelStyle}>Repository</label><input type="text" value={formData.repository} onChange={(e) => setFormData({ ...formData, repository: e.target.value })} className={inputCls} placeholder="URL ending in .git" /></div>
                </>
              )}
            </div>

            {/* Instruments / Requirements */}
            <div>
              <label style={labelStyle}>Requirements / Tech Stack</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="text" placeholder="Add requirement..." value={newInstrument} onChange={(e) => setNewInstrument(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newInstrument.trim()) { setInstruments([...instruments, newInstrument.trim()]); setNewInstrument(""); }}}} className={inputCls} />
                <button type="button" onClick={() => { if (newInstrument.trim()) { setInstruments([...instruments, newInstrument.trim()]); setNewInstrument(""); }}} style={{ padding: "8px 14px", background: T.primary, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {instruments.map((inst, i) => (
                  <span key={i} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 4 }}>
                    {inst} <button type="button" onClick={() => setInstruments(instruments.filter((_, idx) => idx !== i))} style={{ color: T.danger, background: "none", border: "none", cursor: "pointer" }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div><label style={labelStyle}>Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls} rows={3} /></div>

            <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
              <button type="button" onClick={() => showModel(false)} style={{ flex: 1, padding: "10px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.card, color: T.text, cursor: "pointer", fontWeight: 500 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: "10px", background: T.primary, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Updating..." : "Update Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SubmitReviewModal = ({ showModel, projectData }: { showModel: (v: boolean) => void; projectData: any }) => {
  const [loading, setLoading] = useState(false);
  const [repo, setRepo] = useState(projectData.repository || "");
  const [link, setLink] = useState(projectData.finalProjectLink || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/engineer/projects/${projectData.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalProjectLink: link, repository: repo }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Submitted for review!");
        showModel(false);
        window.location.reload();
      } else {
        toast.error(data.message || "Failed to submit");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,10,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: T.card, borderRadius: 16, padding: "1.5rem", width: 400, border: `1px solid ${T.border}` }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: T.text, margin: "0 0 1rem" }}>Submit for Review</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Live Project Link *</label>
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} className={inputCls} placeholder="https://..." required />
          </div>
          <div>
            <label style={labelStyle}>Repository URL</label>
            <input type="url" value={repo} onChange={(e) => setRepo(e.target.value)} className={inputCls} placeholder="https://github.com/..." />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={() => showModel(false)} style={{ flex: 1, padding: "9px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.card, cursor: "pointer", fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: "9px", background: T.success, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Send size={15} /> {loading ? "Sending..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const ProgressModal = ({ current, onClose, onSave, saving }: any) => {
  const [val, setVal] = useState(current);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,10,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: T.card, borderRadius: 16, padding: "1.5rem", width: 340, border: `1px solid ${T.border}`, boxShadow: "0 8px 40px rgba(5,10,48,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: 0 }}>Update Progress</h2>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.textMuted }}><X size={18} /></button>
        </div>
        <input type="range" min={0} max={100} value={val} onChange={(e) => setVal(Number(e.target.value))} style={{ width: "100%", accentColor: T.primary }} />
        <p style={{ textAlign: "center", fontWeight: 700, fontSize: 28, color: T.text, margin: "8px 0 16px" }}>{val}%</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.card, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave(val)} disabled={saving} style={{ flex: 1, padding: "9px", background: T.primary, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
};

const ProgressGauge = ({ progress }: { progress?: number }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - ((progress || 0) / 100) * circumference;
  return (
    <div style={{ position: "relative", width: 120, height: 120 }}>
      <svg style={{ width: 120, height: 120, transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="#e5e5e5" strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r="45" stroke={T.primary} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.4s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: T.text }}>{progress || 0}%</span>
      </div>
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority?: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    HIGH: { bg: "#fee2e2", color: "#ef4444" }, MEDIUM: { bg: "#fef9c3", color: "#d97706" }, LOW: { bg: "#dcfce7", color: "#16a34a" },
  };
  const s = map[priority || "LOW"] || map.LOW;
  return <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{priority || "LOW"} Priority</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    DRAFT: { bg: "#f3f4f6", color: "#6b7280", label: "Draft" }, AWAITING_ADVANCE: { bg: "#fef9c3", color: "#d97706", label: "Awaiting Advance" },
    SEARCHING: { bg: "#dbeafe", color: "#2563eb", label: "Searching Engineer" }, IN_PROGRESS: { bg: "#dcfce7", color: "#16a34a", label: "In Progress" },
    IN_REVIEW: { bg: "#ede9fe", color: "#7c3aed", label: "In Review" }, AWAITING_FINAL_PAYMENT: { bg: "#fef9c3", color: "#d97706", label: "Awaiting Final Payment" },
    COMPLETED: { bg: "#dcfce7", color: "#15803d", label: "Completed" }, CANCELED: { bg: "#fee2e2", color: "#ef4444", label: "Canceled" },
  };
  const s = map[status] || { bg: "#f3f4f6", color: "#6b7280", label: status };
  return <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>;
};

const TeamMemberCard = ({ user, label }: { user: any; label: string }) => {
  const isOnline = user.lastActiveAt ? new Date(user.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000) : false;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 48, height: 48, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {user.image ? <img src={user.image} alt={user.name || "User"} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} /> : <User size={24} color={T.textMuted} />}
        <span style={{ position: "absolute", bottom: 2, right: 2, width: 10, height: 10, borderRadius: "50%", background: isOnline ? "#22c55e" : "#d1d5db", border: "1.5px solid #fff" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: T.text }}>{user.name || "Unknown"}</p>
        <p style={{ margin: "1px 0 0", fontSize: 12, color: T.primary, fontWeight: 500 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 11, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
      </div>
    </div>
  );
};

export default function OverviewTab({ project }: { project: any }) {
  const { user } = useAuth();
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(project?.progress || 0);
  const [editModel, setEditModel] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Roles
  const isAdmin = user?.role === "ADMIN";
  const isClient = user?.role === "CLIENT";
  const isEngineer = user?.role === "ENGINEER";
  const canEditDetails = isAdmin || isClient;

  // Milestones Calculation
  const totalMilestones = project?.milestones?.length || 0;
  const completedMilestones = project?.milestones?.filter((m: any) => m.completed).length || 0;

  useEffect(() => {
    if (project?.progress) setCurrentProgress(project.progress);
  }, [project]);

  const copyTextToClipboard = async (link: string) => {
    try { await navigator.clipboard.writeText(link); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch { /* silent */ }
  };

  const handleProgressUpdate = async (newProgress: number) => {
    setUpdating(true);
    try {
      const apiBase = getApiBase(user?.role as string);
      const r = await fetch(`${apiBase}/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: newProgress }),
      });
      const d = await r.json();
      if (d.success) {
        toast.success("Progress updated");
        setShowProgressModal(false);
        setCurrentProgress(newProgress);
      } else {
        toast.error(d.message || "Failed");
      }
    } catch { toast.error("Failed to update progress"); }
    finally { setUpdating(false); }
  };

  // Client Actions
  const handleClientComplete = async () => {
    try {
      const res = await fetch(`/api/client/projects/${project.id}/complete`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Project Marked as Complete!");
        window.location.reload();
      } else {
        toast.error(data.message || "Failed to complete");
      }
    } catch { toast.error("Error occurred"); }
  };

  if (!project) return null;

  const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "1.5rem" };
  const teamSectionLabel = isClient ? "Your Engineer" : isEngineer ? "Your Client" : "Team Members";

  return (
    <>
      <Toaster position="top-right" />
      {editModel && <EditModal showModel={setEditModel} projectData={project} userRole={user?.role as string} />}
      {showSubmitModal && <SubmitReviewModal showModel={setShowSubmitModal} projectData={project} />}
      {showProgressModal && <ProgressModal current={currentProgress} onClose={() => setShowProgressModal(false)} onSave={handleProgressUpdate} saving={updating} />}

      <div className="bg-gray-50" style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* ══════════════ LEFT COLUMN ══════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Progress + Milestones row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <ProgressGauge progress={currentProgress} />
              <p style={{ margin: "12px 0 0", fontWeight: 600, fontSize: 14, color: T.text }}>Overall Progress</p>
              {isEngineer && (
                <button onClick={() => setShowProgressModal(true)} style={{ marginTop: 10, padding: "5px 16px", background: T.primaryLight, border: `1px solid ${T.primary}`, borderRadius: 20, color: T.primary, cursor: "pointer", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <ArrowUp size={13} /> Update
                </button>
              )}
            </div>
            
            <div style={{ background: T.primary, borderRadius: 16, padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 48, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                  {completedMilestones}<span style={{ fontSize: 28, fontWeight: 400 }}>/{totalMilestones}</span>
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Completed Milestones</p>
              </div>
            </div>
          </div>

          {/* Repository */}
          {project?.repository && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>Repository</h2>
              <div style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: T.textMuted }}>{project.repository?.split("/")[4]?.split(".git")[0]}</p>
                <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <code style={{ fontSize: 12, color: T.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.repository}</code>
                  <button onClick={() => copyTextToClipboard(project.repository!)} style={{ width: 28, height: 28, borderRadius: 6, background: T.primary, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
                    {isCopied ? <LucideCheckCheck size={13} color="#fff" /> : <LucideCopy size={13} color="#fff" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Team Members ── */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>{teamSectionLabel}</h2>
            {isClient && (project.engineer?.user ? <TeamMemberCard user={project.engineer.user} label="Engineer" /> : <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>No engineer assigned yet</p>)}
            {isEngineer && (project.client?.user ? <TeamMemberCard user={project.client.user} label="Client" /> : <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>No client found</p>)}
            {isAdmin && (
              <>
                {project.client?.user && <TeamMemberCard user={project.client.user} label="Client" />}
                {project.engineer?.user ? <TeamMemberCard user={project.engineer.user} label="Engineer" /> : <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>No engineer assigned yet</p>}
              </>
            )}
          </div>
        </div>

        {/* ══════════════ RIGHT COLUMN ══════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Project Information card */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Project Information</h2>
              
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {canEditDetails && (
                  <button onClick={() => setEditModel(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                    <LucideEdit3 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ marginBottom: "1rem", display: "flex", gap: 10 }}>
              {isEngineer && project.status === "IN_PROGRESS" && (
                 <button onClick={() => setShowSubmitModal(true)} style={{ padding: "8px 16px", background: T.primary, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                   <Send size={15} /> Submit for Review
                 </button>
              )}
              {isClient && project.status === "IN_REVIEW" && (
                 <button onClick={handleClientComplete} style={{ padding: "8px 16px", background: T.success, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                   <CheckCheck size={16} /> Mark as Completed
                 </button>
              )}
              {isClient && project.status === "AWAITING_FINAL_PAYMENT" && (
                 <button onClick={handleDummyPayment} style={{ padding: "8px 16px", background: T.primary, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                   <CreditCard size={16} /> Pay Final Payment
                 </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <StatusBadge status={project.status} />
                {project.priority && <PriorityBadge priority={project.priority} />}
              </div>

              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: T.text }}>{project.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>{project.description}</p>
              </div>

              {(isAdmin || isEngineer) && (project.budget != null || project.earnings != null) && (
                <div style={{ background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                  <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {isEngineer ? "Earnings" : "Budget"}
                  </p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>
                    ₹{isEngineer ? project.earnings?.toLocaleString() : project.budget?.toLocaleString()}
                  </p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {project.startDate && (
                  <div style={{ background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Start Date</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{new Date(project.startDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                  </div>
                )}
                {project.endDate && (
                  <div style={{ background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deadline</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{new Date(project.endDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                  </div>
                )}
              </div>

              {(isAdmin || isClient) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: project.advancePaid ? "#dcfce7" : "#fee2e2", color: project.advancePaid ? "#16a34a" : "#ef4444" }}>Advance {project.advancePaid ? "Paid" : "Pending"}</span>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: project.isFinalPaymentMade ? "#dcfce7" : "#fee2e2", color: project.isFinalPaymentMade ? "#16a34a" : "#ef4444" }}>Final Payment {project.isFinalPaymentMade ? "Done" : "Pending"}</span>
                </div>
              )}

              {project.finalProjectLink && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em" }}>Final Delivery</p>
                  <a href={project.finalProjectLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#16a34a", textDecoration: "underline", wordBreak: "break-all" }}>{project.finalProjectLink}</a>
                </div>
              )}

              {project.instruments && project.instruments.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Requirements</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {project.instruments.map((inst: string, i: number) => (
                      <span key={i} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: T.primaryLight, color: T.primary, fontWeight: 500, border: `1px solid ${T.primary}33` }}>{inst}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Done History */}
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 1rem" }}>Work Done History</h2>
            {project.kanbanTasks && project.kanbanTasks.length > 0 ? (
               <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                 {project.kanbanTasks.map((task: any) => (
                    <div key={task.id} style={{ padding: "12px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg }}>
                       <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: T.text }}>{task.title}</p>
                       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                         <p style={{ margin: 0, fontSize: 12, color: T.textSec, fontWeight: 500 }}>
                           Status: <span style={{ color: T.primary }}>{task.status.replace("_", " ")}</span>
                         </p>
                         <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>
                           {new Date(task.updatedAt).toLocaleDateString()}
                         </p>
                       </div>
                    </div>
                 ))}
               </div>
            ) : (
               <p style={{ fontSize: 13, color: T.textMuted }}>No recent tasks found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}