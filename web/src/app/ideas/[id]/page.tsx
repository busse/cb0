import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const statusColors: Record<string, string> = {
  planned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export default async function IdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: idea, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("idea_number", parseInt(id))
    .single();

  if (error || !idea) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          href="/ideas"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          &larr; Back to Ideas
        </Link>
      </div>

      <article className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8">
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm font-mono text-gray-500">
            i{idea.idea_number}
          </span>
          <span
            className={`px-3 py-1 text-sm rounded-full ${statusColors[idea.status] || statusColors.planned}`}
          >
            {idea.status}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-4">{idea.title}</h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          {idea.description}
        </p>

        {idea.tags && idea.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {idea.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-500 mb-6">
          Created: {new Date(idea.created).toLocaleDateString()}
        </div>

        {idea.body && (
          <div className="prose dark:prose-invert max-w-none">
            {idea.body}
          </div>
        )}
      </article>
    </div>
  );
}
