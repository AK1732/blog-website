

export default function AddBlog() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AddBlog</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Frontend form only.</p>

        <form className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</span>
            <input
              className="h-11 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 outline-none focus:ring-2 focus:ring-brand-purple/30"
              placeholder="How to write with clarity"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Tag</span>
            <input
              className="h-11 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 outline-none focus:ring-2 focus:ring-brand-purple/30"
              placeholder="React / Tailwind / UI/UX"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Content</span>
            <textarea
              rows={8}
              className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-purple/30"
              placeholder="Write your post..."
            />
          </label>

          <button
            type="button"
            className="h-11 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-semibold shadow-sm hover:shadow-md transition"
          >
            Publish (UI)
          </button>
        </form>
      </div>
    </section>
  );
}

