'use client';

import { useEffect, useState } from 'react';
import { FileText, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns/format';

const ClientOverview = ({ projectId }: { projectId: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/client/analytics/overview?projectId=${projectId}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  if (!data?.project) return (
    <div className="p-6 text-center text-red-500 dark:text-red-400">No project data available</div>
  );

  const { project, timeline, team, progress } = data;

  const projectName = project.name || 'N/A';
  const projectType = project.type || 'N/A';
  const projectBudget = project.budget || 0;
  const projectDescription = project.description || 'No description available';
  const currency = project.currency || 'USD';

  const startDate = timeline?.startDate ? format(new Date(timeline.startDate), 'dd MMM.yyyy') : 'N/A';
  const deadline = timeline?.deadline ? format(new Date(timeline.deadline), 'dd MMM.yyyy') : 'N/A';
  const daysRemaining = timeline?.daysRemaining ?? 0;

  const projectManager = team?.projectManager || 'Unassigned';
  const overallProgress = progress?.overall ?? 0;
  const circumference = +(2 * Math.PI * 80).toFixed(1);

  return (
    <div className="dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">

            {/* Top 3 Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-600/60 to-blue-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-end">
                <div className="absolute top-4 right-4 w-10 h-10 bg-gray-100/40 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-1">{projectName}</h2>
                  <p className="text-blue-100 text-sm">Project Name</p>
                </div>
              </div>

              {/* <div className="bg-gradient-to-r from-yellow-400/70 to-yellow-800/80 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-end">
                <div className="absolute top-4 right-4 w-10 h-10 bg-gray-100/40 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-1">{projectType}</h2>
                  <p className="text-yellow-100 text-sm">Project Type</p>
                </div>
              </div> */}

              <div className="bg-gradient-to-r from-purple-600/50 to-purple-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-end">
                <div className="absolute top-4 right-4 w-10 h-10 bg-gray-100/40 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-1">{currency} {projectBudget.toLocaleString()}</h2>
                  <p className="text-purple-100 text-sm">Project Budget</p>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{projectDescription}</p>
              </div>

              <div className="flex flex-col gap-4 col-span-1">
                <div className="flex gap-4 w-full">
                  <div className="bg-gray-100 dark:bg-gray-800 w-full rounded-2xl p-5 shadow-sm border border-gray-400/50 dark:border-gray-700">
                    <div className="flex items-end justify-end gap-2 mb-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Start Date</span>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{startDate}</p>
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800 w-full rounded-2xl p-5 shadow-sm border border-gray-400/50 dark:border-gray-700">
                    <div className="flex justify-end items-end gap-2 mb-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Deadline</span>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{deadline}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 w-full">
                  <div className="bg-gray-100 dark:bg-gray-800 w-80 rounded-2xl p-5 shadow-sm border border-gray-400/50 dark:border-gray-700">
                    <div className="flex flex-col items-start gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Project Engineer</span>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{projectManager}</p>
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800 w-40 rounded-2xl p-5 shadow-sm border border-gray-400/50 dark:border-gray-700">
                    <div className="flex flex-col items-start gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Days Remaining</span>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {daysRemaining > 0 ? daysRemaining : 'Completed'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Progress Circle */}
          <div className="lg:col-span-4">
            <div className="bg-gray-100 dark:bg-gray-800 h-full rounded-2xl p-6 shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center">
              <h3 className="font-bold text-gray-900 dark:text-white mb-8">Overall Progress</h3>
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" className="dark:stroke-gray-600" strokeWidth="20" />
                  <circle
                    cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" strokeWidth="20"
                    strokeDasharray={`${(overallProgress / 100) * circumference} ${circumference}`}
                    strokeLinecap="round" className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">{overallProgress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOverview;
