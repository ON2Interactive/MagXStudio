import type { SectionData } from "@/lib/types";

export function SectionRenderer({ sections }: { sections: SectionData[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section key={section.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/50">{section.type}</p>
        </section>
      ))}
    </div>
  );
}
