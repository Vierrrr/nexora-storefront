import Link from "next/link";
import { Package } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-semibold text-gray-900">Nexora</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Electronics and accessories for the modern world. Quality products, fast delivery.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {["Smartphones", "Audio", "Cables & Chargers", "Laptop Accessories", "Peripherals", "Cases"].map((item) => (
                <li key={item}>
                  <Link href="/shop" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: "My Account", href: "/account" },
                { label: "My Orders", href: "/account/orders" },
                { label: "Track Order", href: "/track" },
                { label: "My Returns", href: "/account/returns" },
                { label: "Sign In", href: "/login" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2.5">
              {["Help Center", "Shipping Policy", "Return Policy", "Contact Us", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-gray-500 cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Nexora Electronics. All rights reserved.</p>
          <p className="text-xs text-gray-400">Powered by Nexora OFMS</p>
        </div>
      </div>
    </footer>
  );
}
