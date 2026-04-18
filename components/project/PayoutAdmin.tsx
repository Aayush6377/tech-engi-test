"use client";

import React, { useState } from "react";
import { Eye } from "lucide-react";
import PayoutHistory from "./PayoutHistory";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

type User = {
  id: string;
  name: string;
  role: "CLIENT" | "ENGINEER";
  payoutDetail: any;
};

type Payout = {
  id: string;
  amount: number;
  source: string;
  transactionId: string;
  date: string;
};

function SummaryCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5">
      <p className="text-sm font-inter" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <h2
        className="text-xl font-bold mt-1 font-id"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </h2>
    </div>
  );
}

//   const users: User[] = [
//       { id: "1", name: "Rahul (Client)", role: "CLIENT" },
//       {
//           id: "2",
//           name: "Amit (Engineer)",
//           role: "ENGINEER",
//           bank: "HDFC • 1234XXXX",
//         },
//     ];
interface Props {
  projectId: string;
}
export default function PayoutAdmin({ projectId }: Props) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data, isLoading } = useSWR(`/api/payout/${projectId}`, fetcher);
  const stats = data?.stats ?? {};
  const users = stats?.users ?? [];
  const projectApproved = stats.approved ?? false;
  const progress = stats?.progress ?? 0;
  const totalAmount = stats?.budget ?? 0;
  const receivedAmount = stats?.totalReceived ?? 0;
  console.log(users);
  const canPayEngineer =
    selectedUser?.role === "ENGINEER" && projectApproved && progress === 100;

  return (
    <div className="flex gap-6 text-black!">
      {/* SIDEBAR */}
      <div className="w-64 border border-[var(--border)] rounded-xl bg-white p-4 space-y-3">
        <h3 className="font-semibold font-inter text-sm">Users</h3>

        {users.map((user: any) => (
          <button
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-inter ${
              selectedUser?.id === user?.id
                ? "bg-[var(--primary)] text-white"
                : "hover:bg-[var(--bg)]"
            }`}
          >
            {user?.name}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 space-y-6">
        {/* TOP CARDS */}
        <div className="grid md:grid-cols-3 gap-4">
          <SummaryCard title="Total Project Amount" value={`₹${totalAmount}`} />
          <SummaryCard title="Total Received" value={`₹${receivedAmount}`} />
          <SummaryCard
            title="Engineer Bank Details"
            value={
              selectedUser?.role === "ENGINEER" ? (
                selectedUser.payoutDetail ? (
                  <div className="text-xs font-inter space-y-1">
                    {selectedUser.payoutDetail.accountHolder && (
                      <p>
                        <span className="font-semibold">Name:</span>{" "}
                        {selectedUser.payoutDetail.accountHolder}
                      </p>
                    )}
                    {selectedUser.payoutDetail.bankName && (
                      <p>
                        <span className="font-semibold">Bank:</span>{" "}
                        {selectedUser.payoutDetail.bankName}
                      </p>
                    )}
                    {selectedUser.payoutDetail.accountNumber && (
                      <p>
                        <span className="font-semibold">A/C:</span>{" "}
                        {selectedUser.payoutDetail.accountNumber}
                      </p>
                    )}

                    {selectedUser.payoutDetail.ifscCode && (
                      <p>
                        <span className="font-semibold">IFSC:</span>{" "}
                        {selectedUser.payoutDetail.ifscCode}
                      </p>
                    )}

                    {selectedUser.payoutDetail.upiId && (
                      <p>
                        <span className="font-semibold">UPI:</span>{" "}
                        {selectedUser.payoutDetail.upiId}
                      </p>
                    )}
                  </div>
                ) : (
                  "Not added"
                )
              ) : (
                "Select Engineer"
              )
            }
          />
        </div>

        {/* LOWER GRID */}
        <div className="flex gap-4">
          {/* PAYOUT HISTORY */}
          <PayoutHistory projectId={projectId} />

          {/* PAYMENT CONTROL */}
          <div className="rounded-xl w-xs md:w-sm border border-[var(--border)] bg-white p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold font-inter mb-2">
                Engineer Payment
              </h3>

              {selectedUser?.role !== "ENGINEER" ? (
                <p className="text-sm text-[var(--text-muted)]">
                  Select an engineer to proceed.
                </p>
              ) : !canPayEngineer ? (
                <p className="text-sm text-[var(--text-muted)]">
                  No activity yet. Payment will be enabled once project is
                  approved and reaches 100%.
                </p>
              ) : (
                <>
                  <p className="text-sm text-[var(--text-muted)]">
                    Release payout to engineer
                  </p>

                  <div className="mt-4 space-y-3">
                    <input
                      placeholder="Amount"
                      className="w-full border border-[var(--border)] rounded-lg p-2 text-sm"
                    />
                    <input
                      placeholder="Transaction ID"
                      className="w-full border border-[var(--border)] rounded-lg p-2 text-sm"
                    />
                    <input
                      placeholder="Source (Bank/UPI)"
                      className="w-full border border-[var(--border)] rounded-lg p-2 text-sm"
                    />

                    <button
                      className="w-full py-2 rounded-lg text-white text-sm"
                      style={{ background: "var(--primary)" }}
                    >
                      Release Payment
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
