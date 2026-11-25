import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { StrictMode, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AddContentModal } from '@/components/cv/add-content-modal'
import { Modal } from '@/components/ui/modal'

describe('Modal (<dialog> in React StrictMode)', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      // Chromium queues a native `close` event task when dialog.close() runs.
      setTimeout(() => {
        this.dispatchEvent(new Event('close'))
      }, 0)
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('stays open across React 19 StrictMode double-effect cleanup and queued close event', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <StrictMode>
          <button type="button" onClick={() => setOpen(true)}>
            Mở hộp thoại
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Hộp thoại thử nghiệm" description="Kiểm thử StrictMode">
            <p>Nội dung bên trong</p>
          </Modal>
        </StrictMode>
      )
    }

    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở hộp thoại' }))

    // Wait past macrotask queue where Chromium's queued `close` event from StrictMode cleanup fires.
    await new Promise((r) => setTimeout(r, 20))

    expect(screen.getByText('Hộp thoại thử nghiệm')).toBeTruthy()
    expect(screen.getByText('Nội dung bên trong')).toBeTruthy()

    // Escape / native cancel closes cleanly.
    const dialog = document.querySelector('dialog')!
    expect(dialog.hasAttribute('open')).toBe(true)
    const cancelEv = new Event('cancel', { cancelable: true })
    act(() => {
      dialog.dispatchEvent(cancelEv)
    })
    expect(cancelEv.defaultPrevented).toBe(true)

    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByText('Nội dung bên trong')).toBeNull()
  })

  it('opens AddContentModal in StrictMode with 0 axe-core violations and selects a preset', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const { container } = render(
      <StrictMode>
        <AddContentModal open={true} lang="vi" onClose={onClose} onSelectPreset={onSelect} />
      </StrictMode>,
    )

    await new Promise((r) => setTimeout(r, 20))
    expect(screen.getByText('Dự án tiêu biểu')).toBeTruthy()
    expect(screen.getByText('Người tham chiếu')).toBeTruthy()

    const results = await axe.run(container)
    expect(results.violations).toEqual([])

    fireEvent.click(screen.getByText('Dự án tiêu biểu'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0].kind).toBe('projects')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
