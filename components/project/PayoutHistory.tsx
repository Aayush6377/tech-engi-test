import { fetcher } from "@/lib/fetcher";
import { Eye } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

function PayoutRow({
  payout,
  onView,
}: {
  payout: any;
  onView: (proof?: string) => void;
}) {
  const payoutDate = new Date(payout.createdAt).toLocaleDateString();
  const payoutTime = new Date(payout.createdAt).toLocaleTimeString();

  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-4">
      <div className="space-y-2">
        <p className="font-inter text-sm">
          <span
            className="font-semibold text-[13px]"
            style={{ color: "var(--text-primary)" }}
          >
            Amount:
          </span>{" "}
          <span style={{ color: "var(--text-secondary)" }}>
            ₹{payout.amount}
          </span>
        </p>

        <p className="font-inter text-sm">
          <span
            className="font-semibold text-[13px]"
            style={{ color: "var(--text-primary)" }}
          >
            Paid By:
          </span>{" "}
          <span style={{ color: "var(--text-muted)" }}>{payout.user?.name || "Anonymous"}</span>
        </p>

        <p className="font-inter text-sm">
          <span
            className="font-semibold text-[13px]"
            style={{ color: "var(--text-primary)" }}
          >
            Date:
          </span>{" "}
          <span style={{ color: "var(--text-muted)" }}>{payoutDate}</span>
        </p>

        <p className="font-inter text-sm">
          <span
            className="font-semibold text-[13px]"
            style={{ color: "var(--text-primary)" }}
          >
            Time:
          </span>{" "}
          <span style={{ color: "var(--text-muted)" }}>{payoutTime}</span>
        </p>

        <p className="font-inter text-sm">
          <span
            className="font-semibold text-[13px]"
            style={{ color: "var(--text-primary)" }}
          >
            Payment ID:
          </span>{" "}
          <span
            className="font-mono text-xs px-2 py-1 rounded-md"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {payout.razorpayPaymentId || "Id Not Found!"}
          </span>
        </p>
      </div>

      <button
        onClick={() => {onView(payout?.proof ?? "/two-guys.png")}}
        className="flex items-center gap-1 text-sm font-inter px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)]"
        style={{ color: "var(--text-secondary)" }}
      >
        <Eye size={14} />
        Proof
      </button>
    </div>
  );
}

export default function PayoutHistory({ projectId }: { projectId: string }) {
  const { data: historyData, isLoading: historyLoading } = useSWR(
    `/api/payout/${projectId}`,
    fetcher
  );
  const transactions = historyData?.transactions ?? [];
  const [proofModal, setProofModal] = useState<string | null>(null);
  return (
    <>
      <div className="rounded-xl flex-1 border border-[var(--border)] bg-white p-5 h-full">
        <h3
          className="text-lg font-semibold font-inter mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Payout History
        </h3>

        {historyLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <PayoutSkeletonRow key={i} />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((p: any) => (
              <PayoutRow
                key={p.id}
                payout={p}
                onView={(proof) => setProofModal(proof || null)}
              />
            ))}
          </div>
        ) : (
          <p
            className="text-sm text-center py-10 font-inter"
            style={{ color: "var(--text-muted)" }}
          >
            No payouts yet.
          </p>
        )}
      </div>
      {proofModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-lg w-full">
            <h2
              className="font-semibold mb-3 font-inter"
              style={{ color: "var(--text-primary)" }}
            >
              Payment Proof
            </h2>

            <img
              src={proofModal}
              alt="proof"
              className="rounded-lg border border-[var(--border)]"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setProofModal(null)}
                className="px-4 py-2 rounded-lg bg-[var(--primary)] border border-[var(--border)] font-inter text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PayoutSkeletonRow() {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-4 animate-pulse">
      <div className="space-y-2 w-full">
        <div className="h-4 w-32 bg-[var(--bg)] rounded-md" />
        <div className="h-3 w-40 bg-[var(--bg)] rounded-md" />
        <div className="h-3 w-28 bg-[var(--bg)] rounded-md" />
        <div className="h-3 w-24 bg-[var(--bg)] rounded-md" />
        <div className="h-5 w-48 bg-[var(--bg)] rounded-md" />
      </div>

      <div className="h-8 w-20 bg-[var(--bg)] rounded-lg ml-4" />
    </div>
  );
}
