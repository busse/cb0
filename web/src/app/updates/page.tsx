import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const typeColors: Record<string, string> = {
  progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completion: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  blocker: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  note: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default async function UpdatesPage() {
  const supabase = await createClient();
  const { data: updates, error } = await supabase
    .from("updates")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-500">Error loading updates: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Updates</h1>
      </div>

      {updates && updates.length > 0 ? (
        <div className="space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-mono text-gray-500">
                  {update.notation}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${typeColors[update.type] || typeColors.note}`}
                >
                  {update.type}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <Link
                  href={`/sprints/${update.sprint_id}`}
                  className="hover:text-blue-600"
                >
                  Sprint {update.sprint_id}
                </Link>
                <Link
                  href={`/ideas/${update.idea_number}`}
                  className="hover:text-blue-600"
                >
                  Idea {update.idea_number}
                </Link>
                <Link
                  href={`/stories/${update.story_number}`}
                  className="hover:text-blue-600"
                >
                  Story {update.story_number}
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(update.date).toLocaleDateString()}
              </p>
              {update.body && (
                <p className="mt-3 text-gray-700 dark:text-gray-300">
                  {update.body}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No updates found.</p>
      )}
    </div>
  );
}
