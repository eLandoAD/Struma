import { createContext, useContext, useState } from "react";

export const AgentAuthContext = createContext({
  agent: null,
  login: () => {},
  logout: () => {},
});

export function AgentAuthProvider({ children }) {
  const [agent, setAgent] = useState(null);

  // Sostituisci il corpo con una vera chiamata API quando il backend è pronto.
  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error("Email e password sono obbligatorie.");
    }

    // --- MOCK: rimuovi quando collegherai il backend reale ---
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (password.length < 4) {
      throw new Error("Credenziali non valide. Riprova.");
    }
    // --- fine MOCK ---

    setAgent({ name: email.split("@")[0], email, id: "agent-1" });
  };

  const logout = () => setAgent(null);

  return (
    <AgentAuthContext.Provider value={{ agent, login, logout }}>
      {children}
    </AgentAuthContext.Provider>
  );
}

export function useAgentAuth() {
  return useContext(AgentAuthContext);
}