"use client";

import { fetcher } from "@/lib/fetcher";
import {
  Mail,
  Phone,
  Calendar,
  User,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  Leaf,
  LucideTrash,
  LucideLoader,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import useSWR from "swr";

// ─── Design tokens (matching your dashboard) ───────────────────────────────
// --bg:             #f4f4f4
// --bg-card:        #ffffff
// --border:         #e5e5e5
// --primary:        #FFAE58
// --primary-light:  #fff4e6
// --text-primary:   #050A30
// --text-secondary: #4B4B4B
// --text-muted:     #6F6F6F

// ─── Static mock data ───────────────────────────────────────────────────────
const STATIC_EMPLOYEES = [
  {
    id: "1",
    name: "Varun Sharma",
    email: "arjun.sharma@techEngi.com",
    employeeId: "EMP-001",
    phone: "+91 98765 43210",
    department: "Web Development",
    workingAs: "Full Stack Developer",
    bio: "Passionate about building scalable web apps.",
    joiningDate: "2022-06-15T00:00:00.000Z",
    dob: "1995-03-22",
    isLogin: true,
    image: null,
    githubProfile: "arjun-sharma",
    timezone: { code: "IST" },
    leaves: { total: 8, remaining: 5, emergency: 1, sick: 2 },
    role: { id: "r1", name: "EMPLOYEE" },
  },
  {
    id: "2",
    name: "Priya Mehta",
    email: "priya.mehta@techEngi.com",
    employeeId: "EMP-002",
    phone: "+91 91234 56789",
    department: "UI / UX Design",
    workingAs: "UI/UX Designer",
    bio: "Design is not just what it looks like — it's how it works.",
    joiningDate: "2023-01-10T00:00:00.000Z",
    dob: "1997-07-14",
    isLogin: false,
    image: null,
    githubProfile: null,
    timezone: { code: "IST" },
    leaves: { total: 8, remaining: 3, emergency: 0, sick: 1 },
    role: { id: "r1", name: "EMPLOYEE" },
  },
  {
    id: "3",
    name: "Ravi Kumar",
    email: "ravi.kumar@techEngi.com",
    employeeId: "EMP-003",
    phone: "+91 99887 76655",
    department: "Mobile App Development",
    workingAs: "Mobile App Developer",
    bio: "Flutter and React Native enthusiast.",
    joiningDate: "2021-11-01T00:00:00.000Z",
    dob: "1993-12-05",
    isLogin: true,
    image: null,
    githubProfile: "ravi-dev",
    timezone: { code: "IST" },
    leaves: { total: 8, remaining: 6, emergency: 2, sick: 1 },
    role: { id: "r1", name: "EMPLOYEE" },
  },
  {
    id: "4",
    name: "Vicky Patel",
    email: "sneha.patel@techEngi.com",
    employeeId: "EMP-004",
    phone: "+91 88776 55443",
    department: "QA & Testing",
    workingAs: "QA Engineer",
    bio: "Finding bugs before users do is my superpower.",
    joiningDate: "2022-09-20T00:00:00.000Z",
    dob: "1996-05-18",
    isLogin: false,
    image: null,
    githubProfile: null,
    timezone: { code: "IST" },
    leaves: { total: 8, remaining: 4, emergency: 1, sick: 0 },
    role: { id: "r1", name: "EMPLOYEE" },
  },
];

const STATIC_ADMINS = [
  {
    id: "a1",
    name: "Vikram Singh",
    email: "vikram@techEngi.com",
    employeeId: "ADM-001",
    phone: "+91 70000 11111",
    department: "Project Management",
    workingAs: "Project Manager",
    bio: "Leading teams to deliver impactful products.",
    joiningDate: "2020-03-01T00:00:00.000Z",
    dob: "1988-09-10",
    isLogin: true,
    image: null,
    githubProfile: "vikram-pm",
    timezone: { code: "IST" },
    leaves: { total: 8, remaining: 7, emergency: 0, sick: 0 },
    role: { id: "r2", name: "ADMIN" },
  },
  {
    id: "a2",
    name: "Neha Joshi",
    email: "neha.joshi@techEngi.com",
    employeeId: "ADM-002",
    phone: "+91 70011 22222",
    department: "HR & Talent Management",
    workingAs: "HR Manager",
    bio: "People first, always.",
    joiningDate: "2019-07-15T00:00:00.000Z",
    dob: "1990-04-25",
    isLogin: false,
    image: null,
    githubProfile: null,
    timezone: { code: "IST" },
    leaves: { total: 8, remaining: 5, emergency: 1, sick: 1 },
    role: { id: "r2", name: "ADMIN" },
  },
];

const STATIC_CLIENTS = [
  {
    id: "c1",
    name: "Young Alaska Corp",
    email: "contact@youngalaska.com",
    phone: "+1 415 555 0101",
    bio: "Building next-gen SaaS solutions.",
    joiningDate: "2023-05-01T00:00:00.000Z",
    isLogin: true,
    image: null,
    role: { id: "r3", name: "CLIENT" },
  },
  {
    id: "c2",
    name: "Meridian Labs",
    email: "hello@meridianlabs.io",
    phone: "+44 20 7946 0301",
    bio: "AI-powered analytics for enterprise.",
    joiningDate: "2024-01-20T00:00:00.000Z",
    isLogin: false,
    image: null,
    role: { id: "r3", name: "CLIENT" },
  },
];

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    padding: 32,
    fontFamily: "inherit",
  } as React.CSSProperties,
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e5e5",
    padding: 20,
    boxShadow: "0 1px 4px rgba(5,10,48,0.05)",
    transition: "box-shadow 0.2s",
    cursor: "pointer",
  } as React.CSSProperties,
  avatar: (isLogin: boolean) =>
    ({
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: "#fff4e6",
      border: "2px solid #FFAE58",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
      fontWeight: 600,
      color: "#FFAE58",
      position: "relative",
      flexShrink: 0,
    } as React.CSSProperties),
  dot: (isLogin: boolean) =>
    ({
      position: "absolute",
      bottom: 1,
      right: 1,
      width: 11,
      height: 11,
      borderRadius: "50%",
      background: isLogin ? "#22c55e" : "#9ca3af",
      border: "2px solid #fff",
    } as React.CSSProperties),
  badge: (color: string, bg: string) =>
    ({
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: bg,
      color,
    } as React.CSSProperties),
  label: { fontSize: 12, color: "#6F6F6F" } as React.CSSProperties,
  value: {
    fontSize: 13,
    color: "#050A30",
    fontWeight: 500,
  } as React.CSSProperties,
  divider: {
    borderTop: "1px solid #e5e5e5",
    marginTop: 14,
    paddingTop: 12,
  } as React.CSSProperties,
  tabActive: {
    padding: "8px 20px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: "#FFAE58",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  } as React.CSSProperties,
  tabInactive: {
    padding: "8px 20px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    background: "transparent",
    color: "#6F6F6F",
    border: "none",
    cursor: "pointer",
  } as React.CSSProperties,
  iconRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#6F6F6F",
  } as React.CSSProperties,
  actionBtn: (danger = false) =>
    ({
      padding: "6px 8px",
      borderRadius: 8,
      background: danger ? "#fff0f0" : "#f4f4f4",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
    } as React.CSSProperties),
};

// ─── Employee Card ───────────────────────────────────────────────────────────
function EmployeeCard({ u }: { u: (typeof STATIC_EMPLOYEES)[0] }) {
  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      {/* Action buttons */}
      <div
        style={{
          position: "absolute",
          top: -28,
          right: 8,
          display: "flex",
          gap: 4,
          zIndex: 10,
        }}
      >
        <button style={s.actionBtn()} title="Edit">
          <Edit2 size={14} color="#6F6F6F" />
        </button>
        <button style={s.actionBtn(true)} title="Delete">
          <Trash2 size={14} color="#e53e3e" />
        </button>
      </div>

      <div style={s.card}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* Avatar */}
          <div style={s.avatar(u.isLogin)}>
            {u.image ? (
              <Image
                src={u.image}
                alt={u.name}
                width={56}
                height={56}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              u.name.charAt(0)
            )}
            <div style={s.dot(u.isLogin)} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: "#050A30" }}>
                {u.name}
              </span>
              <span style={s.badge("#FFAE58", "#fff4e6")}>
                {u.workingAs || "Employee"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={s.iconRow}>
                <Mail size={12} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {u.email}
                </span>
              </div>
              <div style={s.iconRow}>
                <Phone size={12} />
                <span>{u.phone || "N/A"}</span>
              </div>
              <div style={s.iconRow}>
                <User size={12} />
                <span>ID: {u.employeeId || "N/A"}</span>
              </div>
              <div style={s.iconRow}>
                <Calendar size={12} />
                <span>
                  Joined:{" "}
                  {u.joiningDate
                    ? new Date(u.joiningDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
              <div style={s.iconRow}>
                <Leaf size={12} />
                <span>
                  Leaves: {(u.leaves?.sick ?? 0) + (u.leaves?.emergency ?? 0)} /{" "}
                  {u.leaves?.total ?? 8}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={s.divider}>
          <p style={{ fontSize: 12, color: "#4B4B4B", margin: 0 }}>
            {u.bio || "Hardworking and result-oriented professional"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <div style={s.iconRow}>
            <MapPin size={12} />
            <span>{u.timezone?.code || "NOT SET"}</span>
          </div>
          <div style={s.iconRow}>
            <span>
              DOB:{" "}
              {u.dob
                ? new Date(u.dob).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Card ──────────────────────────────────────────────────────────────
function AdminCard({ u }: { u: (typeof STATIC_ADMINS)[0] }) {
  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      <div
        style={{
          position: "absolute",
          top: -28,
          right: 8,
          display: "flex",
          gap: 4,
          zIndex: 10,
        }}
      >
        <button style={s.actionBtn()} title="Edit">
          <Edit2 size={14} color="#6F6F6F" />
        </button>
        <button style={s.actionBtn(true)} title="Delete">
          <Trash2 size={14} color="#e53e3e" />
        </button>
      </div>

      <div style={s.card}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={s.avatar(u.isLogin)}>
            {u.image ? (
              <Image
                src={u.image}
                alt={u.name}
                width={56}
                height={56}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              u.name.charAt(0)
            )}
            <div style={s.dot(u.isLogin)} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: "#050A30" }}>
                {u.name}
              </span>
              <span style={s.badge("#050A30", "#f4f4f4")}>{u.workingAs}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={s.iconRow}>
                <Mail size={12} />
                <span>{u.email}</span>
              </div>
              <div style={s.iconRow}>
                <Phone size={12} />
                <span>{u.phone || "N/A"}</span>
              </div>
              <div style={s.iconRow}>
                <User size={12} />
                <span>ID: {u.employeeId || "N/A"}</span>
              </div>
              <div style={s.iconRow}>
                <Calendar size={12} />
                <span>
                  Joined:{" "}
                  {u.joiningDate
                    ? new Date(u.joiningDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={s.divider}>
          <p style={{ fontSize: 12, color: "#4B4B4B", margin: 0 }}>{u.bio}</p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <div style={s.iconRow}>
            <MapPin size={12} />
            <span>{u.timezone?.code || "NOT SET"}</span>
          </div>
          <div style={s.iconRow}>
            <span>
              DOB:{" "}
              {u.dob
                ? new Date(u.dob).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Client Card ─────────────────────────────────────────────────────────────
function ClientCard({ u }: { u: (typeof STATIC_CLIENTS)[0] }) {
  return (
    <div style={{ ...s.card, position: "relative" }}>
      <button
        style={{
          ...s.actionBtn(true),
          position: "absolute",
          top: 12,
          right: 12,
        }}
        title="Delete"
      >
        <Trash2 size={14} color="#e53e3e" />
      </button>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={s.avatar(u.isLogin)}>
          {u.image ? (
            <Image
              src={u.image}
              alt={u.name}
              width={56}
              height={56}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            u.name.charAt(0)
          )}
          <div style={s.dot(u.isLogin)} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#050A30",
              marginBottom: 6,
            }}
          >
            {u.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={s.iconRow}>
              <Mail size={12} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {u.email}
              </span>
            </div>
            <div style={s.iconRow}>
              <Phone size={12} />
              <span>{u.phone || "N/A"}</span>
            </div>
            <div style={s.iconRow}>
              <Calendar size={12} />
              <span>
                Joined:{" "}
                {u.joiningDate
                  ? new Date(u.joiningDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div style={s.divider}>
        <p style={{ fontSize: 12, color: "#4B4B4B", margin: 0 }}>
          Bio: {u.bio || "N/A"}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function RoleDashboard({
  role,
}: {
  role: "ENGINEER" | "ADMIN" | "CLIENT";
}) {
  const [selectedRole, setSelectedRole] = useState<
    "ENGINEER" | "ADMIN" | "CLIENT"
  >(role);
  const [search, setSearch] = useState("");

  // const allUsers = [...STATIC_EMPLOYEES, ...STATIC_ADMINS, ...STATIC_CLIENTS];

  // const visibleUsers = allUsers
  //   .filter((u) => u.role.name === selectedRole)
  //   .filter((u) => {
  //     const q = search.toLowerCase();
  //     return (
  //       u.name.toLowerCase().includes(q) ||
  //       u.email.toLowerCase().includes(q) ||
  //       ('phone' in u && u.phone?.toLowerCase().includes(q)) ||
  //       ('employeeId' in u && (u as any).employeeId?.toLowerCase().includes(q))
  //     );
  //   });
  const { data, isLoading, error } = useSWR(
    `/api/admin/users?role=${role}`,
    fetcher
  );
  const visibleUsers = data?.users ?? [];
  const tabs: ("ENGINEER" | "ADMIN" | "CLIENT")[] = [
    "ENGINEER",
    "ADMIN",
    "CLIENT",
  ];
  const tabLabel = {
    ENGINEER: "Engineers",
    ADMIN: "Admins",
    CLIENT: "Clients",
  };

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#050A30",
            }}
          >
            {tabLabel[selectedRole]}
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#6F6F6F",
                marginLeft: 10,
              }}
            >
              {visibleUsers.length}
            </span>
          </h1>
          {/* Tabs */}
          {/* <div
            style={{
              display: "flex",
              gap: 4,
              background: "#fff",
              borderRadius: 10,
              padding: 4,
              border: "1px solid #e5e5e5",
            }}
          >
            {tabs.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                style={selectedRole === role ? s.tabActive : s.tabInactive}
              >
                {tabLabel[role]}
              </button>
            ))}
          </div> */}

          <div style={{ display: "flex", gap: 10 }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name, email, phone or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                background: "#fff",
                fontSize: 13,
                color: "#050A30",
                width: 280,
                outline: "none",
              }}
            />

            {/* Add button */}
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "#FFAE58",
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={15} />
              Add
            </button>
          </div>
        </div>
      </div>

      {isLoading && selectedRole === "ENGINEER" && (
        <div className="h-full w-full flex items-center justify-center">
          <Loader2 className="animate-spin" color="var(--primary)" />
        </div>
      )}
      {/* ── Content ── */}
      {!isLoading && selectedRole === "ENGINEER" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 24,
            paddingTop: 20,
          }}
        >
          {(visibleUsers as typeof STATIC_EMPLOYEES).map((u) => (
            <EmployeeCard key={u.id} u={u} />
          ))}
          {visibleUsers.length === 0 && (
            <p
              style={{
                color: "#6F6F6F",
                gridColumn: "1/-1",
                textAlign: "center",
                paddingTop: 40,
              }}
            >
              No employees found.
            </p>
          )}
        </div>
      )}

      {!isLoading && selectedRole === "ADMIN" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            paddingTop: 20,
            maxWidth: 680,
          }}
        >
          {(visibleUsers as typeof STATIC_ADMINS).map((u) => (
            <AdminCard key={u.id} u={u} />
          ))}
          {visibleUsers.length === 0 && (
            <p
              style={{ color: "#6F6F6F", textAlign: "center", paddingTop: 40 }}
            >
              No admins found.
            </p>
          )}
        </div>
      )}

      {!isLoading && selectedRole === "CLIENT" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {(visibleUsers as typeof STATIC_CLIENTS).map((u) => (
            <ClientCard key={u.id} u={u} />
          ))}
          {visibleUsers.length === 0 && (
            <p
              style={{
                color: "#6F6F6F",
                gridColumn: "1/-1",
                textAlign: "center",
                paddingTop: 40,
              }}
            >
              No clients found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
