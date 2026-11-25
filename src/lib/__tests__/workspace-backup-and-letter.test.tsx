import 'fake-indexeddb/auto'
import { render } from '@testing-library/react'
import axe from 'axe-core'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LetterPaper, letterPrintBackdrop, SAMPLE_LETTER } from '@/components/resume/letter-paper'
import { QUOC_HUY } from '@/components/resume/resume-data'
import { ResumePaper } from '@/components/resume/resume-paper'
import { Modal } from '@/components/ui/modal'
import { arrayMove, SortableList } from '@/components/ui/sortable-list'
import { Tabs } from '@/components/ui/tabs'
import { createCv, deleteCv, listCvs, saveCv } from '@/lib/cv-repository'
import { createLetterFromTemplate, getApplications, getLetterList, saveAllApplications, saveLetterDocument } from '@/lib/storage'
import { exportWorkspaceToJson, importWorkspaceFromJson } from '@/lib/workspace-backup'

describe('LetterPaper & multi-page print backdrop', () => {
  it('uses custom salutation and hides greeting when cleared', () => {
    const custom = render(<LetterPaper layout="thang" accent="ink" data={{ ...SAMPLE_LETTER, salutation: 'Chào chị Lan,' }} />).container
    expect(custom.textContent).toContain('Chào chị Lan,')
    expect(custom.textContent).not.toContain('Kính gửi quý công ty,')

    const empty = render(<LetterPaper layout="thang" accent="ink" data={{ ...SAMPLE_LETTER, salutation: '' }} />).container
    expect(empty.textContent).not.toContain('Kính gửi quý công ty,')
  })

  it('renders clickable mailto and tel links in sender block and generates backdrop for le-trai', () => {
    const { container } = render(<LetterPaper layout="le-trai" accent="pen" data={SAMPLE_LETTER} flow />)
    const hrefs = Array.from(container.querySelectorAll('.l-contact a')).map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('mailto:minhanh@example.com')
    expect(hrefs).toContain('tel:0901234567')
    expect(letterPrintBackdrop('le-trai', 'pen')).toContain('linear-gradient')
    expect(letterPrintBackdrop('thang', 'ink')).toBeUndefined()
  })
})

describe('Workspace backup & restore', () => {
  beforeEach(async () => {
    localStorage.clear()
    const existing = await listCvs()
    for (const c of existing) await deleteCv(c.id)
  })

  it('exports and restores CVs, letters and kanban applications while remapping colliding IDs cleanly', async () => {
    const cv = createCv({ templateSlug: 'cot-xanh', title: 'CV Frontend' })
    await saveCv(cv)
    const letter = createLetterFromTemplate('dai-xanh', 'Thư Sao Mai', cv)
    saveLetterDocument(letter)
    saveAllApplications([
      {
        id: 'app_test_1',
        company: 'Sao Mai Tech',
        role: 'Frontend Engineer',
        columnId: 'interview',
        linkedCvId: cv.id,
        linkedLetterId: letter.id,
        todos: [{ id: 't1', text: 'Ôn câu hỏi hệ thống', done: false }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    const archive = await exportWorkspaceToJson()

    // Importing onto a browser that ALREADY has those exact IDs must clone with fresh IDs and keep cross-links intact!
    const summary = await importWorkspaceFromJson(archive)
    expect(summary).toEqual({ cvs: 1, letters: 1, applications: 1 })

    const allCvs = await listCvs()
    const allLetters = getLetterList()
    const allApps = getApplications()

    expect(allCvs).toHaveLength(2)
    expect(allLetters).toHaveLength(2)
    expect(allApps).toHaveLength(2)

    const importedApp = allApps.find((a) => a.id !== 'app_test_1')!
    expect(importedApp.linkedCvId).not.toBe(cv.id)
    expect(allCvs.some((c) => c.id === importedApp.linkedCvId)).toBe(true)
    expect(allLetters.some((l) => l.id === importedApp.linkedLetterId)).toBe(true)
  })
})

describe('Accessibility (axe-core) & keyboard reorder', () => {
  it('reorders items cleanly with arrayMove and passes axe-core with zero violations on sheets and controls', async () => {
    expect(arrayMove(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])

    const { container } = render(
      <div>
        <Tabs
          label="Điều hướng thử nghiệm"
          tabs={[
            { id: 'one', label: 'Mục một' },
            { id: 'two', label: 'Mục hai' },
          ]}
          value="one"
          onChange={() => {}}
        >
          <SortableList
            items={[
              { id: 'i1', name: 'Mục 1' },
              { id: 'i2', name: 'Mục 2' },
            ]}
            kind="mục"
            onReorder={() => {}}
            renderItem={(item, _idx, handle) => (
              <div>
                {handle}
                <span>{item.name}</span>
              </div>
            )}
          />
        </Tabs>
        <ResumePaper layout="anh-tron" data={QUOC_HUY} flow />
        <LetterPaper layout="dai-mau" accent="pen" data={SAMPLE_LETTER} flow />
      </div>,
    )

    const results = await axe.run(container, {
      rules: {
        // Colour contrast depends on real computed CSS in a full browser rather than jsdom.
        'color-contrast': { enabled: false },
      },
    })
    expect(results.violations).toEqual([])
  })

  it('keeps Modal open under React StrictMode when native dialog.close() dispatches async close events', async () => {
    const origShowModal = HTMLDialogElement.prototype.showModal
    const origClose = HTMLDialogElement.prototype.close
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '')
    }
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open')
      queueMicrotask(() => {
        this.dispatchEvent(new Event('close'))
      })
    }

    try {
      const onClose = vi.fn()
      const { container } = render(
        <StrictMode>
          <Modal open={true} onClose={onClose} title="Hộp thoại thử nghiệm">
            <p>Nội dung hộp thoại</p>
          </Modal>
        </StrictMode>,
      )
      await Promise.resolve()
      await Promise.resolve()
      expect(onClose).not.toHaveBeenCalled()
      expect(container.querySelector('dialog')?.hasAttribute('open')).toBe(true)
      expect(container.textContent).toContain('Nội dung hộp thoại')
    } finally {
      HTMLDialogElement.prototype.showModal = origShowModal
      HTMLDialogElement.prototype.close = origClose
    }
  })
})
