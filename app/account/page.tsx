"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Package, RotateCcw, LogOut, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { mockOrders } from "@/data/orders";
import Badge from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useEffect } from "react";

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  if (!user) return null;

  const recentOrders = mockOrders.slice(0, 2);

  const quickLinks = [
    { icon: Package, label: "My Orders", desc: "View and track your orders", href: "/account/orders" },
    { icon: RotateCcw, label: "My Returns", desc: "Manage your return requests", href: "/account/returns" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-7 h-7 text-gray-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>

          <button
            onClick={() => { logout(); router.push("/"); }}
            className="mt-6 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {quickLinks.map(({ icon: Icon, label, desc, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/account/orders" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
            View all
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.date)} · {formatCurrency(order.total)}</p>
              </div>
              <Badge status={order.status} size="sm" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
