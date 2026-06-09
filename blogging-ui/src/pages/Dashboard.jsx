

// Public dashboard placeholder (the actual admin dashboard UI is under /dashboard/*)
export default function Dashboard() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Your admin dashboard is available at <span className="font-semibold">/dashboard</span>.
        </p>
      </div>
    </section>
  );
}

