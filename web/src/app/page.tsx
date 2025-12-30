import Link from "next/link";

const sections = [
  {
    title: "Ideas",
    description: "Core concepts and features being developed",
    href: "/ideas",
  },
  {
    title: "Stories",
    description: "Specific tasks and user stories",
    href: "/stories",
  },
  {
    title: "Sprints",
    description: "Time-boxed development periods",
    href: "/sprints",
  },
  {
    title: "Updates",
    description: "Progress notes and status changes",
    href: "/updates",
  },
  {
    title: "Figures",
    description: "Images and visual assets",
    href: "/figures",
  },
  {
    title: "Materials",
    description: "Blog posts and documentation",
    href: "/materials",
  },
];

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Ideas Taxonomy</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          A system for tracking ideas, stories, sprints, and progress updates
          across projects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
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
