'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { syncWorkspaceWithCloud } from '@/lib/cloud-sync'
import type { PublicUserProfile } from '@/server/auth'
import { AuthModal } from './auth-modal'

export type AuthQuotaState = {
  usedToday: number
  dailyLimit: number
  remaining: number
  planId: string
}

export type InfraModeState = {
  d1Mode: 'worker-binding' | 'd1-rest-api' | 'local-store'
  aiMode: 'worker-binding' | 'workers-ai-rest' | 'local-engine'
}

type AuthContextValue = {
  user: PublicUserProfile | null
  quota: AuthQuotaState | null
  infra: InfraModeState | null
  loading: boolean
  syncing: boolean
  lastSyncedAt: string | null
  authModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  refreshMe: () => Promise<void>
  syncNow: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUserProfile | null>(null)
  const [quota, setQuota] = useState<AuthQuotaState | null>(null)
  const [infra, setInfra] = useState<InfraModeState | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const syncNow = useCallback(async () => {
    setSyncing(true)
    try {
      const summary = await syncWorkspaceWithCloud()
      setLastSyncedAt(summary.syncedAt)
    } catch {
      // Ignore offline sync errors
    } finally {
      setSyncing(false)
    }
  }, [])

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) return
      const json = (await res.json()) as {
        user: PublicUserProfile | null
        quota: AuthQuotaState
        infra: InfraModeState
      }
      setUser(json.user)
      setQuota(json.quota)
      setInfra(json.infra)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshMe().then(async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const json = (await res.json()) as { user: PublicUserProfile | null }
          if (json.user) await syncNow()
        }
      } catch {
        // Ignore initial sync failure
      }
    })
  }, [refreshMe, syncNow])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setLastSyncedAt(null)
    await refreshMe()
  }, [refreshMe])

  return (
    <AuthContext.Provider
      value={{
        user,
        quota,
        infra,
        loading,
        syncing,
        lastSyncedAt,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        refreshMe,
        syncNow,
        logout,
      }}
    >
      {children}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={async () => {
          await refreshMe()
          await syncNow()
        }}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    return {
      user: null,
      quota: null,
      infra: null,
      loading: false,
      syncing: false,
      lastSyncedAt: null,
      authModalOpen: false,
      openAuthModal: () => {},
      closeAuthModal: () => {},
      refreshMe: async () => {},
      syncNow: async () => {},
      logout: async () => {},
    }
  }
  return ctx
}
