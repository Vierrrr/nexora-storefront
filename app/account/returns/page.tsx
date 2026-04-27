"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RotateCcw, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { fetchMyReturns } from "@/lib/api";

interface ReturnRequest {
  id: number; orderNumber: string; reason: string;
  status: string; submittedAt: string; notes?: string;
}

export default function ReturnsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login?redirect=/account/returns"); return; }
    if (!user) return;
    fetchMyReturns(user.id)
      .then(setReturns)
      .catch(() => setError("Failed to load returns."))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 mb-8 text-sm text-gray-500">
        <Link href="/account" className="hover:text-gray-900 transition-colors">Account</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">My Returns</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Returns</h1>
        <Link href="/account/returns/new"
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors">
          <Plus className="w-4 h-4" /> New Request
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-500 py-16">{error}</p>
      ) : returns.length === 0 ? (
        <div className="text-center py-24">
          <RotateCcw className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No return requests yet.</p>
          <Link href="/account/orders" className="mt-4 inline-block text-sm font-medium text-gray-900 underline">View My Orders</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {returns.map((ret) => (
            <div key={ret.id} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{ret.orderNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(ret.submittedAt)}</p>
                </div>
                <Badge status={ret.status} />
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5 flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400 w-16 flex-shrink-0">Reason</span>
                  <span className="text-xs text-gray-800 font-medium">{ret.reason}</span>
                </div>
                {ret.notes && (
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-400 w-16 flex-shrink-0">Notes</span>
                    <span className="text-xs text-gray-600">{ret.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
