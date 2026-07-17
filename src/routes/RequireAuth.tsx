import { Navigate, Outlet } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { usePresenceHeartbeat } from "../hooks/usePresenceHeartbeat";

export default function RequireAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  usePresenceHeartbeat(isAuthenticated);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
