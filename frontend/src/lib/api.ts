import type {
  Agent,
  AgentStatus,
  ConsultationSession,
  QueueRequest,
} from "../types/domain";

/**
 * MOCK API LAYER
 * ----------------
 * Every function here represents one REST endpoint the backend team will
 * expose. The shapes (request/response) are final from the UI's point of
 * view; only the implementation body needs to change from "in-memory mock"
 * to "fetch('/api/...')" once the backend exists.
 *
 *   POST   /api/auth/agent/login        -> loginAgent
 *   PUT    /api/agents/me/status        -> updateAgentStatus
 *   POST   /api/queue/requests          -> createQueueRequest
 *   GET    /api/queue/requests/:id      -> getQueueRequest
 *   DELETE /api/queue/requests/:id      -> cancelQueueRequest
 *   GET    /api/queue/requests?status=WAITING -> listWaitingQueue
 *   POST   /api/queue/requests/:id/answer     -> answerQueueRequest
 *   POST   /api/queue/requests/:id/decline    -> declineQueueRequest
 */

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const MOCK_AGENT: Agent = {
  id: "agent-1",
  name: "Sarah Jenkins",
  title: "Senior Consultant · Tier 1",
  email: "sarah.jenkins@videoshop.com",
  status: "OFFLINE",
  avatarInitials: "SJ",
};

// Seed a couple of customers already "waiting" so the dashboard isn't empty.
let queue: QueueRequest[] = [
  {
    id: "q-1",
    customerLabel: "David Richardson",
    context: "Checkout Page",
    waitingSince: Date.now() - 165_000,
    status: "WAITING",
  },
  {
    id: "q-2",
    customerLabel: "Elena Kostas",
    context: "Product: Lumina Pro",
    waitingSince: Date.now() - 52_000,
    status: "WAITING",
  },
];

let idCounter = 3;

export async function loginAgent(
  email: string,
  password: string
): Promise<{ agent: Agent; token: string }> {
  await delay(600);
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  if (password.length < 4) {
    throw new Error("Invalid email or password.");
  }
  return {
    agent: { ...MOCK_AGENT, email, status: "OFFLINE" },
    token: "mock-token-" + Math.random().toString(36).slice(2),
  };
}

export async function updateAgentStatus(
  status: AgentStatus
): Promise<Agent> {
  await delay(250);
  return { ...MOCK_AGENT, status };
}

export async function createQueueRequest(
  customerLabel: string,
  context: string
): Promise<QueueRequest> {
  await delay(500);
  const request: QueueRequest = {
    id: `q-${idCounter++}`,
    customerLabel,
    context,
    waitingSince: Date.now(),
    status: "WAITING",
  };
  queue = [...queue, request];
  return request;
}

export async function getQueueRequest(
  id: string
): Promise<QueueRequest | undefined> {
  await delay(300);
  return queue.find((r) => r.id === id);
}

export async function cancelQueueRequest(id: string): Promise<void> {
  await delay(200);
  queue = queue.map((r) =>
    r.id === id ? { ...r, status: "CANCELLED" } : r
  );
}

export async function listWaitingQueue(): Promise<QueueRequest[]> {
  await delay(300);
  return queue.filter((r) => r.status === "WAITING");
}

export async function answerQueueRequest(
  id: string
): Promise<ConsultationSession> {
  await delay(400);
  queue = queue.map((r) =>
    r.id === id ? { ...r, status: "ANSWERED" } : r
  );
  return {
    id: `session-${id}`,
    agent: { ...MOCK_AGENT, status: "BUSY" },
    startedAt: Date.now(),
  };
}

export async function declineQueueRequest(id: string): Promise<void> {
  await delay(200);
  queue = queue.map((r) =>
    r.id === id ? { ...r, status: "DECLINED" } : r
  );
}
