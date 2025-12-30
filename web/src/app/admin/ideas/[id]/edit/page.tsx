"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { IdeaStatus, Idea } from "@/types/database";

export default function EditIdeaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "planned" as IdeaStatus,
    tags: "",
    body: "",
  });

  useEffect(() => {
    async function loadIdea() {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("idea_number", parseInt(id))
        .single();

      if (error) {
        setError(error.message);
      } else if (data) {
        setIdea(data);
        setFormData({
          title: data.title,
          description: data.description,
          status: data.status,
          tags: data.tags?.join(", ") || "",
          body: data.body || "",
        });
      }
      setLoading(false);
    }

    loadIdea();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("ideas")
      .update({
        title: formData.title,
        description: formData.description,
        status: formData.status,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
        body: formData.body || null,
      })
      .eq("id", idea.id);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push("/admin/ideas");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p>Loading...</p>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-500">Idea not found</p>
        <Link href="/admin/ideas" className="text-blue-600 hover:text-blue-800">
          Back to Ideas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/admin/ideas" className="text-blue-600 hover:text-blue-800 text-sm">
          &larr; Back to Ideas
        </Link>
        <h1 className="text-3xl font-bold mt-2">Edit Idea i{idea.idea_number}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-500">
            Idea Number
          </label>
          <p className="text-lg font-mono">i{idea.idea_number}</p>
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
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
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
