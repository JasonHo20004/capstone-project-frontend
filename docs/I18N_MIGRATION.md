# i18n Migration — Handoff & Status

> **Mục đích:** File này là điểm handoff để tiếp tục công việc migrate i18n (vi/en) trên bất kỳ máy nào.
> Khi mở Claude Code trong repo này, nói **"tiếp tục migrate i18n"** và trỏ tới file này.
> Framework đã setup xong — việc còn lại chủ yếu là **cơ học**: thay literal trong từng `.tsx` bằng `t('key')` và thêm key vào JSON.

## Mục tiêu & phạm vi

- Website cần switch ngôn ngữ **Việt / Anh** để fix tình trạng UI lẫn lộn vi+en.
- Chỉ migrate **UI strings**, KHÔNG thay đổi dữ liệu DB.
- Default lang: auto-detect từ browser (`vi-*` → vi, else → en).
- **QUYẾT ĐỊNH SCOPE:** GIỮ NGUYÊN admin pages bằng tiếng Việt — KHÔNG i18n hóa `components/admin/` + `pages/admin/`. Chỉ migrate **seller** (và user/shared đã xong).

## Framework (đã xong — ĐỪNG setup lại)

- Cấu hình: `src/i18n/index.ts`. Packages: `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- `main.tsx` đã `import "./i18n"`.
- Component switch: `src/components/LanguageSwitcher.tsx` (đặt ở UserAppLayout header, Navbar desktop+mobile, góc phải Login/Register).
- **10 namespaces**: `common`, `auth`, `landing`, `layout`, `dashboard`, `courses`, `account`, `exam`, `info`, `seller` — mỗi cái 2 lang trong `src/i18n/locales/{en,vi}/<ns>.json`.

## Pattern migrate (theo đúng cách này)

```tsx
import { useTranslation } from 'react-i18next';
// hoặc khi có inline <strong>/<a>: import { useTranslation, Trans } from 'react-i18next';

const { t, i18n } = useTranslation('seller');           // namespace của surface đang làm
const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';  // khi có toLocaleString/Date

// Thay literal:  "Tạo khoá học"  →  {t('courses.create')}
// Có biến:       `${n} câu hỏi`   →  {t('questionCount', { count: n })}
// Inline markup: <Trans i18nKey="metadataTab.priceWarning" ns="seller" components={{ strong: <strong /> }} />
```

**Quy ước đã thống nhất:**
- Thêm key vào **CẢ** `en/seller.json` lẫn `vi/seller.json`, giữ cấu trúc nested giống nhau.
- Hàm/helper ở **module-level** (ngoài component) không gọi được hook → truyền `t: TFunction` vào param, hoặc nếu là function-component thì tự gọi `useTranslation` bên trong.
- Const list (vd `STATUS_OPTIONS`, `STEPS`) đổi field `label` → `labelKey`, resolve qua `t(\`prefix.${labelKey}\`)`.
- Date/number locale luôn auto-switch `vi-VN`|`en-GB`.
- **Giữ tiếng Anh ở cả 2 lang** cho: tên skill IELTS (Reading/Listening/Writing/Speaking), CEFR descriptors, IELTS criteria, category/brand terms gửi lên BE.
- CSV headers tiếng Việt không dấu (giữ no-diacritic ở vi, English ở en).

## Verify sau mỗi batch

```bash
cd capstone-project-frontend
node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/vi/seller.json','utf8'));JSON.parse(require('fs').readFileSync('src/i18n/locales/en/seller.json','utf8'));console.log('JSON OK')"
npx tsc --noEmit
```

Và grep dấu tiếng Việt trong các file vừa sửa để chắc không sót literal (loại trừ file JSON `vi/`).

## Trạng thái hiện tại (2026-05-30)

**✅ ĐÃ XONG:** toàn bộ user/shared (auth, landing, layout, home, courses, account, exam-center, placement-test, learning-path, info) — xem chi tiết trong memory ECC nếu cần.

**✅ Seller đã migrate:**
- `components/seller/`: SellerSidebar, SellerHeader, SellerLayout, UploadProgress, CourseReviewWorkflow, CourseMetadataTab, CourseFinalTestTab (wrapper).
- `pages/seller/dashboard/SellerDashboard`, `courses/SellerCourses`, `courses/SellerCreateCourse`, `courses/CreateLessonPage`, `courses/SellerCourseDetail`, `tests/SellerTests`, `tests/SellerTestDetail`, `tests/CreateTestPage`, `finance/SellerEarnings`, `finance/SellerMonthlyFees`, `learners/SellerLearners`, `account/SellerProfile`.
- Namespaces seller đã có: `sidebar, header, upload, dashboard, courses, tests, testDetail, createTest, earningsPage, monthlyFees, learners, profile, createLesson, createCourse, courseDetail, reviewWorkflow, metadataTab`.

**⏳ SELLER CÒN LẠI (việc tiếp theo):**
- `pages/seller/courses/LessonDetailPage.tsx` (~938 LoC) — file lớn nhất còn lại.
- `pages/seller/interactions/SellerComments.tsx` (~726 LoC).
- `components/seller/CourseModulesTab.tsx` (~637 LoC).
- `components/seller/`: `CreateCourseDialog`, `CreateLessonDialog`, `FinalTestTab`, `AddQuizLessonDialog`, `account/EditSellerProfileDialog`, `finance/WithdrawalHistoryTab`, `finance/WithdrawalModal`, `tests/ImportFromFileModal`.
- `components/seller/EmptyState.tsx` — generic (text từ caller), KHÔNG cần migrate.

**Gợi ý batch tiếp theo:** nhóm theo feature, ưu tiên file vừa-phải để 1 turn gọn (vd `FinalTestTab` + `CourseModulesTab` cùng nhóm course-tabs; hoặc `WithdrawalModal` + `WithdrawalHistoryTab` cùng nhóm finance). Migrate **theo nhóm nhỏ** để gom edit, tránh fan-out.

## Lưu ý quan trọng

- TS config frontend **lenient** (`noImplicitAny: false`, `strictNullChecks: false`) — ĐỪNG tự ý tighten.
- Khi gặp biến tên `t` trùng hàm dịch (vd `.map((t) => ...)` hoặc `const t = setTimeout(...)`), đổi tên biến đó để không shadow `t` của i18n. (Đã từng dính ở SellerTests, SellerLearners.)
- exam-center còn 2 file `WritingResult.tsx` + `SpeakingResult.tsx` là static demo mockup — skip cho tới khi wire với BE.
