export type Role = "hr" | "employee";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  position?: string;
  department?: string;
  avatarSeed: string;
  startDate?: string;
  managerId?: string;
}

export type TicketStatus =
  | "draft"
  | "in_progress"
  | "blocked"
  | "review"
  | "completed";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketCategory =
  | "documents"
  | "access"
  | "training"
  | "equipment"
  | "compliance"
  | "culture"
  | "mentorship";

export interface TicketBadge {
  label: string;
  tone: "navy" | "gold" | "success" | "warning" | "danger" | "info";
}

export interface FlowNode {
  id: string;
  type: "start" | "task" | "decision" | "approval" | "milestone" | "end";
  title: string;
  description?: string;
  assigneeRole?: Role;
  estimateDays?: number;
  position: { x: number; y: number };
  status?: "pending" | "active" | "done" | "blocked";
  resources?: { label: string; url?: string }[];
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  variant?: "default" | "success" | "warning";
}

export interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  summary: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: string;
  ownerId: string;
  badges: TicketBadge[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  flow: Flow;
  tags: string[];
}

export interface OnboardingTask {
  id: string;
  ticketId: string;
  nodeId: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "done";
  dueDate?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  tags: string[];
  updatedAt: string;
  embeddingId?: string;
}

export interface ActivityEvent {
  id: string;
  actorId: string;
  actorName: string;
  message: string;
  type: "ticket" | "task" | "system" | "chat";
  createdAt: string;
  meta?: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: { articleId: string; title: string }[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface PortalState {
  users: User[];
  tickets: Ticket[];
  tasks: OnboardingTask[];
  knowledge: KnowledgeArticle[];
  activity: ActivityEvent[];
  chats: ChatSession[];
  currentUserId: string | null;
  hydrated: boolean;
}
