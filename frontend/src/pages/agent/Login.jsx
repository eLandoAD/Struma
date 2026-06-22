import { useEffect } from "react";
import { useAgentAuth } from "../../hooks/useAgentAuth";

export default function AgentLogin() {
  const { login } = useAgentAuth();

  useEffect(() => {
    login();
  }, [login]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold">Agent Login</h1>
      <p className="mt-4 text-[var(--color-text-dim)]">Agent login placeholder.</p>
    </div>
  );
}
