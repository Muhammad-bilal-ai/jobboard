"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

type Role = "CANDIDATE" | "EMPLOYER" | "ADMIN";

export function useRequireAuth(allowedRole?: Role) {
  const router = useRouter();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (allowedRole && user?.role !== allowedRole) {
      router.push("/");
    }
  }, [token, user, allowedRole, router]);

  return { user, token };
}
