import { Navigate } from "react-router-dom";
import { useAgentAuth } from "../hooks/useAgentAuth";

export function ProtectedAgentRoute({ children }) {
  const { agent } = useAgentAuth();
  if (!agent) {
    return <Navigate to="/agent/login" replace />;
  }
  return <>{children}</>;
}
