import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";

const statusColors: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default async function AdminStoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: stories, error } = await supabase
    .from("stories")
    .select("*")
    .order("story_number", { ascending: true });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm">
            &larr; Back to Admin
          </Link>
          <h1 className="text-3xl font-bold mt-2">Manage Stories</h1>
        </div>
        <Link
          href="/admin/stories/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          New Story
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
          Error loading stories: {error.message}
        </div>
      )}

      {stories && stories.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">s{story.story_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{story.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[story.status]}`}>{story.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{story.priority}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link href={`/admin/stories/${story.story_number}/edit`} className="text-blue-600 hover:text-blue-900">Edit</Link>
                    <DeleteButton table="stories" id={story.id} confirmText={`Delete story "${story.title}"?`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No stories found.</p>
      )}
    </div>
  );
}
