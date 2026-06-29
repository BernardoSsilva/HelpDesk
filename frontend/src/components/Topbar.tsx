import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Avatar, Badge, IconButton, Menu as MuiMenu, MenuItem, Tooltip } from "@mui/material";
import { useMemo, useState, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tickets": "Tickets",
  "/meus-tickets": "Meus Tickets",
  "/tickets/new": "Novo Ticket",
  "/usuarios": "Usuarios",
  "/relatorios": "Relatorios",
  "/configuracoes": "Configuracoes",
};

export default function Topbar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const title = useMemo(() => {
    if (location.pathname.startsWith("/tickets/") && location.pathname !== "/tickets/new") {
      return "Ticket";
    }

    return titles[location.pathname] || "Help Desk";
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <IconButton size="small" sx={{ color: "#1d63ed" }}>
          <Menu className="h-5 w-5" />
        </IconButton>

        <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold text-slate-950">{title}</h1>

        <div className="hidden h-10 w-64 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-400 xl:flex">
          <Search className="h-4 w-4" />
          <span className="text-sm">Buscar no sistema...</span>
        </div>

        <Tooltip title="Notificacoes">
          <IconButton size="small">
            <Badge color="error" variant="dot">
              <Bell className="h-5 w-5 text-slate-700" />
            </Badge>
          </IconButton>
        </Tooltip>

        <button className="flex items-center gap-2" onClick={(event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget)}>
          <Avatar sx={{ width: 32, height: 32 }}>{(user?.name || "A").charAt(0)}</Avatar>
          <span className="hidden text-sm font-bold text-slate-900 sm:inline">{user?.name || "Admin"}</span>
        </button>

        <MuiMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </MenuItem>
        </MuiMenu>
      </div>
    </header>
  );
}
