import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ideas Taxonomy",
  description: "Track and manage ideas, stories, and sprints",
};

const navLinks = [
  { href: "/ideas", label: "Ideas" },
  { href: "/stories", label: "Stories" },
  { href: "/sprints", label: "Sprints" },
  { href: "/updates", label: "Updates" },
  { href: "/figures", label: "Figures" },
  { href: "/materials", label: "Materials" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <header className="border-b border-gray-200 dark:border-gray-800">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link
                  href="/"
                  className="flex items-center font-semibold text-lg"
                >
                  Ideas Taxonomy
                </Link>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <Link
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Admin
                </Link>
              </div>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              Ideas Taxonomy CMS
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
