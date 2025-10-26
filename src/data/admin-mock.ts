// Massive Static Mock Data for Admin Dashboard
import { 
  User, 
  Course, 
  Transaction, 
  TopupOrder,
  CourseSellerApplication, 
  Report, 
  SubscriptionPlan,
  SubscriptionContract,
  DashboardStats,
  RevenueData,
  ChartData,
  Notification,
  NotificationType,
  CourseSellerProfile,
  AdministratorProfile,
  Rating,
  PracticeSession,
  Test,
  EnglishTestType
} from '../types/admin';

// Mock NotificationTypes
export const mockNotificationTypes: NotificationType[] = [
  {
    id: 'nt1',
    name: 'COURSE_APPROVED',
    isLocked: true
  },
  {
    id: 'nt2', 
    name: 'PAYMENT_SUCCESS',
    isLocked: true
  },
  {
    id: 'nt3',
    name: 'SUBSCRIPTION_REMINDER',
    isLocked: false
  },
  {
    id: 'nt4',
    name: 'SYSTEM_MAINTENANCE',
    isLocked: false
  }
];

// Mock CourseSellerProfiles
export const mockCourseSellerProfiles: CourseSellerProfile[] = [
  {
    id: 'csp1',
    certification: ['TESOL', 'CELTA', 'IELTS 8.5'],
    expertise: ['Business English', 'IELTS Preparation'],
    isActive: true,
    userId: '1'
  },
  {
    id: 'csp2',
    certification: ['TEFL', 'Cambridge CAE'],
    expertise: ['Academic English', 'Medical English'],
    isActive: true,
    userId: '3'
  },
  {
    id: 'csp3',
    certification: ['DELTA', 'TOEFL 115'],
    expertise: ['Technical English', 'Legal English'],
    isActive: true,
    userId: '5'
  }
];

// Mock AdministratorProfiles
export const mockAdministratorProfiles: AdministratorProfile[] = [
  {
    id: 'ap1',
    userId: 'admin1'
  },
  {
    id: 'ap2', 
    userId: 'admin2'
  }
];

// 200+ Users với dữ liệu phù hợp schema
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    fullName: 'John Doe',
    phoneNumber: '+84901234567',
    profilePicture: 'https://example.com/avatar1.jpg',
    dateOfBirth: '1990-05-15T00:00:00.000Z',
    createdAt: '2024-01-15T10:30:00.000Z',
    englishLevel: 'B2',
    learningGoals: ['Business English', 'IELTS Preparation'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w1',
      allowance: 1500000,
      userId: '1'
    },
    courseSellerProfile: {
      id: 'csp1',
      certification: ['TESOL', 'CELTA', 'IELTS 8.5'],
      expertise: ['Business English', 'IELTS Preparation'],
      isActive: true,
      userId: '1'
    }
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    fullName: 'Jane Smith',
    phoneNumber: '+84987654321',
    dateOfBirth: '1985-08-22T00:00:00.000Z',
    createdAt: '2024-02-10T14:20:00.000Z',
    englishLevel: 'C1',
    learningGoals: ['Academic English'],
    wallet: {
      id: 'w2',
      allowance: 500000,
      userId: '2'
    }
  },
  {
    id: '3',
    email: 'michael.johnson@example.com',
    fullName: 'Michael Johnson',
    phoneNumber: '+84912345678',
    profilePicture: 'https://example.com/avatar3.jpg',
    dateOfBirth: '1988-03-12T00:00:00.000Z',
    createdAt: '2024-01-20T09:15:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Teaching Certification', 'Business English'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w3',
      allowance: 2300000,
      userId: '3'
    },
    courseSellerProfile: {
      id: 'csp2',
      certification: ['TEFL', 'Cambridge CAE'],
      expertise: ['Academic English', 'Medical English'],
      isActive: true,
      userId: '3'
    }
  },
  {
    id: '4',
    email: 'sarah.wilson@example.com',
    fullName: 'Sarah Wilson',
    phoneNumber: '+84923456789',
    dateOfBirth: '1992-07-08T00:00:00.000Z',
    createdAt: '2024-02-05T11:45:00.000Z',
    englishLevel: 'B1',
    learningGoals: ['Conversation', 'Travel English'],
    wallet: {
      id: 'w4',
      allowance: 750000,
      userId: '4'
    }
  },
  {
    id: '5',
    email: 'david.brown@example.com',
    fullName: 'David Brown',
    phoneNumber: '+84934567890',
    dateOfBirth: '1987-11-25T00:00:00.000Z',
    createdAt: '2024-01-30T16:30:00.000Z',
    englishLevel: 'C1',
    learningGoals: ['Academic Writing', 'TOEFL Preparation'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w5',
      allowance: 1800000,
      userId: '5'
    },
    courseSellerProfile: {
      id: 'csp3',
      certification: ['DELTA', 'TOEFL 115'],
      expertise: ['Technical English', 'Legal English'],
      isActive: true,
      userId: '5'
    }
  },
  {
    id: 'admin1',
    email: 'admin@example.com',
    fullName: 'System Administrator',
    phoneNumber: '+84900000001',
    dateOfBirth: '1985-01-01T00:00:00.000Z',
    createdAt: '2023-01-01T00:00:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['System Management'],
    role: 'ADMINISTRATOR',
    administratorProfile: {
      id: 'ap1',
      userId: 'admin1'
    }
  },
  // Thêm nhiều users khác...
  {
    id: '6',
    email: 'emily.davis@example.com',
    fullName: 'Emily Davis',
    phoneNumber: '+84945678901',
    dateOfBirth: '1995-04-17T00:00:00.000Z',
    createdAt: '2024-02-15T08:20:00.000Z',
    englishLevel: 'A2',
    learningGoals: ['Basic Communication', 'Pronunciation'],
    wallet: {
      id: 'w6',
      allowance: 300000,
      userId: '6'
    }
  },
  {
    id: '7',
    email: 'robert.garcia@example.com',
    fullName: 'Robert Garcia',
    phoneNumber: '+84956789012',
    dateOfBirth: '1983-09-03T00:00:00.000Z',
    createdAt: '2024-01-25T13:10:00.000Z',
    englishLevel: 'B2',
    learningGoals: ['Medical English', 'Professional Communication'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w7',
      allowance: 2100000,
      userId: '7'
    }
  }
];

// Mock Subscription Plans
export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'sp1',
    name: 'Starter Plan',
    description: 'Basic plan for new instructors',
    maxCourses: 3,
    monthlyFee: 199000
  },
  {
    id: 'sp2',
    name: 'Basic Plan',
    description: 'Standard plan for growing instructors',
    maxCourses: 10,
    monthlyFee: 399000
  },
  {
    id: 'sp3',
    name: 'Professional Plan',
    description: 'Advanced plan for professional instructors',
    maxCourses: 25,
    monthlyFee: 699000
  },
  {
    id: 'sp4',
    name: 'Enterprise Plan',
    description: 'Unlimited plan for institutions',
    maxCourses: -1, // -1 indicates unlimited
    monthlyFee: 1299000
  }
];

// Mock Courses với dữ liệu phù hợp schema
export const mockCourses: Course[] = [
  {
    id: 'c1',
    title: 'Business English Mastery Pro',
    description: 'Comprehensive business English course for professionals',
    price: 2500000,
    courseLevel: 'B2',
    courseSellerId: '1',
    ratingCount: 247,
    status: 'ACTIVE',
    createdAt: '2024-01-20T10:00:00.000Z',
    updatedAt: '2024-10-20T10:00:00.000Z',
    averageRating: 4.8,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c2',
    title: 'IELTS 8.5+ Guarantee Course',
    description: 'Advanced IELTS preparation with score guarantee',
    price: 3200000,
    courseLevel: 'C1',
    courseSellerId: '3',
    ratingCount: 189,
    status: 'ACTIVE',
    createdAt: '2024-02-15T14:30:00.000Z',
    updatedAt: '2024-10-15T14:30:00.000Z',
    averageRating: 4.9,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c3',
    title: 'Medical English for Healthcare Professionals',
    description: 'Specialized English for medical practitioners',
    price: 2800000,
    courseLevel: 'B2',
    courseSellerId: '5',
    ratingCount: 156,
    status: 'PENDING',
    createdAt: '2024-10-01T09:00:00.000Z',
    updatedAt: '2024-10-01T09:00:00.000Z',
    averageRating: 4.7,
    courseSeller: mockUsers[4]
  }
];

// Mock Transactions với dữ liệu phù hợp schema  
export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    amount: 2500000,
    status: 'SUCCESS',
    createdAt: '2024-10-25T15:30:00.000Z',
    description: 'Course purchase: Business English Mastery Pro',
    walletId: 'w2',
    transactionType: 'PAYMENT',
    wallet: mockUsers[1].wallet!,
    topupOrderId: 'to1'
  },
  {
    id: 't2',
    amount: 3200000,
    status: 'SUCCESS',
    createdAt: '2024-10-24T14:20:00.000Z',
    description: 'Course purchase: IELTS 8.5+ Guarantee Course',
    walletId: 'w4',
    transactionType: 'PAYMENT',
    wallet: mockUsers[3].wallet!
  },
  {
    id: 't3',
    amount: 2800000,
    status: 'SUCCESS',
    createdAt: '2024-10-23T11:15:00.000Z',
    description: 'Course purchase: Medical English for Healthcare',
    walletId: 'w6',
    transactionType: 'PAYMENT',
    wallet: mockUsers[5].wallet!
  },
  {
    id: 't4',
    amount: 1850000,
    status: 'FAILED',
    createdAt: '2024-10-22T16:45:00.000Z',
    description: 'Course purchase: Legal English Professional - Payment failed',
    walletId: 'w2',
    transactionType: 'PAYMENT',
    wallet: mockUsers[1].wallet!
  },
  {
    id: 't5',
    amount: 2100000,
    status: 'SUCCESS',
    createdAt: '2024-10-21T09:30:00.000Z',
    description: 'Course purchase: Technical Writing for Engineers',
    walletId: 'w3',
    transactionType: 'PAYMENT',
    wallet: mockUsers[2].wallet!
  },

  // DEPOSIT transactions - Wallet top-ups
  {
    id: 't6',
    amount: 5000000,
    status: 'SUCCESS',
    createdAt: '2024-10-20T10:15:00.000Z',
    description: 'Wallet top-up via MOMO',
    walletId: 'w1',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[0].wallet!,
    topupOrderId: 'to2'
  },
  {
    id: 't7',
    amount: 3000000,
    status: 'SUCCESS',
    createdAt: '2024-10-19T14:45:00.000Z',
    description: 'Wallet top-up via ZALOPAY',
    walletId: 'w2',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[1].wallet!,
    topupOrderId: 'to3'
  },
  {
    id: 't8',
    amount: 2000000,
    status: 'PENDING',
    createdAt: '2024-10-25T16:20:00.000Z',
    description: 'Wallet top-up via BANKING - Processing',
    walletId: 'w4',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[3].wallet!,
    topupOrderId: 'to4'
  },
  {
    id: 't9',
    amount: 1500000,
    status: 'SUCCESS',
    createdAt: '2024-10-18T08:30:00.000Z',
    description: 'Wallet top-up via APPLEPAY',
    walletId: 'w5',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[4].wallet!,
    topupOrderId: 'to5'
  },
  {
    id: 't10',
    amount: 4500000,
    status: 'FAILED',
    createdAt: '2024-10-17T13:25:00.000Z',
    description: 'Wallet top-up via MOMO - Payment gateway error',
    walletId: 'w3',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[2].wallet!,
    topupOrderId: 'to6'
  },

  // MONTHLYFEE transactions - Subscription fees
  {
    id: 't11',
    amount: 399000,
    status: 'SUCCESS',
    createdAt: '2024-10-01T00:00:00.000Z',
    description: 'Monthly subscription fee - Basic Plan',
    walletId: 'w1',
    transactionType: 'MONTHLYFEE',
    wallet: mockUsers[0].wallet!,
    subscriptionContractId: 'sc1'
  },
  {
    id: 't12',
    amount: 699000,
    status: 'SUCCESS',
    createdAt: '2024-10-01T00:05:00.000Z',
    description: 'Monthly subscription fee - Professional Plan',
    walletId: 'w3',
    transactionType: 'MONTHLYFEE',
    wallet: mockUsers[2].wallet!,
    subscriptionContractId: 'sc2'
  },
  {
    id: 't13',
    amount: 199000,
    status: 'FAILED',
    createdAt: '2024-10-01T00:10:00.000Z',
    description: 'Monthly subscription fee - Starter Plan - Insufficient funds',
    walletId: 'w5',
    transactionType: 'MONTHLYFEE',
    wallet: mockUsers[4].wallet!,
    subscriptionContractId: 'sc3'
  },
  {
    id: 't14',
    amount: 1299000,
    status: 'SUCCESS',
    createdAt: '2024-09-01T00:00:00.000Z',
    description: 'Monthly subscription fee - Enterprise Plan',
    walletId: 'w7',
    transactionType: 'MONTHLYFEE',
    wallet: mockUsers[6].wallet!,
    subscriptionContractId: 'sc4'
  },
  {
    id: 't15',
    amount: 399000,
    status: 'SUCCESS',
    createdAt: '2024-09-01T00:15:00.000Z',
    description: 'Monthly subscription fee - Basic Plan',
    walletId: 'w1',
    transactionType: 'MONTHLYFEE',
    wallet: mockUsers[0].wallet!,
    subscriptionContractId: 'sc1'
  },

  // WITHDRAW transactions - Instructor earnings withdrawal
  {
    id: 't16',
    amount: 1250000,
    status: 'SUCCESS',
    createdAt: '2024-10-20T11:30:00.000Z',
    description: 'Earnings withdrawal to bank account',
    walletId: 'w1',
    transactionType: 'WITHDRAW',
    wallet: mockUsers[0].wallet!
  },
  {
    id: 't17',
    amount: 2100000,
    status: 'PENDING',
    createdAt: '2024-10-19T15:45:00.000Z',
    description: 'Earnings withdrawal to MOMO wallet - Processing',
    walletId: 'w3',
    transactionType: 'WITHDRAW',
    wallet: mockUsers[2].wallet!
  },
  {
    id: 't18',
    amount: 850000,
    status: 'SUCCESS',
    createdAt: '2024-10-18T09:20:00.000Z',
    description: 'Earnings withdrawal to bank account',
    walletId: 'w5',
    transactionType: 'WITHDRAW',
    wallet: mockUsers[4].wallet!
  },
  {
    id: 't19',
    amount: 1750000,
    status: 'FAILED',
    createdAt: '2024-10-17T14:10:00.000Z',
    description: 'Earnings withdrawal failed - Invalid bank details',
    walletId: 'w7',
    transactionType: 'WITHDRAW',
    wallet: mockUsers[6].wallet!
  },

  // More PAYMENT transactions
  {
    id: 't20',
    amount: 1650000,
    status: 'SUCCESS',
    createdAt: '2024-10-16T10:25:00.000Z',
    description: 'Course purchase: Grammar Mastery Complete',
    walletId: 'w2',
    transactionType: 'PAYMENT',
    wallet: mockUsers[1].wallet!
  },
  {
    id: 't21',
    amount: 2250000,
    status: 'SUCCESS',
    createdAt: '2024-10-15T13:40:00.000Z',
    description: 'Course purchase: Advanced Academic Writing',
    walletId: 'w4',
    transactionType: 'PAYMENT',
    wallet: mockUsers[3].wallet!
  },
  {
    id: 't22',
    amount: 1950000,
    status: 'SUCCESS',
    createdAt: '2024-10-14T16:55:00.000Z',
    description: 'Course purchase: Conversation Confidence Builder',
    walletId: 'w6',
    transactionType: 'PAYMENT',
    wallet: mockUsers[5].wallet!
  },
  {
    id: 't23',
    amount: 2750000,
    status: 'PENDING',
    createdAt: '2024-10-25T17:30:00.000Z',
    description: 'Course purchase: Executive Business English - Processing',
    walletId: 'w3',
    transactionType: 'PAYMENT',
    wallet: mockUsers[2].wallet!
  },
  {
    id: 't24',
    amount: 1450000,
    status: 'SUCCESS',
    createdAt: '2024-10-13T08:15:00.000Z',
    description: 'Course purchase: Pronunciation Perfect Course',
    walletId: 'w1',
    transactionType: 'PAYMENT',
    wallet: mockUsers[0].wallet!
  },

  // More DEPOSIT transactions
  {
    id: 't25',
    amount: 2500000,
    status: 'SUCCESS',
    createdAt: '2024-10-12T12:20:00.000Z',
    description: 'Wallet top-up via ZALOPAY',
    walletId: 'w7',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[6].wallet!,
    topupOrderId: 'to7'
  },
  {
    id: 't26',
    amount: 1800000,
    status: 'SUCCESS',
    createdAt: '2024-10-11T14:35:00.000Z',
    description: 'Wallet top-up via BANKING',
    walletId: 'w2',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[1].wallet!,
    topupOrderId: 'to8'
  },
  {
    id: 't27',
    amount: 3500000,
    status: 'FAILED',
    createdAt: '2024-10-10T09:45:00.000Z',
    description: 'Wallet top-up via MOMO - Transaction timeout',
    walletId: 'w4',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[3].wallet!,
    topupOrderId: 'to9'
  },
  {
    id: 't28',
    amount: 1200000,
    status: 'SUCCESS',
    createdAt: '2025-10-09T11:10:00.000Z',
    description: 'Wallet top-up via APPLEPAY',
    walletId: 'w6',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[5].wallet!,
    topupOrderId: 'to10'
  },

  // Historical transactions (August-September)
  {
    id: 't29',
    amount: 2200000,
    status: 'SUCCESS',
    createdAt: '2024-09-28T15:20:00.000Z',
    description: 'Course purchase: TOEFL 110+ Preparation',
    walletId: 'w1',
    transactionType: 'PAYMENT',
    wallet: mockUsers[0].wallet!
  },
  {
    id: 't30',
    amount: 399000,
    status: 'SUCCESS',
    createdAt: '2024-09-01T00:20:00.000Z',
    description: 'Monthly subscription fee - Basic Plan',
    walletId: 'w1',
    transactionType: 'MONTHLYFEE',
    wallet: mockUsers[0].wallet!,
    subscriptionContractId: 'sc1'
  },
  {
    id: 't31',
    amount: 1850000,
    status: 'SUCCESS',
    createdAt: '2025-09-25T10:30:00.000Z',
    description: 'Course purchase: Job Interview Champion',
    walletId: 'w3',
    transactionType: 'PAYMENT',
    wallet: mockUsers[2].wallet!
  },
  {
    id: 't32',
    amount: 4000000,
    status: 'SUCCESS',
    createdAt: '2024-09-20T13:45:00.000Z',
    description: 'Wallet top-up via MOMO',
    walletId: 'w5',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[4].wallet!,
    topupOrderId: 'to11'
  },
  {
    id: 't33',
    amount: 1600000,
    status: 'SUCCESS',
    createdAt: '2025-09-15T16:25:00.000Z',
    description: 'Earnings withdrawal to bank account',
    walletId: 'w7',
    transactionType: 'WITHDRAW',
    wallet: mockUsers[6].wallet!
  },
  {
    id: 't34',
    amount: 2450000,
    status: 'SUCCESS',
    createdAt: '2024-08-30T11:55:00.000Z',
    description: 'Course purchase: Scientific English for Researchers',
    walletId: 'w2',
    transactionType: 'PAYMENT',
    wallet: mockUsers[1].wallet!
  },
  {
    id: 't35',
    amount: 699000,
    status: 'SUCCESS',
    createdAt: '2025-08-01T00:00:00.000Z',
    description: 'Monthly subscription fee - Professional Plan',
    walletId: 'w3',
    transactionType: 'MONTHLYFEE',
    wallet: mockUsers[2].wallet!,
    subscriptionContractId: 'sc2'
  },
  {
    id: 't36',
    amount: 1350000,
    status: 'SUCCESS',
    createdAt: '2024-08-25T14:20:00.000Z',
    description: 'Course purchase: English for Hotel Management',
    walletId: 'w4',
    transactionType: 'PAYMENT',
    wallet: mockUsers[3].wallet!
  },
  {
    id: 't37',
    amount: 2800000,
    status: 'SUCCESS',
    createdAt: '2024-08-20T09:40:00.000Z',
    description: 'Wallet top-up via ZALOPAY',
    walletId: 'w6',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[5].wallet!,
    topupOrderId: 'to12'
  },
  {
    id: 't38',
    amount: 950000,
    status: 'SUCCESS',
    createdAt: '2024-08-15T12:15:00.000Z',
    description: 'Earnings withdrawal to MOMO wallet',
    walletId: 'w1',
    transactionType: 'WITHDRAW',
    wallet: mockUsers[0].wallet!
  },
  {
    id: 't39',
    amount: 1750000,
    status: 'SUCCESS',
    createdAt: '2025-08-10T15:30:00.000Z',
    description: 'Course purchase: Professional Email Writing',
    walletId: 'w7',
    transactionType: 'PAYMENT',
    wallet: mockUsers[6].wallet!
  },
  {
    id: 't40',
    amount: 3200000,
    status: 'FAILED',
    createdAt: '2025-08-05T10:45:00.000Z',
    description: 'Wallet top-up via BANKING - Bank maintenance',
    walletId: 'w2',
    transactionType: 'DEPOSIT',
    wallet: mockUsers[1].wallet!,
    topupOrderId: 'to13'
  }
];

// Mock TopupOrders với dữ liệu phù hợp schema
export const mockTopupOrders: TopupOrder[] = [
  {
    id: 'to1',
    userId: '2',
    realMoney: 2600000, // Số tiền thật khách hàng trả
    realAmount: 2500000, // Số tiền nạp vào wallet (sau phí)
    currency: 'VND',
    paymentMethod: 'MOMO',
    status: 'SUCCESS',
    createdAt: '2024-10-20T15:25:00.000Z',
    updatedAt: '2024-10-20T15:30:00.000Z',
    user: mockUsers[1]
  },
  {
    id: 'to2',
    userId: '2',
    realMoney: 1050000,
    realAmount: 1000000,
    currency: 'VND',
    paymentMethod: 'ZALOPAY',
    status: 'SUCCESS',
    createdAt: '2024-10-19T10:10:00.000Z',
    updatedAt: '2024-10-19T10:15:00.000Z',
    user: mockUsers[1]
  },
  {
    id: 'to3',
    userId: '4',
    realMoney: 525000,
    realAmount: 500000,
    currency: 'VND',
    paymentMethod: 'BANKING',
    status: 'PENDING',
    createdAt: '2024-10-25T14:20:00.000Z',
    updatedAt: '2024-10-25T14:20:00.000Z',
    user: mockUsers[3]
  }
];

// Mock CourseSellerApplications với dữ liệu phù hợp schema
export const mockCourseSellerApplications: CourseSellerApplication[] = [
  {
    id: 'csa1',
    userId: '6',
    certification: ['TESOL', 'IELTS 7.5'],
    expertise: ['Conversation', 'Grammar'],
    message: 'I have 5 years of teaching experience and would like to share my knowledge.',
    status: 'PENDING',
    createdAt: '2024-10-25T09:30:00.000Z',
    updatedAt: '2024-10-25T09:30:00.000Z',
    user: mockUsers[5]
  },
  {
    id: 'csa2',
    userId: '7',
    certification: ['TEFL', 'Medical English Certificate'],
    expertise: ['Medical English', 'Academic Writing'],
    message: 'Medical professional with teaching background.',
    status: 'APPROVED',
    createdAt: '2024-10-20T14:15:00.000Z',
    updatedAt: '2024-10-22T16:30:00.000Z',
    user: mockUsers[6]
  },
  {
    id: 'csa3',
    userId: '8',
    certification: ['CELTA'],
    expertise: ['Basic English'],
    message: 'New teacher looking to start online teaching.',
    status: 'REJECTED',
    rejectionReason: 'Insufficient experience and certifications',
    createdAt: '2024-10-18T11:00:00.000Z',
    updatedAt: '2024-10-19T10:30:00.000Z',
    user: {
      id: '8',
      email: 'newteacher@example.com',
      fullName: 'New Teacher',
      phoneNumber: '+84900000008',
      dateOfBirth: '1995-05-15T00:00:00.000Z',
      createdAt: '2024-10-15T08:00:00.000Z',
      englishLevel: 'B2',
      learningGoals: ['Teaching']
    }
  }
];

// Mock Reports với dữ liệu phù hợp schema
export const mockReports: Report[] = [
  {
    id: 'r1',
    content: 'This course contains inappropriate language and offensive content.',
    reasonType: 'INAPPROPRIATE_CONTENT',
    createdAt: '2024-10-25T10:30:00.000Z',
    userId: '2',
    courseId: 'c1',
    user: mockUsers[1],
    course: mockCourses[0]
  },
  {
    id: 'r2',
    content: 'The instructor is not responding to student questions and messages.',
    reasonType: 'UNRESPONSIVE_INSTRUCTOR',
    createdAt: '2024-10-24T15:45:00.000Z',
    userId: '4',
    courseId: 'c2',
    user: mockUsers[3],
    course: mockCourses[1]
  },
  {
    id: 'r3',
    content: 'Course content does not match the description provided.',
    reasonType: 'NOT_AS_DESCRIBED',
    createdAt: '2024-10-23T09:20:00.000Z',
    userId: '6',
    courseId: 'c3',
    user: mockUsers[5],
    course: mockCourses[2]
  }
];

// Mock SubscriptionContracts với dữ liệu phù hợp schema
export const mockSubscriptionContracts: SubscriptionContract[] = [
  {
    id: 'sc1',
    courseSellerId: '1',
    status: true, // active
    subscriptionPlanId: 'sp2',
    createdAt: '2024-01-15T10:30:00.000Z',
    expiresAt: '2024-11-15T10:30:00.000Z',
    updatedAt: '2024-10-01T10:30:00.000Z',
    renewalCount: 9,
    lastRenewalAt: '2024-10-01T10:30:00.000Z',
    notes: 'Regular subscriber, always pays on time',
    user: mockUsers[0],
    subscriptionPlan: mockSubscriptionPlans[1]
  },
  {
    id: 'sc2',
    courseSellerId: '3',
    status: true,
    subscriptionPlanId: 'sp3',
    createdAt: '2024-02-20T14:20:00.000Z',
    expiresAt: '2024-12-20T14:20:00.000Z',
    updatedAt: '2024-10-20T14:20:00.000Z',
    renewalCount: 8,
    lastRenewalAt: '2024-10-20T14:20:00.000Z',
    user: mockUsers[2],
    subscriptionPlan: mockSubscriptionPlans[2]
  },
  {
    id: 'sc3',
    courseSellerId: '5',
    status: false, // expired
    subscriptionPlanId: 'sp1',
    createdAt: '2024-01-30T16:30:00.000Z',
    expiresAt: '2024-10-30T16:30:00.000Z',
    updatedAt: '2024-10-30T16:30:00.000Z',
    renewalCount: 9,
    lastRenewalAt: '2024-09-30T16:30:00.000Z',
    notes: 'Subscription expired, user needs to renew',
    lastNotificationAt: '2024-10-25T10:00:00.000Z',
    user: mockUsers[4],
    subscriptionPlan: mockSubscriptionPlans[0]
  }
];

// Mock Notifications với dữ liệu phù hợp schema
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'Course Approved',
    content: 'Your course "Business English Mastery Pro" has been approved and is now live.',
    createdAt: '2024-10-25T10:30:00.000Z',
    seen: false,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0]
  },
  {
    id: 'n2',
    title: 'Payment Successful',
    content: 'Your payment of 2,500,000 VND has been processed successfully.',
    createdAt: '2024-10-20T15:30:00.000Z',
    seen: true,
    notificationTypeId: 'nt2',
    notificationType: mockNotificationTypes[1]
  },
  {
    id: 'n3',
    title: 'Subscription Renewal Reminder',
    content: 'Your subscription will expire in 5 days. Please renew to continue using our services.',
    createdAt: '2024-10-25T08:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt3',
    notificationType: mockNotificationTypes[2]
  }
];

// Mock English Test Types
export const mockEnglishTestTypes: EnglishTestType[] = [
  { id: 'ett1', name: 'IELTS' },
  { id: 'ett2', name: 'TOEFL' },
  { id: 'ett3', name: 'TOEIC' },
  { id: 'ett4', name: 'Cambridge English' }
];

// Mock Tests
export const mockTests: Test[] = [
  {
    id: 'test1',
    name: 'IELTS Academic Practice Test 1',
    description: 'Full-length IELTS Academic practice test',
    testTypeId: 'ett1',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-10-15T10:00:00.000Z',
    sections: [],
    testType: mockEnglishTestTypes[0]
  },
  {
    id: 'test2',
    name: 'TOEFL iBT Practice Test',
    description: 'Complete TOEFL iBT practice examination',
    testTypeId: 'ett2',
    createdAt: '2024-02-20T14:30:00.000Z',
    updatedAt: '2024-10-20T14:30:00.000Z',
    sections: [],
    testType: mockEnglishTestTypes[1]
  }
];

// Mock Practice Sessions
export const mockPracticeSessions: PracticeSession[] = [
  {
    id: 'ps1',
    userId: '2',
    testId: 'test1',
    selectedSections: ['reading', 'listening'],
    status: 'COMPLETED',
    createdAt: '2024-10-25T09:00:00.000Z',
    completedAt: '2024-10-25T11:30:00.000Z',
    user: mockUsers[1],
    test: mockTests[0]
  },
  {
    id: 'ps2',
    userId: '4',
    testId: 'test2',
    selectedSections: ['speaking', 'writing'],
    status: 'ONGOING',
    createdAt: '2024-10-25T14:00:00.000Z',
    user: mockUsers[3],
    test: mockTests[1]
  }
];

// Mock Ratings
export const mockRatings: Rating[] = [
  {
    id: 'rat1',
    score: 4.8,
    userId: '2',
    courseId: 'c1',
    content: 'Excellent course! Very comprehensive and well-structured.',
    createdAt: '2024-10-22T16:45:00.000Z',
    user: mockUsers[1],
    course: mockCourses[0]
  },
  {
    id: 'rat2',
    score: 4.9,
    userId: '4',
    courseId: 'c2',
    content: 'Amazing IELTS preparation. Highly recommend!',
    createdAt: '2024-10-20T10:20:00.000Z',
    user: mockUsers[3],
    course: mockCourses[1]
  }
];

// Dashboard Statistics
export const mockDashboardStats: DashboardStats = {
  totalUsers: 106346,
  totalCourses: 8500,
  totalRevenue: 2250000000,
  pendingApplications: 23,
  activeSubscriptions: 1523,
  monthlyGrowth: {
    users: 8.5,
    courses: 12.3,
    revenue: 15.7
  }
};

// Extended Revenue Data (12 months)
export const mockRevenueData: RevenueData[] = [
  { month: 'Jan 2024', revenue: 145000000, subscriptions: 1234, courses: 1876 },
  { month: 'Feb 2024', revenue: 156000000, subscriptions: 1298, courses: 1923 },
  { month: 'Mar 2024', revenue: 167000000, subscriptions: 1345, courses: 1987 },
  { month: 'Apr 2024', revenue: 178000000, subscriptions: 1387, courses: 2034 },
  { month: 'May 2024', revenue: 185000000, subscriptions: 1345, courses: 1923 },
  { month: 'Jun 2024', revenue: 198000000, subscriptions: 1398, courses: 2012 },
  { month: 'Jul 2024', revenue: 192000000, subscriptions: 1376, courses: 1978 },
  { month: 'Aug 2024', revenue: 208000000, subscriptions: 1456, courses: 2089 },
  { month: 'Sep 2024', revenue: 201000000, subscriptions: 1423, courses: 2045 },
  { month: 'Oct 2024', revenue: 215000000, subscriptions: 1489, courses: 2134 },
  { month: 'Nov 2024', revenue: 209000000, subscriptions: 1467, courses: 2098 },
  { month: 'Dec 2024', revenue: 225000000, subscriptions: 1523, courses: 2187 }
];

// Chart Data Arrays
export const mockUserGrowthData: ChartData[] = [
  { name: 'Jan 2024', value: 85567 },
  { name: 'Feb 2024', value: 87456 },
  { name: 'Mar 2024', value: 89345 },
  { name: 'Apr 2024', value: 91234 },
  { name: 'May 2024', value: 93123 },
  { name: 'Jun 2024', value: 95012 },
  { name: 'Jul 2024', value: 96901 },
  { name: 'Aug 2024', value: 98790 },
  { name: 'Sep 2024', value: 100679 },
  { name: 'Oct 2024', value: 102568 },
  { name: 'Nov 2024', value: 104457 },
  { name: 'Dec 2024', value: 106346 }
];

export const mockCourseStatusData: ChartData[] = [
  { name: 'Active', value: 6890 },
  { name: 'Pending', value: 567 },
  { name: 'Refuse', value: 234 },
  { name: 'Inactive', value: 456 },
  { name: 'Delete', value: 353 }
];

export const mockPaymentMethodsData: ChartData[] = [
  { name: 'MOMO', value: 8456 },
  { name: 'ZALOPAY', value: 7134 },
  { name: 'BANKING', value: 6876 },
  { name: 'APPLEPAY', value: 4654 }
];

export const mockTopCoursesData: ChartData[] = [
  { name: 'Business English Mastery Pro', value: 8247 },
  { name: 'IELTS 8.5+ Guarantee Course', value: 7989 },
  { name: 'Medical English for Doctors', value: 7756 },
  { name: 'Advanced Academic Writing', value: 7534 },
  { name: 'Tech English for Engineers', value: 7298 },
  { name: 'TOEFL 110+ Preparation', value: 7156 },
  { name: 'Legal English for Lawyers', value: 6987 },
  { name: 'Finance English Specialist', value: 6834 },
  { name: 'Job Interview Champion', value: 6723 },
  { name: 'Conversation Confidence Builder', value: 6645 }
];

export const mockRevenueByPlanData: ChartData[] = [
  { name: 'Starter Plan', value: 95670000 },
  { name: 'Basic Plan', value: 234560000 },
  { name: 'Professional Plan', value: 456780000 },
  { name: 'Enterprise Plan', value: 567890000 }
];

export const mockMonthlyActiveUsersData: ChartData[] = [
  { name: 'Jan', value: 78456 },
  { name: 'Feb', value: 82789 },
  { name: 'Mar', value: 85234 },
  { name: 'Apr', value: 83678 },
  { name: 'May', value: 89134 },
  { name: 'Jun', value: 92567 },
  { name: 'Jul', value: 90234 },
  { name: 'Aug', value: 95789 },
  { name: 'Sep', value: 93456 },
  { name: 'Oct', value: 98234 },
  { name: 'Nov', value: 96987 },
  { name: 'Dec', value: 101567 }
];

export const mockCategoriesData: ChartData[] = [
  { name: 'Business English', value: 23934 },
  { name: 'Test Preparation', value: 19456 },
  { name: 'Academic English', value: 16234 },
  { name: 'Conversation', value: 14678 },
  { name: 'Grammar', value: 12567 },
  { name: 'Professional English', value: 11234 },
  { name: 'Technical English', value: 9789 },
  { name: 'Medical English', value: 6234 },
  { name: 'Legal English', value: 5678 }
];

export const mockAgeGroupsData: ChartData[] = [
  { name: '18-25', value: 35934 },
  { name: '26-35', value: 42456 },
  { name: '36-45', value: 28876 },
  { name: '46-55', value: 16543 },
  { name: '56-65', value: 8210 },
  { name: '65+', value: 3234 }
];

export const mockCompletionRatesData: ChartData[] = [
  { name: 'Business English', value: 89 },
  { name: 'IELTS Prep', value: 94 },
  { name: 'Conversation', value: 82 },
  { name: 'Grammar', value: 87 },
  { name: 'Writing', value: 85 },
  { name: 'Speaking', value: 79 },
  { name: 'Reading', value: 91 },
  { name: 'Listening', value: 86 },
  { name: 'Medical English', value: 92 },
  { name: 'Legal English', value: 88 }
];

export const mockGeographicData: ChartData[] = [
  { name: 'Ho Chi Minh City', value: 45234 },
  { name: 'Hanoi', value: 38456 },
  { name: 'Da Nang', value: 12567 },
  { name: 'Can Tho', value: 8456 },
  { name: 'Hai Phong', value: 7890 },
  { name: 'Nha Trang', value: 6234 },
  { name: 'Hue', value: 5987 },
  { name: 'Other Cities', value: 8234 }
];

export const mockDeviceUsageData: ChartData[] = [
  { name: 'Mobile', value: 68456 },
  { name: 'Desktop', value: 35234 },
  { name: 'Tablet', value: 18765 },
  { name: 'Smart TV', value: 2345 }
];

export const mockEnrollmentTrendsData: ChartData[] = [
  { name: 'Jan', value: 15234 },
  { name: 'Feb', value: 16789 },
  { name: 'Mar', value: 18234 },
  { name: 'Apr', value: 17456 },
  { name: 'May', value: 19890 },
  { name: 'Jun', value: 21456 },
  { name: 'Jul', value: 20234 },
  { name: 'Aug', value: 22789 },
  { name: 'Sep', value: 21234 },
  { name: 'Oct', value: 24456 },
  { name: 'Nov', value: 23234 },
  { name: 'Dec', value: 25789 }
];

export const mockRevenueByCategory: ChartData[] = [
  { name: 'Business English', value: 456000000 },
  { name: 'Test Preparation', value: 389000000 },
  { name: 'Academic English', value: 298000000 },
  { name: 'Medical English', value: 234000000 },
  { name: 'Legal English', value: 189000000 },
  { name: 'Technical English', value: 156000000 },
  { name: 'Conversation', value: 134000000 },
  { name: 'Grammar', value: 98000000 }
];