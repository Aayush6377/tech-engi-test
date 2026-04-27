"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, CreditCard, Users, MessageSquare, LogOut, ChevronLeft, ChevronRight,
  User, UserKeyIcon, FolderKanban,
  Presentation,
  Lightbulb,
  FileUp,
  Handshake
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  href: string;
}

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/admin" },
  { label: "Projects", icon: <FolderKanban size={18} />, href: "/admin/project" },
  { label: "Client Management", icon: <User size={18} />, href: "/admin/client-management" },
  { label: "Engineer Management", icon: <UserKeyIcon size={18} />, href: "/admin/engineer-management" },
  { label: "Invitations Management", icon: <UserKeyIcon size={18} />, href: "/admin/invitations-management" },
  { label: "Payment", icon: <CreditCard size={18} />, href: "/admin/payment" },
  { label: "Customers", icon: <Users size={18} />, href: "/admin/customers" },
  { label: "Message", icon: <MessageSquare size={18} />, href: "/admin/message" },];

const CLIENT_NAV: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/client" },
  // { label: "Documents", icon: <FileUp size={18} />, href: "/client/documents" },
  // { label: "Features", icon: <Lightbulb size={18} />, href: "/client/feature-requests" },
  // { label: "Feedback", icon: <Handshake size={18} />, href: "/client/feedbacks" },
  { label: "Message", icon: <MessageSquare size={18} />, href: "/client/message" },
  // { label: "Meetings", icon: <Presentation size={18} />, href: "/client/schedule-meet" },
  { label: "Projects", icon: <FolderKanban size={18} />, href: "/client/project" },
  { label: "Payout", icon: <CreditCard size={18} />, href: "/client/account" },
  { label: "Profile", icon: <User size={18} />, href: "/client/profile" },
];

const ENGINEER_NAV: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/engineer" },
  { label: "Projects", icon: <FolderKanban size={18} />, href: "/engineer/project" },
  { label: "Message", icon: <MessageSquare size={18} />, href: "/engineer/message" },
  { label: "Payout", icon: <CreditCard size={18} />, href: "/engineer/payout" },
];

const NavLink = ({ item, collapsed }: { item: NavItem; collapsed: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold font-inter transition-all duration-200 group relative
          ${isActive
          ? "bg-[#fff4e6] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[#fff4e6] hover:text-[var(--text-primary)]"
        }`}
    >
      <span className={`shrink-0 ${isActive ? "text-[#FFAE58]" : "text-gray-400 group-hover:text-[#FFAE58]"}`}>
        {item.icon}
      </span>
      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className={`text-xs px-1.5 py-0.5 font-semibold font-inter
            ${typeof item.badge === "number"
            ? "bg-[#FFAE58] text-white"
            : "bg-black text-white"
          }`}
        >
          {item.badge}
        </span>
      )}
      {collapsed && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
          {item.label}
        </span>
      )}
    </Link>
  );
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin, isEngineer, isClient } = useAuth();
  const nav = isAdmin ? ADMIN_NAV : isEngineer ? ENGINEER_NAV : isClient ? CLIENT_NAV : [];

  return (
    <aside
      style={{ width: collapsed ? 68 : 210 }}
      className="h-screen flex flex-col bg-white border-r border-[var(--border)] transition-all duration-300 shrink-0 relative"
    >
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[var(--border)]">
        {!collapsed && <span className="font-bold font-benz text-lg text-[var(--text-primary)] tracking-tight">TECH ENGI</span>}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-[var(--border)] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all z-10 text-gray-400 hover:text-[#FFAE58]"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => <NavLink key={item.label} item={item} collapsed={collapsed} />)}
      </nav>

      <div className="border-t border-[var(--border)] p-3 space-y-2">
        <button onClick={() => signOut({ callbackUrl: "/login" })} className={`w-full flex items-center font-bold gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all ${collapsed ? "justify-center" : ""}`}>
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
