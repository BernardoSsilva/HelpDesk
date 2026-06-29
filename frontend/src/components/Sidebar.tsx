import {
  BarChart3,
  CircleHelp,
  Gauge,
  Headphones,
  Menu,
  PlusCircle,
  Settings,
  Ticket,
  UserRound,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Avatar, IconButton, Tooltip } from "@mui/material";
import { useAuth } from "../state/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/meus-tickets", label: "Meus Tickets", icon: CircleHelp },
  { to: "/tickets/new", label: "Criar Ticket", icon: PlusCircle },
  { to: "/usuarios", label: "Usuarios", icon: UsersRound },
  { to: "/relatorios", label: "Relatorios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configuracoes", icon: Settings },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar-bg fixed bottom-0 left-0 top-0 z-30 hidden w-60 flex-col text-white shadow-2xl lg:flex">
      <div className="flex h-16 items-center gap-3 px-6">
        <Headphones className="h-7 w-7 text-blue-400" />
        <span className="text-xl font-extrabold tracking-normal">Help Desk</span>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex h-12 items-center gap-3 rounded-md px-4 text-sm font-semibold transition",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-200 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar sx={{ width: 38, height: 38 }}>{(user?.name || "A").charAt(0)}</Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.name || "Admin"}</p>
            <p className="truncate text-xs text-slate-300">{user?.role === "ADMIN" ? "Administrador" : "Usuario"}</p>
          </div>
          <Tooltip title="Menu">
            <IconButton size="small" sx={{ color: "white" }}>
              <Menu className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
