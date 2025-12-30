import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusColors: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const priorityColors: Record<string, string> = {
  low: "text-gray-500",
  medium: "text-blue-500",
  high: "text-orange-500",
  critical: "text-red-500",
};

export default async function StoriesPage() {
  const supabase = await createClient();
  const { data: stories, error } = await supabase
    .from("stories")
    .select("*")
    .order("story_number", { ascending: true });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-500">Error loading stories: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Stories</h1>
      </div>

      {stories && stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.story_number}`}
              className="block p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-mono text-gray-500">
                  s{story.story_number}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${statusColors[story.status] || statusColors.backlog}`}
                >
                  {story.status}
                </span>
              </div>
              <h2 className="text-lg font-semibold mb-2">{story.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                {story.description}
              </p>
              <div className="mt-3">
                <span className={`text-xs font-medium ${priorityColors[story.priority]}`}>
                  {story.priority} priority
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No stories found.</p>
      )}
    </div>
  );
}
