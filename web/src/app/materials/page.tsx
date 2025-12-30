import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MaterialsPage() {
  const supabase = await createClient();
  const { data: materials, error } = await supabase
    .from("materials")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-500">Error loading materials: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Materials</h1>
      </div>

      {materials && materials.length > 0 ? (
        <div className="space-y-6">
          {materials.map((material) => (
            <Link
              key={material.id}
              href={`/materials/${material.slug}`}
              className="block p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-semibold">{material.title}</h2>
                <span className="text-sm text-gray-500">
                  {new Date(material.date).toLocaleDateString()}
                </span>
              </div>
              {material.excerpt && (
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {material.excerpt}
                </p>
              )}
              {material.author && (
                <p className="text-sm text-gray-500">By {material.author}</p>
              )}
              {material.tags && material.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {material.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No materials found.</p>
      )}
    </div>
  );
}
