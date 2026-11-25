import { z } from 'zod'

export const CvLayoutSchema = z.enum([
  'ke-ngang',
  'cot-xanh',
  'bia-kraft',
  'thu-gon',
  'anh-tron',
  'moc-thoi-gian',
  'toi-gian',
  'con-dau',
  'harvard',
  'cong-nghe',
  'hien-dai',
  'sang-tao',
])
export type CvLayout = z.infer<typeof CvLayoutSchema>

export const REORDERABLE_SECTIONS = ['summary', 'jobs', 'education', 'extra', 'skills', 'languages'] as const
export type CvSectionKey = (typeof REORDERABLE_SECTIONS)[number]

export const DEFAULT_SECTION_ORDER: string[] = [...REORDERABLE_SECTIONS]

export function isCustomSectionKey(key: string): boolean {
  return key.startsWith('custom_')
}

export function normalizeSectionOrder(raw?: readonly string[], customSectionIds: readonly string[] = []): string[] {
  const validBuiltins = new Set<string>(REORDERABLE_SECTIONS)
  const validCustom = new Set<string>(customSectionIds)
  const seen = new Set<string>()
  const result: string[] = []

  if (Array.isArray(raw)) {
    for (const key of raw) {
      if ((validBuiltins.has(key) || validCustom.has(key)) && !seen.has(key)) {
        seen.add(key)
        result.push(key)
      }
    }
  }
  for (const key of REORDERABLE_SECTIONS) {
    if (!seen.has(key)) {
      seen.add(key)
      result.push(key)
    }
  }
  for (const customId of customSectionIds) {
    if (!seen.has(customId)) {
      seen.add(customId)
      result.push(customId)
    }
  }
  return result
}

export const ProfileLinkSchema = z.object({
  id: z.string().default(() => `lnk_${Math.random().toString(36).slice(2, 7)}`),
  label: z.string().default(''),
  url: z.string().default(''),
})

export const JobItemSchema = z.object({
  id: z.string().default(() => `job_${Math.random().toString(36).slice(2, 7)}`),
  title: z.string().default(''),
  org: z.string().default(''),
  location: z.string().default(''),
  period: z.string().default(''),
  bullets: z.array(z.string()).default([]),
  hidden: z.boolean().default(false),
})

export const EducationItemSchema = z.object({
  id: z.string().default(() => `edu_${Math.random().toString(36).slice(2, 7)}`),
  school: z.string().default(''),
  degree: z.string().default(''),
  location: z.string().default(''),
  gpa: z.string().default(''),
  period: z.string().default(''),
  hidden: z.boolean().default(false),
})

export const LanguageItemSchema = z.object({
  id: z.string().default(() => `lang_${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().default(''),
  level: z.string().default(''),
  proficiency: z.number().min(0).max(5).default(0),
  hidden: z.boolean().default(false),
})

export const ExtraSectionSchema = z.object({
  title: z.string().default('Chứng chỉ & Dự án'),
  items: z.array(z.string()).default([]),
})

export const CustomSectionKindSchema = z.enum([
  'projects',
  'certificates',
  'awards',
  'activities',
  'publications',
  'references',
  'interests',
  'custom',
])

export const CustomSectionEntrySchema = z.object({
  id: z.string().default(() => `cse_${Math.random().toString(36).slice(2, 7)}`),
  title: z.string().default(''),
  subtitle: z.string().default(''),
  period: z.string().default(''),
  link: z.string().default(''),
  bullets: z.array(z.string()).default([]),
  hidden: z.boolean().default(false),
})

export const CustomSectionSchema = z.object({
  id: z.string().default(() => `custom_${Math.random().toString(36).slice(2, 7)}`),
  kind: CustomSectionKindSchema.default('custom'),
  title: z.string().default('Mục tuỳ chỉnh'),
  hidden: z.boolean().default(false),
  entries: z.array(CustomSectionEntrySchema).default([]),
})

export const ResumeDataSchema = z.object({
  name: z.string().default(''),
  initials: z.string().default(''),
  photo: z.string().default(''),
  role: z.string().default(''),
  location: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  link: z.string().default(''),
  links: z.array(ProfileLinkSchema).default([]),
  summary: z.string().default(''),
  jobs: z.array(JobItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  languages: z.array(LanguageItemSchema).default([]),
  extra: ExtraSectionSchema.default({
    title: 'Chứng chỉ & Dự án',
    items: [],
  }),
  customSections: z.array(CustomSectionSchema).default([]),
})

export const CvDocumentLanguageSchema = z.enum(['vi', 'en'])
export type CvDocumentLanguage = z.infer<typeof CvDocumentLanguageSchema>

export const CvFontFamilySchema = z.enum(['sans', 'serif', 'jakarta', 'lora'])
export type CvFontFamilyV2 = z.infer<typeof CvFontFamilySchema>

export const CvColumnSplitSchema = z.enum(['compact', 'balanced', 'wide'])
export type CvColumnSplit = z.infer<typeof CvColumnSplitSchema>

export const CvSkillStyleSchema = z.enum(['template', 'pills', 'comma', 'bullets', 'grid'])
export type CvSkillStyle = z.infer<typeof CvSkillStyleSchema>

export const CvHeadingStyleSchema = z.enum(['default', 'underline', 'shaded', 'left-accent', 'minimal'])
export type CvHeadingStyle = z.infer<typeof CvHeadingStyleSchema>

export const CvHeaderLayoutSchema = z.enum(['template', 'left', 'center', 'split'])
export type CvHeaderLayout = z.infer<typeof CvHeaderLayoutSchema>

export const CvSettingsSchema = z.object({
  accentColor: z.string().default('#0c6a58'),
  fontFamily: CvFontFamilySchema.default('sans'),
  fontSize: z.enum(['compact', 'normal', 'relaxed']).default('normal'),
  spacing: z.enum(['compact', 'normal', 'relaxed']).default('normal'),
  pageMargin: z.enum(['compact', 'normal', 'spacious']).default('normal'),
  sectionSpacing: z.enum(['compact', 'normal', 'spacious']).default('normal'),
  paperSize: z.enum(['a4', 'letter']).default('a4'),
  documentLanguage: CvDocumentLanguageSchema.default('vi'),
  skillStyle: CvSkillStyleSchema.default('template'),
  headingStyle: CvHeadingStyleSchema.default('default'),
  headingCase: z.enum(['normal', 'uppercase']).default('normal'),
  headerLayout: CvHeaderLayoutSchema.default('template'),
  showSectionIcons: z.boolean().default(false),
  showContactIcons: z.boolean().default(false),
  photoShape: z.enum(['circle', 'rounded', 'square']).default('circle'),
  columnSplit: CvColumnSplitSchema.default('balanced'),
  sideSections: z.array(z.string()).default([]),
  showQrCode: z.boolean().default(false),
  qrUrl: z.string().default(''),
  discretePages: z.boolean().default(true),
  sectionOrder: z.array(z.string()).default([...DEFAULT_SECTION_ORDER]),
  sectionTitles: z.record(z.string(), z.string()).default({}),
  hiddenSections: z.array(z.string()).default([]),
})

export const ResumeDocumentSchema = z.object({
  version: z.literal(2).default(2),
  id: z.string(),
  title: z.string().default('CV chưa đặt tên'),
  layout: CvLayoutSchema.default('ke-ngang'),
  isMaster: z.boolean().default(false),
  parentCvId: z.string().nullable().default(null),
  settings: CvSettingsSchema.default({
    accentColor: '#0c6a58',
    fontFamily: 'sans',
    fontSize: 'normal',
    spacing: 'normal',
    pageMargin: 'normal',
    sectionSpacing: 'normal',
    paperSize: 'a4',
    documentLanguage: 'vi',
    skillStyle: 'template',
    headingStyle: 'default',
    headingCase: 'normal',
    headerLayout: 'template',
    showSectionIcons: false,
    showContactIcons: false,
    photoShape: 'circle',
    columnSplit: 'balanced',
    sideSections: [],
    showQrCode: false,
    qrUrl: '',
    discretePages: true,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sectionTitles: {},
    hiddenSections: [],
  }),
  data: ResumeDataSchema.default({
    name: '',
    initials: '',
    photo: '',
    role: '',
    location: '',
    email: '',
    phone: '',
    link: '',
    links: [],
    summary: '',
    jobs: [],
    education: [],
    skills: [],
    languages: [],
    extra: {
      title: 'Chứng chỉ & Dự án',
      items: [],
    },
    customSections: [],
  }),
  updatedAt: z.string().default(() => new Date().toISOString()),
  createdAt: z.string().default(() => new Date().toISOString()),
})

export type ResumeDocumentV2 = z.infer<typeof ResumeDocumentSchema>
export type JobItemV2 = z.infer<typeof JobItemSchema>
export type EducationItemV2 = z.infer<typeof EducationItemSchema>
export type CustomSectionV2 = z.infer<typeof CustomSectionSchema>
export type CustomSectionEntryV2 = z.infer<typeof CustomSectionEntrySchema>

/**
 * Migration function to upgrade legacy v1 documents or unversioned data to Schema V2
 */
export function migrateToV2(raw: unknown): ResumeDocumentV2 {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu tài liệu không hợp lệ.')
  }
  const rec = raw as Record<string, any>

  const jobs = Array.isArray(rec.data?.jobs)
    ? rec.data.jobs.map((j: any) => ({
        id: j?.id || `job_${Math.random().toString(36).slice(2, 7)}`,
        title: j?.title || '',
        org: j?.org || '',
        location: typeof j?.location === 'string' ? j.location : '',
        period: j?.period || '',
        bullets: Array.isArray(j?.bullets) ? j.bullets : [],
        hidden: Boolean(j?.hidden),
      }))
    : []

  const education = Array.isArray(rec.data?.education)
    ? rec.data.education.map((e: any) => ({
        id: e?.id || `edu_${Math.random().toString(36).slice(2, 7)}`,
        school: e?.school || '',
        degree: e?.degree || '',
        location: typeof e?.location === 'string' ? e.location : '',
        gpa: typeof e?.gpa === 'string' ? e.gpa : '',
        period: e?.period || '',
        hidden: Boolean(e?.hidden),
      }))
    : []

  const languages = Array.isArray(rec.data?.languages)
    ? rec.data.languages.map((l: any) => ({
        id: l?.id || `lang_${Math.random().toString(36).slice(2, 7)}`,
        name: l?.name || '',
        level: l?.level || '',
        proficiency: typeof l?.proficiency === 'number' && l.proficiency >= 0 && l.proficiency <= 5 ? Math.round(l.proficiency) : 0,
        hidden: Boolean(l?.hidden),
      }))
    : []

  const links = Array.isArray(rec.data?.links)
    ? rec.data.links.map((lnk: any) => ({
        id: lnk?.id || `lnk_${Math.random().toString(36).slice(2, 7)}`,
        label: typeof lnk?.label === 'string' ? lnk.label : '',
        url: typeof lnk?.url === 'string' ? lnk.url : '',
      }))
    : []

  const customSections = Array.isArray(rec.data?.customSections)
    ? rec.data.customSections.map((cs: any) => ({
        id: typeof cs?.id === 'string' && cs.id.startsWith('custom_') ? cs.id : `custom_${Math.random().toString(36).slice(2, 7)}`,
        kind: CustomSectionKindSchema.safeParse(cs?.kind).success ? cs.kind : 'custom',
        title: typeof cs?.title === 'string' && cs.title.trim() ? cs.title : 'Mục tuỳ chỉnh',
        hidden: Boolean(cs?.hidden),
        entries: Array.isArray(cs?.entries)
          ? cs.entries.map((entry: any) => ({
              id: entry?.id || `cse_${Math.random().toString(36).slice(2, 7)}`,
              title: typeof entry?.title === 'string' ? entry.title : '',
              subtitle: typeof entry?.subtitle === 'string' ? entry.subtitle : '',
              period: typeof entry?.period === 'string' ? entry.period : '',
              link: typeof entry?.link === 'string' ? entry.link : '',
              bullets: Array.isArray(entry?.bullets) ? entry.bullets.filter((b: unknown): b is string => typeof b === 'string') : [],
              hidden: Boolean(entry?.hidden),
            }))
          : [],
      }))
    : []

  const customIds = customSections.map((cs: { id: string }) => cs.id)

  const rawData = {
    ...rec.data,
    photo: typeof rec.data?.photo === 'string' ? rec.data.photo : '',
    links,
    jobs,
    education,
    languages,
    customSections,
  }

  const rawTitles: Record<string, string> = {}
  if (rec.settings?.sectionTitles && typeof rec.settings.sectionTitles === 'object') {
    for (const [k, v] of Object.entries(rec.settings.sectionTitles)) {
      if (typeof v === 'string') rawTitles[k] = v
    }
  }

  const s = rec.settings ?? {}
  const rawSettings = {
    accentColor: s.accentColor || '#0c6a58',
    fontFamily: CvFontFamilySchema.safeParse(s.fontFamily).success ? s.fontFamily : 'sans',
    fontSize: s.fontSize || 'normal',
    spacing: s.spacing || 'normal',
    pageMargin: ['compact', 'normal', 'spacious'].includes(s.pageMargin) ? s.pageMargin : 'normal',
    sectionSpacing: ['compact', 'normal', 'spacious'].includes(s.sectionSpacing) ? s.sectionSpacing : 'normal',
    paperSize: s.paperSize || 'a4',
    documentLanguage: s.documentLanguage === 'en' ? 'en' : 'vi',
    skillStyle: CvSkillStyleSchema.safeParse(s.skillStyle).success ? s.skillStyle : 'template',
    headingStyle: CvHeadingStyleSchema.safeParse(s.headingStyle).success ? s.headingStyle : 'default',
    headingCase: s.headingCase === 'uppercase' ? 'uppercase' : 'normal',
    headerLayout: ['template', 'left', 'center', 'split'].includes(s.headerLayout) ? s.headerLayout : 'template',
    showSectionIcons: Boolean(s.showSectionIcons),
    showContactIcons: Boolean(s.showContactIcons),
    photoShape: ['circle', 'rounded', 'square'].includes(s.photoShape) ? s.photoShape : 'circle',
    columnSplit: CvColumnSplitSchema.safeParse(s.columnSplit).success ? s.columnSplit : 'balanced',
    sideSections: Array.isArray(s.sideSections) ? s.sideSections.filter((x: unknown): x is string => typeof x === 'string') : [],
    showQrCode: Boolean(s.showQrCode),
    qrUrl: typeof s.qrUrl === 'string' ? s.qrUrl : '',
    discretePages: s.discretePages === undefined ? true : Boolean(s.discretePages),
    sectionOrder: normalizeSectionOrder(s.sectionOrder, customIds),
    sectionTitles: rawTitles,
    hiddenSections: Array.isArray(s.hiddenSections) ? s.hiddenSections.filter((x: unknown): x is string => typeof x === 'string') : [],
  }

  const candidate = {
    version: 2,
    id: rec.id || `cv_${Date.now()}`,
    title: rec.title || 'CV chưa đặt tên',
    layout: rec.layout || 'ke-ngang',
    isMaster: Boolean(rec.isMaster),
    parentCvId: typeof rec.parentCvId === 'string' ? rec.parentCvId : null,
    settings: rawSettings,
    data: rawData,
    updatedAt: rec.updatedAt || new Date().toISOString(),
    createdAt: rec.createdAt || new Date().toISOString(),
  }

  return ResumeDocumentSchema.parse(candidate)
}
