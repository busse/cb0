import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";

const typeColors: Record<string, string> = {
  progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completion: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  blocker: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  note: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default async function AdminUpdatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: updates, error } = await supabase
    .from("updates")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm">
            &larr; Back to Admin
          </Link>
          <h1 className="text-3xl font-bold mt-2">Manage Updates</h1>
        </div>
        <Link
          href="/admin/updates/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          New Update
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
          Error loading updates: {error.message}
        </div>
      )}

      {updates && updates.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {updates.map((update) => (
                <tr key={update.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{update.notation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(update.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${typeColors[update.type]}`}>{update.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link href={`/admin/updates/${update.id}/edit`} className="text-blue-600 hover:text-blue-900">Edit</Link>
                    <DeleteButton table="updates" id={update.id} confirmText={`Delete update ${update.notation}?`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No updates found.</p>
      )}
    </div>
  );
}
