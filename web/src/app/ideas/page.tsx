import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusColors: Record<string, string> = {
  planned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export default async function IdeasPage() {
  const supabase = await createClient();
  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("*")
    .order("idea_number", { ascending: true });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-500">Error loading ideas: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ideas</h1>
      </div>

      {ideas && ideas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <Link
              key={idea.id}
              href={`/ideas/${idea.idea_number}`}
              className="block p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-mono text-gray-500">
                  i{idea.idea_number}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${statusColors[idea.status] || statusColors.planned}`}
                >
                  {idea.status}
                </span>
              </div>
              <h2 className="text-lg font-semibold mb-2">{idea.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                {idea.description}
              </p>
              {idea.tags && idea.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {idea.tags.map((tag: string) => (
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
        <p className="text-gray-500">No ideas found.</p>
      )}
    </div>
  );
}
