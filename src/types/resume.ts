import type { ResumeData } from '@/components/resume/resume-data'
import { MINH_ANH, QUOC_HUY, THU_HA, GIA_BAO } from '@/components/resume/resume-data'
import type { CvLayout } from '@/components/resume/resume-paper'
import type { LetterLayout, LetterAccent } from '@/components/resume/letter-paper'

export type CvPaperSize = 'a4' | 'letter'
export type CvFontFamily = 'sans' | 'serif' | 'jakarta' | 'lora'
export type CvFontSize = 'compact' | 'normal' | 'relaxed'
export type CvSpacing = 'compact' | 'normal' | 'relaxed'

export type CvSettings = {
  accentColor: string
  fontFamily: CvFontFamily
  fontSize: CvFontSize
  spacing: CvSpacing
  pageMargin?: 'compact' | 'normal' | 'spacious'
  sectionSpacing?: 'compact' | 'normal' | 'spacious'
  paperSize: CvPaperSize
  documentLanguage?: 'vi' | 'en'
  columnSplit?: 'compact' | 'balanced' | 'wide'
  sideSections?: string[]
  showQrCode?: boolean
  qrUrl?: string
  discretePages?: boolean
  sectionOrder?: string[]
  sectionTitles?: Record<string, string>
}

export const DEFAULT_CV_SETTINGS: CvSettings = {
  accentColor: '#0c6a58',
  fontFamily: 'sans',
  fontSize: 'normal',
  spacing: 'normal',
  paperSize: 'a4',
  documentLanguage: 'vi',
  sectionOrder: ['summary', 'jobs', 'education', 'extra', 'skills', 'languages'],
  sectionTitles: {},
}

export type LetterDocument = {
  id: string
  title: string
  layout: LetterLayout
  accent: LetterAccent
  customAccentColor?: string
  fontFamily?: CvFontFamily
  paperSize: CvPaperSize
  senderName: string
  senderRole: string
  senderLocation: string
  senderEmail: string
  senderPhone: string
  recipientTitle: string
  recipientCompany: string
  dateStr: string
  subject: string
  salutation?: string
  paragraphs: string[]
  signOff: string
  signatureText?: string
  jdText?: string
  linkedCvId?: string
  updatedAt: string
  createdAt: string
}

export type KanbanColumnId = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected'

export type JobTodo = {
  id: string
  text: string
  done: boolean
}

export type InterviewPrepQuestion = {
  question: string
  hint: string
}

export type JobApplication = {
  id: string
  company: string
  role: string
  columnId: KanbanColumnId
  salary?: string
  location?: string
  url?: string
  notes?: string
  jdText?: string
  interviewPrep?: InterviewPrepQuestion[]
  appliedDate?: string
  interviewDate?: string
  linkedCvId?: string
  linkedLetterId?: string
  todos: JobTodo[]
  updatedAt: string
  createdAt: string
}

export const EMPTY_RESUME_DATA: ResumeData = {
  name: '',
  initials: '',
  role: '',
  location: '',
  email: '',
  phone: '',
  link: '',
  summary: '',
  jobs: [],
  education: [],
  skills: [],
  languages: [],
  extra: {
    title: 'Chứng chỉ / Dự án',
    items: [],
  },
}

export function getPersonaData(personaKey?: string): ResumeData {
  switch (personaKey) {
    case 'thu-ha':
      return JSON.parse(JSON.stringify(THU_HA))
    case 'quoc-huy':
      return JSON.parse(JSON.stringify(QUOC_HUY))
    case 'gia-bao':
      return JSON.parse(JSON.stringify(GIA_BAO))
    case 'minh-anh':
    default:
      return JSON.parse(JSON.stringify(MINH_ANH))
  }
}

export function computeInitials(name: string): string {
  if (!name.trim()) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
