import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import PageFallback from "./components/PageFallback";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

// Cada página vira um arquivo separado, carregado só quando a rota é aberta.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const NewTicket = lazy(() => import("./pages/NewTicket"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const Tickets = lazy(() => import("./pages/Tickets"));
const Users = lazy(() => import("./pages/Users"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/tickets/new" element={<NewTicket />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/meus-tickets" element={<MyTickets />} />
              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/usuarios" element={<Users />} />
              </Route>
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
