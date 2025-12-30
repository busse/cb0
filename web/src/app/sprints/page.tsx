import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusColors: Record<string, string> = {
  planned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default async function SprintsPage() {
  const supabase = await createClient();
  const { data: sprints, error } = await supabase
    .from("sprints")
    .select("*")
    .order("sprint_id", { ascending: false });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-500">Error loading sprints: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sprints</h1>
      </div>

      {sprints && sprints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map((sprint) => (
            <Link
              key={sprint.id}
              href={`/sprints/${sprint.sprint_id}`}
              className="block p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-mono text-gray-500">
                  Sprint {sprint.sprint_id}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${statusColors[sprint.status] || statusColors.planned}`}
                >
                  {sprint.status}
                </span>
              </div>
              <h2 className="text-lg font-semibold mb-2">
                Sprint {sprint.sprint_number}, {sprint.year}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {new Date(sprint.start_date).toLocaleDateString()} -{" "}
                {new Date(sprint.end_date).toLocaleDateString()}
              </p>
              {sprint.goals && sprint.goals.length > 0 && (
                <ul className="mt-3 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                  {sprint.goals.slice(0, 3).map((goal: string, i: number) => (
                    <li key={i} className="truncate">
                      {goal}
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No sprints found.</p>
      )}
    </div>
  );
}
