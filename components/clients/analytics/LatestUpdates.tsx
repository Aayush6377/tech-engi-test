'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const LatestUpdates = ({ projectId }: { projectId: string }) => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/client/analytics/updates?projectId=${projectId}`)
      .then(r => r.json())
      .then(res => { if (res.success && Array.isArray(res.data)) setUpdates(res.data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 p-6 shadow-md relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">Latest Updates</h2>
        <span className="text-lg font-medium text-gray-500 dark:text-gray-400">{updates.length} updates</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      ) : updates.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No updates yet.</p>
      ) : (
        <div className="relative">
          <div className="space-y-6 max-h-[430px] overflow-y-auto pr-2 no-scrollbar pb-10">
            {updates.map((item) => (
              <div key={item.id} className="relative">
                <div className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600">
                  <span className="absolute top-3 right-4 text-sm text-purple-600 dark:text-purple-400 font-medium">
                    {item.date}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-800 pt-3 dark:text-gray-200">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none rounded-xl absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-300/60 dark:from-gray-800/60 to-transparent" />
    </div>
  );
};

export default LatestUpdates;
