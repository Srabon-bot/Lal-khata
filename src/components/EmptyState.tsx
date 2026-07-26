interface EmptyStateProps {
  message: string;
  showArrow?: boolean;
}

export function EmptyState({ message, showArrow = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="status">
      {showArrow && (
        <span className="animate-bounce text-4xl" aria-hidden="true">
          ⬇️
        </span>
      )}
      <p className="max-w-[220px] font-bangla text-base text-ink/60">{message}</p>
    </div>
  );
}
