import { getServerEnv } from '@/server/cf-env'

function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0')
  return `${id}${len}${value}`
}

function crc16Ccitt(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function buildVietQrTransferPayload(params: {
  bankBin: string
  accountNo: string
  amountVnd: number
  orderCode: string
}): string {
  const merchantAccountInfo = tlv('00', 'A000000727') + tlv('01', tlv('00', params.bankBin) + tlv('01', params.accountNo)) + tlv('02', 'QRIBFTTA')
  const additionalData = tlv('08', params.orderCode)

  const body =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('38', merchantAccountInfo) +
    tlv('53', '704') +
    tlv('54', String(params.amountVnd)) +
    tlv('58', 'VN') +
    tlv('62', additionalData) +
    '6304'

  return body + crc16Ccitt(body)
}

export function buildVietQrImageUrl(params: {
  bankBin: string
  accountNo: string
  accountName: string
  amountVnd: number
  orderCode: string
}): string {
  const query = new URLSearchParams({
    amount: String(params.amountVnd),
    addInfo: params.orderCode,
    accountName: params.accountName,
  })
  return `https://img.vietqr.io/image/${encodeURIComponent(params.bankBin)}-${encodeURIComponent(params.accountNo)}-compact2.png?${query.toString()}`
}

export function getVietQrBankConfig() {
  const env = getServerEnv()
  return {
    bankBin: env.VIETQR_BANK_BIN || '970422',
    bankShortName: env.VIETQR_BANK_SHORT_NAME || 'MBBank',
    accountNo: env.VIETQR_ACCOUNT_NO || '0123456789',
    accountName: env.VIETQR_ACCOUNT_NAME || 'VEROCV SAAS',
  }
}

export function extractOrderCodeFromTransferContent(text: string): string | null {
  const match = text.toUpperCase().match(/\bHSX[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}\b/)
  return match ? match[0] : null
}
