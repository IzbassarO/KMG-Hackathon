"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { loadState, resetState, saveState } from "./storage";
import { buildInitialState } from "./seed";
import { clamp, formatDate, uid } from "./utils";
import { PLAN_KIND_LABEL, PROBATION_DAYS, getDayPlan, getPlanItemByCourse } from "./program";
import { COURSES, courseSectionCount, getCourse } from "./courses";
import {
  canStartNode,
  doneNodeIdsFromTasks,
  progressFor,
  resolveFlow,
  ticketStatusFor
} from "./flow";
import type {
  ActivityEvent,
  AppNotification,
  BadgeRecord,
  ChatMessage,
  ChatSession,
  CourseProgress,
  DirectMessage,
  FeedbackEntry,
  KnowledgeArticle,
  LoginEvent,
  MeetingRequest,
  OnboardingTask,
  PortalState,
  Ticket,
  User,
  VectorDoc
} from "./types";

type Action =
  | { type: "HYDRATE"; payload: PortalState }
  | { type: "RESET" }
  | { type: "SET_CURRENT_USER"; payload: string | null }
  | { type: "ADD_TICKET"; payload: Ticket }
  | { type: "UPDATE_TICKET"; payload: { id: string; patch: Partial<Ticket> } }
  | { type: "UPDATE_TASK"; payload: { id: string; patch: Partial<OnboardingTask> } }
  | { type: "COMPLETE_ALL_TASKS"; payload: { ticketId: string } }
  | { type: "ADD_ACTIVITY"; payload: ActivityEvent }
  | { type: "ADD_CHAT"; payload: ChatSession }
  | { type: "APPEND_CHAT_MESSAGE"; payload: { chatId: string; message: ChatMessage } }
  | { type: "UPSERT_USER"; payload: User }
  | { type: "UPSERT_ARTICLE"; payload: KnowledgeArticle }
  | { type: "ISSUE_BADGE"; payload: BadgeRecord }
  | { type: "ADD_VECTOR_DOC"; payload: VectorDoc }
  | { type: "SET_VECTOR_DOC_STATUS"; payload: { id: string; status: VectorDoc["status"] } }
  | { type: "REMOVE_VECTOR_DOC"; payload: { id: string } }
  | { type: "ADD_FEEDBACK"; payload: FeedbackEntry }
  | { type: "ADD_LOGIN"; payload: LoginEvent }
  | { type: "CLEAR_CHAT"; payload: { userId: string } }
  | { type: "ADD_MESSAGE"; payload: DirectMessage }
  | { type: "ADD_MEETING_REQUEST"; payload: MeetingRequest }
  | { type: "UPDATE_MEETING_REQUEST"; payload: { id: string; patch: Partial<MeetingRequest> } }
  | { type: "ADD_NOTIFICATION"; payload: AppNotification }
  | { type: "ADD_NOTIFICATIONS"; payload: AppNotification[] }
  | { type: "MARK_NOTIFICATIONS_READ"; payload: { userId: string } }
  | { type: "SET_ONBOARDING_START"; payload: { userId: string; startedAt: string } }
  | { type: "SET_DAY_OVERRIDE"; payload: { userId: string; day: number | null } }
  | { type: "TOGGLE_PLAN_ITEM"; payload: { userId: string; itemId: string; day: number; at: string } }
  | { type: "SET_COURSE_PROGRESS"; payload: { userId: string; courseId: string; progress: CourseProgress } };

function reducer(state: PortalState, action: Action): PortalState {
  switch (action.type) {
    case "HYDRATE":
      return { ...action.payload, hydrated: true };
    case "RESET":
      return { ...buildInitialState(), hydrated: true };
    case "SET_CURRENT_USER":
      return { ...state, currentUserId: action.payload };
    case "ADD_TICKET":
      return { ...state, tickets: [action.payload, ...state.tickets] };
    case "UPDATE_TICKET":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.id
            ? { ...t, ...action.payload.patch, updatedAt: new Date().toISOString() }
            : t
        )
      };
    case "UPDATE_TASK": {
      const updated = state.tasks.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload.patch } : t
      );
      const affected = updated.find((t) => t.id === action.payload.id);
      const ticket = affected && state.tickets.find((t) => t.id === affected.ticketId);
      if (!affected || !ticket) return { ...state, tasks: updated };

      const ticketTasks = updated.filter((t) => t.ticketId === ticket.id);
      const doneNodeIds = doneNodeIdsFromTasks(ticketTasks);
      const flow = resolveFlow(ticket.flow, doneNodeIds);

      // Статусы задач выводим из разрешённого flow (доступно/заблокировано/готово).
      const stateOf = new Map(flow.nodes.map((n) => [n.id, n.status]));
      const tasks = updated.map((t) => {
        if (t.ticketId !== ticket.id) return t;
        const ns = stateOf.get(t.nodeId);
        const status: OnboardingTask["status"] =
          ns === "done" ? "done" : ns === "active" ? "in_progress" : "pending";
        return { ...t, status };
      });

      const progress = progressFor(flow, doneNodeIds);
      const status = ticketStatusFor(progress, ticket.status);
      const tickets = state.tickets.map((t) =>
        t.id === ticket.id
          ? { ...t, flow, progress, status, updatedAt: new Date().toISOString() }
          : t
      );

      return { ...state, tasks, tickets };
    }
    case "COMPLETE_ALL_TASKS": {
      const { ticketId } = action.payload;
      const ticket = state.tickets.find((t) => t.id === ticketId);
      if (!ticket) return state;
      const tasks = state.tasks.map((t) =>
        t.ticketId === ticketId ? { ...t, status: "done" as const } : t
      );
      const doneNodeIds = new Set(
        state.tasks.filter((t) => t.ticketId === ticketId).map((t) => t.nodeId)
      );
      const flow = resolveFlow(ticket.flow, doneNodeIds);
      const tickets = state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, flow, progress: 100, status: "completed" as const, updatedAt: new Date().toISOString() }
          : t
      );
      return { ...state, tasks, tickets };
    }
    case "ADD_ACTIVITY":
      return { ...state, activity: [action.payload, ...state.activity].slice(0, 80) };
    case "ADD_CHAT":
      return { ...state, chats: [action.payload, ...state.chats] };
    case "APPEND_CHAT_MESSAGE":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload.chatId
            ? {
                ...chat,
                messages: [...chat.messages, action.payload.message],
                updatedAt: new Date().toISOString()
              }
            : chat
        )
      };
    case "UPSERT_USER": {
      const exists = state.users.some((u) => u.id === action.payload.id);
      return {
        ...state,
        users: exists
          ? state.users.map((u) =>
              u.id === action.payload.id ? { ...u, ...action.payload } : u
            )
          : [...state.users, action.payload]
      };
    }
    case "UPSERT_ARTICLE": {
      const exists = state.knowledge.some((k) => k.id === action.payload.id);
      return {
        ...state,
        knowledge: exists
          ? state.knowledge.map((k) =>
              k.id === action.payload.id ? { ...k, ...action.payload } : k
            )
          : [action.payload, ...state.knowledge]
      };
    }
    case "ISSUE_BADGE":
      return {
        ...state,
        badges: { ...state.badges, [action.payload.employeeId]: action.payload }
      };
    case "ADD_VECTOR_DOC":
      return { ...state, vectorDocs: [action.payload, ...state.vectorDocs] };
    case "SET_VECTOR_DOC_STATUS":
      return {
        ...state,
        vectorDocs: state.vectorDocs.map((d) =>
          d.id === action.payload.id ? { ...d, status: action.payload.status } : d
        )
      };
    case "REMOVE_VECTOR_DOC":
      return { ...state, vectorDocs: state.vectorDocs.filter((d) => d.id !== action.payload.id) };
    case "ADD_FEEDBACK":
      return { ...state, feedback: [action.payload, ...state.feedback] };
    case "ADD_LOGIN":
      return { ...state, logins: [action.payload, ...state.logins].slice(0, 200) };
    case "CLEAR_CHAT":
      return {
        ...state,
        chats: state.chats.filter((c) => c.userId !== action.payload.userId)
      };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "ADD_MEETING_REQUEST":
      return { ...state, meetingRequests: [action.payload, ...state.meetingRequests] };
    case "UPDATE_MEETING_REQUEST":
      return {
        ...state,
        meetingRequests: state.meetingRequests.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload.patch } : r
        )
      };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case "ADD_NOTIFICATIONS":
      return { ...state, notifications: [...action.payload, ...state.notifications] };
    case "MARK_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.userId === action.payload.userId && !n.read ? { ...n, read: true } : n
        )
      };
    case "SET_COURSE_PROGRESS": {
      const { userId, courseId, progress } = action.payload;
      return {
        ...state,
        courseProgress: {
          ...state.courseProgress,
          [userId]: { ...(state.courseProgress[userId] ?? {}), [courseId]: progress }
        }
      };
    }
    case "SET_ONBOARDING_START": {
      const { userId, startedAt } = action.payload;
      if (state.onboarding[userId]?.startedAt) return state;
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          [userId]: { ...state.onboarding[userId], startedAt }
        }
      };
    }
    case "SET_DAY_OVERRIDE": {
      const { userId, day } = action.payload;
      const current = state.onboarding[userId] ?? { startedAt: new Date().toISOString() };
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          [userId]: { ...current, dayOverride: day }
        }
      };
    }
    case "TOGGLE_PLAN_ITEM": {
      const { userId, itemId, day, at } = action.payload;
      const current = state.onboarding[userId] ?? { startedAt: at };
      const completions = { ...(current.completions ?? {}) };
      if (completions[itemId]) delete completions[itemId];
      else completions[itemId] = { day, at };
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          [userId]: { ...current, completions }
        }
      };
    }
    default:
      return state;
  }
}

interface StoreContextValue {
  state: PortalState;
  currentUser: User | null;
  signIn: (userId: string) => void;
  signOut: () => void;
  reset: () => void;
  dispatch: React.Dispatch<Action>;
  helpers: {
    createTicket: (input: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "code">) => Ticket;
    advanceTask: (taskId: string, status: OnboardingTask["status"]) => void;
    logActivity: (event: Omit<ActivityEvent, "id" | "createdAt">) => void;
    askAssistant: (chatId: string | null, question: string) => Promise<ChatSession>;
    ensureOnboardingStart: (userId: string) => void;
    getAdaptationDay: (userId: string) => number;
    setDemoDay: (userId: string, day: number | null) => void;
    togglePlanItem: (userId: string, itemId: string) => void;
    isPlanItemDone: (userId: string, itemId: string) => boolean;
    isDayComplete: (userId: string, day: number) => boolean;
    getCompletions: (userId: string) => Record<string, { day: number; at: string }>;
    completeToday: (userId: string, day: number) => void;
    autofillTicket: (ticketId: string) => void;
    notify: (userId: string, n: Omit<AppNotification, "id" | "userId" | "createdAt" | "read">) => void;
    markNotificationsRead: (userId: string) => void;
    unreadCount: (userId: string) => number;
    userNotifications: (userId: string) => AppNotification[];
    syncDayNotifications: (userId: string, day: number) => void;
    sendMessage: (employeeId: string, fromId: string, toId: string, text: string) => void;
    requestMeeting: (employeeId: string, hrId: string, topic: string, preferredAt?: string) => void;
    decideMeeting: (
      id: string,
      decision: "accepted" | "rejected",
      opts?: { scheduledAt?: string; hrNote?: string }
    ) => void;
    threadMessages: (employeeId: string) => DirectMessage[];
    meetingRequestsForHr: (hrId: string) => MeetingRequest[];
    meetingRequestsForEmployee: (employeeId: string) => MeetingRequest[];
    acceptedMeetings: (employeeId: string) => MeetingRequest[];
    markSectionDone: (userId: string, courseId: string, sectionId: string) => void;
    submitQuiz: (userId: string, courseId: string, sectionId: string, score: number, total: number) => void;
    isSectionDone: (userId: string, courseId: string, sectionId: string) => boolean;
    quizResult: (
      userId: string,
      courseId: string,
      sectionId: string
    ) => { score: number; total: number; passed: boolean } | undefined;
    courseProgressPct: (userId: string, courseId: string) => number;
    isCourseComplete: (userId: string, courseId: string) => boolean;
    getCourseStatus: (userId: string, courseId: string) => "completed" | "in_progress" | "available";
    coursesCompletedBy: (userId: string) => { courseId: string; completedAt: string }[];
    submitFeedback: (userId: string, entry: Omit<FeedbackEntry, "id" | "userId" | "createdAt">) => void;
    feedbackAll: () => FeedbackEntry[];
    feedbackByUser: (userId: string) => FeedbackEntry[];
    lastLogin: (userId: string) => string | undefined;
    loginOnTimeRate: (userId: string) => number | null;
    clearChat: (userId: string) => void;
    syncMilestoneReports: (employeeId: string, day: number) => void;
    issueBadge: (record: BadgeRecord) => void;
    getBadge: (employeeId: string) => BadgeRecord | undefined;
    addVectorDoc: (name: string, sizeLabel: string, uploadedBy: string) => string;
    markVectorDocIndexed: (id: string) => void;
    removeVectorDoc: (id: string) => void;
    vectorDocs: () => VectorDoc[];
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, buildInitialState());
  const hydratedRef = useRef(false);

  useEffect(() => {
    const loaded = loadState();
    dispatch({ type: "HYDRATE", payload: loaded });
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    saveState(state);
  }, [state]);

  const value = useMemo<StoreContextValue>(() => {
    const currentUser =
      state.users.find((u) => u.id === state.currentUserId) ?? null;

    const completeCourse = (userId: string, courseId: string) => {
      const course = getCourse(courseId);
      if (!course) return;
      helpers.notify(userId, {
        kind: "task",
        title: `Курс завершён: ${course.title}`,
        body: "Отметка о прохождении сохранена.",
        tone: "success",
        href: `/employee/learning/${courseId}`
      });
      const user = state.users.find((u) => u.id === userId);
      if (user?.managerId) {
        helpers.notify(user.managerId, {
          kind: "system",
          title: `${user.fullName} завершил курс`,
          body: course.title,
          tone: "navy",
          href: "/hr/learning"
        });
      }
      const item = getPlanItemByCourse(courseId);
      if (item && !helpers.isPlanItemDone(userId, item.id)) {
        helpers.togglePlanItem(userId, item.id);
      }
      helpers.logActivity({
        actorId: userId,
        actorName: user?.fullName ?? "Сотрудник",
        message: `Завершил курс «${course.title}»`,
        type: "task"
      });
    };

    const helpers: StoreContextValue["helpers"] = {
      createTicket(input) {
        const ticket: Ticket = {
          ...input,
          id: uid("t"),
          code: `ONB-${1100 + state.tickets.length}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        dispatch({ type: "ADD_TICKET", payload: ticket });
        dispatch({
          type: "ADD_ACTIVITY",
          payload: {
            id: uid("a"),
            actorId: currentUser?.id ?? "system",
            actorName: currentUser?.fullName ?? "Система",
            message: `Создал тикет ${ticket.code}: ${ticket.title}`,
            type: "ticket",
            createdAt: new Date().toISOString(),
            meta: { ticket: ticket.code }
          }
        });
        return ticket;
      },
      advanceTask(taskId, status) {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;
        // Gating: начать/завершить шаг можно только если завершены предшественники.
        if (status !== "pending") {
          const ticket = state.tickets.find((t) => t.id === task.ticketId);
          if (ticket) {
            const doneNodeIds = doneNodeIdsFromTasks(
              state.tasks.filter((t) => t.ticketId === ticket.id)
            );
            if (!canStartNode(ticket.flow, task.nodeId, doneNodeIds)) return;
          }
        }
        dispatch({ type: "UPDATE_TASK", payload: { id: taskId, patch: { status } } });
        if (task) {
          dispatch({
            type: "ADD_ACTIVITY",
            payload: {
              id: uid("a"),
              actorId: currentUser?.id ?? "system",
              actorName: currentUser?.fullName ?? "Система",
              message: `${
                status === "done" ? "Завершил" : status === "in_progress" ? "Взял в работу" : "Сбросил"
              } задачу «${task.title}»`,
              type: "task",
              createdAt: new Date().toISOString(),
              meta: { taskId }
            }
          });
        }
        if (status === "done") {
          const tk = state.tickets.find((t) => t.id === task.ticketId);
          if (tk?.assigneeId) {
            helpers.notify(tk.assigneeId, {
              kind: "stage",
              title: `Шаг завершён: ${task.title}`,
              body: `Тикет ${tk.code}`,
              tone: "success",
              href: `/employee/tickets/${tk.id}`
            });
          }
        }
      },
      logActivity(event) {
        dispatch({
          type: "ADD_ACTIVITY",
          payload: { id: uid("a"), createdAt: new Date().toISOString(), ...event }
        });
      },
      async askAssistant(chatId, question) {
        const trimmed = question.trim();
        if (!trimmed) {
          throw new Error("Пустой запрос");
        }
        let chat = chatId ? state.chats.find((c) => c.id === chatId) ?? null : null;

        if (!chat) {
          chat = {
            id: uid("chat"),
            userId: currentUser?.id ?? "anonymous",
            title: trimmed.slice(0, 48),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: []
          };
          dispatch({ type: "ADD_CHAT", payload: chat });
        }

        const userMessage: ChatMessage = {
          id: uid("m"),
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString()
        };
        dispatch({
          type: "APPEND_CHAT_MESSAGE",
          payload: { chatId: chat.id, message: userMessage }
        });

        // Сначала пробуем реальный чат-бот (Groq через /api/chat — порт digital_buddy.py).
        // Если ключ не задан или ошибка — откатываемся на локальную TF-IDF заглушку.
        let content: string;
        let citations: ChatMessage["citations"];
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: trimmed })
          });
          const data = await res.json();
          if (res.ok && data.answer) {
            content = data.answer as string;
            citations = ((data.sources ?? []) as { day: number; title: string }[]).map((s) => ({
              articleId: `vnd-${s.day}`,
              title: s.title
            }));
          } else {
            throw new Error("fallback");
          }
        } catch {
          const { retrieve } = await import("./rag");
          const result = retrieve(trimmed, state.knowledge);
          content = result.answer;
          citations = result.citations;
        }
        const assistantMessage: ChatMessage = {
          id: uid("m"),
          role: "assistant",
          content,
          citations,
          createdAt: new Date().toISOString()
        };
        dispatch({
          type: "APPEND_CHAT_MESSAGE",
          payload: { chatId: chat.id, message: assistantMessage }
        });

        return {
          ...chat,
          messages: [...chat.messages, userMessage, assistantMessage]
        };
      },
      ensureOnboardingStart(userId) {
        if (state.onboarding[userId]?.startedAt) return;
        dispatch({
          type: "SET_ONBOARDING_START",
          payload: { userId, startedAt: new Date().toISOString() }
        });
      },
      getAdaptationDay(userId) {
        const progress = state.onboarding[userId];
        if (!progress) return 1;
        if (typeof progress.dayOverride === "number") {
          return clamp(progress.dayOverride, 1, PROBATION_DAYS);
        }
        const diff = Date.now() - new Date(progress.startedAt).getTime();
        const realDay = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
        return clamp(realDay, 1, PROBATION_DAYS);
      },
      setDemoDay(userId, day) {
        dispatch({ type: "SET_DAY_OVERRIDE", payload: { userId, day } });
      },
      togglePlanItem(userId, itemId) {
        const day = helpers.getAdaptationDay(userId);
        dispatch({
          type: "TOGGLE_PLAN_ITEM",
          payload: { userId, itemId, day, at: new Date().toISOString() }
        });
      },
      isPlanItemDone(userId, itemId) {
        return Boolean(state.onboarding[userId]?.completions?.[itemId]);
      },
      isDayComplete(userId, day) {
        const items = getDayPlan(day).today;
        if (items.length === 0) return false;
        const completions = state.onboarding[userId]?.completions ?? {};
        return items.every((i) => completions[i.id]);
      },
      getCompletions(userId) {
        return state.onboarding[userId]?.completions ?? {};
      },
      completeToday(userId, day) {
        const completions = state.onboarding[userId]?.completions ?? {};
        const at = new Date().toISOString();
        for (const item of getDayPlan(day).today) {
          if (!completions[item.id]) {
            dispatch({ type: "TOGGLE_PLAN_ITEM", payload: { userId, itemId: item.id, day, at } });
          }
        }
      },
      autofillTicket(ticketId) {
        dispatch({ type: "COMPLETE_ALL_TASKS", payload: { ticketId } });
        const ticket = state.tickets.find((t) => t.id === ticketId);
        if (ticket) {
          dispatch({
            type: "ADD_ACTIVITY",
            payload: {
              id: uid("a"),
              actorId: currentUser?.id ?? "system",
              actorName: currentUser?.fullName ?? "Система",
              message: `Автозаполнил тикет ${ticket.code} (демо)`,
              type: "ticket",
              createdAt: new Date().toISOString(),
              meta: { ticket: ticket.code }
            }
          });
          if (ticket.assigneeId) {
            helpers.notify(ticket.assigneeId, {
              kind: "stage",
              title: `Тикет завершён: ${ticket.title}`,
              body: `Все шаги ${ticket.code} выполнены.`,
              tone: "success",
              href: `/employee/tickets/${ticket.id}`
            });
          }
        }
      },
      notify(userId, n) {
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: { ...n, id: uid("n"), userId, createdAt: new Date().toISOString(), read: false }
        });
      },
      markNotificationsRead(userId) {
        dispatch({ type: "MARK_NOTIFICATIONS_READ", payload: { userId } });
      },
      unreadCount(userId) {
        return state.notifications.filter((n) => n.userId === userId && !n.read).length;
      },
      userNotifications(userId) {
        return state.notifications
          .filter((n) => n.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      syncDayNotifications(userId, day) {
        const existing = new Set(
          state.notifications.filter((n) => n.userId === userId).map((n) => n.id)
        );
        const plan = getDayPlan(day);
        const at = new Date().toISOString();
        const toAdd: AppNotification[] = [];
        const add = (
          suffix: string,
          kind: AppNotification["kind"],
          title: string,
          body?: string,
          tone?: AppNotification["tone"],
          href?: string
        ) => {
          const id = `n_${userId}_d${day}_${suffix}`;
          if (existing.has(id)) return;
          toAdd.push({ id, userId, kind, title, body, createdAt: at, read: false, tone, href });
        };
        for (const item of plan.today) {
          add(item.id, "task", `Задача дня: ${item.title}`, item.description, "navy", item.href);
        }
        for (const ev of plan.events) {
          add(ev.id, "meeting", `${PLAN_KIND_LABEL[ev.kind]}: ${ev.title}`, ev.description, "gold", ev.href);
        }
        if (toAdd.length > 0) {
          dispatch({ type: "ADD_NOTIFICATIONS", payload: toAdd });
        }
      },
      sendMessage(employeeId, fromId, toId, text) {
        const trimmed = text.trim();
        if (!trimmed) return;
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: uid("msg"),
            employeeId,
            fromId,
            toId,
            text: trimmed,
            createdAt: new Date().toISOString()
          }
        });
        const fromName = state.users.find((u) => u.id === fromId)?.fullName ?? "Пользователь";
        const toIsHr = state.users.find((u) => u.id === toId)?.role === "hr";
        helpers.notify(toId, {
          kind: "hr",
          title: toIsHr ? `Новое сообщение от ${fromName}` : `Ответ от ${fromName}`,
          body: trimmed.slice(0, 120),
          tone: "navy",
          href: toIsHr ? "/hr/mentorship" : "/employee/mentorship"
        });
      },
      requestMeeting(employeeId, hrId, topic, preferredAt) {
        const req: MeetingRequest = {
          id: uid("mr"),
          employeeId,
          hrId,
          topic: topic.trim() || "Встреча 1:1",
          preferredAt,
          status: "pending",
          createdAt: new Date().toISOString()
        };
        dispatch({ type: "ADD_MEETING_REQUEST", payload: req });
        const empName = state.users.find((u) => u.id === employeeId)?.fullName ?? "Сотрудник";
        helpers.notify(hrId, {
          kind: "meeting",
          title: `Запрос на 1:1 от ${empName}`,
          body: req.topic,
          tone: "gold",
          href: "/hr/mentorship"
        });
      },
      decideMeeting(id, decision, opts) {
        const req = state.meetingRequests.find((r) => r.id === id);
        if (!req) return;
        const scheduledAt = decision === "accepted" ? opts?.scheduledAt ?? req.preferredAt : undefined;
        dispatch({
          type: "UPDATE_MEETING_REQUEST",
          payload: {
            id,
            patch: { status: decision, decidedAt: new Date().toISOString(), scheduledAt, hrNote: opts?.hrNote }
          }
        });
        if (decision === "accepted") {
          helpers.notify(req.employeeId, {
            kind: "meeting",
            title: "Встреча 1:1 подтверждена",
            body: `${scheduledAt ? formatDate(scheduledAt) : "время уточняется"} · ${req.topic}`,
            tone: "success",
            href: "/employee/calendar"
          });
        } else {
          helpers.notify(req.employeeId, {
            kind: "meeting",
            title: "Запрос на 1:1 отклонён",
            body: opts?.hrNote || req.topic,
            tone: "warning",
            href: "/employee/mentorship"
          });
        }
      },
      threadMessages(employeeId) {
        return state.messages
          .filter((m) => m.employeeId === employeeId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      },
      meetingRequestsForHr(hrId) {
        return state.meetingRequests
          .filter((r) => r.hrId === hrId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      meetingRequestsForEmployee(employeeId) {
        return state.meetingRequests
          .filter((r) => r.employeeId === employeeId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      acceptedMeetings(employeeId) {
        return state.meetingRequests
          .filter((r) => r.employeeId === employeeId && r.status === "accepted" && r.scheduledAt)
          .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
      },
      markSectionDone(userId, courseId, sectionId) {
        const cp = state.courseProgress[userId]?.[courseId] ?? { completedSections: [], quiz: {} };
        if (cp.completedSections.includes(sectionId)) return;
        const completedSections = [...cp.completedSections, sectionId];
        const course = getCourse(courseId);
        const total = course ? courseSectionCount(course) : 0;
        const justCompleted = total > 0 && completedSections.length >= total && !cp.completedAt;
        const progress: CourseProgress = {
          ...cp,
          completedSections,
          completedAt: justCompleted ? new Date().toISOString() : cp.completedAt
        };
        dispatch({ type: "SET_COURSE_PROGRESS", payload: { userId, courseId, progress } });
        if (justCompleted) completeCourse(userId, courseId);
      },
      submitQuiz(userId, courseId, sectionId, score, total) {
        const cp = state.courseProgress[userId]?.[courseId] ?? { completedSections: [], quiz: {} };
        const passed = score >= total;
        const quiz = { ...cp.quiz, [sectionId]: { score, total, passed } };
        let completedSections = cp.completedSections;
        if (passed && !completedSections.includes(sectionId)) {
          completedSections = [...completedSections, sectionId];
        }
        const course = getCourse(courseId);
        const totalSec = course ? courseSectionCount(course) : 0;
        const justCompleted = totalSec > 0 && completedSections.length >= totalSec && !cp.completedAt;
        const progress: CourseProgress = {
          completedSections,
          quiz,
          completedAt: justCompleted ? new Date().toISOString() : cp.completedAt
        };
        dispatch({ type: "SET_COURSE_PROGRESS", payload: { userId, courseId, progress } });
        if (justCompleted) completeCourse(userId, courseId);
      },
      isSectionDone(userId, courseId, sectionId) {
        return Boolean(
          state.courseProgress[userId]?.[courseId]?.completedSections.includes(sectionId)
        );
      },
      quizResult(userId, courseId, sectionId) {
        return state.courseProgress[userId]?.[courseId]?.quiz[sectionId];
      },
      courseProgressPct(userId, courseId) {
        const course = getCourse(courseId);
        const total = course ? courseSectionCount(course) : 0;
        if (total === 0) return 0;
        const done = state.courseProgress[userId]?.[courseId]?.completedSections.length ?? 0;
        return Math.round((Math.min(done, total) / total) * 100);
      },
      isCourseComplete(userId, courseId) {
        return Boolean(state.courseProgress[userId]?.[courseId]?.completedAt);
      },
      getCourseStatus(userId, courseId) {
        const cp = state.courseProgress[userId]?.[courseId];
        if (cp?.completedAt) return "completed";
        if (cp && cp.completedSections.length > 0) return "in_progress";
        return "available";
      },
      coursesCompletedBy(userId) {
        const byCourse = state.courseProgress[userId] ?? {};
        return Object.entries(byCourse)
          .filter(([, cp]) => cp.completedAt)
          .map(([courseId, cp]) => ({ courseId, completedAt: cp.completedAt as string }));
      },
      submitFeedback(userId, entry) {
        const fb: FeedbackEntry = {
          ...entry,
          id: uid("fb"),
          userId,
          createdAt: new Date().toISOString()
        };
        dispatch({ type: "ADD_FEEDBACK", payload: fb });
        const user = state.users.find((u) => u.id === userId);
        if (user?.managerId) {
          helpers.notify(user.managerId, {
            kind: "hr",
            title: `Новый фидбэк от ${user.fullName}`,
            body: entry.comment?.slice(0, 100) || (entry.kind === "idea" ? "Идея / предложение" : "Пульс-опрос"),
            tone: "gold",
            href: "/hr/reports"
          });
        }
      },
      feedbackAll() {
        return [...state.feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      feedbackByUser(userId) {
        return state.feedback
          .filter((f) => f.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      lastLogin(userId) {
        return state.logins.find((l) => l.userId === userId)?.at;
      },
      loginOnTimeRate(userId) {
        const ls = state.logins.filter((l) => l.userId === userId);
        if (ls.length === 0) return null;
        const onTime = ls.filter((l) => new Date(l.at).getHours() < 10).length;
        return Math.round((onTime / ls.length) * 100);
      },
      clearChat(userId) {
        dispatch({ type: "CLEAR_CHAT", payload: { userId } });
      },
      syncMilestoneReports(employeeId, day) {
        const user = state.users.find((u) => u.id === employeeId);
        const hrId = user?.managerId;
        if (!hrId) return;
        const requiredTotal = COURSES.filter((c) => c.category === "Обязательный").length;
        const requiredDone = COURSES.filter(
          (c) => c.category === "Обязательный" && state.courseProgress[employeeId]?.[c.id]?.completedAt
        ).length;
        const at = new Date().toISOString();
        const toAdd = [];
        for (const m of [14, 30, 90]) {
          if (day < m) continue;
          const id = `n_report_${employeeId}_d${m}`;
          if (state.notifications.some((n) => n.id === id)) continue;
          const atRisk = requiredDone < requiredTotal;
          toAdd.push({
            id,
            userId: hrId,
            kind: "system" as const,
            title: `Отчёт по адаптации (день ${m}): ${user.fullName}`,
            body: atRisk
              ? `Внимание: обязательные курсы пройдены ${requiredDone}/${requiredTotal} — есть риск отставания.`
              : `Идёт по плану: обязательные курсы ${requiredDone}/${requiredTotal}.`,
            tone: (atRisk ? "warning" : "navy") as AppNotification["tone"],
            href: "/hr/reports",
            createdAt: at,
            read: false
          });
        }
        if (toAdd.length > 0) dispatch({ type: "ADD_NOTIFICATIONS", payload: toAdd });
      },
      issueBadge(record) {
        dispatch({ type: "ISSUE_BADGE", payload: record });
        // Завершаем шаг генерации в тикете «Бейдж и пропускной режим».
        const ticket = state.tickets.find(
          (t) => t.assigneeId === record.employeeId && t.tags.includes("badge")
        );
        if (ticket) {
          const firstStep = ticket.flow.nodes.find(
            (n) => n.type === "task" || n.type === "approval"
          );
          const task =
            firstStep &&
            state.tasks.find((t) => t.ticketId === ticket.id && t.nodeId === firstStep.id);
          if (task && task.status !== "done") helpers.advanceTask(task.id, "done");
        }
        helpers.notify(record.employeeId, {
          kind: "system",
          title: "Бейдж готов",
          body: "Ваш корпоративный бейдж сгенерирован и будет выдан в Badge Center.",
          tone: "success",
          href: ticket ? `/employee/tickets/${ticket.id}` : undefined
        });
        helpers.logActivity({
          actorId: currentUser?.id ?? "system",
          actorName: currentUser?.fullName ?? "HR",
          message: `Сгенерировал бейдж для ${record.fio}`,
          type: "ticket",
          meta: ticket ? { ticket: ticket.code } : undefined
        });
      },
      getBadge(employeeId) {
        return state.badges[employeeId];
      },
      // Симуляция загрузки документа в векторную базу: сохраняем ТОЛЬКО имя/метаданные.
      // Файл не сохраняется и на ответы AI не влияет.
      addVectorDoc(name, sizeLabel, uploadedBy) {
        const id = uid("vd");
        dispatch({
          type: "ADD_VECTOR_DOC",
          payload: {
            id,
            name,
            sizeLabel,
            uploadedBy,
            uploadedAt: new Date().toISOString(),
            status: "indexing"
          }
        });
        return id;
      },
      markVectorDocIndexed(id) {
        dispatch({ type: "SET_VECTOR_DOC_STATUS", payload: { id, status: "indexed" } });
      },
      removeVectorDoc(id) {
        dispatch({ type: "REMOVE_VECTOR_DOC", payload: { id } });
      },
      vectorDocs() {
        return [...state.vectorDocs].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      }
    };

    return {
      state,
      currentUser,
      dispatch,
      signIn: (userId) => {
        dispatch({ type: "SET_CURRENT_USER", payload: userId });
        dispatch({
          type: "ADD_LOGIN",
          payload: { id: uid("lg"), userId, at: new Date().toISOString() }
        });
      },
      signOut: () => dispatch({ type: "SET_CURRENT_USER", payload: null }),
      reset: () => {
        resetState();
        // Сбрасываем и флаги Digital Buddy (обучение/День 1/карточки/welcome),
        // чтобы демо начиналось «с чистого листа».
        if (typeof window !== "undefined") {
          for (const key of Object.keys(window.localStorage)) {
            if (key.startsWith("kmg.buddy.") || key.startsWith("kmg.onboarding.welcome")) {
              window.localStorage.removeItem(key);
            }
          }
        }
        dispatch({ type: "RESET" });
      },
      helpers
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return ctx;
}
