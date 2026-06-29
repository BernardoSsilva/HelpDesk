import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type StatCardProps = {
  color?: string;
  icon?: LucideIcon;
  label: string;
  trend?: string;
  value: ReactNode;
};

export default function StatCard({ color = "blue", icon: Icon, label, trend, value }: StatCardProps) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-100 text-slate-600",
    violet: "bg-violet-100 text-violet-700",
  };

  return (
    <div className="soft-card rounded-md p-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-md ${colorMap[color] || colorMap.blue}`}>
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-950">{value}</p>
        </div>
      </div>
      {trend ? <p className="mt-4 text-xs font-medium text-slate-500">{trend}</p> : null}
    </div>
  );
}
