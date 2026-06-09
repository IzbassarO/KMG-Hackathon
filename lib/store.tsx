"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { loadState, resetState, saveState } from "./storage";
import { buildInitialState } from "./seed";
import { uid } from "./utils";
import type {
  ActivityEvent,
  ChatMessage,
  ChatSession,
  KnowledgeArticle,
  OnboardingTask,
  PortalState,
  Ticket,
  TicketStatus,
  User
} from "./types";

type Action =
  | { type: "HYDRATE"; payload: PortalState }
  | { type: "RESET" }
  | { type: "SET_CURRENT_USER"; payload: string | null }
  | { type: "ADD_TICKET"; payload: Ticket }
  | { type: "UPDATE_TICKET"; payload: { id: string; patch: Partial<Ticket> } }
  | { type: "UPDATE_TASK"; payload: { id: string; patch: Partial<OnboardingTask> } }
  | { type: "ADD_ACTIVITY"; payload: ActivityEvent }
  | { type: "ADD_CHAT"; payload: ChatSession }
  | { type: "APPEND_CHAT_MESSAGE"; payload: { chatId: string; message: ChatMessage } }
  | { type: "UPSERT_USER"; payload: User }
  | { type: "UPSERT_ARTICLE"; payload: KnowledgeArticle };

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
      const tasks = state.tasks.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload.patch } : t
      );

      const affected = tasks.find((t) => t.id === action.payload.id);
      let tickets = state.tickets;
      if (affected) {
        const ticketTasks = tasks.filter((t) => t.ticketId === affected.ticketId);
        const done = ticketTasks.filter((t) => t.status === "done").length;
        const progress = ticketTasks.length
          ? Math.round((done / ticketTasks.length) * 100)
          : 0;
        const status: TicketStatus =
          progress === 100
            ? "completed"
            : progress > 0
              ? "in_progress"
              : "draft";
        tickets = tickets.map((t) =>
          t.id === affected.ticketId
            ? {
                ...t,
                progress,
                status,
                updatedAt: new Date().toISOString(),
                flow: {
                  ...t.flow,
                  nodes: t.flow.nodes.map((node) => {
                    const match = ticketTasks.find((task) => task.nodeId === node.id);
                    if (!match) return node;
                    return {
                      ...node,
                      status:
                        match.status === "done"
                          ? "done"
                          : match.status === "in_progress"
                            ? "active"
                            : "pending"
                    };
                  })
                }
              }
            : t
        );
      }

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
        dispatch({ type: "UPDATE_TASK", payload: { id: taskId, patch: { status } } });
        const task = state.tasks.find((t) => t.id === taskId);
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

        const { retrieve } = await import("./rag");
        const result = retrieve(trimmed, state.knowledge);
        const assistantMessage: ChatMessage = {
          id: uid("m"),
          role: "assistant",
          content: result.answer,
          citations: result.citations,
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
      }
    };

    return {
      state,
      currentUser,
      dispatch,
      signIn: (userId) => dispatch({ type: "SET_CURRENT_USER", payload: userId }),
      signOut: () => dispatch({ type: "SET_CURRENT_USER", payload: null }),
      reset: () => {
        resetState();
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
