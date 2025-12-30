import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminMaterialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: materials, error } = await supabase
    .from("materials")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm">
            &larr; Back to Admin
          </Link>
          <h1 className="text-3xl font-bold mt-2">Manage Materials</h1>
        </div>
        <Link
          href="/admin/materials/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          New Material
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
          Error loading materials: {error.message}
        </div>
      )}

      {materials && materials.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{material.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{material.slug}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(material.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link href={`/admin/materials/${material.slug}/edit`} className="text-blue-600 hover:text-blue-900">Edit</Link>
                    <DeleteButton table="materials" id={material.id} confirmText={`Delete material "${material.title}"?`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No materials found.</p>
      )}
    </div>
  );
}
