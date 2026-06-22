import { useContext } from "react";
import { AgentAuthContext } from "../context/AgentAuthContext";

export function useAgentAuth() {
  return useContext(AgentAuthContext);
}
