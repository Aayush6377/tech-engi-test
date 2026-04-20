"use client";

import { useAuth } from "@/app/hooks/useAuth";
import DashboardShell from "@/components/layout/DashboardShell";
import { Plus, Search, Filter, Users, Calendar, AlertCircle, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";

interface Project {
  id: string;
  title: string;
  description: string;
  budget?: number;
  earnings?: number;
  status: string;
  progress: number;
  instruments: string[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  advancePaid?: boolean;
  isFinalPaymentMade?: boolean;
}

interface User {
  name: string;
  email: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  AWAITING_ADVANCE: { label: "Awaiting Advance", color: "bg-yellow-100 text-yellow-700" },
  SEARCHING: { label: "Searching Engineer", color: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-green-100 text-green-700" },
  IN_REVIEW: { label: "In Review", color: "bg-purple-100 text-purple-700" },
  AWAITING_FINAL_PAYMENT: { label: "Awaiting Final Payment", color: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  CANCELED: { label: "Canceled", color: "bg-red-100 text-red-600" },
};

function StatusBadge({ status }: { status: string }) {
  if (status === "AWAITING_ADVANCE") return null;
  const meta = STATUS_META[status] ?? { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-[10px] font-semibold font-inter px-2 py-0.5 rounded-full ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const amount = project.budget;
  const amountLabel = "Budget";

  return (
    <Link href={`/client/project/${project.id}`}>
      <div className="bg-white border border-[var(--border)] rounded-xl p-5 hover:shadow-md hover:border-[var(--primary)] transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold font-inter text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
            {project.title}
          </h3>
          <StatusBadge status={project.status} />
        </div>

        <p className="text-xs font-inter text-[var(--text-muted)] line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        {project.instruments?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.instruments.slice(0, 3).map((inst) => (
              <span key={inst} className="text-[10px] font-inter px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] border border-[#ffd9a8] rounded-full">
                {inst}
              </span>
            ))}
            {project.instruments.length > 3 && (
              <span className="text-[10px] font-inter text-[var(--text-muted)]">+{project.instruments.length - 3}</span>
            )}
          </div>
        )}

        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-inter text-[var(--text-muted)] mb-1">
            <span>Progress</span>
            <span className="font-semibold text-[var(--text-primary)]">{project.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${project.progress}%`, background: "var(--primary)" }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1 text-[10px] font-inter text-[var(--text-muted)]">
            <Calendar size={11} />
            {new Date(project.createdAt).toLocaleDateString()}
          </div>
          {amount !== undefined && (
            <span className="text-xs font-bold font-inter text-[var(--text-primary)]">
              {amountLabel}: ₹{amount.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Client: Create Project Modal with Razorpay ──────────────────────────────────
function CreateProjectModal({ onClose, onCreated, user }: { onClose: () => void; onCreated: () => void, user: User }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", budget: "", startDate: "", endDate: "" });
  const [instruments, setInstruments] = useState<string[]>([]);
  const [instrInput, setInstrInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const addInstrument = () => {
    const v = instrInput.trim();
    if (v && !instruments.includes(v)) setInstruments((p) => [...p, v]);
    setInstrInput("");
  };

  const handleRazorpayPayment = async (projectId: string, amount: number) => {
    try {
      setProcessingPayment(true);

      // Get Razorpay order from backend
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        setError(orderData.message || "Failed to create payment order");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.order.id,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "Tech-Engi",
        description: "Project Advance Payment (40%)",
        image: "/logo.png",
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success("Payment successful! Project created.");

              // start matching process
              await handleStartMatching(projectId);

              onCreated();
              onClose();
              router.push(`/client/project/${projectId}`);
            } else {
              setError("Payment verification failed");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setError("Payment verification failed");
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "var(--primary)",
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            toast.error("Payment cancelled");
          },
        },
      };

      // Load Razorpay script and open checkout
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const Razorpay = (window as any).Razorpay;
        const razorpayInstance = new Razorpay(options);
        razorpayInstance.open();
      };
      document.body.appendChild(script);
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment setup failed");
      setProcessingPayment(false);
    }
  };


  const handleStartMatching = async (projectId: string) => {
    if (!projectId) return;

    setIsMatching(true);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projectId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Matching started! Finding best engineers...");
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } else {
        toast.error(data.message || "Failed to start matching");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsMatching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate form
      if (form.title.length < 5) {
        setError("Title must be at least 5 characters");
        setLoading(false);
        return;
      }
      if (form.description.length < 20) {
        setError("Description must be at least 20 characters");
        setLoading(false);
        return;
      }
      if (Number(form.budget) < 500) {
        setError("Budget must be at least ₹500");
        setLoading(false);
        return;
      }

      // Create project
      const res = await fetch("/api/client/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          budget: Number(form.budget),
          instruments,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Failed to create project");
        setLoading(false);
        return;
      }
      console.log("API RESPONSE:", data);
      const projectId = data.projectId;
      const advanceAmount = Number(form.budget) * 0.4; // 40% advance

      setLoading(false);

      // Redirect to Razorpay payment
      await handleRazorpayPayment(projectId, advanceAmount);
    } catch (err) {
      console.error("Project creation error:", err);
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-inter outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white text-[var(--text-primary)]";
  const budgetAmount = form.budget ? Number(form.budget) : 0;
  const advanceAmount = (budgetAmount * 0.4).toFixed(0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-bold font-id text-[var(--text-primary)] mb-1">Create New Project</h2>
          <p className="text-xs text-[var(--text-muted)] font-inter mb-5">You'll pay 40% advance after creation</p>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium font-inter text-[var(--text-secondary)] mb-1">Title *</label>
              <input
                className={inputCls}
                placeholder="Project title (min 5 chars)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={100}
                disabled={loading || processingPayment}
                required
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{form.title.length}/100</p>
            </div>

            <div>
              <label className="block text-xs font-medium font-inter text-[var(--text-secondary)] mb-1">Description *</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Describe your project (min 20 chars)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
                disabled={loading || processingPayment}
                required
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{form.description.length}/500</p>
            </div>

            <div>
              <label className="block text-xs font-medium font-inter text-[var(--text-secondary)] mb-1">Budget (₹) *</label>
              <div className="relative">
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Min ₹500"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  min="500"
                  disabled={loading || processingPayment}
                  required
                />
              </div>
              {budgetAmount > 0 && (
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 p-2 bg-blue-50 rounded border border-blue-100">
                  💳 You'll pay <span className="font-bold text-[var(--primary)]">₹{advanceAmount}</span> (40% advance) after project creation
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium font-inter text-[var(--text-secondary)] mb-1">Start Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  disabled={loading || processingPayment}
                />
              </div>
              <div>
                <label className="block text-xs font-medium font-inter text-[var(--text-secondary)] mb-1">End Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  disabled={loading || processingPayment}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium font-inter text-[var(--text-secondary)] mb-1">Instruments / Skills Needed</label>
              <div className="flex gap-2 mb-2">
                <input
                  className={inputCls}
                  placeholder="e.g. React, Node.js"
                  value={instrInput}
                  onChange={(e) => setInstrInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInstrument())}
                  disabled={loading || processingPayment}
                />
                <button
                  type="button"
                  onClick={addInstrument}
                  disabled={loading || processingPayment}
                  className="px-3 py-2 bg-[var(--primary-light)] text-[var(--primary)] border border-[#ffd9a8] rounded-lg text-xs font-inter font-semibold disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {instruments.map((i) => (
                  <span key={i} className="text-[10px] font-inter px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] border border-[#ffd9a8] rounded-full flex items-center gap-1">
                    {i}
                    <button
                      type="button"
                      onClick={() => setInstruments((p) => p.filter((x) => x !== i))}
                      disabled={loading || processingPayment}
                      className="hover:text-red-500 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || processingPayment}
                className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-inter text-[var(--text-secondary)] hover:bg-[var(--bg)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || processingPayment || !form.title.trim() || !form.description.trim() || !form.budget}
                className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-inter font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Creating...
                  </>
                ) : processingPayment ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Opening Payment...
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Create & Pay
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-[var(--text-muted)] text-center pt-2 border-t border-[var(--border)]">
              ✅ Secure payments powered by Razorpay
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectsPage() {

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth() as {user: User};
  
  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = "/api/client/projects";
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) setProjects(data.projects);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const filtered = useMemo(() => projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  }), [projects, search, statusFilter]);

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => ["IN_PROGRESS", "IN_REVIEW", "SEARCHING"].includes(p.status)).length,
    completed: projects.filter((p) => p.status === "COMPLETED").length,
  }), [projects]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-id text-[var(--text-primary)]">
              My Projects
            </h1>
            <p className="text-xs font-inter text-[var(--text-muted)] mt-0.5">
              Manage your projects and track progress
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm font-semibold" style={{ background: "var(--primary)" }}>
            <Plus size={15} /> New Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: stats.total, icon: <Users size={16} />, color: "text-[var(--text-primary)]" },
            { label: "Active", value: stats.active, icon: <Clock size={16} />, color: "text-green-600" },
            { label: "Completed", value: stats.completed, icon: <CheckCircle size={16} />, color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[var(--border)] rounded-xl p-4 flex items-center gap-3">
              <div className={`${s.color}`}>{s.icon}</div>
              <div>
                <p className={`text-xl font-bold font-id ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-inter text-[var(--text-muted)]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm font-inter bg-white text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary)] w-52"
            />
          </div>
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm font-inter bg-white text-[var(--text-primary)] outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <span className="text-xs font-inter text-[var(--text-muted)]">{filtered.length} shown</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-[var(--primary)]" size={36} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <XCircle size={40} className="text-[var(--border)] mb-3" />
            <p className="text-sm font-inter font-semibold text-[var(--text-primary)]">No projects found</p>
            <p className="text-xs font-inter text-[var(--text-muted)] mt-1">
              {projects.length === 0 ? "Create your first project to get started." : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={fetchProjects} user={user} />}
    </DashboardShell>
  );
}