/*
  Crops an uploaded portrait photo into a compact square Data URL on the client.
  Nothing is uploaded to any server; the resulting string (~15–35 KB) lives inside the CV document.
*/

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_INPUT_BYTES = 8 * 1024 * 1024 // 8 MB
const OUTPUT_SIZE = 256

export class AvatarImageError extends Error {
  constructor(readonly reason: 'unsupported-type' | 'too-large' | 'decode-failed') {
    super(reason)
    this.name = 'AvatarImageError'
  }
}

export function avatarErrorMessage(error: unknown): string {
  if (error instanceof AvatarImageError) {
    if (error.reason === 'unsupported-type') return 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.'
    if (error.reason === 'too-large') return 'Ảnh quá lớn (trên 8 MB). Hãy chọn ảnh nhẹ hơn.'
    return 'Không đọc được file ảnh này. Hãy thử một ảnh khác.'
  }
  return 'Không thể xử lý ảnh này.'
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new AvatarImageError('decode-failed'))
    img.src = src
  })
}

export async function processAvatarFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new AvatarImageError('unsupported-type')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new AvatarImageError('too-large')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImageElement(objectUrl)
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    if (!width || !height) throw new AvatarImageError('decode-failed')

    // Portrait crop biases slightly toward the upper-middle so the head is framed well.
    const side = Math.min(width, height)
    const sx = Math.round((width - side) / 2)
    const sy = Math.round((height - side) * 0.25)

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new AvatarImageError('decode-failed')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const webp = canvas.toDataURL('image/webp', 0.86)
    if (webp.startsWith('data:image/webp')) return webp
    return canvas.toDataURL('image/jpeg', 0.86)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
