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

export interface BadgeRecord {
  employeeId: string;
  fio: string;
  position?: string;
  department?: string;
  /** документы-основания (отметка о приложении) */
  documents: { consent: boolean; memo: boolean; id: boolean };
  /** сгенерированный бейдж (PNG data URL) */
  badgeDataUrl?: string;
  issuedAt: string;
}

export interface VectorDoc {
  id: string;
  name: string;
  sizeLabel: string;
  uploadedBy: string;
  uploadedAt: string;
  status: "indexing" | "indexed";
}

export interface FeedbackEntry {
  id: string;
  userId: string;
  kind: "pulse" | "idea";
  mood?: string;
  comment?: string;
  pulse?: Record<string, string>;
  createdAt: string;
}

export interface LoginEvent {
  id: string;
  userId: string;
  at: string;
}

export type NotificationKind = "task" | "meeting" | "stage" | "hr" | "system";

export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
  tone?: "navy" | "gold" | "success" | "warning" | "danger" | "info";
  href?: string;
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

export interface PlanCompletion {
  /** день адаптации, на который пришлось выполнение */
  day: number;
  /** ISO-время отметки о выполнении */
  at: string;
}

export interface CourseProgress {
  /** id пройденных секций (прочитано/просмотрено/тест сдан) */
  completedSections: string[];
  /** результаты тестов по секциям */
  quiz: Record<string, { score: number; total: number; passed: boolean }>;
  /** когда курс полностью завершён */
  completedAt?: string;
}

export interface OnboardingProgress {
  /** ISO-дата первого открытия портала = День 1 роадмапа */
  startedAt: string;
  /** demo-оверрайд текущего дня для презентации; null/undefined = реальный день */
  dayOverride?: number | null;
  /** выполненные пункты плана (см. lib/program.ts): id → когда выполнено */
  completions?: Record<string, PlanCompletion>;
}

export interface DirectMessage {
  id: string;
  /** сотрудник, которому принадлежит переписка (онбординг-пользователь) */
  employeeId: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: string;
}

export type MeetingStatus = "pending" | "accepted" | "rejected";

export interface MeetingRequest {
  id: string;
  employeeId: string;
  hrId: string;
  topic: string;
  /** желаемое время сотрудника */
  preferredAt?: string;
  status: MeetingStatus;
  /** подтверждённое HR время встречи */
  scheduledAt?: string;
  /** ответ/причина от HR */
  hrNote?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface PortalState {
  users: User[];
  tickets: Ticket[];
  tasks: OnboardingTask[];
  knowledge: KnowledgeArticle[];
  activity: ActivityEvent[];
  chats: ChatSession[];
  notifications: AppNotification[];
  messages: DirectMessage[];
  meetingRequests: MeetingRequest[];
  feedback: FeedbackEntry[];
  logins: LoginEvent[];
  badges: Record<string, BadgeRecord>;
  vectorDocs: VectorDoc[];
  /** прогресс адаптации по сотрудникам, ключ — userId */
  onboarding: Record<string, OnboardingProgress>;
  /** прогресс по курсам: userId → courseId → CourseProgress */
  courseProgress: Record<string, Record<string, CourseProgress>>;
  currentUserId: string | null;
  hydrated: boolean;
}
