import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/admin/LogoutButton";

const adminSections = [
  { title: "Ideas", href: "/admin/ideas", description: "Manage ideas" },
  { title: "Stories", href: "/admin/stories", description: "Manage stories" },
  { title: "Sprints", href: "/admin/sprints", description: "Manage sprints" },
  { title: "Updates", href: "/admin/updates", description: "Manage updates" },
  { title: "Figures", href: "/admin/figures", description: "Manage figures" },
  { title: "Materials", href: "/admin/materials", description: "Manage materials" },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Logged in as {user.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
