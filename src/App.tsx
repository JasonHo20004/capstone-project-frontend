import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// User pages
import Index from "./pages/user/home/Home";
import Courses from "./pages/user/courses/Courses";
import CourseDetail from "./pages/user/courses/CourseDetail";
import Flashcards from "./pages/user/learning/Flashcards";
import Profile from "./pages/user/account/Profile";
import Wallet from "./pages/user/account/Wallet";
import Cart from "./pages/user/account/Cart";
import About from "./pages/user/info/About";
import Contact from "./pages/user/info/Contact";
import Blog from "./pages/user/info/Blog";
import Notifications from "./pages/user/account/Notifications";
import MyCourses from "./pages/user/courses/MyCourses";

// Admin pages
import AdminDashboard from "./pages/admin/dashboard/AdminDashboard";
import UsersManagement from "./pages/admin/management/UsersManagement";
import CoursesManagement from "./pages/admin/management/CoursesManagement";
import ApplicationsManagement from "./pages/admin/management/ApplicationsManagement";
import ReportsManagement from "./pages/admin/management/ReportsManagement";
import NotificationsManagement from "./pages/admin/management/NotificationsManagement";
import TransactionsManagement from "./pages/admin/finance/TransactionsManagement";
import RevenueManagement from "./pages/admin/finance/RevenueManagement";
import SubscriptionPlansManagement from "./pages/admin/finance/SubscriptionPlansManagement";
import SubscriptionContractsManagement from "./pages/admin/finance/SubscriptionContractsManagement";

// Shared pages
import Login from "./pages/shared/auth/Login";
import NotFound from "./pages/shared/NotFound";

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

// Cấu hình QueryClient với default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Retry 1 lần khi fail
      refetchOnWindowFocus: false, // Không refetch khi focus window
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false, // Không retry mutations
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/blog" element={<Blog />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="courses" element={<CoursesManagement />} />
            <Route path="transactions" element={<TransactionsManagement />} />
            <Route path="applications" element={<ApplicationsManagement />} />
            <Route path="reports" element={<ReportsManagement />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="subscription-plans" element={<SubscriptionPlansManagement />} />
            <Route path="subscription-contracts" element={<SubscriptionContractsManagement />} />
            <Route path="revenue" element={<RevenueManagement />} />
          </Route>

          {/* Seller Routes */}
          <Route path="/seller" element={<SellerLayout />}>
            <Route index element={<SellerDashboard />} />
            <Route path="courses" element={<SellerCourses />} />
            <Route path="courses/:id" element={<SellerCourseDetail />} />
            <Route path="fees" element={<SellerMonthlyFees />} />
            <Route path="comments" element={<SellerComments />} />
            <Route path="learners" element={<SellerLearners />} />
            <Route path="profile" element={<SellerProfile />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
