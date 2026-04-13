"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUp, CheckCheck, LucideCheckCheck, LucideCopy, LucideEdit3,
  LucideTrash, User, X, DollarSign, Palette,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import LatestUpdates from "./LatestUpdates";
import { useRouter } from "next/navigation";

/* ─── Design Tokens ───────────────────────────────────────────────────── */
const T = {
  bg: "#f4f4f4",
  card: "#ffffff",
  border: "#e5e5e5",
  primary: "#FFAE58",
  primaryLight: "#fff4e6",
  text: "#050A30",
  textSec: "#4B4B4B",
  textMuted: "#6F6F6F",
  danger: "#ef4444",
  purple: "#8b5cf6",
} as const;

/* ─── Types (aligned with Prisma schema) ─────────────────────────────── */
type ProjectUser = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: "ADMIN" | "CLIENT" | "ENGINEER";
  lastActiveAt?: string;
};

type ClientProfile = {
  id: string;
  userId: string;
  user?: ProjectUser;
};

type EngineerProfile = {
  id: string;
  userId: string;
  user?: ProjectUser;
};

type Project = {
  id: string;
  title: string;
  description: string;
  budget: number;
  instruments: string[];
  progress: number;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  finalProjectLink?: string | null;
  isEngineerFinished?: boolean;
  advancePaid?: boolean;
  isFinalPaymentMade?: boolean;
  // optional custom fields you may have added
  repository?: string | null;
  priority?: "HIGH" | "MEDIUM" | "LOW" | string;
  basicDetails?: string | null;
  // relations
  client?: ClientProfile | null;
  engineer?: EngineerProfile | null;
};

interface OverviewTabProps {
  project: Project;
}

/* ─── Shared input style ──────────────────────────────────────────────── */
const inputCls =
  "w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white text-[#050A30] border-[#e5e5e5]";

/* ─── EditModal ───────────────────────────────────────────────────────── */
const EditModal = ({ showModel, projectData }: { showModel: (v: boolean) => void; projectData: Project }) => {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [techStack, setTechStack] = useState<any[]>([]);
  const [newTech, setNewTech] = useState({ key: "", value: "" });
  const [customCategory, setCustomCategory] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");

  const [formData, setFormData] = useState({
    title: projectData.title,
    description: projectData.description,
    priority: projectData.priority || "MEDIUM",
    repository: projectData.repository || "",
    basicDetails: projectData.basicDetails || "",
    budget: projectData.budget,
    startDate: projectData.startDate || "",
    endDate: projectData.endDate || "",
  });

  const predefinedTech = [
    { key: "Design", options: ["Figma", "Adobe XD", "Sketch", "Canva"] },
    { key: "Frontend", options: ["React", "Next.js", "Vue.js", "Angular"] },
    { key: "Backend", options: ["Node.js", "Python", "Java", "PHP"] },
    { key: "Database", options: ["PostgreSQL", "MongoDB", "MySQL", "Redis"] },
    { key: "Hosting", options: ["Vercel", "AWS", "Netlify", "Heroku"] },
  ];

  const fetchTechnology = async () => {
    try {
      const response = await fetch(`/api/project/technology?projectId=${projectData.id}`);
      const data = await response.json();
      if (data.success && data.data?.tech) setTechStack(data.data.tech);
    } catch { /* silent */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projectData.id, ...formData }),
      });
      await fetch("/api/project/technology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projectData.id, tech: techStack }),
      });
      if (currentPhase && projectData.client?.userId) {
        await fetch("/api/client/analytics/design", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: projectData.client.userId, projectId: projectData.id, currentPhase }),
        });
      }
      const result = await response.json();
      if (result.success) { toast.success("Project updated successfully"); showModel(false); }
      else toast.error("Failed to update project");
    } catch { toast.error("Failed to update project"); }
    finally { setLoading(false); window.location.reload(); }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/admin/adminOnly");
        const d = await r.json();
        if (d.success) setAdmins(d.users);
      } catch { /* silent */ } finally { setLoading(false); }
    })();
    if (projectData.id) fetchTechnology();
  }, [projectData.id]);

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 4,
  };
  const selectCls =
    "w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white text-[#050A30]";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,10,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
      <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 760, maxHeight: "82vh", overflowY: "auto", border: `1px solid ${T.border}`, boxShadow: "0 8px 40px rgba(5,10,48,0.12)" }}>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: T.text, margin: 0 }}>Edit Project</h2>
            <button onClick={() => showModel(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.textMuted }}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Project Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputCls} placeholder="Enter project title" required />
              </div>
              {/* Priority */}
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className={selectCls}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              {/* Budget */}
              <div>
                <label style={labelStyle}>Budget (₹) *</label>
                <input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })} className={inputCls} placeholder="Enter budget" required />
              </div>
              {/* Repository */}
              <div>
                <label style={labelStyle}>Repository</label>
                <input type="text" value={formData.repository} onChange={(e) => setFormData({ ...formData, repository: e.target.value })} className={inputCls} placeholder="URL ending in .git" />
              </div>
              {/* Start Date */}
              <div>
                <label style={labelStyle}>Start Date *</label>
                <input type="date" value={formData.startDate?.split("T")[0]} disabled className={inputCls + " opacity-60 cursor-not-allowed"} />
              </div>
              {/* End Date */}
              <div>
                <label style={labelStyle}>Deadline *</label>
                <input type="date" value={formData.endDate?.split("T")[0]} min={formData.startDate?.split("T")[0]} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className={inputCls} required />
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <label style={labelStyle}>Technology Stack</label>
              {techStack.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  {techStack.map((tech, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px" }}>
                      <span style={{ fontSize: 13, color: T.text }}><strong>{tech.key}:</strong> {tech.value}</span>
                      <button type="button" onClick={() => setTechStack(techStack.filter((_, idx) => idx !== i))} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.danger }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 8 }}>No technology stack configured yet</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
                <select value={newTech.key} onChange={(e) => setNewTech({ ...newTech, key: e.target.value, value: "" })} className={selectCls}>
                  <option value="">Category</option>
                  {predefinedTech.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
                  <option value="custom">Custom</option>
                </select>
                {newTech.key === "custom" ? (
                  <input type="text" placeholder="Custom category" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className={inputCls} />
                ) : newTech.key && predefinedTech.find((c) => c.key === newTech.key) ? (
                  <select value={newTech.value} onChange={(e) => setNewTech({ ...newTech, value: e.target.value })} className={selectCls}>
                    <option value="">Select tech</option>
                    {predefinedTech.find((c) => c.key === newTech.key)?.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" placeholder="Technology" value={newTech.value} onChange={(e) => setNewTech({ ...newTech, value: e.target.value })} className={inputCls} />
                )}
                <button type="button"
                  onClick={() => {
                    if (newTech.key === "custom" && customCategory && newTech.value) {
                      setTechStack([...techStack, { key: customCategory, value: newTech.value }]);
                      setNewTech({ key: "", value: "" }); setCustomCategory("");
                    } else if (newTech.key && newTech.value) {
                      setTechStack([...techStack, newTech]); setNewTech({ key: "", value: "" });
                    }
                  }}
                  disabled={newTech.key === "custom" ? (!customCategory || !newTech.value) : (!newTech.key || !newTech.value)}
                  style={{ padding: "8px 14px", background: T.primary, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Add
                </button>
              </div>
            </div>

            {/* Phase */}
            <div>
              <label style={labelStyle}>Current Project Phase</label>
              <select value={currentPhase} onChange={(e) => setCurrentPhase(e.target.value)} className={selectCls}>
                <option value="">Select phase</option>
                <option value="Design">Design</option>
                <option value="Code">Code</option>
                <option value="Testing">Testing</option>
                <option value="Deployment">Deployment</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls} rows={3} placeholder="Brief project description" />
            </div>

            {/* Basic Details */}
            <div>
              <label style={labelStyle}>Basic Details</label>
              <textarea value={formData.basicDetails} onChange={(e) => setFormData({ ...formData, basicDetails: e.target.value })} className={inputCls} rows={4} placeholder="Detailed description" />
            </div>

            <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
              <button type="button" onClick={() => showModel(false)}
                style={{ flex: 1, padding: "10px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.card, color: T.text, cursor: "pointer", fontWeight: 500, fontSize: 14 }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ flex: 1, padding: "10px", background: T.primary, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Updating..." : <><CheckCheck size={15} />Update Project</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─── ProgressGauge ───────────────────────────────────────────────────── */
const ProgressGauge = ({ progress }: { progress?: number }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - ((progress || 0) / 100) * circumference;
  return (
    <div style={{ position: "relative", width: 120, height: 120 }}>
      <svg style={{ width: 120, height: 120, transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="#e5e5e5" strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r="45" stroke={T.primary} strokeWidth="8" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: T.text }}>{progress || 0}%</span>
      </div>
    </div>
  );
};

/* ─── TeamMemberCard (uses ProjectUser directly) ──────────────────────── */
const TeamMemberCard = ({ user, label }: { user: ProjectUser; label: string }) => {
  // consider online if lastActiveAt within last 5 minutes
  const isOnline = user.lastActiveAt
    ? new Date(user.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000)
    : false;

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 48, height: 48, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {user.image
          ? <img src={user.image} alt={user.name || "User"} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
          : <User size={24} color={T.textMuted} />}
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

/* ─── Priority badge ──────────────────────────────────────────────────── */
const PriorityBadge = ({ priority }: { priority?: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    HIGH: { bg: "#fee2e2", color: "#ef4444" },
    MEDIUM: { bg: "#fef9c3", color: "#d97706" },
    LOW: { bg: "#dcfce7", color: "#16a34a" },
  };
  const s = map[priority || "LOW"] || map.LOW;
  return (
    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {priority || "LOW"} Priority
    </span>
  );
};

/* ─── Status badge ────────────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    DRAFT: { bg: "#f3f4f6", color: "#6b7280", label: "Draft" },
    AWAITING_ADVANCE: { bg: "#fef9c3", color: "#d97706", label: "Awaiting Advance" },
    SEARCHING: { bg: "#dbeafe", color: "#2563eb", label: "Searching Engineer" },
    IN_PROGRESS: { bg: "#dcfce7", color: "#16a34a", label: "In Progress" },
    IN_REVIEW: { bg: "#ede9fe", color: "#7c3aed", label: "In Review" },
    AWAITING_FINAL_PAYMENT: { bg: "#fef9c3", color: "#d97706", label: "Awaiting Final Payment" },
    COMPLETED: { bg: "#dcfce7", color: "#15803d", label: "Completed" },
    CANCELED: { bg: "#fee2e2", color: "#ef4444", label: "Canceled" },
  };
  const s = map[status] || { bg: "#f3f4f6", color: "#6b7280", label: status };
  return (
    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

/* ─── Progress Update Modal ───────────────────────────────────────────── */
const ProgressModal = ({
  current, onClose, onSave, saving,
}: { current: number; onClose: () => void; onSave: (v: number) => void; saving: boolean }) => {
  const [val, setVal] = useState(current);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,10,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: T.card, borderRadius: 16, padding: "1.5rem", width: 340, border: `1px solid ${T.border}`, boxShadow: "0 8px 40px rgba(5,10,48,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: 0 }}>Update Progress</h2>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.textMuted }}><X size={18} /></button>
        </div>
        <input type="range" min={0} max={100} value={val} onChange={(e) => setVal(Number(e.target.value))}
          style={{ width: "100%", accentColor: T.primary }} />
        <p style={{ textAlign: "center", fontWeight: 700, fontSize: 28, color: T.text, margin: "8px 0 16px" }}>{val}%</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.card, color: T.text, cursor: "pointer", fontWeight: 500 }}>Cancel</button>
          <button onClick={() => onSave(val)} disabled={saving}
            style={{ flex: 1, padding: "9px", background: T.primary, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main OverviewTab ────────────────────────────────────────────────── */
export default function OverviewTab({ project }: OverviewTabProps) {
  const [milestones, setMilestones] = useState({ ongoing: 0, total: 0 });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(project?.progress || 0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEngineer, setIsEngineer] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [editModel, setEditModel] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDesignerModal, setShowDesignerModal] = useState(false);
  const router = useRouter();

  const copyTextToClipboard = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!project?.id) return;
    setCurrentProgress(project.progress || 0);

    const checkUserRole = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) return;
        const parsed = JSON.parse(stored);
        const role = parsed?.user?.role || parsed?.role || null;
        if (!role) return;
        const roleName = (typeof role === "string" ? role : role.name)?.toUpperCase().trim();
        if (roleName === "ADMIN") setIsAdmin(true);
        if (roleName === "ENGINEER") setIsEngineer(true);
        if (roleName === "CLIENT") setIsClient(true);
      } catch { /* silent */ }
    };

    const fetchMilestones = async () => {
      try {
        const res = await fetch(`/api/project/milestone?projectId=${project.id}`);
        const data = await res.json();
        if (data.success && data.milestones) {
          const total = data.milestones.length;
          const ongoing = data.milestones.filter((m: any) => m.status === "PENDING" || m.status === "IN_PROGRESS").length;
          setMilestones({ ongoing, total });
        }
      } catch { /* silent */ }
    };

    checkUserRole();
    fetchMilestones();
  }, [project]);

  const handleProgressUpdate = async (newProgress: number) => {
    if (newProgress < 0 || newProgress > 100) { toast.error("Progress must be 0–100"); return; }
    setUpdating(true);
    try {
      const r = await fetch(`/api/project/progress?id=${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: newProgress }),
      });
      if (r.ok) {
        toast.success("Progress updated");
        setShowProgressModal(false);
        setCurrentProgress(newProgress);
      } else {
        const d = await r.json();
        toast.error(d.error || "Failed");
      }
    } catch { toast.error("Failed to update progress"); }
    finally { setUpdating(false); }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      const r = await fetch(`/api/project?projectId=${id}`, { method: "DELETE" });
      const d = await r.json();
      if (d.success) { toast.success("Deleted"); router.back(); }
      else toast.error(d.message || "Failed");
    } catch { toast.error("Failed to delete project"); }
  };

  if (!project) return null;

  const card: React.CSSProperties = {
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 16, padding: "1.5rem",
  };

  // ── Team member section label ──
  const teamSectionLabel =
    isClient ? "Your Engineer" :
    isEngineer ? "Client" :
    "Team Members";

  return (
    <>
      <Toaster position="top-right" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {editModel && <EditModal showModel={setEditModel} projectData={project} />}

      {showProgressModal && (
        <ProgressModal
          current={currentProgress}
          onClose={() => setShowProgressModal(false)}
          onSave={handleProgressUpdate}
          saving={updating}
        />
      )}

      <div style={{ background: T.bg, padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

        {/* ══════════════ LEFT COLUMN ══════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Progress + Milestones row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

            {/* Progress card */}
            <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <ProgressGauge progress={currentProgress} />
              <p style={{ margin: "12px 0 0", fontWeight: 600, fontSize: 14, color: T.text }}>Overall Progress</p>
              {/* Only ADMIN can update progress */}
              {isAdmin && (
                <button
                  onClick={() => setShowProgressModal(true)}
                  style={{ marginTop: 10, padding: "5px 16px", background: T.primaryLight, border: `1px solid ${T.primary}`, borderRadius: 20, color: T.primary, cursor: "pointer", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <ArrowUp size={13} /> Update
                </button>
              )}
            </div>

            {/* Milestones card */}
            <div style={{ background: T.primary, borderRadius: 16, padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 48, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                  {milestones.ongoing}
                  <span style={{ fontSize: 28, fontWeight: 400 }}>/{milestones.total}</span>
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Ongoing Milestones</p>
              </div>
            </div>
          </div>

          {/* Repository — visible to ADMIN and ENGINEER only (not client) */}
          {!isClient && project?.repository && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>Repository</h2>
              <div style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: T.textMuted }}>
                  {project.repository?.split("/")[4]?.split(".git")[0]}
                </p>
                <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <code style={{ fontSize: 12, color: T.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {project.repository}
                  </code>
                  <button
                    onClick={() => copyTextToClipboard(project.repository!)}
                    style={{ width: 28, height: 28, borderRadius: 6, background: T.primary, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
                    {isCopied ? <LucideCheckCheck size={13} color="#fff" /> : <LucideCopy size={13} color="#fff" />}
                  </button>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: T.textMuted, textAlign: "right" }}>Clone the Repository</p>
              </div>
            </div>
          )}

          {/* ── Team Members ── */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>
              {teamSectionLabel}
            </h2>

            {/* CLIENT → sees only the engineer */}
            {isClient && (
              project.engineer?.user
                ? <TeamMemberCard user={project.engineer.user} label="Engineer" />
                : <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>No engineer assigned yet</p>
            )}

            {/* ENGINEER → sees only the client */}
            {isEngineer && (
              project.client?.user
                ? <TeamMemberCard user={project.client.user} label="Client" />
                : <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>No client found</p>
            )}

            {/* ADMIN → sees both client and engineer */}
            {isAdmin && (
              <>
                {project.client?.user && (
                  <TeamMemberCard user={project.client.user} label="Client" />
                )}
                {project.engineer?.user
                  ? <TeamMemberCard user={project.engineer.user} label="Engineer" />
                  : <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>No engineer assigned yet</p>}
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

              {/* Edit / Delete — ADMIN only */}
              {isAdmin && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", background: T.bg, borderRadius: 20, padding: "4px 10px", border: `1px solid ${T.border}`, marginRight: 4 }}>
                    <button onClick={() => setShowDesignerModal(true)} title="Design System"
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", padding: 0 }}>
                      <Palette size={15} />
                    </button>
                    <button onClick={() => setShowBudgetModal(true)} title="Edit Budget"
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", padding: 0 }}>
                      <DollarSign size={16} />
                    </button>
                  </div>
                  <button onClick={() => setEditModel(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                    <LucideEdit3 size={16} />
                  </button>
                  <button onClick={() => deleteProject(project.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                    <LucideTrash size={16} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Badges row */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <StatusBadge status={project.status} />
                {project.priority && <PriorityBadge priority={project.priority} />}
              </div>

              {/* Title + Description — visible to ALL roles */}
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: T.text }}>{project.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>{project.description}</p>
              </div>

              {/* Budget — ADMIN and ENGINEER can see, CLIENT cannot */}
              {(isAdmin || isEngineer) && project.budget != null && (
                <div style={{ background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                  <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Budget</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>₹{project.budget.toLocaleString()}</p>
                </div>
              )}

              {/* Dates — visible to ALL roles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {project.startDate && (
                  <div style={{ background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Start Date</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>
                      {new Date(project.startDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}
                {project.endDate && (
                  <div style={{ background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deadline</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>
                      {new Date(project.endDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment status chips — visible to ADMIN and CLIENT */}
              {(isAdmin || isClient) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: project.advancePaid ? "#dcfce7" : "#fee2e2", color: project.advancePaid ? "#16a34a" : "#ef4444" }}>
                    Advance {project.advancePaid ? "Paid" : "Pending"}
                  </span>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: project.isFinalPaymentMade ? "#dcfce7" : "#fee2e2", color: project.isFinalPaymentMade ? "#16a34a" : "#ef4444" }}>
                    Final Payment {project.isFinalPaymentMade ? "Done" : "Pending"}
                  </span>
                </div>
              )}

              {/* Final project link — visible to ALL once available */}
              {project.finalProjectLink && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em" }}>Final Delivery</p>
                  <a href={project.finalProjectLink} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#16a34a", textDecoration: "underline", wordBreak: "break-all" }}>
                    {project.finalProjectLink}
                  </a>
                </div>
              )}

              {/* Basic details — visible to ALL */}
              {project.basicDetails && (
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</p>
                  <p style={{ margin: 0, fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>{project.basicDetails}</p>
                </div>
              )}

              {/* Instruments / requirements tags — visible to ALL */}
              {project.instruments && project.instruments.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Requirements</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {project.instruments.map((inst, i) => (
                      <span key={i} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: T.primaryLight, color: T.primary, fontWeight: 500, border: `1px solid ${T.primary}33` }}>
                        {inst}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Done History */}
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 1rem" }}>Work Done History</h2>
            <LatestUpdates projectId={project.id} />
          </div>
        </div>
      </div>
    </>
  );
}