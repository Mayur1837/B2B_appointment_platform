export default function Loader({ label = "Loading...", fullScreen = false }) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen items-center justify-center bg-slate-50"
          : "flex items-center justify-center py-12"
      }
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />

        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}
