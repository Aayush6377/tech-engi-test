"use client";

import React, { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import Loader from "../common/Loading";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import PayoutHistory from "./PayoutHistory";
type Payout = {
  id: string;
  amount: number;
  source: string;
  transactionId: string;
  date: string;
  proof?: string;
};

function SummaryCard({ title, value }: { title: string; value: string }) {
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

interface Props {
  projectId: string;
}
export default function PayoutEngineer({ projectId }: Props) {

  
  const { data , isLoading } = useSWR(
    `/api/payout/${projectId}`,
    fetcher
  );
  const loading = isLoading;
  const stats = data?.stats ?? {};
  if (loading)
    return (
      <div className="h-[60vh] flex justify-center items-center">
        <Loader2 color="var(--primary)" size={25} className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2
          className="text-2xl font-bold font-id"
          style={{ color: "var(--text-primary)" }}
        >
          Payouts
        </h2>
        <p
          className="text-sm font-inter mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          Track payments and transaction history.
        </p>
      </div>

      {/* TOP BOXES */}
      <div className="grid md:grid-cols-2 gap-4">
        <SummaryCard title="Total Project Amount" value={`₹${stats.budget ?? 0}`} />
        <SummaryCard
          title="Paid / Remaining"
          value={`₹${stats.amountPaid} / ₹${stats.remaining}`}
        />
      </div>

      <PayoutHistory projectId={projectId}/>
    </div>
  );
}
