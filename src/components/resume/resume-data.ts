// Fictional people used to fill the sample CVs and letters. Emails use the reserved example.com domain.

export type CustomSectionKind =
  'projects' | 'certificates' | 'awards' | 'activities' | 'publications' | 'references' | 'interests' | 'custom'

export type CustomSectionEntry = {
  id: string
  title: string
  subtitle?: string
  period?: string
  link?: string
  bullets: string[]
  hidden?: boolean
}

export type CustomSection = {
  id: string
  kind: CustomSectionKind
  title: string
  hidden?: boolean
  entries: CustomSectionEntry[]
}

export type ProfileLink = {
  id: string
  label: string
  url: string
}

export type ResumeData = {
  name: string
  initials: string
  photo?: string
  role: string
  location: string
  email: string
  phone: string
  link: string
  links?: ProfileLink[]
  summary: string
  jobs: { id?: string; title: string; org: string; location?: string; period: string; bullets: string[]; hidden?: boolean }[]
  education: { id?: string; school: string; degree: string; location?: string; gpa?: string; period: string; hidden?: boolean }[]
  skills: string[]
  languages: { id?: string; name: string; level: string; proficiency?: number; hidden?: boolean }[]
  extra: { title: string; items: string[] }
  customSections?: CustomSection[]
}

export const MINH_ANH: ResumeData = {
  name: 'Nguyễn Minh Anh',
  initials: 'MA',
  photo: '/images/avatars/minh-anh.jpg',
  role: 'Chuyên viên Marketing',
  location: 'Cầu Giấy, Hà Nội',
  email: 'minhanh@example.com',
  phone: '0901 234 567',
  link: 'linkedin.com/in/minhanh',
  summary:
    'Hơn 4 năm làm marketing cho ngành bán lẻ và thương mại điện tử. Quen lập kế hoạch chiến dịch, đo hiệu quả bằng số liệu và phối hợp với đội thiết kế, bán hàng để chạy đúng hạn.',
  jobs: [
    {
      title: 'Chuyên viên Marketing',
      org: 'Công ty Cổ phần Ánh Dương',
      period: '2023 – nay',
      bullets: [
        'Lập kế hoạch và triển khai 12 chiến dịch quảng cáo trả phí, đơn hàng từ quảng cáo tăng 28% sau 9 tháng.',
        'Dựng bảng theo dõi chi phí mỗi đơn hàng theo tuần, giúp đội cắt các nhóm quảng cáo kém hiệu quả.',
        'Hướng dẫn 2 nhân viên mới về quy trình duyệt nội dung.',
      ],
    },
    {
      title: 'Nhân viên Content',
      org: 'Công ty TNHH Lá Xanh',
      period: '2021 – 2023',
      bullets: [
        'Viết bài cho website và fanpage, lượng truy cập tự nhiên tăng gấp đôi trong 1 năm.',
        'Phối hợp với thiết kế để ra đều 3 bài mỗi tuần.',
      ],
    },
    {
      title: 'Thực tập sinh Marketing',
      org: 'Agency Cây Sồi',
      period: '2020 – 2021',
      bullets: ['Hỗ trợ báo cáo chiến dịch hằng tháng cho 5 khách hàng.', 'Nghiên cứu đối thủ và tổng hợp thành bản tóm tắt cho đội.'],
    },
  ],
  education: [{ school: 'Đại học Kinh tế Quốc dân', degree: 'Cử nhân Marketing', period: '2016 – 2020' }],
  skills: ['Lập kế hoạch chiến dịch', 'Quảng cáo Meta', 'Google Analytics', 'SEO cơ bản', 'Viết nội dung', 'Excel'],
  languages: [
    { name: 'Tiếng Việt', level: 'Bản ngữ' },
    { name: 'Tiếng Anh', level: 'Giao tiếp tốt' },
  ],
  extra: {
    title: 'Chứng chỉ',
    items: ['Chứng chỉ Google Analytics (2023)', 'Khoá Quản trị quảng cáo Meta (2022)', 'Khoá Viết nội dung cho thương mại điện tử (2021)'],
  },
}

export const QUOC_HUY: ResumeData = {
  name: 'Trần Quốc Huy',
  initials: 'QH',
  photo: '/images/avatars/quoc-huy.jpg',
  role: 'Lập trình viên Frontend',
  location: 'Quận 7, TP. Hồ Chí Minh',
  email: 'quochuy@example.com',
  phone: '0912 345 678',
  link: 'github.com/quochuy',
  summary:
    '3 năm làm giao diện web cho các sản phẩm bán hàng và quản lý nội bộ. Thích viết component dễ tái sử dụng và quan tâm đến tốc độ tải trang.',
  jobs: [
    {
      title: 'Frontend Developer',
      org: 'Công ty Phần mềm Sao Mai',
      period: '2022 – nay',
      bullets: [
        'Xây lại trang thanh toán bằng React và TypeScript, thời gian tải giảm từ 4,1 giây xuống 1,8 giây.',
        'Viết bộ component dùng chung cho 3 dự án, giảm khoảng một nửa thời gian dựng màn hình mới.',
        'Thêm kiểm thử tự động cho các luồng đăng nhập và đặt hàng.',
      ],
    },
    {
      title: 'Junior Web Developer',
      org: 'Studio Hạt Dẻ',
      period: '2021 – 2022',
      bullets: [
        'Dựng giao diện từ bản thiết kế cho 8 website giới thiệu doanh nghiệp.',
        'Sửa lỗi hiển thị trên các trình duyệt và máy di động.',
      ],
    },
  ],
  education: [{ school: 'Đại học Bách khoa TP. Hồ Chí Minh', degree: 'Kỹ sư Khoa học Máy tính', period: '2017 – 2021' }],
  skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Vitest', 'Git'],
  languages: [
    { name: 'Tiếng Việt', level: 'Bản ngữ' },
    { name: 'Tiếng Anh', level: 'Đọc tài liệu kỹ thuật tốt' },
  ],
  extra: {
    title: 'Dự án cá nhân',
    items: [
      'Thư viện component mã nguồn mở, hơn 300 sao trên GitHub.',
      'Ứng dụng ghi chú chạy không cần mạng, viết bằng Next.js.',
      'Viết blog kỹ thuật về hiệu năng trang web.',
    ],
  },
}

export const THU_HA: ResumeData = {
  name: 'Lê Thu Hà',
  initials: 'TH',
  role: 'Kế toán tổng hợp',
  location: 'Hải Châu, Đà Nẵng',
  email: 'thuha@example.com',
  phone: '0935 456 789',
  link: 'linkedin.com/in/thuha',
  summary:
    '6 năm kinh nghiệm kế toán cho doanh nghiệp sản xuất vừa và nhỏ. Làm quen với khoá sổ cuối tháng, báo cáo thuế và đối chiếu công nợ.',
  jobs: [
    {
      title: 'Kế toán tổng hợp',
      org: 'Công ty TNHH Sản xuất Đại Dương',
      period: '2021 – nay',
      bullets: [
        'Khoá sổ và lập báo cáo tài chính hằng tháng, rút thời gian khoá sổ từ 7 ngày xuống 4 ngày.',
        'Đối chiếu công nợ với hơn 60 nhà cung cấp, giảm các khoản treo quá hạn.',
        'Lập tờ khai thuế GTGT và thuế thu nhập doanh nghiệp đúng hạn.',
      ],
    },
    {
      title: 'Kế toán thanh toán',
      org: 'Công ty Cổ phần Thương mại Hải Âu',
      period: '2018 – 2021',
      bullets: ['Kiểm tra chứng từ và theo dõi thanh toán cho 3 chi nhánh.', 'Làm việc với ngân hàng để xử lý lệnh chi cuối ngày.'],
    },
  ],
  education: [{ school: 'Đại học Kinh tế Đà Nẵng', degree: 'Cử nhân Kế toán', period: '2014 – 2018' }],
  skills: ['Kế toán tổng hợp', 'Báo cáo thuế', 'Đối chiếu công nợ', 'MISA', 'Excel nâng cao', 'Chuẩn mực VAS'],
  languages: [
    { name: 'Tiếng Việt', level: 'Bản ngữ' },
    { name: 'Tiếng Anh', level: 'Đọc hiểu chứng từ' },
  ],
  extra: {
    title: 'Chứng chỉ',
    items: ['Chứng chỉ Kế toán trưởng (2022)', 'Khoá cập nhật chính sách thuế (2024)', 'Chứng chỉ sử dụng phần mềm MISA (2019)'],
  },
}

export const GIA_BAO: ResumeData = {
  name: 'Phạm Gia Bảo',
  initials: 'GB',
  role: 'Sinh viên năm cuối ngành Kinh tế',
  location: 'Thủ Đức, TP. Hồ Chí Minh',
  email: 'giabao@example.com',
  phone: '0978 567 890',
  link: 'linkedin.com/in/giabao',
  summary:
    'Đang tìm vị trí thực tập về phân tích dữ liệu kinh doanh. Có kinh nghiệm làm báo cáo cho câu lạc bộ và làm thêm ở quán cà phê, quen làm việc nhóm và giữ đúng hạn.',
  jobs: [
    {
      title: 'Phó ban Nội dung, CLB Tài chính',
      org: 'Đại học Kinh tế TP. Hồ Chí Minh',
      period: '2023 – nay',
      bullets: [
        'Quản lý nhóm 6 bạn, ra bản tin tuần cho hơn 400 thành viên.',
        'Tổng hợp số liệu khảo sát sinh viên và trình bày trong buổi tổng kết học kỳ.',
      ],
    },
    {
      title: 'Nhân viên bán thời gian',
      org: 'Quán cà phê Hạt Mộc',
      period: '2022 – 2023',
      bullets: [
        'Làm 20 giờ mỗi tuần song song với việc học, không nghỉ ca không báo trước.',
        'Tự lập bảng theo dõi nguyên liệu hao hụt bằng Excel.',
      ],
    },
  ],
  education: [{ school: 'Đại học Kinh tế TP. Hồ Chí Minh', degree: 'Cử nhân Kinh tế (dự kiến 2026)', period: '2022 – 2026' }],
  skills: ['Excel', 'Power BI cơ bản', 'SQL cơ bản', 'Thuyết trình', 'Làm việc nhóm'],
  languages: [
    { name: 'Tiếng Việt', level: 'Bản ngữ' },
    { name: 'Tiếng Anh', level: 'IELTS 6.5' },
  ],
  extra: {
    title: 'Hoạt động khác',
    items: [
      'Giải Ba cuộc thi phân tích tình huống cấp trường, 2024.',
      'Tình nguyện viên chiến dịch Mùa hè xanh, 2023.',
      'Thành viên đội bóng chuyền của khoa.',
    ],
  },
}

export const HOANG_NAM: ResumeData = {
  name: 'Đỗ Hoàng Nam',
  initials: 'HN',
  photo: '/images/avatars/hoang-nam.jpg',
  role: 'Senior Backend & AI Engineer',
  location: 'Quận 1, TP. Hồ Chí Minh',
  email: 'hoangnam@example.com',
  phone: '0908 678 901',
  link: 'github.com/hoangnam-ai',
  links: [{ id: 'lnk_nam_1', label: 'linkedin.com/in/hoangnam', url: 'https://linkedin.com/in/hoangnam' }],
  summary:
    'Hơn 5 năm xây dựng hệ thống backend chịu tải cao và tích hợp LLM/RAG vào sản phẩm thực tế. Tập trung vào độ ổn định API, tối ưu độ trễ truy vấn vector và tự động hoá hạ tầng.',
  jobs: [
    {
      title: 'Senior Backend & AI Engineer',
      org: 'Công ty Công nghệ VietPulse',
      location: 'TP. Hồ Chí Minh',
      period: '2023 – nay',
      bullets: [
        'Thiết kế kiến trúc dịch vụ RAG bằng Python, FastAPI và pgvector cho 120.000 người dùng doanh nghiệp, giảm độ trễ p95 xuống 420ms.',
        'Tối ưu pipeline xử lý sự kiện Kafka và Redis giúp thông lượng tăng 3,2 lần và tiết kiệm 35% chi phí GPU hàng tháng.',
        'Xây dựng bộ đánh giá chất lượng câu trả lời AI tự động (evals), nâng độ chính xác trích xuất tài liệu từ 76% lên 93%.',
      ],
    },
    {
      title: 'Backend Engineer',
      org: 'Nền tảng Thương mại Mây Việt',
      location: 'TP. Hồ Chí Minh',
      period: '2020 – 2023',
      bullets: [
        'Phát triển hệ thống thanh toán và đồng bộ tồn kho bằng Go & PostgreSQL, xử lý ổn định 45.000 đơn hàng/ngày dịp cao điểm.',
        'Chuẩn hoá CI/CD với Docker và Kubernetes, rút thời gian triển khai bản phát hành từ 40 phút xuống 6 phút.',
      ],
    },
  ],
  education: [
    {
      school: 'Đại học Công nghệ Thông tin – ĐHQG TP.HCM',
      degree: 'Kỹ sư Kỹ thuật Phần mềm',
      gpa: '3.65/4.0',
      period: '2016 – 2020',
    },
  ],
  skills: ['Python', 'Go', 'TypeScript', 'FastAPI', 'PostgreSQL', 'pgvector', 'Redis', 'Docker', 'Kubernetes', 'LLM / RAG'],
  languages: [
    { name: 'Tiếng Việt', level: 'Bản ngữ', proficiency: 5 },
    { name: 'Tiếng Anh', level: 'Thành thạo công việc (IELTS 7.5)', proficiency: 4 },
  ],
  extra: {
    title: 'Chứng chỉ & Thành tích',
    items: [
      'AWS Certified Solutions Architect – Associate (2024)',
      'Diễn giả Vietnam Tech Summit: Vận hành RAG ở quy mô sản xuất (2024)',
    ],
  },
  customSections: [
    {
      id: 'custom_nam_proj',
      kind: 'projects',
      title: 'Dự án mã nguồn mở',
      hidden: false,
      entries: [
        {
          id: 'cse_nam_1',
          title: 'VeroSearch Vector Gateway',
          subtitle: 'Tác giả chính · Go + Qdrant',
          period: '2024',
          link: 'github.com/hoangnam-ai/verosearch',
          bullets: ['Hơn 850 sao trên GitHub, hỗ trợ hybrid search BM25 + dense vector với độ trễ dưới 20ms.'],
          hidden: false,
        },
      ],
    },
  ],
}

export const KHANH_LINH: ResumeData = {
  name: 'Vũ Khánh Linh',
  initials: 'KL',
  photo: '/images/avatars/khanh-linh.jpg',
  role: 'Product Manager (B2B SaaS)',
  location: 'Ba Đình, Hà Nội',
  email: 'khanhlinh@example.com',
  phone: '0914 789 012',
  link: 'linkedin.com/in/khanhlinh-pm',
  summary:
    'Product Manager với 4,5 năm dẫn dắt sản phẩm SaaS B2B và tăng trưởng người dùng. Mạnh về khám phá nhu cầu khách hàng, định nghĩa chỉ số North Star và phối hợp Engineering – Design ra mắt tính năng đúng nhịp.',
  jobs: [
    {
      title: 'Product Manager',
      org: 'Công ty SaaS Kênh Sáng',
      location: 'Hà Nội',
      period: '2022 – nay',
      bullets: [
        'Sở hữu lộ trình luồng Onboarding và Tự động hoá CRM cho 3.500 doanh nghiệp SME, nâng tỷ lệ kích hoạt tuần đầu từ 34% lên 58%.',
        'Triển khai thử nghiệm A/B cho gói nâng cấp Pro, tăng doanh thu định kỳ hằng tháng (MRR) thêm 24% trong 2 quý.',
        'Thực hiện hơn 80 cuộc phỏng vấn khách hàng sâu, cắt giảm 30% backlog tính năng ít giá trị để đội ngũ tập trung vào luồng lõi.',
      ],
    },
    {
      title: 'Associate Product Manager',
      org: 'Ví điện tử An Tâm',
      location: 'Hà Nội',
      period: '2020 – 2022',
      bullets: [
        'Phối hợp 12 kỹ sư và 2 designer ra mắt tính năng thanh toán định kỳ, đạt 180.000 người dùng hoạt động sau 6 tháng.',
        'Thiết lập hệ thống dashboard Mixpanel & SQL theo dõi phễu chuyển đổi theo từng bước KYC.',
      ],
    },
  ],
  education: [
    {
      school: 'Đại học Ngoại thương Hà Nội',
      degree: 'Cử nhân Kinh tế Đối ngoại',
      gpa: '3.72/4.0',
      period: '2016 – 2020',
    },
  ],
  skills: ['Product Strategy', 'User Discovery', 'A/B Testing', 'SQL', 'Mixpanel', 'Figma', 'OKRs', 'Agile / Scrum'],
  languages: [
    { name: 'Tiếng Việt', level: 'Bản ngữ', proficiency: 5 },
    { name: 'Tiếng Anh', level: 'IELTS 7.5', proficiency: 4 },
  ],
  extra: {
    title: 'Chứng chỉ',
    items: ['Reforge Product Strategy (2024)', 'Professional Scrum Product Owner I (PSPO I, 2022)'],
  },
}

export const DUC_ANH: ResumeData = {
  name: 'Trịnh Đức Anh',
  initials: 'DA',
  photo: '/images/avatars/duc-anh.jpg',
  role: 'Chuyên viên Phân tích Tài chính (CFA Level II)',
  location: 'Hoàn Kiếm, Hà Nội',
  email: 'ducanh@example.com',
  phone: '0983 234 567',
  link: 'linkedin.com/in/ducanh-finance',
  summary:
    '5 năm kinh nghiệm phân tích tài chính doanh nghiệp, định giá và thẩm định đầu tư tại tổ chức tài chính. Thành thạo mô hình DCF, phân tích báo cáo tài chính chuẩn VAS/IFRS và chuẩn bị hồ sơ M&A.',
  jobs: [
    {
      title: 'Senior Financial Analyst',
      org: 'Quỹ Đầu tư Thịnh Vượng',
      location: 'Hà Nội',
      period: '2022 – nay',
      bullets: [
        'Xây dựng mô hình định giá DCF, LBO và Comparable cho 14 thương vụ đầu tư ngành sản xuất và bán lẻ với tổng quy mô 1.200 tỷ đồng.',
        'Thực hiện thẩm định tài chính (Financial Due Diligence) và phát hiện rủi ro vốn lưu động giúp điều chỉnh giá trị thương vụ hợp lý hơn 9%.',
        'Trình bày Investment Memo hằng tuần trước Hội đồng Đầu tư bằng tiếng Việt và tiếng Anh.',
      ],
    },
    {
      title: 'Financial Analyst',
      org: 'Công ty Chứng khoán Bắc Việt',
      location: 'Hà Nội',
      period: '2019 – 2022',
      bullets: [
        'Phụ trách báo cáo phân tích định kỳ 18 doanh nghiệp niêm yết nhóm Ngân hàng và Bán lẻ.',
        'Tự động hoá bảng tổng hợp chỉ số tài chính từ dữ liệu quý bằng Excel VBA & Python, tiết kiệm 6 giờ/tuần.',
      ],
    },
  ],
  education: [
    {
      school: 'Học viện Tài chính',
      degree: 'Cử nhân Tài chính Doanh nghiệp (Loại Giỏi)',
      gpa: '3.78/4.0',
      period: '2015 – 2019',
    },
  ],
  skills: ['Financial Modeling (DCF/LBO)', 'Định giá doanh nghiệp', 'Financial Due Diligence', 'Excel VBA', 'IFRS & VAS', 'Bloomberg', 'Power BI'],
  languages: [
    { name: 'Tiếng Việt', level: 'Bản ngữ', proficiency: 5 },
    { name: 'Tiếng Anh', level: 'Thành thạo tài chính (TOEIC 920)', proficiency: 4 },
  ],
  extra: {
    title: 'Chứng chỉ chuyên môn',
    items: ['Vượt qua CFA Level II (2024)', 'Chứng chỉ Hành nghề Phân tích Tài chính – UBCKNN (2021)'],
  },
}

export const THAO_VY: ResumeData = {
  name: 'Phạm Thảo Vy',
  initials: 'TV',
  photo: '/images/avatars/thao-vy.jpg',
  role: 'Senior UI/UX & Product Designer',
  location: 'Quận 3, TP. Hồ Chí Minh',
  email: 'thaovy@example.com',
  phone: '0909 345 678',
  link: 'dribbble.com/thaovy-ux',
  links: [{ id: 'lnk_vy_1', label: 'thaovy.design', url: 'https://thaovy.design' }],
  summary:
    'Product Designer với hơn 4 năm thiết kế ứng dụng web & di động lấy người dùng làm trung tâm. Chuyên sâu về Design System, Prototyping tương tác cao và kiểm thử khả năng sử dụng (Usability Testing).',
  jobs: [
    {
      title: 'Senior Product Designer',
      org: 'Studio Sản phẩm Sóng Xanh',
      location: 'TP. Hồ Chí Minh',
      period: '2022 – nay',
      bullets: [
        'Xây dựng và chuẩn hoá Design System trên Figma gồm hơn 140 component và design tokens, rút ngắn 40% thời gian bàn giao cho đội Frontend.',
        'Thiết kế lại luồng đặt lịch và thanh toán trên ứng dụng di động, giảm tỷ lệ rời bỏ ở bước thanh toán từ 31% xuống 16%.',
        'Tổ chức 25 phiên Usability Testing định kỳ và đào tạo 2 Junior Designer về hệ thống lưới và accessibility (WCAG AA).',
      ],
    },
    {
      title: 'UI/UX Designer',
      org: 'Công ty Công nghệ Lửa Việt',
      location: 'TP. Hồ Chí Minh',
      period: '2020 – 2022',
      bullets: [
        'Thiết kế giao diện dashboard phân tích cho nền tảng quản lý bán hàng với hơn 20.000 cửa hàng sử dụng.',
        'Phối hợp PM xây dựng wireframe, prototype và tài liệu đặc tả tương tác chi tiết.',
      ],
    },
  ],
  education: [
    {
      school: 'Đại học Kiến trúc TP. Hồ Chí Minh',
      degree: 'Cử nhân Thiết kế Đồ hoạ',
      gpa: '3.6/4.0',
      period: '2016 – 2020',
    },
  ],
  skills: ['Figma & Design Tokens', 'Design Systems', 'User Research', 'Usability Testing', 'Interactive Prototyping', 'Information Architecture', 'HTML / CSS'],
  languages: [
    { name: 'Tiếng Việt', level: 'Bản ngữ', proficiency: 5 },
    { name: 'Tiếng Anh', level: 'Giao tiếp tốt (IELTS 7.0)', proficiency: 4 },
  ],
  extra: {
    title: 'Giải thưởng & Triển lãm',
    items: ['Top 5 Vietnam UX Design Challenge (2023)', 'Chứng chỉ Google UX Design Professional (2022)'],
  },
}

export const TRUC_LY: ResumeData = {
  name: 'Lê Thị Trúc Ly',
  initials: 'TL',
  photo: '/images/avatars/minh-anh.jpg',
  role: 'Chuyên viên Kinh doanh B2B (Sales Executive)',
  location: 'Quận 1, TP. Hồ Chí Minh',
  email: 'trucly@example.com',
  phone: '0906 555 248',
  link: 'linkedin.com/in/trucly-sales',
  summary:
    'Hơn 4 năm phát triển khách hàng doanh nghiệp B2B SaaS và giải pháp chuyển đổi số tại thị trường Việt Nam. Mạnh về khai thác phễu khách hàng Enterprise, đàm phán hợp đồng giá trị cao và duy trì tỷ lệ gia hạn trên 92%.',
  jobs: [
    {
      title: 'Senior B2B Sales Executive',
      org: 'Nền tảng SaaS Doanh nghiệp Vươn Xa',
      location: 'TP. Hồ Chí Minh',
      period: '2022 – nay',
      bullets: [
        'Đạt 142% chỉ tiêu doanh thu quý liên tiếp trong 4 quý gần nhất, đóng góp hơn 6,8 tỷ đồng ARR mới từ nhóm khách hàng SME & Mid-market.',
        'Xây dựng quy trình tư vấn MEDDIC và demo giải pháp cá nhân hoá trên HubSpot CRM, nâng tỷ lệ chuyển đổi từ Demo sang Ký hợp đồng lên 34%.',
        'Phối hợp đội Customer Success triển khai onboarding cho 45 tài khoản doanh nghiệp với tỷ lệ gia hạn năm 2 đạt 94%.',
      ],
    },
    {
      title: 'Account Executive',
      org: 'Giải pháp Thanh toán Số Việt Tín',
      location: 'TP. Hồ Chí Minh',
      period: '2020 – 2022',
      bullets: [
        'Ký mới hơn 65 hợp đồng đối tác bán lẻ và chuỗi F&B khu vực phía Nam, vượt 118% KPI doanh số năm.',
        'Quản lý pipeline trên Salesforce với độ chính xác dự báo doanh thu theo tháng đạt trên 90%.',
      ],
    },
  ],
  education: [
    {
      school: 'Đại học Kinh tế TP. Hồ Chí Minh (UEH)',
      degree: 'Cử nhân Quản trị Kinh doanh',
      gpa: '3.58/4.0',
      period: '2016 – 2020',
    },
  ],
  skills: ['B2B SaaS Sales', 'Đàm phán hợp đồng Enterprise', 'HubSpot & Salesforce CRM', 'Cold Outreach & ABM', 'Phương pháp MEDDIC', 'Quản lý Pipeline'],
  languages: [
    { name: 'Tiếng Việt', level: 'Bản ngữ', proficiency: 5 },
    { name: 'Tiếng Anh', level: 'Thương mại lưu loát (IELTS 7.0)', proficiency: 4 },
  ],
  extra: {
    title: 'Thành tích & Chứng nhận',
    items: [
      'Top Performer of the Year – Doanh số B2B xuất sắc nhất 2024',
      'Chứng chỉ HubSpot Sales Software & Inbound Sales (2023)',
    ],
  },
}

export type RoleStarterKit = {
  id: string
  roleTitle: string
  industry: string
  badge: string
  recommendedLayout:
    | 'ke-ngang'
    | 'cot-xanh'
    | 'bia-kraft'
    | 'thu-gon'
    | 'anh-tron'
    | 'moc-thoi-gian'
    | 'toi-gian'
    | 'con-dau'
    | 'harvard'
    | 'cong-nghe'
    | 'hien-dai'
    | 'sang-tao'
  accentColor: string
  description: string
  data: ResumeData
}

export const ROLE_STARTER_KITS: RoleStarterKit[] = [
  {
    id: 'backend-ai',
    roleTitle: 'Backend & AI Engineer',
    industry: 'Công nghệ thông tin',
    badge: 'Tech & AI',
    recommendedLayout: 'cong-nghe',
    accentColor: '#0c6a58',
    description: 'Sẵn cấu trúc RAG, kiến trúc hệ thống chịu tải cao, chỉ số độ trễ p95 và dự án mã nguồn mở.',
    data: HOANG_NAM,
  },
  {
    id: 'frontend-fullstack',
    roleTitle: 'Frontend / Fullstack Developer',
    industry: 'Phát triển phần mềm',
    badge: 'Engineering',
    recommendedLayout: 'cot-xanh',
    accentColor: '#1e3a8a',
    description: 'Làm nổi bật React, TypeScript, tối ưu tốc độ tải trang và thư viện UI dùng chung.',
    data: QUOC_HUY,
  },
  {
    id: 'product-manager',
    roleTitle: 'Product Manager (SaaS / Tech)',
    industry: 'Quản trị sản phẩm',
    badge: 'Product',
    recommendedLayout: 'hien-dai',
    accentColor: '#0c6a58',
    description: 'Tập trung vào tỷ lệ kích hoạt, A/B testing, tăng trưởng MRR và khám phá nhu cầu người dùng.',
    data: KHANH_LINH,
  },
  {
    id: 'finance-cfa',
    roleTitle: 'Tài chính / Phân tích Đầu tư',
    industry: 'Tài chính & Ngân hàng',
    badge: 'Harvard ATS',
    recommendedLayout: 'harvard',
    accentColor: '#0f172a',
    description: 'Chuẩn Harvard 1 cột cổ điển, nhấn mạnh mô hình DCF/LBO, thẩm định thương vụ và chứng chỉ CFA.',
    data: DUC_ANH,
  },
  {
    id: 'ui-ux-designer',
    roleTitle: 'UI/UX & Product Designer',
    industry: 'Thiết kế sản phẩm',
    badge: 'Design',
    recommendedLayout: 'sang-tao',
    accentColor: '#e11d48',
    description: 'Bố cục 2 cột trang nhã tôn vinh Design System, Usability Testing và liên kết Portfolio.',
    data: THAO_VY,
  },
  {
    id: 'performance-marketing',
    roleTitle: 'Performance & Content Marketing',
    industry: 'Marketing & Tăng trưởng',
    badge: 'Growth',
    recommendedLayout: 'bia-kraft',
    accentColor: '#b45309',
    description: 'Nhấn mạnh ROAS, tăng trưởng đơn hàng từ quảng cáo trả phí và lưu lượng tự nhiên.',
    data: MINH_ANH,
  },
  {
    id: 'accounting-general',
    roleTitle: 'Kế toán tổng hợp / Kiểm toán',
    industry: 'Kế toán – Thuế',
    badge: 'Kinh tế',
    recommendedLayout: 'ke-ngang',
    accentColor: '#1e3a8a',
    description: 'Trình bày mạch lạc kinh nghiệm khoá sổ cuối tháng, đối chiếu công nợ và quyết toán thuế.',
    data: THU_HA,
  },
  {
    id: 'b2b-sales',
    roleTitle: 'Kinh doanh / B2B Sales Executive',
    industry: 'Kinh doanh & Phát triển B2B',
    badge: 'Sales KPI',
    recommendedLayout: 'anh-tron',
    accentColor: '#0c6a58',
    description: 'Làm nổi bật chỉ tiêu doanh thu quý (142% KPI), doanh số ARR mới, CRM HubSpot/Salesforce và tỷ lệ gia hạn.',
    data: TRUC_LY,
  },
  {
    id: 'fresher-intern',
    roleTitle: 'Sinh viên / Thực tập sinh',
    industry: 'Khởi đầu sự nghiệp',
    badge: 'Fresher',
    recommendedLayout: 'con-dau',
    accentColor: '#4338ca',
    description: 'Chuyển hoá hoạt động câu lạc bộ, dự án học tập và làm thêm thành điểm cộng cho nhà tuyển dụng.',
    data: GIA_BAO,
  },
]
