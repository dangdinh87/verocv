# Báo Cáo Kiểm Toán & Nghiên Cứu Vòng 2 (Hồ Sơ Xanh)

*Thời gian thực hiện:* 2026-10-04  
*Trạng thái mục tiêu:* Nâng cấp từ "chạy được" lên chất lượng cấp cao (đối chiếu FlowCV, Resume.io, Reactive Resume).

---

## 1. Kết Quả Audit Trung Thực (Góc Nhìn Người Dùng Khó Tính)

### 1.1 Những Khoảng Trống & Lỗi Được Xác Minh Trực Tiếp
1. **Vi phạm Design System:**
   - Xuất hiện các class đổ bóng: `shadow-xs`, `shadow-md`, `shadow-xl`, `shadow-2xs`. Nguyên tắc của Hồ Sơ Xanh: **thẻ phẳng, viền 1px rule, không đổ bóng**.
   - Xuất hiện màu Tailwind thô ngoài token: `text-emerald-600`, `bg-amber-50`, `text-amber-900`, `border-amber-300`. Token chuẩn chỉ gồm `pen`, `ink`, `ink-2`, `ink-3`, `paper`, `desk`, `seal`, `kraft`, `rule`.
2. **Kiến trúc Trình Soạn CV (`cv-editor.tsx` > 1.100 dòng):**
   - Nguyên khối (monolithic), khó mở rộng và không có tính năng **Undo / Redo**.
   - Người dùng gõ nhầm hoặc xóa nhầm mục con là mất vĩnh viễn, không phục hồi được.
   - Chưa có phím tắt (`Ctrl+Z`, `Ctrl+Y`, `?` xem bảng phím tắt).
   - Chưa có Command Palette (`⌘K` / `Ctrl+K`) để điều hướng nhanh các mục, đổi mẫu, tải PDF.
3. **Lưu trữ & Dữ liệu:**
   - Dùng trực tiếp `localStorage.setItem` không schema Zod, không migration version, không kiểm tra quota / lỗi dữ liệu JSON hỏng.
   - Khi mở 2 tab cùng lúc không có cơ chế đồng bộ qua `BroadcastChannel`.
   - Cần lớp lưu trữ chuẩn hóa hỗ trợ **IndexedDB** với fallback an toàn.
4. **Kéo-thả (Drag & Drop):**
   - Hiện tại Kanban dùng HTML5 Drag & Drop thuần: **hoàn toàn liệt trên điện thoại cảm ứng (touch)**, không hỗ trợ bàn phím, không có animation reorder.
   - Trong soạn thảo CV: chỉ có nút bấm Lên/Xuống thô sơ, chưa thể kéo thả các section và items.
5. **Dàn trang & Xuất PDF:**
   - `window.print()` dựa vào print dialog hệ thống: phụ thuộc margin trình duyệt, có nguy cơ ngắt trang xấu (cắt ngang giữa 1 block kinh nghiệm).
   - Cần engine tính toán chiều cao thực tế chính xác từng trang (A4 / Letter), tách trang tự động khi nội dung dài, và kiểm tra layer text chuẩn tiếng Việt có dấu.
6. **Bộ Phân Tích Nhập CV (Parser):**
   - Đã có bóc tách thô, nhưng chưa hiển thị thanh điểm số độ tin cậy (Confidence Score) cho từng trường để người dùng tự tin soát lỗi.
7. **Kiểm Tra Chất Lượng CV (CV Quality Linter):**
   - Chưa có bộ phân tích câu chủ động, thiếu số liệu `[x]`, câu quá dài, lỗi dấu tiếng Việt.

---

## 2. Đối Chiếu 10 Điểm Vượt Trội Của Đối Thủ (FlowCV, Resume.io, Reactive Resume)

| Tiêu chí | FlowCV / Reactive Resume | Hồ Sơ Xanh (Trước Vòng 2) | Giải pháp Vòng 2 của Hồ Sơ Xanh |
| :--- | :--- | :--- | :--- |
| **1. Kéo-thả mục** | Kéo thả mượt mà trên cả chuột & touch | Nút bấm Lên/Xuống thô | Tích hợp `@dnd-kit` hỗ trợ cả Pointer, Touch, Keyboard |
| **2. Lịch sử soạn thảo** | Undo / Redo nhiều bước có phím tắt | Không có undo | Store Zustand + Immer Patches lưu lịch sử, debounced typing |
| **3. Command Palette** | `⌘K` tìm và thao tác tức thì | Không có | Command menu nhanh: nhảy section, đổi layout, xuất PDF |
| **4. Multi-page Pagination** | Chia trang A4 thực tế, thấy rõ ranh giới trang 1 & 2 | Chỉ 1 trang và báo cảnh báo tràn | Chia trang visual động (Page breaks sạch sẽ không cắt ngang item) |
| **5. Đổi Template Spec** | Định nghĩa qua Spec data-driven | Code template lặp lại trong JSX | Chuẩn hóa `TemplateSpec` cấu hình bố cục, phông, lề |
| **6. Quản lý lưu trữ** | Reactive Resume dùng schema version | JSON parse thô trong localStorage | Zod schema versioned + IndexedDB + BroadcastChannel sync |
| **7. CV Quality Audit** | Gợi ý động từ, chỉ ra lỗi thiếu metric | Chỉ có mock viết lại từng câu | Checklist kiểm tra chất lượng CV thời gian thực |
| **8. Tương tác mượt mà** | Micro-animation khi reorder, toast | Chuyển trạng thái cứng | `motion/react` cho layout animation tôn trọng `prefers-reduced-motion` |
| **9. Nhập CV cũ** | Báo độ tin cậy từng trường dữ liệu | Nhập thô không báo độ chính xác | Giao diện kiểm tra độ tin cậy (High/Med/Low) kèm cảnh báo |
| **10. Accessibility (a11y)** | Keyboard navigable hoàn toàn | Một số nút thiếu aria | ARIA đầy đủ, focus rõ ràng, vượt qua kiểm toán axe-core |

---

## 3. Lộ Trình Triển Khai Chi Tiết Vòng 2

1. **Hạng mục A - Nền móng kiến trúc:**
   - Zod Schema `ResumeDocument` có versioning (v1, v2).
   - Storage Repository (IndexedDB via `idb` + fallback localStorage + BroadcastChannel).
   - Zustand store có Immer patches cho Undo/Redo & gộp thao tác gõ liên tục.
   - Loại bỏ toàn bộ `shadow-*` và token màu ngoài lề trong design system.
2. **Hạng mục B - Template Spec & Multi-page Engine:**
   - Chuẩn hóa cấu trúc 8 mẫu qua Spec.
   - Engine dàn trang đo chiều cao thật, phân trang nhiều trang A4/Letter không cắt đôi item.
3. **Hạng mục C - Xuất PDF chuẩn:**
   - Tối ưu CSS Print `@page`, xuất JSON backup, xuất PNG xem trước.
4. **Hạng mục D - Trình soạn thảo chuyên nghiệp:**
   - Tách nhỏ module `cv-editor` (< 350 dòng/file).
   - Sắp xếp mục với `@dnd-kit`.
   - Command Palette (`⌘K`) và Bảng phím tắt (`?`).
5. **Hạng mục E - Kiểm tra chất lượng CV & Parser xịn:**
   - CV Inspector checklist (độ dài, động từ hành động, metric số liệu, dấu câu).
   - Parser giao diện hiển thị Confidence badge.
6. **Hạng mục F - Kanban & Cover Letter:**
   - Kanban tích hợp `@dnd-kit` touch + keyboard.
7. **Hạng mục G - Animation có mục đích & Kiểm thử:**
   - Animation mượt với `motion/react`.
   - Viết test Vitest cho pure logic.
