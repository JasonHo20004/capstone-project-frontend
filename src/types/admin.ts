// Admin Types based on Prisma Schema

export interface User {
  id: string;
  email: string;
  password?: string; // Không hiển thị trong admin UI nhưng có trong DB
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth: string; // DateTime as ISO string
  createdAt: string; // DateTime as ISO string  
  englishLevel?: string;
  learningGoals: string[];
  role?: 'ADMINISTRATOR' | 'COURSESELLER';
  wallet?: Wallet;
  courseSellerProfile?: CourseSellerProfile;
  administratorProfile?: AdministratorProfile;
}

export interface CourseSellerProfile {
  id: string;
  certification: string[];
  expertise: string[];
  isActive: boolean;
  userId: string;
}

export interface AdministratorProfile {
  id: string;
  userId: string;
}

export interface Wallet {
  id: string;
  allowance: number; // Decimal trong DB, number trong FE
  userId: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  price: number; // Decimal trong DB, number trong FE
  courseLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  courseSellerId: string;
  ratingCount?: number;
  status: 'PENDING' | 'ACTIVE' | 'REFUSE' | 'INACTIVE' | 'DELETE';
  createdAt: string; // DateTime as ISO string
  updatedAt: string; // DateTime as ISO string
  courseSeller: User;
  averageRating?: number;
}

export interface Transaction {
  id: string;
  amount: number; // Decimal trong DB, number trong FE
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string; // DateTime as ISO string
  description?: string;
  walletId: string;
  transactionType: 'DEPOSIT' | 'PAYMENT' | 'MONTHLYFEE' | 'WITHDRAW';
  topupOrderId?: string;
  subscriptionContractId?: string;
  wallet: Wallet;
  topupOrder?: TopupOrder;
  subscriptionContract?: SubscriptionContract;
}

export interface TopupOrder {
  id: string;
  userId: string;
  realMoney: number; // Decimal trong DB, number trong FE
  realAmount?: number; // Decimal trong DB, number trong FE
  currency: string;
  paymentMethod: 'MOMO' | 'ZALOPAY' | 'BANKING' | 'APPLEPAY';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string; // DateTime as ISO string
  updatedAt: string; // DateTime as ISO string
  user: User;
}

export interface CourseSellerApplication {
  id: string;
  userId: string;
  certification: string[];
  expertise: string[];
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string; // DateTime as ISO string
  user: User;
}

export interface Report {
  id: string;
  content: string; // Thay đổi từ description thành content
  reasonType: 'INAPPROPRIATE_CONTENT' | 'COPYRIGHT_VIOLATION' | 'NOT_AS_DESCRIBED' | 'UNRESPONSIVE_INSTRUCTOR' | 'INCOMPLETE_CONTENT'; // Thay đổi từ reason thành reasonType
  createdAt: string; // DateTime as ISO string
  userId: string;
  courseId: string;
  user: User;
  course: Course;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  maxCourses: number;
  monthlyFee: number; // Decimal trong DB, number trong FE
}

export interface SubscriptionContract {
  id: string;
  courseSellerId: string;
  status: boolean; // Thay đổi từ string thành boolean
  subscriptionPlanId: string;
  createdAt: string; // DateTime as ISO string
  expiresAt: string; // DateTime as ISO string
  updatedAt: string; // DateTime as ISO string
  renewalCount: number;
  lastRenewalAt?: string; // DateTime as ISO string
  notes?: string;
  lastNotificationAt?: string; // DateTime as ISO string
  user: User;
  subscriptionPlan: SubscriptionPlan;
}

// Các interface cho Notification system từ schema
export interface NotificationType {
  id: string;
  name: string;
  isLocked: boolean;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: string; // DateTime as ISO string
  seen: boolean;
  notificationTypeId: string;
  notificationType: NotificationType;
  userIds: string[]; // Array of user IDs who will receive this notification
}

// Interface cho Test system từ schema  
export interface EnglishTestType {
  id: string;
  name: string;
}

export interface Test {
  id: string;
  name: string;
  description?: string;
  testTypeId: string;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  testType: EnglishTestType;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  skillType: 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';
  testId: string;
  sectionOrder?: number;
  timeLimit?: number;
}

export interface PracticeSession {
  id: string;
  userId: string;
  testId: string;
  selectedSections: string[];
  status: 'ONGOING' | 'COMPLETED';
  createdAt: string;
  completedAt?: string;
  user: User;
  test: Test;
}

// Rating system
export interface Rating {
  id: string;
  score: number; // Float trong DB
  userId: string;
  courseId: string;
  content?: string;
  createdAt: string;
  user: User;
  course: Course;
}

// Dashboard Statistics
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  pendingApplications: number;
  activeSubscriptions: number;
  monthlyGrowth: {
    users: number;
    courses: number;
    revenue: number;
  };
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
  courses: number;
}

// User Activity tracking
export interface UserActivity {
  id: string;
  userId: string;
  transactionId: string;
  courseId: string;
  createdAt: string;
  expiresAt?: string;
  user: User;
  transaction: Transaction;
}