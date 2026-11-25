/*
  Zero-dependency client-side Word (.docx) text extractor.
  A .docx file is a standard ZIP archive containing `word/document.xml`.
  We locate `word/document.xml` via the ZIP Central Directory, decompress it with the Web
  `DecompressionStream('deflate-raw')` API (available in all modern browsers and Node 20+),
  and rebuild clean paragraphs, bullets and table cells for `parseRawCvText`.
*/

export type DocxImportErrorCode = 'legacy-doc' | 'invalid' | 'no-text'

export class DocxImportError extends Error {
  constructor(readonly code: DocxImportErrorCode) {
    super(code)
    this.name = 'DocxImportError'
  }
}

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_FILE_SIGNATURE = 0x02014b50
const LOCAL_FILE_SIGNATURE = 0x04034b50

function isOle2BinaryDoc(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1
  )
}

function findEocdOffset(view: DataView): number {
  const minOffset = Math.max(0, view.byteLength - 65557)
  for (let offset = view.byteLength - 22; offset >= minOffset; offset--) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset
  }
  return -1
}

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new DocxImportError('invalid')
  }
  const copy = new Uint8Array(compressed.byteLength)
  copy.set(compressed)
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  const ab = await new Response(stream).arrayBuffer()
  return new Uint8Array(ab)
}

async function readZipEntry(data: ArrayBuffer, targetName: string): Promise<string | null> {
  const bytes = new Uint8Array(data)
  if (isOle2BinaryDoc(bytes)) throw new DocxImportError('legacy-doc')
  if (bytes.length < 22 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new DocxImportError('invalid')
  }

  const view = new DataView(data)
  const eocd = findEocdOffset(view)
  if (eocd < 0) throw new DocxImportError('invalid')

  const totalEntries = view.getUint16(eocd + 10, true)
  let cdOffset = view.getUint32(eocd + 16, true)
  const decoder = new TextDecoder('utf-8')

  for (let i = 0; i < totalEntries; i++) {
    if (cdOffset + 46 > view.byteLength || view.getUint32(cdOffset, true) !== CENTRAL_FILE_SIGNATURE) {
      throw new DocxImportError('invalid')
    }
    const compressionMethod = view.getUint16(cdOffset + 10, true)
    const compressedSize = view.getUint32(cdOffset + 20, true)
    const fileNameLen = view.getUint16(cdOffset + 28, true)
    const extraLen = view.getUint16(cdOffset + 30, true)
    const commentLen = view.getUint16(cdOffset + 32, true)
    const localHeaderOffset = view.getUint32(cdOffset + 42, true)

    const name = decoder.decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + fileNameLen))
    cdOffset += 46 + fileNameLen + extraLen + commentLen

    if (name !== targetName) continue

    if (localHeaderOffset + 30 > view.byteLength || view.getUint32(localHeaderOffset, true) !== LOCAL_FILE_SIGNATURE) {
      throw new DocxImportError('invalid')
    }
    const localNameLen = view.getUint16(localHeaderOffset + 26, true)
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
    const rawSlice = bytes.subarray(dataStart, dataStart + compressedSize)

    if (compressionMethod === 0) {
      return decoder.decode(rawSlice)
    }
    if (compressionMethod === 8) {
      try {
        const inflated = await inflateRaw(rawSlice)
        return decoder.decode(inflated)
      } catch {
        throw new DocxImportError('invalid')
      }
    }
    throw new DocxImportError('invalid')
  }

  return null
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function wordXmlToText(xml: string): string {
  const lines: string[] = []
  const paragraphRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g
  let pMatch: RegExpExecArray | null

  while ((pMatch = paragraphRegex.exec(xml)) !== null) {
    const pBody = pMatch[1]
    const isList = /<w:numPr\b/.test(pBody) || /<w:pStyle\b[^>]*w:val="[^"]*List[^"]*"/i.test(pBody)

    // Normalize line breaks and tabs inside the paragraph before collecting text runs.
    const normalized = pBody.replace(/<w:(?:br|cr)\b[^>]*\/?>/g, '<w:t>\n</w:t>').replace(/<w:tab\b[^>]*\/?>/g, '<w:t>  </w:t>')

    let text = ''
    const runRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g
    let tMatch: RegExpExecArray | null
    while ((tMatch = runRegex.exec(normalized)) !== null) {
      text += decodeXmlEntities(tMatch[1])
    }

    const subLines = text
      .split('\n')
      .map((s) => s.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean)

    subLines.forEach((sub, idx) => {
      if (isList && idx === 0 && !/^[•\-*·▪●‣–]\s/.test(sub)) {
        lines.push(`• ${sub}`)
      } else {
        lines.push(sub)
      }
    })
  }

  return lines.join('\n').trim()
}

export async function extractDocxText(data: ArrayBuffer): Promise<{ text: string }> {
  const xml = await readZipEntry(data, 'word/document.xml')
  if (!xml) throw new DocxImportError('invalid')
  const text = wordXmlToText(xml)
  if (text.replace(/\s/g, '').length < 15) throw new DocxImportError('no-text')
  return { text }
}
