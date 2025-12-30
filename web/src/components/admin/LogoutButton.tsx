"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      Sign Out
    </button>
  );
}
