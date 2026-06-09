
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="max-w-2xl mx-auto px-4 py-14 text-center">
      <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-sm p-8">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white">404</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Page not found.</p>
        <Link
          to="/"
          className="mt-6 inline-flex px-5 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-semibold shadow-sm hover:shadow-md transition"
        >
          Go Home
        </Link>
      </div>
    </section>
  );
}

