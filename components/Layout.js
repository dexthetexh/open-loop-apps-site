// File: /components/Layout.js
import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Global Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Open Loop Apps
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-gray-600">
            <Link href="/games" className="hover:text-blue-600">Games</Link>
            <Link href="/contact" className="hover:text-blue-600">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Open Loop Apps. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
      </footer>
    </div>
  );
}