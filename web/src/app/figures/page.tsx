import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default async function FiguresPage() {
  const supabase = await createClient();
  const { data: figures, error } = await supabase
    .from("figures")
    .select("*")
    .order("figure_number", { ascending: true });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-500">Error loading figures: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Figures</h1>
      </div>

      {figures && figures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {figures.map((figure) => (
            <Link
              key={figure.id}
              href={`/figures/${figure.figure_number}`}
              className="block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors overflow-hidden"
            >
              {figure.image_path && (
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={figure.image_path}
                    alt={figure.alt_text || figure.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-mono text-gray-500">
                    fig_{figure.figure_number}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${statusColors[figure.status] || statusColors.active}`}
                  >
                    {figure.status}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{figure.title}</h2>
                {figure.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                    {figure.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No figures found.</p>
      )}
    </div>
  );
}
