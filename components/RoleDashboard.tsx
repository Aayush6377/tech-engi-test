"use client";

import { fetcher } from "@/lib/fetcher";
import {
  Mail,
  Calendar,
  User,
  Edit2,
  Trash2,
  Plus,
  Loader2,
  Ban,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";


import { io } from "socket.io-client"; 
import EditUserModal from "./admin/EditUserModal";
import ConfirmModal from "./ConfirmModal";
const socket = io();

const s = {
  page: { minHeight: "100vh", background: "#f9fafb", padding: 32, fontFamily: "inherit" } as React.CSSProperties,
  card: { position: "relative", background: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 20, boxShadow: "0 1px 4px rgba(5,10,48,0.05)", transition: "box-shadow 0.2s" } as React.CSSProperties,
  avatar: (isSuspended: boolean) => ({ width: 56, height: 56, borderRadius: "50%", background: isSuspended ? "#fee2e2" : "#fff4e6", border: `2px solid ${isSuspended ? "#ef4444" : "#FFAE58"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, color: isSuspended ? "#ef4444" : "#FFAE58", position: "relative", flexShrink: 0 } as React.CSSProperties),
  dot: (isActive: boolean) => ({ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: isActive ? "#22c55e" : "#9ca3af", border: "2px solid #fff" } as React.CSSProperties),
  badge: (color: string, bg: string) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color } as React.CSSProperties),
  divider: { borderTop: "1px solid #e5e5e5", marginTop: 14, paddingTop: 12 } as React.CSSProperties,
  iconRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6F6F6F" } as React.CSSProperties,
  actionBtn: (danger = false) => ({ padding: "6px 8px", borderRadius: 8, background: danger ? "#fff0f0" : "#f4f4f4", border: "none", cursor: "pointer", display: "flex", alignItems: "center" } as React.CSSProperties),
};

export default function RoleDashboard({ role }: { role: "ENGINEER" | "ADMIN" | "CLIENT" }) {
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [suspendingUser, setSuspendingUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [liveUsers, setLiveUsers] = useState<Record<string, boolean>>({});

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/users?role=${role}&search=${encodeURIComponent(search)}`,
    fetcher
  );
  const visibleUsers = data?.users ?? [];

  useEffect(() => {
    if (visibleUsers.length === 0) return;

    const userIds = visibleUsers.map((u: any) => u.id);
    socket.emit("check_multiple_users_status", userIds);

    const handleBulkStatus = (statuses: Record<string, boolean>) => {
      setLiveUsers((prev) => ({ ...prev, ...statuses }));
    };

    const handleStatusChange = ({ userId, isOnline }: { userId: string, isOnline: boolean }) => {
      setLiveUsers((prev) => ({ ...prev, [userId]: isOnline }));
    };

    socket.on("multiple_users_status_result", handleBulkStatus);
    socket.on("user_status_change", handleStatusChange);

    return () => {
      socket.off("multiple_users_status_result", handleBulkStatus);
      socket.off("user_status_change", handleStatusChange);
    };
  }, [visibleUsers]);

  const tabLabel = {
    ENGINEER: "Engineers",
    ADMIN: "Admins",
    CLIENT: "Clients",
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("User deleted successfully");
        mutate();
      } else {
        toast.error(result.message || "Failed to delete");
      }
    } catch {
      toast.error("Internal Server Error");
    } finally {
      setIsProcessing(false);
      setDeletingUser(null);
    }
  };

  const handleSuspend = async () => {
    if (!suspendingUser) return;
    setIsProcessing(true);
    const newSuspendStatus = !suspendingUser.isSuspended;
    try {
      const res = await fetch(`/api/admin/users/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: suspendingUser.id, isSuspended: newSuspendStatus }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        mutate();
      } else {
        toast.error(result.message || "Failed to update status");
      }
    } catch {
      toast.error("Internal Server Error");
    } finally {
      setIsProcessing(false);
      setSuspendingUser(null);
    }
  };

  const renderCard = (u: any) => {
    const isDbActive = new Date().getTime() - new Date(u.lastActive).getTime() < 15 * 60 * 1000;
    const isActive = liveUsers[u.id] !== undefined ? liveUsers[u.id] : isDbActive;

    return (
      <div key={u.id} style={s.card}>
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 4, zIndex: 10 }}>
          <button onClick={() => setSuspendingUser(u)} style={s.actionBtn()} title={u.isSuspended ? "Unsuspend" : "Suspend"}>
            {u.isSuspended ? <CheckCircle size={14} color="#22c55e" /> : <Ban size={14} color="#f59e0b" />}
          </button>
          <button onClick={() => setEditingUser(u)} style={s.actionBtn()} title="Edit">
            <Edit2 size={14} color="#6F6F6F" />
          </button>
          <button onClick={() => setDeletingUser(u)} style={s.actionBtn(true)} title="Delete">
            <Trash2 size={14} color="#e53e3e" />
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={s.avatar(u.isSuspended)}>
            {u.image ? (
              <Image src={u.image} alt={u.name || "User"} width={56} height={56} style={{ borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              (u.name || "U").charAt(0).toUpperCase()
            )}
            
            <div style={s.dot(isActive)} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, paddingRight: 80 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: u.isSuspended ? "#ef4444" : "#050A30" }}>
                {u.name || "Unnamed"}
              </span>
            </div>

            {(role === "ENGINEER") && (
              <div style={{ marginBottom: 6 }}>
                <span style={s.badge("#FFAE58", "#f4f4f4")}>
                  {u.status || "PENDING"}
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={s.iconRow}>
                <Mail size={12} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
              </div>
              
              {role === "CLIENT" && (
                <div style={s.iconRow}>
                  <User size={12} />
                  <span>Projects: {u.totalProjects || 0}</span>
                </div>
              )}

              {role === "ENGINEER" && (
                <div style={s.iconRow}>
                  <User size={12} />
                  <span>Completed Work: {u.completedProjects || 0}</span>
                </div>
              )}

              {u.joinedAt && (
                <div style={s.iconRow}>
                  <Calendar size={12} />
                  <span>
                    Joined: {new Date(u.joinedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={s.divider}>
          <p style={{ fontSize: 12, color: "#4B4B4B", margin: 0, lineHeight: "1.4" }}>
            {role === "ENGINEER" && (
              <><strong>Skills:</strong> {u.skills?.length ? u.skills.join(", ") : "Not provided"}</>
            )}
            {role === "CLIENT" && (
              <><strong>Expertise:</strong> {u.expertise?.length ? u.expertise.join(", ") : "Not provided"}</>
            )}
            {role === "ADMIN" && "Platform Administrator"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div style={s.page}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#050A30" }}>
            {tabLabel[role]}
            <span style={{ fontSize: 14, fontWeight: 500, color: "#6F6F6F", marginLeft: 10 }}>
              {visibleUsers.length}
            </span>
          </h1>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", fontSize: 13, color: "#050A30", width: 280, outline: "none" }}
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="h-40 w-full flex items-center justify-center">
          <Loader2 className="animate-spin" color="#FFAE58" size={32} />
        </div>
      )}

      {!isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24, paddingTop: 20 }}>
          {visibleUsers.map((u: any) => renderCard(u))}
          {visibleUsers.length === 0 && (
            <p style={{ color: "#6F6F6F", gridColumn: "1/-1", textAlign: "center", paddingTop: 40 }}>
              No {tabLabel[role].toLowerCase()} found.
            </p>
          )}
        </div>
      )}

      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => {
          mutate();
          setEditingUser(null);
        }}
      />

      <ConfirmModal
        isOpen={!!deletingUser}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${deletingUser?.name}? All associated data and files will be wiped.`}
        confirmText="Delete"
        isDanger={true}
        isLoading={isProcessing}
        onCancel={() => setDeletingUser(null)}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        isOpen={!!suspendingUser}
        title={suspendingUser?.isSuspended ? "Unsuspend User" : "Suspend User"}
        message={
          suspendingUser?.isSuspended
            ? `Are you sure you want to unsuspend ${suspendingUser.name} and restore their access?`
            : `Are you sure you want to suspend ${suspendingUser?.name}? They will not be able to log in to the platform.`
        }
        confirmText={suspendingUser?.isSuspended ? "Unsuspend" : "Suspend"}
        isDanger={!suspendingUser?.isSuspended}
        isLoading={isProcessing}
        onCancel={() => setSuspendingUser(null)}
        onConfirm={handleSuspend}
      />
    </div>
  );
}