import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

type ProtectedRouteProps = {
  /** Restringe a rota a administradores; os demais voltam ao dashboard. */
  adminOnly?: boolean;
};

export default function ProtectedRoute({ adminOnly = false }: ProtectedRouteProps) {
  const { isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
