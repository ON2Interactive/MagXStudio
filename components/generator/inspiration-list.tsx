import type { InspirationSource } from "@/lib/types";

type InspirationListProps = {
  sources: InspirationSource[];
};

export function InspirationList({ sources }: InspirationListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
        Inspiration Sources
      </h3>
      {sources.length ? (
        <ul className="space-y-2">
          {sources.map((source) => (
            <li key={source.url} className="rounded-md border border-border p-3">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
              >
                {source.title}
              </a>
              <p className="mt-1 text-xs text-text/80">{source.notes}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">No sources yet. Generate to populate inspiration research.</p>
      )}
    </div>
  );
}
