'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  OPEN:        'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  RESOLVED:    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  CLOSED:      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600',
};

const RiskBlockage = ({ projectId }: { projectId: string }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(`/api/tickets?projectId=${projectId}`);
        const data = await res.json();
        if (data.success) setTickets(data.tickets ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchTickets();
  }, [projectId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 border-red-400 shadow-sm relative">
      {/* Header Pill */}
      <div className="flex justify-end absolute top-1 right-10 -mt-6 mb-4">
        <span className="bg-red-400 text-white px-4 py-1 rounded-sm text-sm font-medium">
          Risk & Blockage
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-red-400" size={24} />
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No risks or blockages reported.</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{ticket.issueType}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[ticket.status] ?? STATUS_COLOR.CLOSED}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{ticket.description}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RiskBlockage;
