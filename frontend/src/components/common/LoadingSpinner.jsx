export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-accent" />
      {label && <p className="mt-3 text-sm">{label}</p>}
    </div>
  );
}
