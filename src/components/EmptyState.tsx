export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="card border-dashed bg-blue/[0.02] py-16 px-6 text-center">
      <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue/10 text-blue-dark">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M4 13h4l2 3h4l2-3h4M4 13l2.5-7h11L20 13M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="font-serif text-xl">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-ink/55 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
