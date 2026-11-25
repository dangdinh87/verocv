import { listCvs, saveCv, type CvRecord } from '@/lib/cv-repository'
import { getApplications, getLetterList, saveAllApplications, saveLetterDocument } from '@/lib/storage'
import type { JobApplication, LetterDocument } from '@/types/resume'
import { migrateToV2 } from '@/types/schema'

export type CloudSyncSummary = {
  cvs: number
  letters: number
  applications: number
  syncedAt: string
}

export async function syncWorkspaceWithCloud(): Promise<CloudSyncSummary> {
  const [localCvs, localLetters, localApps] = await Promise.all([
    listCvs(),
    Promise.resolve(getLetterList()),
    Promise.resolve(getApplications()),
  ])

  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cvs: localCvs,
      letters: localLetters,
      applications: localApps,
    }),
  })

  if (!res.ok) {
    throw new Error('SYNC_FAILED')
  }

  const json = (await res.json()) as {
    cvs: unknown[]
    letters: LetterDocument[]
    applications: JobApplication[]
    syncedAt: string
  }

  const localCvMap = new Map(localCvs.map((c) => [c.id, c]))
  for (const rawCv of json.cvs ?? []) {
    try {
      const cloudCv = migrateToV2(rawCv)
      const local = localCvMap.get(cloudCv.id)
      if (!local || cloudCv.updatedAt > local.updatedAt) {
        await saveCv(cloudCv)
      }
    } catch {
      // Ignore invalid entries
    }
  }

  const localLetterMap = new Map(localLetters.map((l) => [l.id, l]))
  for (const cloudLetter of json.letters ?? []) {
    const local = localLetterMap.get(cloudLetter.id)
    if (!local || cloudLetter.updatedAt > local.updatedAt) {
      saveLetterDocument(cloudLetter)
    }
  }

  const mergedAppsMap = new Map<string, JobApplication>()
  for (const app of localApps) mergedAppsMap.set(app.id, app)
  for (const cloudApp of json.applications ?? []) {
    const existing = mergedAppsMap.get(cloudApp.id)
    if (!existing || cloudApp.updatedAt >= existing.updatedAt) {
      mergedAppsMap.set(cloudApp.id, cloudApp)
    }
  }
  const mergedApps = Array.from(mergedAppsMap.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  saveAllApplications(mergedApps)

  return {
    cvs: (json.cvs ?? []).length,
    letters: (json.letters ?? []).length,
    applications: mergedApps.length,
    syncedAt: json.syncedAt,
  }
}

export async function pushSingleCvToCloud(doc: CvRecord): Promise<void> {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvs: [doc], letters: [], applications: [] }),
    })
  } catch {
    // Offline-first: ignore silent background sync errors
  }
}
