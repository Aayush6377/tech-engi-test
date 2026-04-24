'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const Milestones = ({ projectId }: { projectId: string }) => {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/client/analytics/milestone?projectId=${projectId}`)
      .then(r => r.json())
      .then(res => { if (res.success && Array.isArray(res.data)) setMilestones(res.data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="space-y-4 relative">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Milestones</h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      ) : milestones.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No milestones yet.</p>
      ) : (
        <div className="relative max-h-72 overflow-y-auto pr-2 no-scrollbar pb-10">
          {milestones.map((m) => (
            <div key={m.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">{m.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                    {format(new Date(m.createdAt), 'dd/MM/yyyy')}
                  </span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{m.description}</p>
            </div>
          ))}
          <div className="pointer-events-none absolute inset-x-0 right-2 bottom-6 rounded-xl h-12 bg-gradient-to-t from-gray-100 dark:from-gray-800/60 to-transparent" />
        </div>
      )}
    </div>
  );
};

export default Milestones;
