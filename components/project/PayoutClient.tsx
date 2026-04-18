"use client";

import React, { useState } from "react";
import { Eye } from "lucide-react";
import PayoutHistory from "./PayoutHistory";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

type Payment = {
  id: string;
  amount: number;
  source: string;
  transactionId: string;
  date: string;
  proof?: string;
};

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5">
      <p className="text-sm font-inter" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <h2
        className="text-2xl font-bold mt-1 font-id"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </h2>
    </div>
  );
}

interface Props{
    projectId: string;
}
export default function PayoutClient({projectId}:Props) {
  const { data , isLoading } = useSWR(
    `/api/payout/${projectId}`,
    fetcher
  );
  const stats = data?.stats ?? {};
  const approved = stats?.approved ?? false;
  const budget = stats?.budget ?? 0;
  const projectProgress = stats?.progress ?? 0;
  const remaining = stats?.remaining ?? 0;
  const canPay = approved && projectProgress === 100;
  const lastTransaction = stats?.lastTransaction ?? {};
  const lastTransactionAmount = lastTransaction?.amount ?? 0;
  const lastTransactionDate = (new Date(lastTransaction?.date)).toLocaleDateString() ?? "Loading..."
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2
          className="text-2xl font-bold font-id"
          style={{ color: "var(--text-primary)" }}
        >
          Client Payments
        </h2>
        <p
          className="text-sm font-inter mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          Manage your payments and remaining balance.
        </p>
      </div>

      {/* TOP BOXES */}
      <div className="grid md:grid-cols-2 gap-4">
        <SummaryCard
          title="Total Budget"
          value={`₹${budget}`}
        />
        <SummaryCard
          title="Last Payment"
          value={`₹${lastTransactionAmount} • ${lastTransactionDate}`}
        />
      </div>

      {/* LOWER SECTION */}
      <div className="flex gap-4">
        {/* PAYMENT HISTORY */}
        <PayoutHistory projectId={projectId}/>

        {/* CONDITIONAL PAYMENT BOX */}
        <div className="rounded-xl max-w-sm border border-[var(--border)] bg-white p-5 flex flex-col justify-between">
          <div>
            <h3
              className="text-lg font-semibold font-inter mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Remaining Payment
            </h3>

            {!canPay ? (
              <p
                className="text-sm font-inter mt-4"
                style={{ color: "var(--text-muted)" }}
              >
                No activity yet. Payment will be enabled once the project is
                approved and reaches 100% completion.
              </p>
            ) : (
              <>
                <p
                  className="text-sm font-inter"
                  style={{ color: "var(--text-muted)" }}
                >
                  You need to pay the remaining 60% amount.
                </p>

                <h2
                  className="text-2xl font-bold mt-2 font-id"
                  style={{ color: "var(--text-primary)" }}
                >
                  ₹{remaining}
                </h2>

                <div className="mt-4 space-y-3">
                  <input
                    placeholder="Transaction ID"
                    className="w-full border border-[var(--border)] rounded-lg p-2 text-sm font-inter"
                  />
                  <input
                    placeholder="Payment Source (UPI / Bank)"
                    className="w-full border border-[var(--border)] rounded-lg p-2 text-sm font-inter"
                  />

                  <button
                    className="w-full py-2 rounded-lg text-white text-sm font-inter"
                    style={{ background: "var(--primary)" }}
                  >
                    Submit Payment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}