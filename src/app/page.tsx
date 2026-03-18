import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Homebase</h1>
        <p className="text-lg text-slate-600 mb-8">
          Your family&apos;s command center. Coordinate schedules, manage tasks,
          and keep everyone in sync.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
