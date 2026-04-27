"use client";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function RevenueChart({ data, totalRevenue }: { data: any, totalRevenue: number }) {
  const [period, setPeriod] = useState<"monthly" | "yearly" | "weekly">("monthly");
  
  const activeData = data?.[period] || Object.values(data || {})[0] || [];

  return (
    <div className="bg-white p-5 border border-[var(--border)] rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold font-id text-[var(--text-primary)]">Revenue Overview</h3>
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setPeriod(p => p === "monthly" ? "yearly" : p === "yearly" ? "weekly" : "monthly")}
          className="flex items-center gap-1.5 text-xs font-bold font-inter text-[var(--text-secondary)] bg-white px-3 py-1.5 border border-[var(--border)] rounded-lg hover:bg-gray-50 capitalize"
        >
          {period} <ChevronDown size={12} />
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-3xl font-bold font-id text-[var(--text-primary)]">
          ₹{totalRevenue?.toLocaleString() || "0"}
        </h2>
        <span className="text-xs font-inter text-[var(--text-muted)] font-semibold">Total All Time</span>
      </div>

      <div className="h-44 font-bold">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeData} barSize={22} barCategoryGap="25%">
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "var(--font-inter)" }}
            />
            <Tooltip
              formatter={(val) => [`₹${Number(val).toLocaleString()}`, "Revenue"]}
              cursor={{ fill: "#FFAE58" }}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {activeData.map((entry: any, i: number) => (
                <Cell key={i} fill="#FFAE58" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}