"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import TabContent from "@/components/project/TabContent";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Tab definitions
const CLIENT_TABS = ["Overview", "Daily Taks", "Kanban", "Milestones", "Credentials", "Assets", "Report Issue", "Chat", "Payout"];

function getTabsForRole() {
  return CLIENT_TABS;
}

function TabBar({ tabs, active, setActive }: { tabs: string[]; active: string; setActive: (t: string) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--border)] bg-white overflow-x-auto">
      <Link href="/client/project" className="p-3 hover:bg-[var(--primary-light)] transition-colors shrink-0">
        <ArrowLeft size={18} className="text-[var(--text-muted)]" />
      </Link>
      {tabs.map((tab) => {
        const isActive = active === tab;
        return (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`relative px-4 py-4 text-sm font-inter whitespace-nowrap transition-all duration-150 shrink-0
              ${isActive ? "text-[var(--primary)] font-semibold" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
          >
            {tab}
            {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)] rounded-t-full" />}
          </button>
        );
      })}
    </div>
  );
}

function RoleTabContent({ tab, project }: {
  tab: string;
  project: any;
}) {
  return <TabContent activeTab={tab} project={project} />;
}

// Main Component
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (!projectId) return;

    const endpoint = `/api/overview/${projectId}`;

    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message || "Failed to load project");
          return;
        }
        setProject(data.project);
        console.log("Project data loaded:", data.project);
        const tabs = getTabsForRole();
        setActiveTab(tabs[0]);
      })
      .catch(() => setError("Failed to load project"))
      .finally(() => setLoading(false));
  }, [role, projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[var(--primary)]" size={36} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <p className="text-sm font-inter text-red-500">{error || "Project not found"}</p>
        <Link href="/dashboard/project" className="text-xs font-inter text-[var(--primary)] underline">
          ← Back to projects
        </Link>
      </div>
    );
  }

  const tabs = getTabsForRole();

  return (
    <div>
      {/* Project Header */}
      <h1 className="text-lg font-bold font-id text-[var(--text-primary)] pb-4">{project.title}</h1>

      <TabBar tabs={tabs} active={activeTab} setActive={setActiveTab} />

      <div className="mt-6  px-2">
        <RoleTabContent
          tab={activeTab}
          project={project}
        />
      </div>
    </div>
  );
}