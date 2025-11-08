import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import CoursesManagement from "./pages/admin/CoursesManagement";
import TransactionsManagement from "./pages/admin/TransactionsManagement";
import ApplicationsManagement from "./pages/admin/ApplicationsManagement";
import ReportsManagement from "./pages/admin/ReportsManagement";
import NotificationsManagement from "./pages/admin/NotificationsManagement";
import SubscriptionPlansManagement from "./pages/admin/SubscriptionPlansManagement";
import SubscriptionContractsManagement from "./pages/admin/SubscriptionContractsManagement";
import RevenueManagement from "./pages/admin/RevenueManagement";

const queryClient = new QueryClient();

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
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
