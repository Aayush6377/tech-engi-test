"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";   // ← Add this import
import {
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  KeyRound,
  ExternalLink,
  FileText,
  Link2,
  Plus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Credential {
  id: string;
  title: string;
  type: "CREDENTIALS" | "FILE" | "LINK" | "TEXT";
  content: string;
  isLocked: boolean;
  createdAt: string;
}

interface UnlockStatus {
  progress: number;
  isEngineerFinished: boolean;
  isFinalPaymentMade: boolean;
  isReviewApproved: boolean;
}

interface CredentialsTabProps {
  projectId: string;
}

// ─── Lock Screen ──────────────────────────────────────────────────────────────
function LockScreen({ status }: { status: UnlockStatus }) {
  const steps = [
    { label: "Project progress at 100%", done: status.progress === 100 },
    { label: "Engineer marks work as finished", done: status.isEngineerFinished },
    { label: "Client reviews & approves project", done: status.isReviewApproved },
    { label: "Final payment completed", done: status.isFinalPaymentMade },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const pct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="relative min-h-[480px] flex items-center justify-center p-8 overflow-hidden bg-gray-50 rounded-2xl">
      <div className="relative z-10 bg-gray-100 rounded-[20px] px-9 py-10 max-w-[420px] w-full flex flex-col items-center gap-4 shadow-[0_0_0_1px_#ffffff06,0_32px_64px_#00000080]">
        <div className="relative w-[72px] h-[72px] flex items-center justify-center mb-1">
          <Lock className="text-[var(--primary)] w-9 h-9 relative z-10" strokeWidth={1.5} />
        </div>

        <h2 className="font-serif text-2xl text-black tracking-tight m-0">
          Credentials Locked
        </h2>
        <p className="text-sm text-slate-500 text-center">Complete all steps below to unlock</p>

        <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <span className="text-xs text-black self-end -mt-2">
          {completedCount} / {steps.length} steps complete
        </span>

        <ul className="list-none p-0 mt-1 w-full flex flex-col gap-2.5">
          {steps.map((step, i) => (
            <li
              key={i}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${step.done
                  ? "bg-indigo-500/5 border-indigo-500/20"
                  : "bg-gray-300 border-white/[0.05]"
                }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 ${step.done
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-300 text-black border border-[#2d3148]"
                  }`}
              >
                {step.done ? <CheckCheck size={13} /> : i + 1}
              </span>
              <span className={`text-[13px] ${step.done ? "text-black" : "text-black"}`}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 mt-2 text-[11px] text-black">
          <ShieldCheck size={14} className="text-black" />
          <span>Credentials are end-to-end encrypted and auto-unlock on completion</span>
        </div>
      </div>
    </div>
  );
}

// ─── Credential Card ──────────────────────────────────────────────────────────
function CredentialCard({ cred }: { cred: Credential }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const icon =
    cred.type === "LINK" ? <Link2 size={14} /> :
      cred.type === "FILE" ? <FileText size={14} /> :
        <KeyRound size={14} />;

  return (
    <div className="bg-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-indigo-400 bg-indigo-500/[0.07] border border-indigo-500/20 px-2 py-0.5 rounded-md">
          {icon} {cred.type}
        </span>
        <span className="text-[15px] font-semibold text-black flex-1">{cred.title}</span>

        <div className="flex items-center gap-1 ml-auto">
          {cred.type !== "FILE" && (
            <button
              onClick={() => setVisible((v) => !v)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-gray-300 hover:text-black transition-colors"
            >
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          <button
            onClick={() => copy(cred.content)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-gray-300 hover:text-black transition-colors"
          >
            {copied ? <CheckCheck size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          {cred.type === "LINK" && (
            <a
              href={cred.content}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-gray-300 hover:text-black  transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      <div
        className={`font-mono text-[13px] border border-gray-400 rounded-lg px-3.5 py-2.5 break-all bg-gray-300 ${visible || cred.type === "FILE" ? "text-black" : "text-[#334155] tracking-widest select-none"
          }`}
      >
        {visible || cred.type === "FILE" ? cred.content : "•".repeat(Math.min(cred.content.length, 32))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const CredentialsTab = ({ projectId }: CredentialsTabProps) => {
  const { data: session } = useSession();   // ← Get session for role
  const isAdmin = session?.user?.role === "ADMIN";

  const [status, setStatus] = useState<UnlockStatus | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Credential Function (Only for Admin right now - you can extend later)
  const addTestCredential = async () => {
    try {
      const res = await fetch(`/api/admin/project/${projectId}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Admin Test Login",
          content: "Username: admin\nPassword: TestPass123!\nURL: https://example.com",
        }),
      });

      if (res.ok) {
        alert("✅ Credential added successfully!");
        // Refresh credentials
        window.location.reload(); // simple way for now
      } else {
        const data = await res.json();
        alert("Error: " + (data.error || "Failed to add"));
      }
    } catch (err) {
      alert("Failed to add credential");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const statusRes = await fetch(`/api/admin/project/${projectId}/credentials/status`);
        if (!statusRes.ok) throw new Error("Failed to fetch status");

        const statusData: UnlockStatus = await statusRes.json();
        setStatus(statusData);

        // If user is Admin OR all conditions met → fetch credentials
        const shouldUnlock = isAdmin || (
          statusData.progress === 100 &&
          statusData.isEngineerFinished &&
          statusData.isReviewApproved &&
          statusData.isFinalPaymentMade
        );

        if (shouldUnlock) {
          const credsRes = await fetch(`/api/admin/project/${projectId}/credentials`);
          if (credsRes.ok) {
            const credsData = await credsRes.json();
            setCredentials(credsData.credentials ?? []);
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="w-8 h-8 border-2 border-[#1e2130] border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isUnlockedForNormalUser =
    status !== null &&
    status.progress === 100 &&
    status.isEngineerFinished &&
    status.isReviewApproved &&
    status.isFinalPaymentMade;

  // Show LockScreen only to non-admins when not unlocked
  if (!isAdmin && !isUnlockedForNormalUser && status) {
    return <LockScreen status={status} />;
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <ShieldCheck className="w-7 h-7 text-indigo-500 flex-shrink-0" />
          <div>
            <h2 className="font-serif text-[22px] tracking-tight m-0 text-black">
              Project Credentials
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin ? "Admin Mode - Full Access" : "Visible only after project completion"}
            </p>
          </div>
        </div>

        {/* Add Button - Visible to Admin */}
        {isAdmin && (
          <button
            onClick={addTestCredential}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Add Test Credential
          </button>
        )}
      </div>

      {credentials.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-600 text-center">
          <KeyRound size={48} className="text-[#1e2130]" />
          <p>No credentials added yet.</p>
          {isAdmin && <p className="text-xs">Click "Add Test Credential" above to test</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {credentials.map((cred) => (
            <CredentialCard key={cred.id} cred={cred} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CredentialsTab;