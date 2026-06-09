

export default function PageShell({ title, description, children }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-sm p-6 md:p-8">
        <div className="flex flex-col gap-2">
          {title ? (
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
          ) : null}
          {description ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
          ) : null}
        </div>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}

