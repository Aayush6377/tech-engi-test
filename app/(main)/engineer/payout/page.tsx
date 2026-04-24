"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { DollarSign, Calendar, Clock, CheckCircle, TrendingUp, Wallet, CreditCard } from "lucide-react";

interface Payout {
  id: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  sentFrom: string;
  paymentDate: string;
  status: string;
  isReceived: boolean;
  receivedAt?: string;
  paymentProofUrl?: string;
}

interface PayoutSchedule {
  nextPayoutDate: string;
  lastPayoutDate?: string;
  nextAmount?: number;
}

interface Summary {
  totalAmount: number;
  totalTransactions: number;
  receivedCount: number;
  pendingCount: number;
  workingPeriod: {
    months: number;
    days: number;
  };
}
const EngineerPayoutPage = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [schedule, setSchedule] = useState<PayoutSchedule | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserId(userData.user.id);
        await fetchPayoutData(userData.user.id);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayoutData(uid: string) {
    try {
      const [summaryRes, scheduleRes] = await Promise.all([
        fetch(`/api/payout/summary?userId=${uid}`),
        fetch(`/api/payout/schedule?userId=${uid}`),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
        setPayouts(data.recentPayouts || []);
      }

      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        setSchedule(scheduleData);
      }
    } catch (error) {
      console.error("Error fetching payout data:", error);
    }
  }

  // Format date to dd/mm/yyyy format - works in all browsers
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format time to HH:MM AM/PM format
  const formatTime = (dateString: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Format date and time together
  const formatDateTime = (dateString: string) => {
    const date = formatDate(dateString);
    const time = formatTime(dateString);
    return time ? `${date} • ${time}` : date;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">My Payouts</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Projects</p>
              <p className="text-3xl font-bold mt-1">₹{summary?.totalAmount.toLocaleString() || 0}</p>
              <p className="text-xs opacity-75 mt-2">
                {summary?.workingPeriod.months || 0}m {summary?.workingPeriod.days || 0}d
              </p>
            </div>
            <Wallet size={40} className="opacity-80" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-white/[0.05] rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Projects</p>
              <p className="text-3xl font-bold mt-1">{summary?.totalTransactions || 0}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                {summary?.receivedCount || 0}
              </p>
            </div>
            <TrendingUp size={40} className="text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-white/[0.05] rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Amount Left</p>
              <p className="text-xl font-bold mt-1">
                {schedule?.nextAmount
                  ? `₹${schedule.nextAmount.toLocaleString()}`
                  : "Not scheduled"}
              </p>
            </div>
            <CreditCard size={40} className="text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-white/[0.05] rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-xl font-bold mt-1">
                {schedule?.nextPayoutDate
                  ? formatDate(schedule.nextPayoutDate)
                  : "Not scheduled"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {schedule?.nextPayoutDate &&
                  Math.ceil(
                    (new Date(schedule.nextPayoutDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                  )}{" "}
              </p>
            </div>
            <Calendar size={40} className="text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-white/[0.05] rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Payment</p>
              <p className="text-xl font-bold mt-1">
                {schedule?.lastPayoutDate
                  ? formatDate(schedule.lastPayoutDate)
                  : "N/A"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {schedule?.lastPayoutDate &&
                  formatTime(schedule.lastPayoutDate)}
              </p>
            </div>
            <Clock size={40} className="text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Payment History */}
      <div className="bg-white dark:bg-white/[0.05] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-semibold mb-6">Payment History</h2>
        <div className="space-y-4">
          {payouts.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400">No payment history yet</p>
            </div>
          ) : (
            payouts.map((payout) => (
              <motion.div
                key={payout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-5 rounded-lg border-2 transition ${payout.isReceived
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ₹{payout.amount.toLocaleString()}
                      </p>
                      {payout.isReceived && (
                        <CheckCircle className="text-green-500" size={24} />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                      {payout.transactionId}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Date:</span> {formatDateTime(payout.paymentDate)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Method:</span> {payout.paymentMethod}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">From:</span> {payout.sentFrom}
                      </p>
                      {payout.isReceived && payout.receivedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          <span className="font-medium">Received:</span> {formatDateTime(payout.receivedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EngineerPayoutPage;