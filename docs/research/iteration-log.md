# Nhật ký lặp

Bản ghi trung thực: mỗi mục ghi điều đã làm và cách đã kiểm chứng. Phần "Còn thiếu" ở cuối liệt kê những gì CHƯA đạt.

## Vòng 2 (model trước): dựng khung
Thêm trình soạn CV, thư xin việc, kanban, parser, kho lưu trữ, zustand + immer undo/redo, dnd-kit, test Vitest.
Bản ghi cũ ở đây nói "hoàn tất 100%", nhưng khi kiểm tra bằng trình duyệt thật thì nhiều phần chưa đạt (xem vòng 3).

## Vòng 3: review và sửa toàn bộ

### Lỗi nghiêm trọng đã sửa
| Lỗi | Tác động | Cách sửa |
|---|---|---|
| PDF xuất sai: chữ ép `11pt` làm phình ~35%, lề 10mm, nội dung bị bóp vào cột hẹp | Tính năng cốt lõi hỏng | Viết lại CSS in: `@page margin 0`, rộng đúng 210mm/215.9mm để 1em giống hệt trên màn hình, `box-decoration-break: clone`, nền cột xanh lặp lại trên mọi trang |
| Preview cắt cụt ở trang 1 (`overflow:hidden`) dù ghi "đa trang" | Người dùng không thấy phần còn lại | Chế độ `flow`: tờ giấy giãn theo nội dung, vạch ngắt trang, đếm số trang |
| Hai tầng lưu trữ ghi chung một khoá | Xoá ở danh sách nhưng IndexedDB còn → CV "hồi sinh" | Một repository duy nhất (`cv-repository.ts`), migrate dữ liệu cũ một lần rồi xoá khoá cũ |
| `getCvList` đệ quy khi kho trống | Sinh CV mẫu trùng | Bỏ seed hoàn toàn |
| Xoá hết CV thì CV mẫu lại hiện | Dữ liệu giả lẫn vào | Danh sách trống có màn hình hướng dẫn |
| Sửa trong lúc đang lưu vẫn hiện "Đã lưu" | Mất chỉnh sửa mà không biết | `saved` chỉ hiện khi bản vừa lưu là bản hiện tại; có trạng thái lỗi + thử lại |
| Đóng tab trong 0,6 giây đầu mất chỉnh sửa | Mất dữ liệu | Ghi đồng bộ bản khẩn cấp khi `pagehide`, khôi phục lần mở sau |
| Undo làm lùi `updatedAt` | Bản cũ có thể thắng khi tải lại | Undo/redo luôn đẩy `updatedAt` tiến |
| Parser nhập CV bịa dữ liệu ("Tiếng Anh: Giao tiếp", "Tên công ty", chứng chỉ 2024...) | Người dùng có thể gửi CV chứa thông tin sai | Viết lại parser: không đoán, để trống, báo độ tin cậy từng trường |
| Parser bắt đuôi email làm link; cắt từ có gạch nối ("Full-stack") | Dữ liệu sai | Sửa regex, tách theo " - " có khoảng trắng |
| Nhập `.pdf`/`.docx` đọc như văn bản thô | Ra rác | Từ chối và hướng dẫn sao chép-dán |
| Không thể kéo thẻ vào cột trống ở kanban; thứ tự thẻ không lưu | Tính năng chính hỏng | Cột là vùng thả, `moveApplication` ghi lại thứ tự, test đơn vị |
| Palette "Ngoại ngữ/Mục phụ" mở form trống | Lệnh vô dụng | Chuyển về tab Kỹ năng |
| Ctrl+Z/Y/P ghi trong bảng phím tắt nhưng không chạy | Phím tắt giả | Nối thật; Ctrl+P đi qua `beforeprint` nên cho cùng kết quả với nút |
| Header web che thanh công cụ editor khi cuộn; footer thừa | Giao diện lỗi | Editor toàn màn hình, không header/footer |
| `key={org}` trùng khi 2 việc cùng công ty hoặc để trống | Lỗi React, mất focus | Dùng id |
| Nút "Đăng nhập" và "Nâng lên Pro" không làm gì | Nút giả | "CV của tôi" và "Gói Pro sắp ra mắt" (vô hiệu) |
| Thư xin việc mới mang tên/công ty của người mẫu | Có thể gửi nhầm | Dùng thông tin CV chọn, hoặc `[Họ và tên]`; kiểm tra CV báo chỗ chưa điền |

### Trợ năng và giao diện
Modal dùng `<dialog>` (focus trap, Esc, trả focus); nhãn gắn đúng với ô nhập; ô nhập 16px; tab điều hướng dạng gạch chân có phím mũi tên; kéo-thả có thông báo tiếng Việt; không còn `alert()`.
axe-core: 0 vi phạm trên 10 lượt (desktop và 390px).

### Kiểm chứng
- `pnpm test`: 72 test (schema, parser, auditor, store undo/redo, kanban, kho IndexedDB và fallback, hiển thị tờ CV).
- E2E bằng Chrome thật: tạo, gõ, tự lưu, tải lại, undo/redo, palette, kiểm tra CV, CV dài nhiều trang, xoá, thư, kanban kéo bằng chuột.
- PDF: A4 và Letter đúng khổ, chữ chọn được, nhúng phông, dấu tiếng Việt đủ; cả 8 mẫu in nhiều trang không cắt giữa mục.

## Còn thiếu ở cuối Vòng 3 (đã được giải quyết ở Vòng 4 bên dưới)
- AI chỉ là gợi ý mẫu theo khuôn, chưa phải mô hình thật (giao diện đã ghi rõ).
- PDF dựa vào in của trình duyệt: vị trí ngắt trang có thể khác nhau chút giữa trình duyệt; chỉ kiểm tra với Chrome. Chưa thử Safari/Firefox.
- Nhập PDF đọc ngay trên trình duyệt (không tải lên), chỉ với PDF có chữ. Thử trên 8 PDF do chính app xuất: 4 mẫu (cột xanh, kẻ ngang, mốc thời gian, tối giản) tách đúng tên, email, kinh nghiệm, học vấn, kỹ năng; 4 mẫu còn lại (ảnh tròn, con dấu, bìa kraft, thu gọn) đọc đúng tên/email nhưng tách mục còn thiếu do bố cục cột nhãn/đầu trang. PDF scan (ảnh) và Word chưa đọc được; người dùng nên dán văn bản.
- Dữ liệu chỉ nằm trên trình duyệt đã tạo ra nó; có file sao lưu JSON nhưng chưa đồng bộ giữa máy.
- Kéo-thả bằng bàn phím chưa có test tự động (chỉ thử chuột).
- Thư xin việc nhiều trang chưa có test in riêng.
- Các trang marketing (`/viet-cv-voi-ai`, giá, so sánh) là nội dung minh hoạ.

## Vòng 4: hoàn thiện toàn diện sản phẩm & đóng toàn bộ khoảng trống

### Lỗi và khoảng trống đã xử lý triệt để
| Hạng mục | Vấn đề ở Vòng 3 | Giải pháp đã thực hiện ở Vòng 4 |
|---|---|---|
| Bảo toàn dữ liệu 8 mẫu CV | `moc-thoi-gian` mất Giới thiệu & Ngoại ngữ; `anh-tron` và `toi-gian` mất Ngoại ngữ; `ke-ngang` mất phông `serif` mặc định | Cả 8 mẫu hiển thị đầy đủ 6 mục nội dung; `ke-ngang` mặc định `serif`; thẻ kỹ năng `thu-gon` tự đổi sắc độ theo `--cv-accent`; liên kết `mailto:`, `tel:`, `https://` bấm được trong PDF |
| Sắp xếp mục & CV Tiếng Anh | `sectionOrder` có trong schema nhưng chưa nối giao diện; tiêu đề mục gắn cứng tiếng Việt | Thêm kéo-thả sắp xếp thứ tự mục, đổi tên từng mục và chuyển đổi nhãn mục **Tiếng Việt / English** trực tiếp trong tab Định dạng & Command Palette |
| Ảnh chân dung trên CV | 3 mẫu gắn nhãn `Có ảnh` nhưng không có chỗ tải ảnh | Thêm `avatar-image.ts` cắt vuông & nén WebP/JPEG ngay trên máy, hiển thị trên `cot-xanh`, `anh-tron`, `con-dau` |
| Nhập PDF 8/8 bố cục & Word `.docx` | 4 mẫu có dải đầu trang / cột nhãn trái tách thiếu mục; chưa đọc được `.docx`; `PdfImportError` bị nuốt lỗi | Nâng cấp `pdf-text.ts` nhận diện dải header toàn trang + 2 cột dưới và cột nhãn trái (`anh-tron`); viết `docx-text.ts` giải nén ZIP + `word/document.xml` thuần Web API; báo lỗi rõ cho PDF scan, PDF khoá mật khẩu và `.doc` nhị phân cũ |
| Kiểm toán CV, Đối chiếu JD & Gợi ý 3 chế độ | Chưa có công cụ Đối chiếu JD dù trang `/viet-cv-voi-ai` liệt kê; gợi ý viết mới có 1 chế độ | Thêm `jd-matcher.ts` (đối chiếu từ khoá JD song ngữ, thêm kỹ năng 1 chạm, xem/sao chép văn bản thô chuẩn ATS); nâng cấp `cv-auditor.ts` (bắt mở đầu câu bị động, khoảng trắng thừa trước dấu câu, kỹ năng trùng); nâng cấp `ai-suggestions.ts` với 3 chế độ (*Rõ kết quả*, *Rút gọn*, *Chi tiết hơn*) trên 12+ nhóm ngành |
| Trình soạn Thư xin việc | Cứng câu chào `"Kính gửi quý công ty,"`; thiếu Undo/Redo, thu phóng, đếm trang và dải nền in đa trang cho `le-trai` | Bổ sung ô `salutation`, Undo/Redo (`Ctrl+Z`/`Y`), thu phóng, đếm số trang, gợi ý đoạn văn theo vị trí và `letterPrintBackdrop` cho `le-trai` đa trang |
| Kanban & Sao lưu liên máy | Kanban thiếu tìm kiếm/lọc; chưa có gói sao lưu chung cả CV + Thư + Kanban | Thêm tìm kiếm & bộ lọc nhanh, link mở tin tuyển dụng an toàn, pháo giấy tinh tế khi đạt `Có offer` (tôn trọng `prefers-reduced-motion`), và `workspace-backup.ts` xuất/khôi phục trọn bộ dữ liệu (`.json`) giữ nguyên liên kết ID |
| SEO, A11y & Hạ tầng Next.js 16 | `pnpm typecheck` lỗi khi chưa chạy `next typegen`; thiếu `sitemap.xml`, `robots.txt`, `opengraph-image`, `global-error`, `Skip link` | Bổ sung đầy đủ metadata routes, `Skip to content`, chuẩn hoá `vitest.config.mts`, `typecheck` và bộ kiểm thử (kể cả `axe-core` và kiểm tra tự động Design System 0 `shadow-*` / 0 màu thô) |

## Vòng 5: Nâng cấp trình soạn thảo & tuỳ chỉnh theo chuẩn FlowCV (`app.flowcv.com`)

### Trải nghiệm & kiến trúc đã hoàn thiện
| Hạng mục | Chi tiết triển khai |
|---|---|
| Kiến trúc 2 chế độ **Nội dung hồ sơ** & **Tuỳ chỉnh thiết kế** | Chuyển cột soạn thảo sang danh sách thẻ **Accordion kéo-thả** theo đúng thứ tự mục trên CV (`cv-editor.tsx`), kèm thanh nút ẩn/hiện nhanh và khu vực `Tuỳ chỉnh thiết kế` (`design-settings-form.tsx`) tách biệt rõ ràng. |
| Nút **Mắt ẩn/hiện (`Eye` / `EyeSlash`)** không mất dữ liệu | Bật/tắt hiển thị trên bản in cho từng mục lớn (`hiddenSections`) lẫn từng công việc, học vấn, ngoại ngữ, mục tự thêm và ảnh chân dung; bộ kiểm toán (`cv-auditor.ts`) tự động bỏ qua các mục đang ẩn. |
| Hộp thoại **`+ Thêm mục nội dung`** (`add-content-modal.tsx`) | Hỗ trợ 8 loại mục có cấu trúc riêng: *Dự án tiêu biểu*, *Chứng chỉ*, *Giải thưởng & Thành tích*, *Hoạt động & Tổ chức*, *Công trình & Xuất bản*, *Người tham chiếu*, *Sở thích*, *Mục tự đặt tên*; hiển thị đồng bộ trên cả 8 mẫu CV (kể cả đường kẻ mốc thời gian của `moc-thoi-gian`). |
| **Customize Studio** & **Click-to-Jump hai chiều** | Bổ sung căn lề trang, khoảng cách mục, 5 kiểu tiêu đề mục + `IN HOA`, 5 kiểu hiển thị kỹ năng, biểu tượng liên hệ SVG, khung ảnh Tròn/Bo góc/Vuông, bộ chọn màu tuỳ ý; bấm trực tiếp vào bất kỳ mục nào trên tờ CV A4 để nhảy và làm nổi bật mục đó ở cột soạn thảo. |
| **Tương thích sâu hơn cho Parser, Auditor & Thư xin việc** | `cv-parser.ts` tách được cả liên kết chính và tối đa 4 liên kết hồ sơ bổ sung; `editor-toolbar.tsx` hiển thị trực tiếp số lượng điểm cần xem lại trên nút `Kiểm tra`; trình soạn Thư xin việc đồng bộ phông chữ và màu nhấn tuỳ chỉnh từ CV. |
| **Vòng đời `<dialog>` an toàn với React 19 `StrictMode`** | Sửa dứt điểm lỗi `dialog.close()` trong hàm dọn dẹp `StrictMode` bắn sự kiện `close` làm tự đóng hộp thoại ở chế độ `next dev` (`src/components/ui/modal.tsx`), bổ sung kiểm thử hồi quy `modal.test.tsx` (tổng cộng **16/16 file test, 118/118 bài test pass**, `axe-core` 0 vi phạm, E2E trình duyệt 0 lỗi console). |
