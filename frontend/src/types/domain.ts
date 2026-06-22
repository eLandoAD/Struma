// Domain types shared across the customer flow and the agent console.
// These mirror the shape we expect the future REST API to return, so
// swapping the mock implementations in `lib/api.ts` for real `fetch`
// calls should not require touching the components.

export type AgentStatus = "ONLINE" | "BUSY" | "OFFLINE";

export interface Agent {
  id: string;
  name: string;
  title: string;
  email: string;
  status: AgentStatus;
  avatarInitials: string;
}

export type QueueRequestStatus =
  | "WAITING"
  | "ANSWERED"
  | "DECLINED"
  | "CANCELLED";

export interface QueueRequest {
  id: string;
  customerLabel: string;
  context: string; // e.g. "Checkout Page", "Product: Lumina Pro"
  waitingSince: number; // epoch ms
  status: QueueRequestStatus;
}

export interface ConsultationSession {
  id: string;
  agent: Agent;
  startedAt: number;
}
