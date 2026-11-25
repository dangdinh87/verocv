const encoder = new TextEncoder()

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.trim()
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  return timingSafeEqualBytes(encoder.encode(a), encoder.encode(b))
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input))
  return toHex(new Uint8Array(digest))
}

const PBKDF2_ITERATIONS = 100_000

async function derivePbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const saltCopy = new Uint8Array(salt.byteLength)
  saltCopy.set(salt)
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltCopy,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  const derived = await derivePbkdf2(password, salt)
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(derived)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') return false
  const saltHex = parts[2]
  const expectedHex = parts[3]
  if (!saltHex || !expectedHex || saltHex.length % 2 !== 0 || expectedHex.length % 2 !== 0) return false
  const salt = fromHex(saltHex)
  const expected = fromHex(expectedHex)
  const actual = await derivePbkdf2(password, salt)
  return timingSafeEqualBytes(actual, expected)
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

const ORDER_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateOrderCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  let suffix = ''
  for (let i = 0; i < bytes.length; i++) {
    suffix += ORDER_ALPHABET[bytes[i] % ORDER_ALPHABET.length]
  }
  return `HSX${suffix}`
}
