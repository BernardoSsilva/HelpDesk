import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Avatar, Badge, IconButton, Menu as MuiMenu, MenuItem, Tooltip } from "@mui/material";
import { useMemo, useState, type FormEvent, type MouseEvent } from "react";
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

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");

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

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!search.trim()) {
      return;
    }

    navigate(`/tickets?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <IconButton aria-label="Abrir menu" size="small" sx={{ color: "#1d63ed" }} onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </IconButton>

        <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold text-slate-950">{title}</h1>

        <form className="hidden xl:block" onSubmit={handleSearchSubmit}>
          <label className="flex h-10 w-64 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-blue-400">
            <Search className="h-4 w-4 shrink-0" />
            <input
              className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Buscar tickets..."
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </form>

        <Tooltip title="Notificacoes">
          <IconButton aria-label="Notificacoes" size="small" onClick={(event: MouseEvent<HTMLElement>) => setNotificationsAnchorEl(event.currentTarget)}>
            <Badge color="error" variant="dot" invisible>
              <Bell className="h-5 w-5 text-slate-700" />
            </Badge>
          </IconButton>
        </Tooltip>

        <MuiMenu anchorEl={notificationsAnchorEl} open={Boolean(notificationsAnchorEl)} onClose={() => setNotificationsAnchorEl(null)}>
          <MenuItem disabled>Nenhuma notificacao nova</MenuItem>
        </MuiMenu>

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
