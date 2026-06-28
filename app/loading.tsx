export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading...</p>
      </div>
    </main>
  );
}
