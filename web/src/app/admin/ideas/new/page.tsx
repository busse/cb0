"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { IdeaStatus } from "@/types/database";

export default function NewIdeaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    idea_number: "",
    title: "",
    description: "",
    status: "planned" as IdeaStatus,
    tags: "",
    body: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("ideas").insert({
      idea_number: parseInt(formData.idea_number),
      title: formData.title,
      description: formData.description,
      status: formData.status,
      created: new Date().toISOString().split("T")[0],
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
      body: formData.body || null,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/admin/ideas");
      router.refresh();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/admin/ideas" className="text-blue-600 hover:text-blue-800 text-sm">
          &larr; Back to Ideas
        </Link>
        <h1 className="text-3xl font-bold mt-2">New Idea</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="idea_number" className="block text-sm font-medium mb-2">
            Idea Number *
          </label>
          <input
            id="idea_number"
            type="number"
            required
            value={formData.idea_number}
            onChange={(e) => setFormData({ ...formData, idea_number: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            id="description"
            required
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as IdeaStatus })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="tag1, tag2, tag3"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-2">
            Body (Markdown)
          </label>
          <textarea
            id="body"
            rows={10}
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
          >
            {loading ? "Creating..." : "Create Idea"}
          </button>
          <Link
            href="/admin/ideas"
            className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
