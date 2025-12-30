"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DeleteButtonProps {
  table: string;
  id: number;
  confirmText: string;
}

export function DeleteButton({ table, id, confirmText }: DeleteButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm(confirmText)) return;

    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      alert(`Error deleting: ${error.message}`);
    } else {
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
    >
      Delete
    </button>
  );
}
