# Hồ Sơ Xanh

Công cụ làm **CV khổ A4/Letter**, **Thư xin việc** và **Bảng Kanban theo dõi ứng tuyển** ưu tiên trải nghiệm tiếng Việt (hỗ trợ song ngữ Việt – Anh), chạy hoàn toàn trực tiếp trên trình duyệt (**local-first**, không gửi dữ liệu cá nhân đi đâu, xuất PDF sắc nét không logo/dấu mờ).

---

## Tính năng nổi bật

- **8 mẫu CV chuẩn in ấn & ATS**: *Kẻ ngang*, *Cột xanh*, *Bìa kraft*, *Thu gọn*, *Ảnh tròn*, *Mốc thời gian*, *Tối giản*, *Con dấu*.
  - Chuyển đổi mẫu bất kỳ lúc nào, bảo toàn 100% nội dung (kể cả ngoại ngữ, giới thiệu, mục phụ, nhiều liên kết hồ sơ, ảnh chân dung và các mục tự thêm).
  - Giao diện biên tập 2 chế độ chuẩn FlowCV (**Nội dung hồ sơ** dạng thẻ Accordion kéo-thả & **Tuỳ chỉnh thiết kế**):
    - Bật/tắt **ẩn tạm bằng biểu tượng Mắt** cho từng công việc, học vấn, ngoại ngữ, ảnh chân dung hoặc cả một mục lớn mà không mất dữ liệu.
    - Nút **+ Thêm mục nội dung** hỗ trợ 8 loại khối (*Dự án tiêu biểu*, *Chứng chỉ*, *Giải thưởng & Thành tích*, *Hoạt động & Tổ chức*, *Công trình & Xuất bản*, *Người tham chiếu*, *Sở thích*, *Mục tự đặt tên*).
    - **Click-to-Jump hai chiều**: bấm trực tiếp vào bất kỳ mục nào trên bản xem trước A4/Letter để mở và cuộn ngay tới thẻ chỉnh sửa tương ứng.
    - **Customize Studio**: chọn màu nhấn hoặc bảng màu tuỳ chỉnh (`<input type="color">`), phông chữ (*Be Vietnam Pro* / *Source Serif 4*), cỡ chữ, giãn dòng, **căn lề trang**, **khoảng cách giữa các mục**, **kiểu tiêu đề mục** (*Theo mẫu*, *Gạch chân*, *Nền màu nhạt*, *Vạch trái*, *Tối giản*, *IN HOA*), **kiểu hiển thị kỹ năng** (*Thẻ bo tròn*, *Dấu phẩy*, *Danh sách chấm*, *Lưới 2 cột*), **biểu tượng liên hệ**, **khung ảnh** (*Tròn*, *Bo góc*, *Vuông*), kéo-thả sắp xếp thứ tự mục, đổi tên từng mục và chuyển nhãn **Tiếng Việt / English**.
  - Hỗ trợ **ảnh chân dung cắt vuông tự động** ngay trên trình duyệt.
  - Liên kết email (`mailto:`), điện thoại (`tel:`), LinkedIn/GitHub/Portfolio và liên kết bổ sung bấm mở được trực tiếp trong file PDF xuất ra.
- **Trình soạn thảo chuyên nghiệp**:
  - **Undo / Redo** đa bước (dùng Immer Patches, tự gộp thao tác gõ liên tục).
  - **Command Palette (`⌘K` / `Ctrl+K`)** và bảng phím tắt (`?`).
  - Tự động lưu vào **IndexedDB** (có fallback `localStorage`, bản sao khẩn cấp khi đóng tab `pagehide`, và đồng bộ đa tab qua `BroadcastChannel`).
- **Nhập CV cũ ngay trên máy**:
  - Đọc trực tiếp file **PDF** (nhận diện cả bố cục 1 cột, 2 cột sidebar, dải đầu trang + 2 cột và cột nhãn trái), **Word (`.docx`)** (giải nén chuẩn ZIP + `word/document.xml` không cần server), `.txt`, `.md` hoặc dán văn bản.
  - Không tự bịa thông tin; báo độ tin cậy từng mục để kiểm tra trước khi tạo.
- **Kiểm tra CV, Đối chiếu JD & Gợi ý biên tập**:
  - **Soát lỗi CV**: kiểm tra thông tin liên hệ, chỗ trống `[x]` chưa điền, thiếu số liệu đo lường, mở đầu câu bị động, khoảng trắng thừa trước dấu câu, kỹ năng trùng lặp.
  - **Đối chiếu JD (ATS Matcher)**: dán tin tuyển dụng để xem tỷ lệ khớp từ khoá chuyên môn và thêm nhanh kỹ năng còn thiếu.
  - **Văn bản chuẩn ATS**: xem trước và sao chép thứ tự văn bản thuần mà phần mềm lọc hồ sơ đọc được.
  - **Gợi ý cách viết**: 3 chế độ (*Rõ kết quả*, *Rút gọn*, *Chi tiết hơn*) cho hơn 12 nhóm ngành nghề.
- **Thư xin việc & Kanban Theo dõi ứng tuyển**:
  - 6 mẫu thư xin việc đồng bộ thông tin người gửi từ CV, có Undo/Redo, thu phóng, đếm trang và xuất PDF đa trang.
  - Bảng Kanban 5 cột (*Quan tâm*, *Đã nộp*, *Phỏng vấn*, *Có offer*, *Không phù hợp*) hỗ trợ kéo-thả chuột, cảm ứng & bàn phím (`@dnd-kit`), tìm kiếm/lọc nhanh, checklist việc cần làm.
  - **Sao lưu & Khôi phục toàn bộ không gian làm việc** (`.json`) giữ nguyên liên kết giữa CV, thư xin việc và thẻ ứng tuyển khi đổi máy.

---

## Nguyên tắc Thiết kế (Design System)

Ẩn dụ xuyên suốt là **bìa hồ sơ xin việc giấy kraft và bút bi xanh**:

- Bảng màu token duy nhất trong `src/app/globals.css`: `ink`, `ink-2`, `ink-3`, `pen`, `pen-dark`, `pen-wash`, `seal`, `kraft`, `kraft-deep`, `desk`, `paper`, `rule`.
- **Thẻ phẳng, viền `1px rule`, không đổ bóng (`shadow-*`)**.
- Trợ năng đầy đủ: hộp thoại `<dialog>` chuẩn trình duyệt, liên kết bỏ qua điều hướng (`Skip to content`), phím mũi tên cho tab, thông báo tiếng Việt cho trình đọc màn hình khi kéo-thả, cỡ chữ ô nhập tối thiểu `16px` tránh tự phóng to trên iOS.

---

## Cài đặt & Phát triển

Yêu cầu **Node.js >= 20** và **pnpm**:

```bash
# Cài đặt phụ thuộc
pnpm install

# Chạy máy chủ phát triển (http://localhost:3000)
pnpm dev

# Kiểm tra kiểu TypeScript (tự sinh route types của Next.js 16)
pnpm typecheck

# Chạy bộ kiểm thử đơn vị & tích hợp (Vitest)
pnpm test

# Dựng bản production
pnpm build
pnpm start
```
