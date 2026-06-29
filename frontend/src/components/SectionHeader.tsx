import type { ReactNode } from "react";

type SectionHeaderProps = {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
};

export default function SectionHeader({ actions, eyebrow, title }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase text-blue-600">{eyebrow}</p> : null}
        <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
