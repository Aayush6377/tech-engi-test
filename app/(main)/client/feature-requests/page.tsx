"use client";
import React, { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function FeatureRequestPage() {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [features, setFeatures] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/feature-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    clientId: user?.id,
                    title: title,
                    description: desc,
                    projectId: selectedProject,
                })
            });
            if (response.ok) {
                toast.success('Feedback submitted successfully!');
                setDesc('');
                setTitle('');
                await fetchfeature();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error('Error submitting feedback');
        } finally {
            setLoading(false);
        }

    };

    const fetchUser = async () => {
        const res = localStorage.getItem("user");
        // const res = await fetch("/api/user");
        const data = res ? JSON.parse(res) : null;

        if (data) {
            setUser(data);
        }
    };

    const fetchProject = async () => {
        const res = await fetch(`/api/feedbacks/clientprojectfetch?userId=${user?.id}`);
        const data = await res.json();

        setProjects(data.projects || []);
    };

    const fetchfeature = async () => {
        const res = await fetch(`/api/feature-request?userId=${user?.id}`);
        const data = await res.json();
        setFeatures(Array.isArray(data.features) ? data.features : []);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (user) {
            fetchProject();
            fetchfeature();

        }
    }, [user]);


    return (
        <div className="space-y-8">
            <Toaster position="top-right" />
            {/* Heading */}
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    Feature Requests
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Suggest improvements or new ideas you want in your project.
                </p>
            </div>

            {/* Add Feature Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800"
            >
                <div className="grid gap-4">
                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Feature Title
                        </label>
                        <input
                            type="text"
                            placeholder="Enter feature title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full mt-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* project */}
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                            Project
                        </label>

                        <div className="relative">
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="
          w-full appearance-none rounded-xl px-4 py-2.5
          bg-white dark:bg-gray-900
          border border-gray-300 dark:border-gray-700
          text-gray-900 dark:text-gray-100
          transition-all duration-200
          shadow-sm
        "
                            >
                                <option value="">Select Project</option>

                                {projects.map((proj) => (
                                    <option key={proj.project.id} value={proj.project.id}>
                                        {proj.project.name}
                                    </option>
                                ))}
                            </select>

                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg
                                    className="w-4 h-4 text-gray-500 dark:text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                        </label>
                        <textarea
                            placeholder="Explain the feature..."
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            rows={4}
                            className="w-full mt-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        ></textarea>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white py-2.5 rounded-lg transition-all"
                    >
                        <PlusCircle strokeWidth={1.5} />
                        {loading ? 'Subbmitting Feature Request...' : 'Submit Feature Request'}
                    </button>
                </div>
            </form>

            {/* Feature Requests List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Your Requested Features
                </h2>

                {features.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No requests yet.</p>
                ) : (
                    <div className="grid gap-4">
                        {features.map((f) => (
                            <div
                                key={f.id}
                                className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all"
                            >
                                {/* Project name */}
                                {f.projectname && (
                                    <p className="mt-2 text-gray-400 font-light dark:font-normal dark:text-gray-500 text-sm leading-relaxed">
                                        {f.project.name}
                                    </p>
                                )}

                                {/* Title */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-medium text-gray-800 dark:text-white">
                                        {f.title}
                                    </h3>

                                    {/* 👉 Status Badge */}
                                    <StatusBadge status={f.status} />
                                </div>

                                {/* Description */}
                                {f.description && (
                                    <p className="mt-2 text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                                        {f.description}
                                    </p>
                                )}

                                {/* Date */}
                                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                    Requested on {f.createdAt.split("T")[0]}
                                </p>
                            </div>
                        ))}
                    </div>

                )}
            </div>
        </div>
    );
}

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        pending:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
        approved:
            "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
        rejected:
            "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    };

    return (
        <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${colors[status]}`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};
