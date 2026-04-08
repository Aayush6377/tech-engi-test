"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Loader2, X, Plus, Upload } from "lucide-react";

const QUALIFICATIONS = [
  { value: "UG", label: "Under Graduate (Student)" },
  { value: "EMPLOYED", label: "Employed" },
  { value: "UNEMPLOYED", label: "Unemployed" },
];

const ID_TYPES: Record<string, string[]> = {
  UG: ["STUDENT_ID"],
  EMPLOYED: ["AADHAAR", "PAN", "PAY_SLIP"],
  UNEMPLOYED: ["AADHAAR", "PAN"],
};

const ID_LABELS: Record<string, string> = {
  STUDENT_ID: "Student ID",
  AADHAAR: "Aadhaar Card",
  PAN: "PAN Card",
  PAY_SLIP: "Pay Slip",
};

export default function EngineerFormPage() {
  const router = useRouter();
  const [qualification, setQualification] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addTag = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const val = input.trim();
    if (val && !list.includes(val)) setList([...list, val]);
    setInput("");
  };

  const handleQualificationChange = (val: string) => {
    setQualification(val);
    setIdType("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!idFile) { setError("Please upload your ID document"); return; }
    if (skills.length === 0) { setError("Please add at least one skill"); return; }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("qualification", qualification);
      formData.append("idType", idType);
      formData.append("idNumber", idNumber);
      formData.append("file", idFile);
      formData.append("skills", JSON.stringify(skills));
      formData.append("certifications", JSON.stringify(certifications));

      const res = await fetch("/api/engineer/profile", {
        method: "POST",
        body: formData,
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
      <div className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[#f0b31e] shadow-lg shadow-yellow-500/30 mx-auto mb-4">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Complete Your Profile</h1>
          <p className="text-gray-500 mt-2 text-sm">We need a few details to verify your account</p>
        </div>

        {error && (
          <div className="mb-6 text-red-500 text-sm font-medium text-center bg-red-50 p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Qualification */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Qualification</label>
            <div className="flex gap-2">
              {QUALIFICATIONS.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => handleQualificationChange(q.value)}
                  className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                    qualification === q.value
                      ? "bg-[#f0b31e] text-white border-[#f0b31e] shadow-sm"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-[#f0b31e]"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* ID Type */}
          {qualification && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 ml-1">ID Type</label>
              <div className="flex flex-wrap gap-2">
                {ID_TYPES[qualification].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setIdType(type)}
                    className={`py-2 px-4 text-xs font-semibold rounded-xl border transition-all ${
                      idType === type
                        ? "bg-[#f0b31e] text-white border-[#f0b31e] shadow-sm"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-[#f0b31e]"
                    }`}
                  >
                    {ID_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ID Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">ID Number</label>
            <input
              type="text"
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Enter your ID number"
              className="w-full px-4 h-12 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-[#f0b31e] focus:ring-1 focus:ring-[#f0b31e] outline-none transition-all text-sm text-black"
            />
          </div>

          {/* ID File Upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Upload ID Document</label>
            <label className="flex items-center gap-3 w-full h-12 px-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:border-[#f0b31e] hover:bg-yellow-50 cursor-pointer transition-all">
              <Upload className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500 truncate">
                {idFile ? idFile.name : "Click to upload (JPG, PNG, PDF)"}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Skills</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(skills, setSkills, skillInput, setSkillInput); } }}
                placeholder="e.g. Arduino, PCB Design"
                className="flex-1 px-4 h-12 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-[#f0b31e] focus:ring-1 focus:ring-[#f0b31e] outline-none transition-all text-sm text-black"
              />
              <button
                type="button"
                onClick={() => addTag(skills, setSkills, skillInput, setSkillInput)}
                className="h-12 w-12 flex items-center justify-center rounded-xl bg-[#f0b31e] text-white hover:bg-[#e0a61a] transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                    {tag}
                    <button type="button" onClick={() => setSkills(skills.filter(t => t !== tag))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Certifications <span className="text-gray-400 font-normal">(URL)</span></label>
            <div className="flex gap-2">
              <input
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(certifications, setCertifications, certInput, setCertInput); } }}
                placeholder="e.g. AWS Certified, CCNA"
                className="flex-1 px-4 h-12 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-[#f0b31e] focus:ring-1 focus:ring-[#f0b31e] outline-none transition-all text-sm text-black"
              />
              <button
                type="button"
                onClick={() => addTag(certifications, setCertifications, certInput, setCertInput)}
                className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {certifications.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-full">
                    {tag}
                    <button type="button" onClick={() => setCertifications(certifications.filter(t => t !== tag))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !qualification || !idType}
            className="w-full h-12 mt-2 bg-[#f0b31e] hover:bg-[#e0a61a] text-white rounded-xl text-base font-semibold shadow-md shadow-yellow-500/20 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
