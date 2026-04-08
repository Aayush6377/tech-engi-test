"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, X, Plus } from "lucide-react";

export default function ClientFormPage() {
  const router = useRouter();
  const [totalProjects, setTotalProjects] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addExpertise = () => {
    const val = expertiseInput.trim();
    if (val && !expertise.includes(val)) {
      setExpertise([...expertise, val]);
    }
    setExpertiseInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (expertise.length === 0) {
      setError("Please add at least one area of expertise");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/client/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalProjects: parseInt(totalProjects) || 0,
          totalBudget: parseFloat(totalBudget) || 0,
          expertise,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      router.push("/form/payout");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[#f0b31e] shadow-lg shadow-yellow-500/30 mx-auto mb-4">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Complete Your Profile</h1>
          <p className="text-gray-500 mt-2 text-sm">Tell us a bit about your project history</p>
        </div>

        {error && (
          <div className="mb-6 text-red-500 text-sm font-medium text-center bg-red-50 p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Total Projects Done</label>
            <input
              type="number"
              min="0"
              value={totalProjects}
              onChange={(e) => setTotalProjects(e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-4 h-12 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-[#f0b31e] focus:ring-1 focus:ring-[#f0b31e] outline-none transition-all text-sm text-black"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Total Budget Spent (₹)</label>
            <input
              type="number"
              min="0"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-4 h-12 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-[#f0b31e] focus:ring-1 focus:ring-[#f0b31e] outline-none transition-all text-sm text-black"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Areas of Expertise</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExpertise(); } }}
                placeholder="e.g. Embedded Systems"
                className="flex-1 px-4 h-12 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-[#f0b31e] focus:ring-1 focus:ring-[#f0b31e] outline-none transition-all text-sm text-black"
              />
              <button
                type="button"
                onClick={addExpertise}
                className="h-12 w-12 flex items-center justify-center rounded-xl bg-[#f0b31e] text-white hover:bg-[#e0a61a] transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {expertise.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                    {tag}
                    <button type="button" onClick={() => setExpertise(expertise.filter(t => t !== tag))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 mt-2 bg-[#f0b31e] hover:bg-[#e0a61a] text-white rounded-xl text-base font-semibold shadow-md shadow-yellow-500/20 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
