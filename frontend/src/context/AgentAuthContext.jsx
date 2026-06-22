import { createContext, useState } from "react";

export const AgentAuthContext = createContext({
  agent: null,
  login: () => {},
  logout: () => {},
});

export function AgentAuthProvider({ children }) {
  const [agent, setAgent] = useState(null);

  const login = () => setAgent({ name: "Agent", id: "agent-1" });
  const logout = () => setAgent(null);

  return (
    <AgentAuthContext.Provider value={{ agent, login, logout }}>
      {children}
    </AgentAuthContext.Provider>
  );
}
