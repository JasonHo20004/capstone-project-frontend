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
- `components/seller/`: SellerSidebar, SellerHeader, SellerLayout, UploadProgress, CourseReviewWorkflow, CourseMetadataTab, CourseFinalTestTab (wrapper), **AddQuizLessonDialog**, **CreateCourseDialog**, **CreateLessonDialog**, **account/EditSellerProfileDialog**, **finance/WithdrawalHistoryTab**, **finance/WithdrawalModal**.
- `pages/seller/dashboard/SellerDashboard`, `courses/SellerCourses`, `courses/SellerCreateCourse`, `courses/CreateLessonPage`, `courses/SellerCourseDetail`, `tests/SellerTests`, `tests/SellerTestDetail`, `tests/CreateTestPage`, `finance/SellerEarnings`, `finance/SellerMonthlyFees`, `learners/SellerLearners`, `account/SellerProfile`.
- Namespaces seller đã có: `sidebar, header, upload, dashboard, courses, tests, testDetail, createTest, earningsPage, monthlyFees, learners, profile, createLesson, createCourse, courseDetail, reviewWorkflow, metadataTab, withdrawalModal, withdrawalHistory, addQuizLesson, editProfile, createLessonDialog, createCourseDialog`.

**✅ Đợt 2026-05-30 vừa migrate:**
- `components/seller/tests/ImportFromFileModal.tsx` — namespace `importFile`.
- `components/seller/FinalTestTab.tsx` — namespace `finalTestTab`.
- `components/seller/CourseModulesTab.tsx` — namespace `courseModulesTab` (truyền `t: TFunction` xuống SortableLessonRow/LessonRow/SortableModuleItem).
- `pages/seller/interactions/SellerComments.tsx` — namespace `sellerComments` (helper `relativeTime` nhận `t` + `dateLocale` param; CommentRow/CommentStatusBadge/FilterChip nhận `t` qua props).
- `pages/seller/courses/LessonDetailPage.tsx` — namespace `lessonDetail` (date qua `dateLocale`; `Trans` cho `oldVideoNotice`, `replyingTo`, `confirmDeleteLessonLine1/2`).

**⏳ SELLER CÒN LẠI:** không còn — toàn bộ seller surface đã migrate. `components/seller/EmptyState.tsx` generic (text từ caller), không cần migrate.

## Lưu ý quan trọng

- TS config frontend **lenient** (`noImplicitAny: false`, `strictNullChecks: false`) — ĐỪNG tự ý tighten.
- Khi gặp biến tên `t` trùng hàm dịch (vd `.map((t) => ...)` hoặc `const t = setTimeout(...)`), đổi tên biến đó để không shadow `t` của i18n. (Đã từng dính ở SellerTests, SellerLearners.)
- exam-center còn 2 file `WritingResult.tsx` + `SpeakingResult.tsx` là static demo mockup — skip cho tới khi wire với BE.

## Đợt 2026-05-30 (tiếp)

- `components/SkillTreeFlow.tsx` — namespace `exam.skillTree.flow` (SECTION_THEMES dùng `labelKey`, `t(\`skillTree.flow.sections.${labelKey}\`)`; ARIA labels, Section banner, +50 Bonus XP, NEW, Tap to start, Review:, completedCount).
- `components/MiniQuizDialog.tsx` — namespace `exam.miniQuiz` (TTSPlayer + PairMatchQuestion gọi `useTranslation('exam')` bên trong vì là function components con).
- `components/user/layout/CartDropdown.tsx` — namespace `layout.cartDropdown` (aria + title + empty + total + viewCart, plural `itemCount_one/_other` cho “khoá học”).
- `components/user/layout/UpgradeToProButton.tsx` — namespace `layout.upgradePro` (title + labelLong + labelShort).
- `components/auth/ProtectedRoute.tsx` + `AdminProtectedRoute.tsx`: **skip** — chỉ có VN trong comment, không có UI string.
- Còn lại trong scope user/shared (~36 file): student-learning, livestream, flashcards, payment, course, courses page, refund, placement, AiTutorPanel, premium gate, ui modals, user/learning, user/account/Notifications, App.tsx, PurchasesContext, DiscussionSection, ExamPreviewModal, CourseSellerApplicationDialog.

## Đợt 2026-05-30 (tiếp – payment / refund / courses / reviews / flashcards)

- `components/user/payment/PaymentDialog.tsx` — namespace `account.paymentDialog` (date dùng `dateLocale`, default title/confirmLabel resolve qua `t()`).
- `pages/user/refund/Refunds.tsx` — namespace `account.refunds` (STATUS const đổi `label` → `labelKey`, dialog + counter `{{count}}/1000`, dateLocale).
- `pages/user/courses/Courses.tsx` — namespace `courses.coursesPage` (hero badge/title/subtitle, search/level placeholder, resultsCount với `{{count}}`, pageOf `{{page}}/{{total}}`, empty state).
- `components/user/course/CourseReportDialog.tsx` — namespace `courses.reportDialog` (REASONS const đổi `label` → `labelKey`, toasts).
- `components/user/course/CourseDetailReviews.tsx` — namespace `courses.reviews` (`formatRelativeTime(date, t)` nhận `t: TFunction` ở module level; ReviewCard tự gọi `useTranslation` bên trong).
- `components/user/course/AllRatingsModal.tsx` — namespace `courses.allRatings` (filter chips, empty state với `{{stars}}` interpolation).
- `components/user/flashcards/CardList.tsx` — namespace `exam.flashcards.cardList` (AudioButton tự gọi `useTranslation('exam')`).
- `components/user/flashcards/DeckList.tsx` — namespace `exam.flashcards.deckList` (public/private badge).
- `components/user/flashcards/StudyMode.tsx` — namespace `exam.flashcards.studyMode` (cancel dialog, status badges, grade buttons + gradeHint, feedback chip, progress `{{current}}/{{total}}`, finish screen).

**Skip livestream:** developer khác đang sửa surface đó, **KHÔNG migrate** `components/user/livestream/`, `pages/user/livestream/`. Khi quay lại cần coordinate với developer kia.

**Còn lại trong scope user/shared (~27 file):** student-learning (CourseOverview/CourseReviews/LearningTabs/LessonComments/LessonTestRunner/SyllabusSidebar/VideoSection), placement, AiTutorPanel, premium gate, ui modals, user/learning (Flashcards page, RagGenerator, StudentLearning), App.tsx, PurchasesContext, DiscussionSection, ExamPreviewModal, CourseSellerApplicationDialog, courses/CourseDetail, courses/MyCourses (verify đã migrate?), home (verify), components/user/learning-path (verify), components/user/home (verify).

## Đợt 2026-05-31 (student-learning batch — toàn bộ 7 file)

- `components/user/student-learning/LearningTabs.tsx` — namespace `courses.studentLearning.learningTabs` (tabs const đổi `label` → `labelKey`, resolve qua `t(\`...${labelKey}\`)`).
- `components/user/student-learning/CourseOverview.tsx` — namespace `courses.studentLearning.courseOverview` (drop module-level `levelLabels` Record + `formatDate` hardcode `vi-VN`; inline `toLocaleDateString(dateLocale, …)`; thêm `levels` sub-object).
- `components/user/student-learning/SyllabusSidebar.tsx` — namespace `courses.studentLearning.syllabusSidebar` (helper `formatDuration` nhận `t: TFunction` param).
- `components/user/student-learning/CourseReviews.tsx` — namespace `courses.studentLearning.courseReviews` (filter buttons: `filterAll` + `filterStars` với `{{count}}`; date qua `dateLocale`).
- `components/user/student-learning/LessonComments.tsx` — namespace `courses.studentLearning.lessonComments`.
- `components/user/student-learning/VideoSection.tsx` — namespace `courses.studentLearning.videoSection` (drop unused `getInitials`).
- `components/user/student-learning/LessonTestRunner.tsx` — namespace `courses.studentLearning.lessonTestRunner` (~55 keys, có `stats` + `instructions` sub-objects; `Trans` cho instruction inline `<b>`; `ScoreRing` nhận `passedLabel`/`notPassedLabel` props; đổi `const t = saved ? Number(saved) : 0` → `savedTime` để không shadow `t` của i18n; thêm `t` vào dep array của timer `useEffect`).

**Verify:** JSON valid (both langs), `npx tsc --noEmit` clean, 0 VN literals còn lại trong 7 file.

**Tiếp theo gợi ý:** `placement`, `AiTutorPanel`, `premium gate`, `ui modals` → kế tiếp `user/learning` (page host các component vừa migrate) → App.tsx + PurchasesContext + DiscussionSection + ExamPreviewModal + CourseSellerApplicationDialog.
