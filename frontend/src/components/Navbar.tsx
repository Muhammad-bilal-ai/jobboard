"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // avoid hydration mismatch — only render auth state after mount
  useEffect(() => setMounted(true), []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          Job<span className="text-indigo-600">Board</span>
        </Link>

        <div className="flex items-center gap-4">
          {!mounted ? null : user ? (
            <>
              {user.role === "EMPLOYER" && (
                <Link
                  href="/dashboard/employer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
              )}
              {user.role === "CANDIDATE" && (
                <Link
                  href="/dashboard/candidate"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  My Applications
                </Link>
              )}
              <span className="text-sm text-gray-500">
                Hi, {user.name.split(" ")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm px-4 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
