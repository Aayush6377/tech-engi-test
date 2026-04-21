"use client";

import React, { useState, useEffect } from "react";
import { X, LucideLoader, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface EditUserModalProps {
  isOpen: boolean;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({ isOpen, user, onClose, onSuccess }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [expertiseInput, setExpertiseInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    expertise: [] as string[],
    skills: [] as string[],
    qualification: "UG",
    approvalStatus: "PENDING",
    rejectionReason: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        expertise: user.expertise || [],
        skills: user.skills || [],
        qualification: user.qualification || "UG",
        approvalStatus: user.status || "PENDING",
        rejectionReason: user.rejectionReason || "",
      });
      setSkillInput("");
      setExpertiseInput("");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleAddSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    e?.preventDefault();
    const val = skillInput.trim();
    if (val && !formData.skills.includes(val)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, val] }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (itemToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== itemToRemove),
    }));
  };

  const handleAddExpertise = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    e?.preventDefault();
    const val = expertiseInput.trim();
    if (val && !formData.expertise.includes(val)) {
      setFormData((prev) => ({ ...prev, expertise: [...prev.expertise, val] }));
    }
    setExpertiseInput("");
  };

  const handleRemoveExpertise = (itemToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((exp) => exp !== itemToRemove),
    }));
  };

  // --- Submit Handler ---
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload: any = { name: formData.name };

      if (user.role === "CLIENT") {
        payload.expertise = formData.expertise;
      } else if (user.role === "ENGINEER") {
        payload.skills = formData.skills;
        payload.qualification = formData.qualification;
        payload.approvalStatus = formData.approvalStatus;
        if (formData.approvalStatus === "REJECTED") {
          payload.rejectionReason = formData.rejectionReason;
        }
      }

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("User updated successfully");
        onSuccess();
      } else {
        toast.error(data.message || "Failed to update user");
      }
    } catch (err) {
      toast.error("Internal server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-[#050A30] font-id">
            Edit {user.role === "ENGINEER" ? "Engineer" : "Client"}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#4B4B4B] mb-1 font-inter">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAE58]"
            />
          </div>

          {/* Client: Expertise Tags */}
          {user.role === "CLIENT" && (
            <div>
              <label className="block text-sm font-semibold text-[#4B4B4B] mb-2 font-inter">Expertise</label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.expertise.map((exp, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#fff4e6] text-[#FFAE58] border border-[#ffd9a8]">
                    {exp}
                    <button onClick={() => handleRemoveExpertise(exp)} className="hover:text-red-500">
                      <X size={12} strokeWidth={3} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyDown={handleAddExpertise}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAE58]"
                  placeholder="e.g. Fintech, E-commerce, AI (Press Enter)"
                />
                <button
                  type="button"
                  onClick={handleAddExpertise}
                  className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Engineer: Skills Tags & Status */}
          {user.role === "ENGINEER" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-[#4B4B4B] mb-2 font-inter">Skills</label>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills.map((skill, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#fff4e6] text-[#FFAE58] border border-[#ffd9a8]">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-500">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    className="flex-1 px-4 py-2 rounded-lg border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAE58]"
                    placeholder="e.g. React, Node.js (Press Enter)"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#4B4B4B] mb-1 font-inter">Qualification</label>
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAE58]"
                  >
                    <option value="UG">Undergraduate</option>
                    <option value="EMPLOYED">Employed</option>
                    <option value="UNEMPLOYED">Unemployed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4B4B4B] mb-1 font-inter">Status</label>
                  <select
                    value={formData.approvalStatus}
                    onChange={(e) => setFormData({ ...formData, approvalStatus: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAE58]"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {formData.approvalStatus === "REJECTED" && (
                <div>
                  <label className="block text-sm font-semibold text-[#4B4B4B] mb-1 font-inter">Rejection Reason</label>
                  <textarea
                    value={formData.rejectionReason}
                    onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAE58]"
                    rows={2}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 z-10 flex gap-3 px-6 py-4 border-t border-[#e5e5e5] bg-white rounded-b-2xl">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg font-inter text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg font-inter text-sm bg-[#FFAE58] hover:bg-[#e89b45] text-white flex justify-center items-center"
          >
            {loading ? <LucideLoader className="animate-spin" size={18} /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}