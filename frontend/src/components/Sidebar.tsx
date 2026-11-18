import {
  BarChart3,
  CircleHelp,
  Gauge,
  Headphones,
  LogOut,
  PlusCircle,
  Settings,
  Ticket,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Avatar, IconButton, Tooltip } from "@mui/material";
import { useAuth } from "../state/AuthContext";
import { useSettings } from "../state/SettingsContext";

type NavItem = {
  adminOnly?: boolean;
  icon: LucideIcon;
  label: string;
  to: string;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/meus-tickets", label: "Meus Tickets", icon: CircleHelp },
  { to: "/tickets/new", label: "Criar Ticket", icon: PlusCircle },
  { to: "/usuarios", label: "Usuários", icon: UsersRound, adminOnly: true },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { isAdmin, logout, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Escape fecha o menu no mobile.
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleLogout = () => {
    onClose();
    logout();
    navigate("/login", { replace: true });
  };

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {open ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-20 bg-slate-950/50 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        aria-label="Menu principal"
        className={`sidebar-bg fixed bottom-0 left-0 top-0 z-30 flex w-60 flex-col text-white shadow-2xl transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 px-6">
          <Headphones className="h-7 w-7 shrink-0 text-blue-400" />
          <span className="truncate text-xl font-extrabold tracking-normal">{settings.systemName}</span>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  [
                    "flex h-12 items-center gap-3 rounded-md px-4 text-sm font-semibold transition",
                    // "Tickets" também cobre o detalhe (/tickets/:id), mas não "Criar Ticket" (/tickets/new).
                    isActive && !(item.to === "/tickets" && pathname === "/tickets/new")
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
            <Avatar sx={{ width: 38, height: 38 }}>{(user?.name || "?").charAt(0).toUpperCase()}</Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{user?.name || "Usuário"}</p>
              <p className="truncate text-xs text-slate-300">{isAdmin ? "Administrador" : "Usuário"}</p>
            </div>
            <Tooltip title="Sair">
              <IconButton aria-label="Sair" size="small" sx={{ color: "white" }} onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </aside>
    </>
  );
}
