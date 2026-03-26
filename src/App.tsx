import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { WalletProvider } from "./context/WalletContext";
import { PurchasesProvider } from "./context/PurchasesContext";

// User pages
import Index from "./pages/user/home/Home";
import Landing from "./pages/user/home/Landing";
import CourseDetail from "./pages/user/courses/CourseDetail";
import Flashcards from "./pages/user/learning/Flashcards";
import StudentLearningPage from "./pages/user/learning/StudentLearning";
import Profile from "./pages/user/account/Profile";
import Wallet from "./pages/user/account/Wallet";
import Cart from "./pages/user/account/Cart";
import Contact from "./pages/user/info/Contact";
import Blog from "./pages/user/info/Blog";
import Notifications from "./pages/user/account/Notifications";
import MyCourses from "./pages/user/courses/MyCourses";

// Exam center (static UI integration)
import SpeakingTest from "./pages/user/exam-center/SpeakingTest";
import ExamCenter from "./pages/user/exam-center/ExamCenter";
import SkillTree from "./pages/user/exam-center/SkillTree";
import DictationPractice from "./pages/user/exam-center/DictationPractice";
import DictationExercises from "./pages/user/exam-center/DictationExercises";
import LearningPath from "./pages/user/exam-center/LearningPath";
import IeltsTestModule from "./pages/user/exam-center/IeltsTestModule";
import TestHistory from "./pages/user/exam-center/TestHistory";
import WritingHistory from "./pages/user/exam-center/WritingHistory";
import SpeakingHistory from "./pages/user/exam-center/SpeakingHistory";
import ProgressAnalytics from "./pages/user/exam-center/ProgressAnalytics";
import TestResultPage from "./pages/user/exam-center/TestResultPage";
import TestDetailPage from "./pages/user/exam-center/TestDetailPage";

// Admin pages
import AdminDashboard from "./pages/admin/dashboard/Dashboard";
import UsersManagement from "./pages/admin/user-management/Users";
import CoursesManagement from "./pages/admin/course-management/Courses";
import ApplicationsManagement from "./pages/admin/application-management/ApplicationsManagement";
import ReportsManagement from "./pages/admin/management/ReportsManagement";
import NotificationsManagement from "./pages/admin/management/NotificationsManagement";
import TransactionsManagement from "./pages/admin/transaction-management/Transactions";
import RevenueManagement from "./pages/admin/revenue-management/Revenues";
import SubscriptionPlansManagement from "./pages/admin/management/SubscriptionPlansManagement";
import SubscriptionContractsManagement from "./pages/admin/management/SubscriptionContractsManagement";
import AdminCourseDetail from "./pages/admin/course-management/CourseDetail";
import AdminLessonDetail from "./pages/admin/course-management/LessonDetail";
import TagsManagement from "./pages/admin/tag-management/Tags";
import ExamManagement from "./pages/admin/exam-management/ExamManagement";
import ExamFormPage from "./pages/admin/exam-management/ExamForm";
import WritingTestForm from "./pages/admin/exam-management/WritingTestForm";
import SpeakingTestForm from "./pages/admin/exam-management/SpeakingTestForm";
import SpeakingTopicManager from "./pages/admin/exam-management/SpeakingTopicManager";
import DictationManagement from "./pages/admin/exam-management/DictationManagement";

// Protected Routes
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminProtectedRoute } from "./components/auth/AdminProtectedRoute";
import { SellerProtectedRoute } from "./components/auth/SellerProtectedRoute";
// Shared pages
import Login from "./pages/shared/auth/Login";
import NotFound from "./pages/shared/NotFound";
import Register from "./pages/shared/auth/Register";
import VerifyEmailPage from "./pages/shared/auth/VerifyEmail";

// Layouts
import AdminLayout from "./components/admin/AdminLayout";
import SellerLayout from "./components/seller/SellerLayout";
import SellerDashboard from "./pages/seller/dashboard/SellerDashboard";
import SellerCourses from "./pages/seller/courses/SellerCourses";
import SellerMonthlyFees from "./pages/seller/finance/SellerMonthlyFees";
import SellerComments from "./pages/seller/interactions/SellerComments";
import SellerLearners from "./pages/seller/learners/SellerLearners";
import SellerProfile from "./pages/seller/account/SellerProfile";
import SellerCourseDetail from "./pages/seller/courses/SellerCourseDetail";
import SellerCreateCourse from "./pages/seller/courses/SellerCreateCourse";
import CreateLessonPage from "./pages/seller/courses/CreateLessonPage";
import LessonDetailPage from "./pages/seller/courses/LessonDetailPage";
import UserAppLayout from "./components/user/layout/UserAppLayout";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <WalletProvider>
        <PurchasesProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* public routes - / là trang chủ (landing, giới thiệu + khoá học), /about redirect về / */}
          <Route path="/" element={<Landing />} />
          <Route path="/courses" element={<Landing />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/about" element={<Landing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/verify" element={<VerifyEmailPage />} />
          {/* protected routes - dashboard học viên */}
          <Route element={<ProtectedRoute />}>
            <Route element={<UserAppLayout />}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/notifications" element={<Notifications />} />

              {/* AI Features (with sidebar layout) */}
              <Route path="/exam" element={<ExamCenter />} />
              <Route path="/exam/history" element={<TestHistory />} />
              <Route path="/exam/writing-history" element={<WritingHistory />} />
              <Route path="/exam/speaking-history" element={<SpeakingHistory />} />
              <Route path="/my-progress" element={<ProgressAnalytics />} />
              <Route path="/skill-tree" element={<SkillTree />} />
              <Route path="/dictation" element={<DictationExercises />} />
              <Route path="/dictation/:exerciseId" element={<DictationPractice />} />
              <Route path="/learning-path" element={<LearningPath />} />
            </Route>
            <Route path="/learning/courses/:courseId/lessons/:lessonId?" element={<StudentLearningPage />} />

            {/* AI Test routes (full-page, no sidebar — immersive test mode) */}
            <Route path="/exam/test/speaking" element={<SpeakingTest />} />
            <Route path="/exam/test/:testId" element={<IeltsTestModule />} />
            <Route path="/exam/test/:testId/session/:sessionId" element={<IeltsTestModule />} />
            <Route path="/exam/result/:sessionId" element={<TestResultPage />} />
            <Route path="/practice/:testId" element={<TestDetailPage />} />
            <Route path="/practice/:testId/result/:sessionId" element={<TestDetailPage />} />

            <Route path="/blog" element={<Blog />} />
          </Route>
          {/* admin Routes */}

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="courses" element={<CoursesManagement />} />
            <Route path="courses/:id" element={<AdminCourseDetail />} />
            <Route path="lessons/:lessonId" element={<AdminLessonDetail />} />
            <Route path="transactions" element={<TransactionsManagement />} />
            <Route path="applications" element={<ApplicationsManagement />} />
            <Route path="exams" element={<ExamManagement />} />
            <Route path="exams/new" element={<ExamFormPage />} />
            <Route path="exams/new/writing" element={<WritingTestForm />} />
            <Route path="exams/new/speaking" element={<SpeakingTestForm />} />
            <Route path="exams/:id/edit" element={<ExamFormPage />} />
            <Route path="exams/:id/edit/writing" element={<WritingTestForm />} />
            <Route path="exams/:id/edit/speaking" element={<SpeakingTestForm />} />
            <Route path="speaking-topics" element={<SpeakingTopicManager />} />
            <Route path="dictation" element={<DictationManagement />} />
            <Route path="reports" element={<ReportsManagement />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route
              path="subscription-plans"
              element={<SubscriptionPlansManagement />}
            />
            <Route
              path="subscription-contracts"
              element={<SubscriptionContractsManagement />}
            />
            <Route path="revenue" element={<RevenueManagement />} />
            <Route path="tags" element={<TagsManagement />} />
          </Route>

          {/* Seller Routes */}
          <Route element={<SellerProtectedRoute />}>
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<SellerDashboard />} />
              <Route path="courses" element={<SellerCourses />} />
              <Route path="courses/new" element={<SellerCreateCourse />} />
              <Route path="courses/:courseId/lessons/create" element={<CreateLessonPage />} />
              <Route path="courses/:courseId/lessons/:lessonId" element={<LessonDetailPage />} />
              <Route path="courses/:id" element={<SellerCourseDetail />} />
              <Route path="fees" element={<SellerMonthlyFees />} />
              <Route path="comments" element={<SellerComments />} />
              <Route path="learners" element={<SellerLearners />} />
              <Route path="profile" element={<SellerProfile />} />
            </Route>
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
        </PurchasesProvider>
      </WalletProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
