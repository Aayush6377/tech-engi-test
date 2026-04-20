"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Plus,
  Calendar,
  User,
  Shield,
  LucideLoader,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-600",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-green-100 text-green-600",
  CLOSED: "bg-gray-200 text-gray-700",
};

const typeColors: Record<string, string> = {
  PAYMENT: "bg-purple-100 text-purple-600",
  COMMUNICATION: "bg-blue-100 text-blue-600",
  TECHNICAL: "bg-orange-100 text-orange-600",
  DELIVERY: "bg-pink-100 text-pink-600",
  OTHER: "bg-gray-100 text-gray-600",
};
// export const tickets = [
//   {
//     id: "1",
//     projectId: "proj_123",
//     raisedById: "user_1",
//     issueType: "TECHNICAL",
//     target: "PLATFORM",
//     description:
//       "Dashboard is not loading after login. It keeps showing a blank screen even after multiple refresh attempts.",
//     images: [
//       "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
//       "https://images.unsplash.com/photo-1518770660439-4636190af475",
//     ],
//     status: "OPEN",
//     createdAt: new Date("2026-04-18T10:30:00"),
//     updatedAt: new Date("2026-04-18T10:30:00"),
//   },
//   {
//     id: "2",
//     projectId: "proj_123",
//     raisedById: "user_2",
//     issueType: "PAYMENT",
//     target: "CLIENT",
//     description:
//       "Client has not released the milestone payment even after approval. Need follow-up.",
//     images: [],
//     status: "IN_PROGRESS",
//     createdAt: new Date("2026-04-17T14:10:00"),
//     updatedAt: new Date("2026-04-19T09:00:00"),
//   },
//   {
//     id: "3",
//     projectId: "proj_123",
//     raisedById: "user_3",
//     issueType: "COMMUNICATION",
//     target: "CLIENT",
//     description:
//       "Client is unresponsive on email and Slack for the past 3 days regarding design feedback.",
//     images: [],
//     status: "RESOLVED",
//     createdAt: new Date("2026-04-15T08:45:00"),
//     updatedAt: new Date("2026-04-16T16:20:00"),
//   },
//   {
//     id: "4",
//     projectId: "proj_123",
//     raisedById: "user_1",
//     issueType: "DELIVERY",
//     target: "PLATFORM",
//     description:
//       "File upload is failing during final delivery. It throws a network error at 80% completion.",
//     images: [
//       "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
//     ],
//     status: "OPEN",
//     createdAt: new Date("2026-04-19T11:20:00"),
//     updatedAt: new Date("2026-04-19T11:20:00"),
//   },
//   {
//     id: "5",
//     projectId: "proj_123",
//     raisedById: "user_4",
//     issueType: "OTHER",
//     target: "PLATFORM",
//     description:
//       "Suggestion: Add dark mode support for better usability during night work sessions.",
//     images: [],
//     status: "CLOSED",
//     createdAt: new Date("2026-04-10T12:00:00"),
//     updatedAt: new Date("2026-04-12T15:30:00"),
//   },
//   {
//     id: "6",
//     projectId: "proj_123",
//     raisedById: "user_2",
//     issueType: "TECHNICAL",
//     target: "PLATFORM",
//     description:
//       "Notifications are delayed by several minutes. This is affecting real-time collaboration.",
//     images: [
//       "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
//       "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
//       "https://images.unsplash.com/photo-1526378722443-4b4f1f8f02d3",
//       "https://images.unsplash.com/photo-1504639725590-34d0984388bd",
//     ],
//     status: "IN_PROGRESS",
//     createdAt: new Date("2026-04-16T17:25:00"),
//     updatedAt: new Date("2026-04-19T10:10:00"),
//   },
// ];
export default function ReportIssueTab({ projectId }: { projectId: string }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectClient, setProjectClient] = useState(null);
  const { data: session, status: sessionStatus } = useSession();
  const role = session?.user?.role?.toUpperCase()?.trim() || "";
  const isAdmin = role === "ADMIN";
  const isEngineer = role === "ENGINEER";
  const [updating, setUpdating] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const isClient = role === "CLIENT";
  const [newTicket, setNewTicket] = useState({
    issueType: "",
    target: "PLATFORM",
    description: "",
    images: [] as File[],
  });

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/tickets?projectId=${projectId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch tickets");
      }

      setTickets(data.tickets);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchTickets();
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  const handleCreateTicket = async ({}) => {
    try {
      setCreating(true);

      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("issueType", newTicket.issueType);
      formData.append("target", newTicket.target);
      formData.append("description", newTicket.description);

      newTicket.images.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create ticket");
      }

      toast.success("Ticket submitted successfully");
      await fetchTickets();
      // onSuccess?.(); // close modal / refresh
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const updateTicketStatus = async ({
    ticketId,
    status,
  }: {
    ticketId: string;
    status: string;
  }) => {
    try {
      setUpdating(true);

      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      await fetchTickets();
      toast.success("Status updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };
  // const handleUpdateTicket = async () => {};
  // const deleteTicket = async () => {};
  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-white border border-[var(--border)] font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

  if (sessionStatus === "loading")
    return (
      <div className="flex items-center justify-center py-12">
        <LucideLoader
          className="animate-spin"
          style={{ color: "var(--primary)" }}
          size={40}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-2xl font-bold font-id flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <AlertCircle size={22} /> Report an Issue
        </h2>
        <div className="flex gap-2">
          {(isAdmin || isEngineer) && (
            <>
              {/* <button onClick={() => setShowClientIssueModal(true)} className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm bg-red-500 hover:bg-red-600">
                <Shield size={14} /> Client Issue
              </button> */}
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm"
                style={{ background: "var(--primary)" }}
              >
                <Plus size={14} /> Report Issue
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="rounded-lg p-4 border"
        style={{ background: "var(--primary-light)", borderColor: "#ffd9a8" }}
      >
        <h3
          className="font-semibold font-inter text-sm mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Issue Reporting Guidelines
        </h3>
        <ul
          className="text-xs font-inter space-y-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          <li>
            <strong>Project-Wide:</strong> General problems affecting the entire
            project
          </li>
          <li>
            <strong>Task-Specific:</strong> Problems related to individual tasks
          </li>
        </ul>
      </div>

      {tickets.length === 0 ? (
        loading ? (
          <div className="min-h-full w-full flex justify-center items-center">
            <Loader2 className="animate-spin" color="var(--primary)" />
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle
              className="mx-auto h-10 w-10 mb-3"
              style={{ color: "var(--border)" }}
            />
            <p
              className="font-inter text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No issues reported yet.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {tickets.map((report: any) => {
            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-[var(--border)] p-5"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={18}
                    className="text-red-500"
                    style={{ marginTop: 2 }}
                  />

                  <div className="flex-1">
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      {/* Type Badge */}
                      <span className="text-xs uppercase font-semibold px-2.5 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-200">
                        {report.issueType}
                      </span>

                      {/* ✅ Status Dropdown */}
                      <div className="relative">
                        <button
                          disabled={updating}
                          onClick={() => {
                            if (updating) return;

                            setOpenDropdownId((prev) =>
                              prev === report.id ? null : report.id
                            );
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                            statusColors[report.status]
                          } ${updating ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          {updating
                            ? "Updating..."
                            : report.status.replace("_", " ")}

                          {role !== "ENGINEER" && !updating && (
                            <span className="text-[10px]">▼</span>
                          )}
                        </button>

                        {/* ✅ Controlled Dropdown */}
                        {openDropdownId === report.id &&
                          role !== "ENGINEER" &&
                          !updating && (
                            <div className="absolute right-0 mt-1 w-36 bg-white border rounded-lg shadow-md z-10">
                              {[
                                "OPEN",
                                "IN_PROGRESS",
                                "RESOLVED",
                                "CLOSED",
                              ].map((status) => (
                                <button
                                  key={status}
                                  onClick={async () => {
                                    // ✅ Close dropdown immediately
                                    setOpenDropdownId(null);

                                    // ✅ Update status
                                    await updateTicketStatus({
                                      ticketId: report.id,
                                      status,
                                    });
                                  }}
                                  className="w-full text-black text-left px-3 py-2 text-xs hover:bg-gray-100"
                                >
                                  {status.replace("_", " ")}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Description */}
                    <p
                      className="text-sm mt-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {report.description}
                    </p>

                    {/* Images */}
                    {report.images?.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {report.images.map((img: string, i: number) => (
                          <a
                            key={i}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={img}
                              alt="ticket"
                              className="w-16 h-16 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div
                      className="flex items-center gap-4 mt-3 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span className="flex items-center gap-1">
                        <User size={11} /> {report.raisedBy?.name || "User"}
                      </span>

                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* {showClientIssueModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl border border-[var(--border)] shadow-lg">
            <h3 className="text-lg font-semibold font-inter mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}><Shield size={18} className="text-red-500" /> Report Client Issue</h3>
            <input type="text" value={clientIssueTitle} onChange={(e) => setClientIssueTitle(e.target.value)} className={`${inputCls} mb-3`} placeholder="Enter client issue title..." disabled={creatingClientIssue} />
            <p className="text-xs font-inter p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">This will be visible in the client's analytics dashboard.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowClientIssueModal(false); setClientIssueTitle(""); }} className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg font-inter text-sm" style={{ color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={undefined} disabled={creatingClientIssue || !clientIssueTitle.trim()} className="px-4 py-2 text-white rounded-lg font-inter text-sm disabled:opacity-40 bg-red-500 hover:bg-red-600">
                {creatingClientIssue ? "Reporting..." : "Report to Client"}
              </button>
            </div>
          </div>
        </div>
      )} */}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-black! w-full max-w-md p-6 rounded-xl border border-[var(--border)] shadow-lg">
            <h3
              className="text-lg font-semibold font-inter mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Raise a Ticket
            </h3>

            <div className="space-y-4">
              {/* Ticket Type */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Issue Type *
                </label>
                <select
                  value={newTicket.issueType}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, issueType: e.target.value })
                  }
                  className={inputCls}
                  disabled={creating}
                >
                  <option value="">Select issue type</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="COMMUNICATION">Communication</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Target *
                </label>
                <div className="flex gap-4">
                  {["PLATFORM", "CLIENT"].map((t) => (
                    <label
                      key={t}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="radio"
                        value={t}
                        checked={newTicket.target === t}
                        onChange={(e) =>
                          setNewTicket({ ...newTicket, target: e.target.value })
                        }
                        disabled={creating}
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Description *
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  className={`${inputCls} resize-none`}
                  rows={4}
                  placeholder="Describe the issue..."
                  disabled={creating}
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Upload Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    setNewTicket({
                      ...newTicket,
                      images: Array.from(e.target.files || []),
                    })
                  }
                  disabled={creating}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewTicket({
                    issueType: "",
                    target: "PLATFORM",
                    description: "",
                    images: [],
                  });
                }}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateTicket}
                disabled={
                  creating ||
                  !newTicket.issueType ||
                  !newTicket.description.trim()
                }
                className="px-4 py-2 text-white rounded-lg text-sm disabled:opacity-40"
                style={{ background: "var(--primary)" }}
              >
                {creating ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
