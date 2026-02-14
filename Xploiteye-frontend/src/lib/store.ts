import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string
    email: string
    username: string
    created_at: string
    last_login: string | null
    is_active: boolean
}

interface Session {
    id: string
    user_id: string
    session_id: string
    scan_report_name: string
    qdrant_collection: string
    created_at: string
    last_activity: string
    expires_at: string
    is_active: boolean
    chunks_count?: number
}

interface ChatMessage {
    id: string
    user_id: string
    conversation_id?: string | null
    session_id: string | null
    timestamp: string
    query: string
    response: string
    sources: any[]
    metadata?: any
}

interface Conversation {
    conversation_id: string
    title: string
    last_message_at: string
    message_count: number
    session_id?: string | null
}

interface AuthState {
    token: string | null
    refreshToken: string | null
    user: User | null
    setAuth: (token: string, refreshToken: string, user: User) => void
    clearAuth: () => void
}

interface SessionState {
    sessions: Session[]
    currentSession: Session | null
    setSessions: (sessions: Session[]) => void
    setCurrentSession: (session: Session | null) => void
    addSession: (session: Session) => void
    removeSession: (sessionId: string) => void
}

type SetMessagesArg = ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])

interface ChatState {
    messages: ChatMessage[]
    currentConversationId: string | null
    conversations: Conversation[]
    setMessages: (messages: SetMessagesArg) => void
    addMessage: (message: ChatMessage) => void
    clearMessages: () => void
    setCurrentConversationId: (id: string | null) => void
    setConversations: (conversations: Conversation[]) => void
    addConversation: (conversation: Conversation) => void
    removeConversation: (conversationId: string) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
    token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
    refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null,
    user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
    setAuth: (token, refreshToken, user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', token)
            localStorage.setItem('refresh_token', refreshToken)
            localStorage.setItem('user', JSON.stringify(user))
        }
        set({ token, refreshToken, user })
    },
    clearAuth: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user')
        }
        set({ token: null, refreshToken: null, user: null })
    },
}))

export const useSessionStore = create<SessionState>((set) => ({
    sessions: [],
    currentSession: null,
    setSessions: (sessions) => set({ sessions }),
    setCurrentSession: (session) => set({ currentSession: session }),
    addSession: (session) =>
        set((state) => ({ sessions: [session, ...state.sessions] })),
    removeSession: (sessionId) =>
        set((state) => ({
            sessions: state.sessions.filter((s) => s.session_id !== sessionId),
            currentSession:
                state.currentSession?.session_id === sessionId
                    ? null
                    : state.currentSession,
        })),
}))

function ensureMessageArray(m: unknown): ChatMessage[] {
    return Array.isArray(m) ? m : [];
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    currentConversationId: null,
    conversations: [],
    setMessages: (messagesOrUpdater) =>
        set((state) => ({
            messages:
                typeof messagesOrUpdater === 'function'
                    ? ensureMessageArray(messagesOrUpdater(ensureMessageArray(state.messages)))
                    : ensureMessageArray(messagesOrUpdater),
        })),
    addMessage: (message) =>
        set((state) => ({ messages: [...ensureMessageArray(state.messages), message] })),
    clearMessages: () => set({ messages: [], currentConversationId: null }),
    setCurrentConversationId: (id) => set({ currentConversationId: id }),
    setConversations: (conversations) => set({ conversations }),
    addConversation: (conversation) =>
        set((state) => ({ conversations: [conversation, ...state.conversations] })),
    removeConversation: (conversationId) =>
        set((state) => ({
            conversations: state.conversations.filter((c) => c.conversation_id !== conversationId),
            currentConversationId:
                state.currentConversationId === conversationId ? null : state.currentConversationId,
        })),
}))
