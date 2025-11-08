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
    isLocked: false
  },
  {
    id: 'nt2', 
    name: 'PAYMENT_SUCCESS',
    isLocked: false
  },
  {
    id: 'nt3',
    name: 'SUBSCRIPTION_REMINDER',
    isLocked: false
  },
  {
    id: 'nt4',
    name: 'SYSTEM_MAINTENANCE',
    isLocked: true
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
  },
    {
    id: '8',
    email: 'anna.lee@example.com',
    fullName: 'Anna Lee',
    phoneNumber: '+84967890123',
    dateOfBirth: '1993-09-14T00:00:00.000Z',
    createdAt: '2024-03-12T09:45:00.000Z',
    englishLevel: 'B2',
    learningGoals: ['Business Communication', 'Email Writing'],
    wallet: {
      id: 'w8',
      allowance: 850000,
      userId: '8'
    }
  },
  {
    id: '9',
    email: 'thomas.nguyen@example.com',
    fullName: 'Thomas Nguyen',
    phoneNumber: '+84978901234',
    dateOfBirth: '1989-12-03T00:00:00.000Z',
    createdAt: '2024-02-28T14:30:00.000Z',
    englishLevel: 'C1',
    learningGoals: ['TOEFL Preparation', 'Academic Writing'],
    wallet: {
      id: 'w9',
      allowance: 1200000,
      userId: '9'
    }
  },
  {
    id: '10',
    email: 'maria.santos@example.com',
    fullName: 'Maria Santos',
    phoneNumber: '+84989012345',
    profilePicture: 'https://example.com/avatar10.jpg',
    dateOfBirth: '1991-06-28T00:00:00.000Z',
    createdAt: '2024-01-08T11:20:00.000Z',
    englishLevel: 'A2',
    learningGoals: ['Basic Conversation', 'Grammar'],
    wallet: {
      id: 'w10',
      allowance: 450000,
      userId: '10'
    }
  },

  // Course sellers
  {
    id: '11',
    email: 'dr.patricia.white@university.edu',
    fullName: 'Dr. Patricia White',
    phoneNumber: '+84990123456',
    profilePicture: 'https://example.com/avatar11.jpg',
    dateOfBirth: '1980-04-15T00:00:00.000Z',
    createdAt: '2024-01-05T16:45:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Academic Teaching', 'Research'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w11',
      allowance: 3200000,
      userId: '11'
    },
    courseSellerProfile: {
      id: 'csp4',
      certification: ['PhD Applied Linguistics', 'DELTA', 'IELTS Examiner'],
      expertise: ['Academic English', 'Research Writing', 'IELTS Preparation'],
      isActive: true,
      userId: '11'
    }
  },
  {
    id: '12',
    email: 'james.miller@corporate.com',
    fullName: 'James Miller',
    phoneNumber: '+84901234567',
    dateOfBirth: '1986-08-22T00:00:00.000Z',
    createdAt: '2024-02-20T10:15:00.000Z',
    englishLevel: 'C1',
    learningGoals: ['Corporate Training', 'Business English'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w12',
      allowance: 2800000,
      userId: '12'
    },
    courseSellerProfile: {
      id: 'csp5',
      certification: ['TESOL', 'Business English Specialist', 'MBA'],
      expertise: ['Business English', 'Corporate Communication', 'Presentation Skills'],
      isActive: true,
      userId: '12'
    }
  },
  {
    id: '13',
    email: 'susan.taylor@medical.com',
    fullName: 'Susan Taylor',
    phoneNumber: '+84912345678',
    profilePicture: 'https://example.com/avatar13.jpg',
    dateOfBirth: '1984-11-10T00:00:00.000Z',
    createdAt: '2024-03-01T13:20:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Medical English', 'Healthcare Communication'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w13',
      allowance: 2650000,
      userId: '13'
    },
    courseSellerProfile: {
      id: 'csp6',
      certification: ['RN License', 'Medical English Certificate', 'TEFL'],
      expertise: ['Medical English', 'Healthcare Communication', 'Nursing English'],
      isActive: true,
      userId: '13'
    }
  },

  // More students with diverse backgrounds
  {
    id: '14',
    email: 'kevin.park@student.edu',
    fullName: 'Kevin Park',
    phoneNumber: '+84923456789',
    dateOfBirth: '1997-01-18T00:00:00.000Z',
    createdAt: '2024-04-10T08:30:00.000Z',
    englishLevel: 'B1',
    learningGoals: ['University Preparation', 'IELTS'],
    wallet: {
      id: 'w14',
      allowance: 600000,
      userId: '14'
    }
  },
  {
    id: '15',
    email: 'lisa.wong@tech.com',
    fullName: 'Lisa Wong',
    phoneNumber: '+84934567890',
    dateOfBirth: '1992-07-25T00:00:00.000Z',
    createdAt: '2024-03-18T15:45:00.000Z',
    englishLevel: 'B2',
    learningGoals: ['Technical English', 'IT Communication'],
    wallet: {
      id: 'w15',
      allowance: 950000,
      userId: '15'
    }
  },
  {
    id: '16',
    email: 'robert.kim@finance.com',
    fullName: 'Robert Kim',
    phoneNumber: '+84945678901',
    profilePicture: 'https://example.com/avatar16.jpg',
    dateOfBirth: '1988-03-07T00:00:00.000Z',
    createdAt: '2024-02-14T12:10:00.000Z',
    englishLevel: 'C1',
    learningGoals: ['Finance English', 'Professional Communication'],
    wallet: {
      id: 'w16',
      allowance: 1350000,
      userId: '16'
    }
  },
  {
    id: '17',
    email: 'nancy.chen@hotel.vn',
    fullName: 'Nancy Chen',
    phoneNumber: '+84956789012',
    dateOfBirth: '1990-10-12T00:00:00.000Z',
    createdAt: '2024-01-22T09:55:00.000Z',
    englishLevel: 'B2',
    learningGoals: ['Hospitality English', 'Customer Service'],
    wallet: {
      id: 'w17',
      allowance: 720000,
      userId: '17'
    }
  },

  // Technical and specialized course sellers
  {
    id: '18',
    email: 'prof.alex.johnson@tech.edu',
    fullName: 'Prof. Alex Johnson',
    phoneNumber: '+84967890123',
    profilePicture: 'https://example.com/avatar18.jpg',
    dateOfBirth: '1979-05-30T00:00:00.000Z',
    createdAt: '2024-01-12T14:25:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Technical Teaching', 'Engineering English'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w18',
      allowance: 4100000,
      userId: '18'
    },
    courseSellerProfile: {
      id: 'csp7',
      certification: ['PhD Computer Science', 'TESOL', 'Technical Writing Certificate'],
      expertise: ['Technical English', 'Engineering Communication', 'IT English'],
      isActive: true,
      userId: '18'
    }
  },
  {
    id: '19',
    email: 'dr.rachel.brown@law.edu',
    fullName: 'Dr. Rachel Brown',
    phoneNumber: '+84978901234',
    dateOfBirth: '1982-12-08T00:00:00.000Z',
    createdAt: '2024-02-02T11:40:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Legal English', 'Academic Teaching'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w19',
      allowance: 3750000,
      userId: '19'
    },
    courseSellerProfile: {
      id: 'csp8',
      certification: ['JD Law Degree', 'Legal English Certificate', 'CELTA'],
      expertise: ['Legal English', 'Contract Writing', 'International Law Communication'],
      isActive: true,
      userId: '19'
    }
  },

  // More diverse students
  {
    id: '20',
    email: 'mike.davis@startup.vn',
    fullName: 'Mike Davis',
    phoneNumber: '+84989012345',
    dateOfBirth: '1994-02-17T00:00:00.000Z',
    createdAt: '2024-04-05T16:20:00.000Z',
    englishLevel: 'B1',
    learningGoals: ['Startup English', 'Pitch Presentation'],
    wallet: {
      id: 'w20',
      allowance: 800000,
      userId: '20'
    }
  },
  {
    id: '21',
    email: 'jenny.liu@marketing.com',
    fullName: 'Jenny Liu',
    phoneNumber: '+84990123456',
    profilePicture: 'https://example.com/avatar21.jpg',
    dateOfBirth: '1991-09-05T00:00:00.000Z',
    createdAt: '2024-03-25T10:35:00.000Z',
    englishLevel: 'B2',
    learningGoals: ['Marketing English', 'Social Media'],
    wallet: {
      id: 'w21',
      allowance: 1100000,
      userId: '21'
    }
  },
  {
    id: '22',
    email: 'david.tran@export.vn',
    fullName: 'David Tran',
    phoneNumber: '+84901234567',
    dateOfBirth: '1987-06-13T00:00:00.000Z',
    createdAt: '2024-02-08T13:50:00.000Z',
    englishLevel: 'C1',
    learningGoals: ['International Trade', 'Export Communication'],
    wallet: {
      id: 'w22',
      allowance: 1650000,
      userId: '22'
    }
  },

  // Aviation and specialized instructor
  {
    id: '23',
    email: 'captain.steve.wright@airline.com',
    fullName: 'Captain Steve Wright',
    phoneNumber: '+84912345678',
    profilePicture: 'https://example.com/avatar23.jpg',
    dateOfBirth: '1975-08-20T00:00:00.000Z',
    createdAt: '2024-01-18T15:10:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Aviation English', 'Safety Communication'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w23',
      allowance: 5200000,
      userId: '23'
    },
    courseSellerProfile: {
      id: 'csp9',
      certification: ['Commercial Pilot License', 'Aviation English Certificate', 'TESOL'],
      expertise: ['Aviation English', 'Flight Communication', 'Safety Procedures'],
      isActive: true,
      userId: '23'
    }
  },

  // Young students
  {
    id: '24',
    email: 'sophia.martinez@student.com',
    fullName: 'Sophia Martinez',
    phoneNumber: '+84923456789',
    dateOfBirth: '1999-11-22T00:00:00.000Z',
    createdAt: '2024-04-15T09:25:00.000Z',
    englishLevel: 'A2',
    learningGoals: ['Basic English', 'University Prep'],
    wallet: {
      id: 'w24',
      allowance: 400000,
      userId: '24'
    }
  },
  {
    id: '25',
    email: 'eric.pham@college.edu',
    fullName: 'Eric Pham',
    phoneNumber: '+84934567890',
    dateOfBirth: '1998-04-09T00:00:00.000Z',
    createdAt: '2024-03-30T11:15:00.000Z',
    englishLevel: 'B1',
    learningGoals: ['Academic English', 'Study Abroad'],
    wallet: {
      id: 'w25',
      allowance: 550000,
      userId: '25'
    }
  },

  // Finance and banking instructor
  {
    id: '26',
    email: 'william.thompson@bank.com',
    fullName: 'William Thompson',
    phoneNumber: '+84945678901',
    profilePicture: 'https://example.com/avatar26.jpg',
    dateOfBirth: '1983-01-16T00:00:00.000Z',
    createdAt: '2024-01-28T12:30:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Finance English', 'Banking Communication'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w26',
      allowance: 4500000,
      userId: '26'
    },
    courseSellerProfile: {
      id: 'csp10',
      certification: ['CFA Charter', 'Financial English Certificate', 'TEFL'],
      expertise: ['Finance English', 'Banking Communication', 'Investment Terminology'],
      isActive: true,
      userId: '26'
    }
  },

  // More professional students
  {
    id: '27',
    email: 'grace.wong@consulting.com',
    fullName: 'Grace Wong',
    phoneNumber: '+84956789012',
    dateOfBirth: '1989-07-31T00:00:00.000Z',
    createdAt: '2024-02-25T14:45:00.000Z',
    englishLevel: 'C1',
    learningGoals: ['Consulting English', 'Client Communication'],
    wallet: {
      id: 'w27',
      allowance: 1450000,
      userId: '27'
    }
  },
  {
    id: '28',
    email: 'daniel.park@realestate.vn',
    fullName: 'Daniel Park',
    phoneNumber: '+84967890123',
    dateOfBirth: '1985-12-04T00:00:00.000Z',
    createdAt: '2024-01-14T08:55:00.000Z',
    englishLevel: 'B2',
    learningGoals: ['Real Estate English', 'Property Investment'],
    wallet: {
      id: 'w28',
      allowance: 1250000,
      userId: '28'
    }
  },

  // Customer service instructor
  {
    id: '29',
    email: 'mark.johnson@bpo.com',
    fullName: 'Mark Johnson',
    phoneNumber: '+84978901234',
    profilePicture: 'https://example.com/avatar29.jpg',
    dateOfBirth: '1981-03-26T00:00:00.000Z',
    createdAt: '2024-02-12T16:20:00.000Z',
    englishLevel: 'C1',
    learningGoals: ['Customer Service', 'Call Center Training'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w29',
      allowance: 3100000,
      userId: '29'
    },
    courseSellerProfile: {
      id: 'csp11',
      certification: ['Customer Service Certificate', 'TESOL', 'Call Center Training'],
      expertise: ['Customer Service English', 'Call Center Communication', 'Service Excellence'],
      isActive: true,
      userId: '29'
    }
  },

  // Tourism and hospitality students
  {
    id: '30',
    email: 'linda.zhang@tourism.vn',
    fullName: 'Linda Zhang',
    phoneNumber: '+84989012345',
    dateOfBirth: '1993-05-18T00:00:00.000Z',
    createdAt: '2024-03-22T10:40:00.000Z',
    englishLevel: 'B1',
    learningGoals: ['Tourism English', 'Travel Communication'],
    wallet: {
      id: 'w30',
      allowance: 680000,
      userId: '30'
    }
  },

  // Additional admin user
  {
    id: 'admin2',
    email: 'admin2@example.com',
    fullName: 'Assistant Administrator',
    phoneNumber: '+84900000002',
    dateOfBirth: '1987-06-15T00:00:00.000Z',
    createdAt: '2023-06-01T09:00:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Platform Management', 'User Support'],
    role: 'ADMINISTRATOR',
    administratorProfile: {
      id: 'ap2',
      userId: 'admin2'
    }
  },

  // More diverse backgrounds
  {
    id: '31',
    email: 'ryan.kim@logistics.com',
    fullName: 'Ryan Kim',
    phoneNumber: '+84990123456',
    dateOfBirth: '1990-08-11T00:00:00.000Z',
    createdAt: '2024-04-02T13:25:00.000Z',
    englishLevel: 'B2',
    learningGoals: ['Logistics English', 'Supply Chain'],
    wallet: {
      id: 'w31',
      allowance: 920000,
      userId: '31'
    }
  },
  {
    id: '32',
    email: 'amanda.foster@pharma.com',
    fullName: 'Amanda Foster',
    phoneNumber: '+84901234567',
    profilePicture: 'https://example.com/avatar32.jpg',
    dateOfBirth: '1986-10-27T00:00:00.000Z',
    createdAt: '2024-02-18T11:30:00.000Z',
    englishLevel: 'C1',
    learningGoals: ['Pharmaceutical English', 'Scientific Communication'],
    wallet: {
      id: 'w32',
      allowance: 1550000,
      userId: '32'
    }
  },

  // Test preparation specialist
  {
    id: '33',
    email: 'dr.jennifer.lee@testprep.edu',
    fullName: 'Dr. Jennifer Lee',
    phoneNumber: '+84912345678',
    profilePicture: 'https://example.com/avatar33.jpg',
    dateOfBirth: '1978-09-12T00:00:00.000Z',
    createdAt: '2024-01-25T15:50:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Test Preparation', 'Academic Excellence'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w33',
      allowance: 4800000,
      userId: '33'
    },
    courseSellerProfile: {
      id: 'csp12',
      certification: ['PhD Education', 'TOEFL Specialist', 'Academic Writing Certificate'],
      expertise: ['TOEFL Preparation', 'Academic Writing', 'University Preparation'],
      isActive: true,
      userId: '33'
    }
  },

  // Pronunciation and phonetics specialist
  {
    id: '34',
    email: 'sophie.anderson@accent.com',
    fullName: 'Sophie Anderson',
    phoneNumber: '+84923456789',
    dateOfBirth: '1984-07-08T00:00:00.000Z',
    createdAt: '2024-03-05T12:15:00.000Z',
    englishLevel: 'C2',
    learningGoals: ['Pronunciation Training', 'Accent Coaching'],
    role: 'COURSESELLER',
    wallet: {
      id: 'w34',
      allowance: 2900000,
      userId: '34'
    },
    courseSellerProfile: {
      id: 'csp13',
      certification: ['Linguistics Degree', 'Pronunciation Certificate', 'CELTA'],
      expertise: ['Pronunciation', 'Accent Reduction', 'Phonetics'],
      isActive: true,
      userId: '34'
    }
  },

  // Final diverse students
  {
    id: '35',
    email: 'peter.martinez@engineer.com',
    fullName: 'Peter Martinez',
    phoneNumber: '+84934567890',
    dateOfBirth: '1991-12-19T00:00:00.000Z',
    createdAt: '2024-03-15T09:05:00.000Z',
    englishLevel: 'B2',
    learningGoals: ['Engineering English', 'Technical Documentation'],
    wallet: {
      id: 'w35',
      allowance: 1050000,
      userId: '35'
    }
  }
];

// Mock Subscription Plans
export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'sp1',
    name: 'Starter Plan',
    description: 'Basic plan for new instructors',
    maxCourses: 5,
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
    maxCourses: 100,
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
  },
    {
    id: 'c4',
    title: 'Advanced Academic Writing Masterclass',
    description: 'Master academic writing skills for university and research purposes',
    price: 2750000,
    courseLevel: 'C1',
    courseSellerId: '1',
    ratingCount: 198,
    status: 'DELETE',
    createdAt: '2024-03-10T11:20:00.000Z',
    updatedAt: '2024-10-10T11:20:00.000Z',
    averageRating: 4.7,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c5',
    title: 'TOEFL iBT 110+ Complete Course',
    description: 'Comprehensive TOEFL preparation with guaranteed results',
    price: 3100000,
    courseLevel: 'C1',
    courseSellerId: '3',
    ratingCount: 234,
    status: 'DELETE',
    createdAt: '2024-02-22T09:15:00.000Z',
    updatedAt: '2024-10-22T09:15:00.000Z',
    averageRating: 4.8,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c6',
    title: 'English Conversation Confidence Builder',
    description: 'Build speaking confidence through practical conversation exercises',
    price: 1850000,
    courseLevel: 'B1',
    courseSellerId: '5',
    ratingCount: 312,
    status: 'ACTIVE',
    createdAt: '2024-01-18T14:30:00.000Z',
    updatedAt: '2024-10-18T14:30:00.000Z',
    averageRating: 4.6,
    courseSeller: mockUsers[4]
  },
  {
    id: 'c7',
    title: 'Grammar Mastery Complete Edition',
    description: 'Master English grammar from basic to advanced levels',
    price: 1650000,
    courseLevel: 'B2',
    courseSellerId: '1',
    ratingCount: 287,
    status: 'ACTIVE',
    createdAt: '2024-03-05T16:45:00.000Z',
    updatedAt: '2024-10-05T16:45:00.000Z',
    averageRating: 4.5,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c8',
    title: 'Professional Email Writing Skills',
    description: 'Master professional email communication in English',
    price: 1350000,
    courseLevel: 'B2',
    courseSellerId: '3',
    ratingCount: 156,
    status: 'ACTIVE',
    createdAt: '2024-04-12T10:20:00.000Z',
    updatedAt: '2024-10-12T10:20:00.000Z',
    averageRating: 4.4,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c9',
    title: 'English for Job Interviews Success',
    description: 'Ace your English job interviews with confidence',
    price: 1950000,
    courseLevel: 'B2',
    courseSellerId: '5',
    ratingCount: 203,
    status: 'DELETE',
    createdAt: '2024-03-28T13:10:00.000Z',
    updatedAt: '2024-10-28T13:10:00.000Z',
    averageRating: 4.7,
    courseSeller: mockUsers[4]
  },
  {
    id: 'c10',
    title: 'Legal English for Lawyers',
    description: 'Specialized English course for legal professionals',
    price: 3250000,
    courseLevel: 'C1',
    courseSellerId: '1',
    ratingCount: 89,
    status: 'ACTIVE',
    createdAt: '2024-02-08T08:45:00.000Z',
    updatedAt: '2024-10-08T08:45:00.000Z',
    averageRating: 4.8,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c11',
    title: 'Technical English for Engineers',
    description: 'English communication skills for engineering professionals',
    price: 2850000,
    courseLevel: 'B2',
    courseSellerId: '3',
    ratingCount: 145,
    status: 'ACTIVE',
    createdAt: '2024-01-25T12:30:00.000Z',
    updatedAt: '2024-10-25T12:30:00.000Z',
    averageRating: 4.6,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c12',
    title: 'Pronunciation Perfect Course',
    description: 'Master English pronunciation and accent reduction',
    price: 1750000,
    courseLevel: 'B1',
    courseSellerId: '5',
    ratingCount: 267,
    status: 'ACTIVE',
    createdAt: '2024-04-02T15:20:00.000Z',
    updatedAt: '2024-10-02T15:20:00.000Z',
    averageRating: 4.5,
    courseSeller: mockUsers[4]
  },
  {
    id: 'c13',
    title: 'English for Tourism and Hospitality',
    description: 'Essential English for tourism and hotel industry professionals',
    price: 2150000,
    courseLevel: 'B2',
    courseSellerId: '1',
    ratingCount: 178,
    status: 'ACTIVE',
    createdAt: '2024-03-15T09:40:00.000Z',
    updatedAt: '2024-10-15T09:40:00.000Z',
    averageRating: 4.4,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c14',
    title: 'Cambridge CAE Preparation Course',
    description: 'Complete preparation for Cambridge Certificate in Advanced English',
    price: 2950000,
    courseLevel: 'C1',
    courseSellerId: '3',
    ratingCount: 134,
    status: 'INACTIVE',
    createdAt: '2024-02-18T11:25:00.000Z',
    updatedAt: '2024-10-18T11:25:00.000Z',
    averageRating: 4.7,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c15',
    title: 'English for Banking and Finance',
    description: 'Specialized English for banking and financial services',
    price: 2650000,
    courseLevel: 'B2',
    courseSellerId: '5',
    ratingCount: 112,
    status: 'ACTIVE',
    createdAt: '2024-01-12T14:15:00.000Z',
    updatedAt: '2024-10-12T14:15:00.000Z',
    averageRating: 4.6,
    courseSeller: mockUsers[4]
  },
  {
    id: 'c16',
    title: 'English Reading Comprehension Mastery',
    description: 'Improve reading skills and comprehension strategies',
    price: 1550000,
    courseLevel: 'B1',
    courseSellerId: '1',
    ratingCount: 245,
    status: 'INACTIVE',
    createdAt: '2024-04-05T10:50:00.000Z',
    updatedAt: '2024-10-05T10:50:00.000Z',
    averageRating: 4.3,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c17',
    title: 'Business Presentation Skills in English',
    description: 'Master the art of presenting in English for business',
    price: 2250000,
    courseLevel: 'B2',
    courseSellerId: '3',
    ratingCount: 189,
    status: 'ACTIVE',
    createdAt: '2024-03-20T16:30:00.000Z',
    updatedAt: '2024-10-20T16:30:00.000Z',
    averageRating: 4.5,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c18',
    title: 'English for Sales and Marketing',
    description: 'English communication skills for sales and marketing professionals',
    price: 2350000,
    courseLevel: 'B2',
    courseSellerId: '5',
    ratingCount: 167,
    status: 'INACTIVE',
    createdAt: '2024-02-28T13:45:00.000Z',
    updatedAt: '2024-10-28T13:45:00.000Z',
    averageRating: 4.4,
    courseSeller: mockUsers[4]
  },
  {
    id: 'c19',
    title: 'English Listening Skills Bootcamp',
    description: 'Intensive course to improve English listening comprehension',
    price: 1450000,
    courseLevel: 'B1',
    courseSellerId: '1',
    ratingCount: 298,
    status: 'ACTIVE',
    createdAt: '2024-04-08T12:10:00.000Z',
    updatedAt: '2024-10-08T12:10:00.000Z',
    averageRating: 4.2,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c20',
    title: 'TOEIC Test Preparation Complete',
    description: 'Comprehensive TOEIC preparation for high scores',
    price: 2550000,
    courseLevel: 'B2',
    courseSellerId: '3',
    ratingCount: 201,
    status: 'ACTIVE',
    createdAt: '2024-01-30T09:25:00.000Z',
    updatedAt: '2024-10-30T09:25:00.000Z',
    averageRating: 4.6,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c21',
    title: 'English for Nurses and Healthcare',
    description: 'Medical English for nursing and healthcare professionals',
    price: 2750000,
    courseLevel: 'B2',
    courseSellerId: '5',
    ratingCount: 143,
    status: 'PENDING',
    createdAt: '2024-10-28T14:20:00.000Z',
    updatedAt: '2024-10-28T14:20:00.000Z',
    averageRating: 4.5,
    courseSeller: mockUsers[4]
  },
  {
    id: 'c22',
    title: 'Creative Writing in English',
    description: 'Develop creative writing skills in English',
    price: 1850000,
    courseLevel: 'C1',
    courseSellerId: '1',
    ratingCount: 156,
    status: 'ACTIVE',
    createdAt: '2024-03-12T11:35:00.000Z',
    updatedAt: '2024-10-12T11:35:00.000Z',
    averageRating: 4.4,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c23',
    title: 'English for International Trade',
    description: 'English skills for import/export and international business',
    price: 2450000,
    courseLevel: 'B2',
    courseSellerId: '3',
    ratingCount: 123,
    status: 'ACTIVE',
    createdAt: '2024-02-14T15:50:00.000Z',
    updatedAt: '2024-10-14T15:50:00.000Z',
    averageRating: 4.3,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c24',
    title: 'English Vocabulary Builder Pro',
    description: 'Systematic approach to building advanced English vocabulary',
    price: 1250000,
    courseLevel: 'B1',
    courseSellerId: '5',
    ratingCount: 334,
    status: 'ACTIVE',
    createdAt: '2024-04-18T08:15:00.000Z',
    updatedAt: '2024-10-18T08:15:00.000Z',
    averageRating: 4.1,
    courseSeller: mockUsers[4]
  },
  {
    id: 'c25',
    title: 'English for IT Professionals',
    description: 'Technical English for software developers and IT specialists',
    price: 2650000,
    courseLevel: 'B2',
    courseSellerId: '1',
    ratingCount: 187,
    status: 'ACTIVE',
    createdAt: '2024-01-22T10:40:00.000Z',
    updatedAt: '2024-10-22T10:40:00.000Z',
    averageRating: 4.5,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c26',
    title: 'Executive Business English Communication',
    description: 'High-level English for executives and senior management',
    price: 3450000,
    courseLevel: 'C1',
    courseSellerId: '3',
    ratingCount: 98,
    status: 'ACTIVE',
    createdAt: '2024-02-25T14:25:00.000Z',
    updatedAt: '2024-10-25T14:25:00.000Z',
    averageRating: 4.8,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c27',
    title: 'English for Customer Service Excellence',
    description: 'Master customer service communication in English',
    price: 1750000,
    courseLevel: 'B1',
    courseSellerId: '5',
    ratingCount: 212,
    status: 'REFUSE',
    createdAt: '2024-03-08T12:55:00.000Z',
    updatedAt: '2024-10-08T12:55:00.000Z',
    averageRating: 4.3,
    courseSeller: mockUsers[4]
  },
  {
    id: 'c28',
    title: 'Scientific English for Researchers',
    description: 'English for academic research and scientific publications',
    price: 2950000,
    courseLevel: 'C1',
    courseSellerId: '1',
    ratingCount: 134,
    status: 'ACTIVE',
    createdAt: '2024-01-15T16:20:00.000Z',
    updatedAt: '2024-10-15T16:20:00.000Z',
    averageRating: 4.7,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c29',
    title: 'English for Real Estate Professionals',
    description: 'Specialized English for real estate agents and brokers',
    price: 2150000,
    courseLevel: 'B2',
    courseSellerId: '3',
    ratingCount: 145,
    status: 'PENDING',
    createdAt: '2024-10-26T09:30:00.000Z',
    updatedAt: '2024-10-26T09:30:00.000Z',
    averageRating: 4.4,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c30',
    title: 'English Public Speaking Mastery',
    description: 'Overcome fear and master public speaking in English',
    price: 2250000,
    courseLevel: 'B2',
    courseSellerId: '5',
    ratingCount: 178,
    status: 'REFUSE',
    createdAt: '2024-03-30T11:10:00.000Z',
    updatedAt: '2024-10-30T11:10:00.000Z',
    averageRating: 4.6,
    courseSeller: mockUsers[4]
  },
  {
    id: 'c31',
    title: 'English Writing Workshop Advanced',
    description: 'Advanced writing techniques for professional and academic purposes',
    price: 2350000,
    courseLevel: 'C1',
    courseSellerId: '1',
    ratingCount: 156,
    status: 'REFUSE',
    createdAt: '2024-02-12T13:45:00.000Z',
    updatedAt: '2024-10-12T13:45:00.000Z',
    averageRating: 4.5,
    courseSeller: mockUsers[0]
  },
  {
    id: 'c32',
    title: 'English for Aviation Professionals',
    description: 'Aviation English for pilots, air traffic controllers, and cabin crew',
    price: 3150000,
    courseLevel: 'C1',
    courseSellerId: '3',
    ratingCount: 87,
    status: 'ACTIVE',
    createdAt: '2024-01-28T15:30:00.000Z',
    updatedAt: '2024-10-28T15:30:00.000Z',
    averageRating: 4.8,
    courseSeller: mockUsers[2]
  },
  {
    id: 'c33',
    title: 'Beginner English Foundation Course',
    description: 'Complete foundation course for absolute beginners',
    price: 1150000,
    courseLevel: 'A1',
    courseSellerId: '5',
    ratingCount: 412,
    status: 'ACTIVE',
    createdAt: '2024-04-15T10:25:00.000Z',
    updatedAt: '2024-10-15T10:25:00.000Z',
    averageRating: 4.2,
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
  },
   {
    id: 'csa4',
    userId: '9',
    certification: ['TEFL', 'TOEFL 102'],
    expertise: ['Business English', 'TOEFL Preparation'],
    message: 'I am a business English specialist with 7 years of corporate training experience. I have trained over 500 professionals in multinational companies.',
    status: 'PENDING',
    createdAt: '2024-10-28T14:25:00.000Z',
    user: {
      id: '9',
      email: 'sarah.johnson@example.com',
      fullName: 'Sarah Johnson',
      phoneNumber: '+84901234589',
      dateOfBirth: '1987-08-15T00:00:00.000Z',
      createdAt: '2024-10-25T10:30:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Business English']
    }
  },
  {
    id: 'csa5',
    userId: '10',
    certification: ['DELTA', 'Cambridge CPE'],
    expertise: ['Academic Writing', 'IELTS Preparation', 'Cambridge Exams'],
    message: 'University lecturer with PhD in Applied Linguistics. Specialized in test preparation and academic English. Published researcher in language teaching methodologies.',
    status: 'PENDING',
    createdAt: '2024-10-27T16:45:00.000Z',
    user: {
      id: '10',
      email: 'dr.michael.brown@university.edu',
      fullName: 'Dr. Michael Brown',
      phoneNumber: '+84912345690',
      dateOfBirth: '1982-03-22T00:00:00.000Z',
      createdAt: '2024-10-24T09:15:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Academic Research']
    }
  },
  {
    id: 'csa6',
    userId: '11',
    certification: ['TESOL', 'Medical English Specialist'],
    expertise: ['Medical English', 'Nursing English'],
    message: 'Registered nurse and certified English teacher. I want to help healthcare professionals improve their English communication skills.',
    status: 'PENDING',
    createdAt: '2024-10-26T11:30:00.000Z',
    user: {
      id: '11',
      email: 'nurse.emma@hospital.com',
      fullName: 'Emma Wilson',
      phoneNumber: '+84923456791',
      dateOfBirth: '1990-06-10T00:00:00.000Z',
      createdAt: '2024-10-23T14:20:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Medical English']
    }
  },
  {
    id: 'csa7',
    userId: '12',
    certification: ['CELTA', 'IELTS 8.0'],
    expertise: ['Conversation', 'Pronunciation'],
    message: 'Native English speaker from Australia with 4 years teaching experience in Vietnam. Passionate about helping students with speaking confidence.',
    status: 'PENDING',
    createdAt: '2024-10-25T13:15:00.000Z',
    user: {
      id: '12',
      email: 'james.taylor@aussie.com',
      fullName: 'James Taylor',
      phoneNumber: '+84934567892',
      dateOfBirth: '1988-12-05T00:00:00.000Z',
      createdAt: '2024-10-22T16:45:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Cultural Exchange']
    }
  },
  {
    id: 'csa8',
    userId: '13',
    certification: ['TEFL', 'Legal English Certificate'],
    expertise: ['Legal English', 'Contract Writing'],
    message: 'Lawyer with 10 years experience in international law. I specialize in legal English for Vietnamese lawyers working with international clients.',
    status: 'PENDING',
    createdAt: '2024-10-24T09:45:00.000Z',
    user: {
      id: '13',
      email: 'lawyer.nguyen@lawfirm.vn',
      fullName: 'Nguyen Van Duc',
      phoneNumber: '+84945678993',
      dateOfBirth: '1985-04-18T00:00:00.000Z',
      createdAt: '2024-10-21T11:30:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Legal English']
    }
  },

  // APPROVED Applications
  {
    id: 'csa9',
    userId: '14',
    certification: ['TESOL', 'Business English Specialist', 'TOEIC 980'],
    expertise: ['Business English', 'Corporate Training', 'Presentation Skills'],
    message: 'Former corporate trainer at Samsung Vietnam with 8 years experience. Ready to share knowledge with ambitious professionals.',
    status: 'APPROVED',
    createdAt: '2024-10-15T10:20:00.000Z',
    user: {
      id: '14',
      email: 'trainer.lisa@corporate.com',
      fullName: 'Lisa Park',
      phoneNumber: '+84956789094',
      dateOfBirth: '1984-09-30T00:00:00.000Z',
      createdAt: '2024-10-12T08:15:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Business Training']
    }
  },
  {
    id: 'csa10',
    userId: '15',
    certification: ['DELTA', 'IELTS Examiner Certificate'],
    expertise: ['IELTS Preparation', 'Academic English', 'Test Strategies'],
    message: 'Official IELTS examiner with 6 years of examining experience. I know exactly what examiners look for in high-scoring responses.',
    status: 'APPROVED',
    createdAt: '2024-10-12T14:30:00.000Z',
    user: {
      id: '15',
      email: 'examiner.robert@ielts.org',
      fullName: 'Robert Smith',
      phoneNumber: '+84967890195',
      dateOfBirth: '1981-07-14T00:00:00.000Z',
      createdAt: '2024-10-09T12:45:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Test Preparation']
    }
  },
  {
    id: 'csa11',
    userId: '16',
    certification: ['TEFL', 'IT English Specialist'],
    expertise: ['Technical English', 'IT Vocabulary', 'Software Documentation'],
    message: 'Software engineer turned English teacher. I help IT professionals communicate effectively in international tech companies.',
    status: 'APPROVED',
    createdAt: '2024-10-10T16:20:00.000Z',
    user: {
      id: '16',
      email: 'tech.teacher@software.com',
      fullName: 'Alex Chen',
      phoneNumber: '+84978901296',
      dateOfBirth: '1989-11-25T00:00:00.000Z',
      createdAt: '2024-10-07T15:30:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Technical Communication']
    }
  },
  {
    id: 'csa12',
    userId: '17',
    certification: ['TESOL', 'Cambridge CELTA', 'Young Learners Extension'],
    expertise: ['General English', 'Grammar', 'Vocabulary Building'],
    message: 'Experienced teacher with passion for making English learning fun and effective. Taught in 3 different countries.',
    status: 'APPROVED',
    createdAt: '2024-10-08T11:15:00.000Z',
    user: {
      id: '17',
      email: 'teacher.maria@international.edu',
      fullName: 'Maria Rodriguez',
      phoneNumber: '+84989012397',
      dateOfBirth: '1986-02-28T00:00:00.000Z',
      createdAt: '2024-10-05T09:20:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Language Education']
    }
  },

  // REJECTED Applications
  {
    id: 'csa13',
    userId: '18',
    certification: ['Online TEFL (120 hours)'],
    expertise: ['Conversation'],
    message: 'I love English and want to teach online. I have good English skills and am very motivated.',
    status: 'REJECTED',
    rejectionReason: 'Insufficient formal qualifications and teaching experience. Recommend gaining more teaching experience before reapplying.',
    createdAt: '2024-10-20T09:30:00.000Z',
    user: {
      id: '18',
      email: 'enthusiast@email.com',
      fullName: 'John Enthusiast',
      phoneNumber: '+84990123498',
      dateOfBirth: '1995-01-15T00:00:00.000Z',
      createdAt: '2024-10-17T13:45:00.000Z',
      englishLevel: 'B2',
      learningGoals: ['Teaching']
    }
  },
  {
    id: 'csa14',
    userId: '19',
    certification: ['High School English Teacher Certificate'],
    expertise: ['Basic Grammar', 'Reading'],
    message: 'High school teacher looking for extra income. I teach English at local high school.',
    status: 'REJECTED',
    rejectionReason: 'Lacks specialized adult/professional English teaching qualifications. Platform focuses on professional and test preparation courses.',
    createdAt: '2024-10-18T15:45:00.000Z',
    user: {
      id: '19',
      email: 'highschool.teacher@school.vn',
      fullName: 'Tran Thi Mai',
      phoneNumber: '+84901234599',
      dateOfBirth: '1992-05-20T00:00:00.000Z',
      createdAt: '2024-10-15T10:30:00.000Z',
      englishLevel: 'B2',
      learningGoals: ['Teaching', 'Professional Development']
    }
  },
  {
    id: 'csa15',
    userId: '20',
    certification: ['Self-taught'],
    expertise: ['Conversation', 'Basic English'],
    message: 'I am fluent in English and have helped many friends improve their English. I think I can be a good teacher.',
    status: 'REJECTED',
    rejectionReason: 'No formal teaching qualifications or certifications. Requires recognized TEFL/TESOL certification minimum.',
    createdAt: '2024-10-16T12:20:00.000Z',
    user: {
      id: '20',
      email: 'selftaught@gmail.com',
      fullName: 'Le Van Minh',
      phoneNumber: '+84912345600',
      dateOfBirth: '1993-08-10T00:00:00.000Z',
      createdAt: '2024-10-13T14:15:00.000Z',
      englishLevel: 'B2',
      learningGoals: ['Teaching']
    }
  },
  {
    id: 'csa16',
    userId: '21',
    certification: ['TEFL (40 hours)', 'IELTS 6.5'],
    expertise: ['Beginner English'],
    message: 'Recent graduate wanting to start teaching career. Studied English literature in university.',
    status: 'REJECTED',
    rejectionReason: 'TEFL certification hours insufficient (minimum 120 hours required). IELTS score below required standard (7.0+ needed).',
    createdAt: '2024-10-14T10:50:00.000Z',
    user: {
      id: '21',
      email: 'newgrad@university.edu.vn',
      fullName: 'Pham Thi Lan',
      phoneNumber: '+84923456701',
      dateOfBirth: '1999-03-12T00:00:00.000Z',
      createdAt: '2024-10-11T16:20:00.000Z',
      englishLevel: 'B2',
      learningGoals: ['Teaching', 'Career Development']
    }
  },

  // More PENDING Applications
  {
    id: 'csa17',
    userId: '22',
    certification: ['TESOL', 'Aviation English Specialist'],
    expertise: ['Aviation English', 'Technical Communication'],
    message: 'Former airline pilot with aviation English teaching certification. Want to help aviation professionals improve their English communication.',
    status: 'PENDING',
    createdAt: '2024-10-23T08:40:00.000Z',
    user: {
      id: '22',
      email: 'pilot.captain@airline.com',
      fullName: 'Captain David Wright',
      phoneNumber: '+84934567802',
      dateOfBirth: '1980-10-08T00:00:00.000Z',
      createdAt: '2024-10-20T11:25:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Aviation English']
    }
  },
  {
    id: 'csa18',
    userId: '23',
    certification: ['CELTA', 'Tourism English Certificate'],
    expertise: ['Tourism English', 'Hospitality Communication'],
    message: 'Hotel manager with extensive experience in international hospitality. Passionate about helping tourism professionals excel in English.',
    status: 'PENDING',
    createdAt: '2024-10-22T13:55:00.000Z',
    user: {
      id: '23',
      email: 'hotel.manager@resort.vn',
      fullName: 'Anna Nguyen',
      phoneNumber: '+84945678903',
      dateOfBirth: '1987-12-15T00:00:00.000Z',
      createdAt: '2024-10-19T09:40:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Hospitality English']
    }
  },
  {
    id: 'csa19',
    userId: '24',
    certification: ['TEFL', 'Financial English Specialist', 'CFA Charter'],
    expertise: ['Finance English', 'Banking Communication', 'Investment Terminology'],
    message: 'Chartered Financial Analyst working in investment banking. Want to teach finance English to Vietnamese professionals entering global markets.',
    status: 'PENDING',
    createdAt: '2024-10-21T15:30:00.000Z',
    user: {
      id: '24',
      email: 'cfa.banker@investment.com',
      fullName: 'William Thompson',
      phoneNumber: '+84956789004',
      dateOfBirth: '1983-06-25T00:00:00.000Z',
      createdAt: '2024-10-18T12:15:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Financial English']
    }
  },

  // More APPROVED Applications
  {
    id: 'csa20',
    userId: '25',
    certification: ['DELTA', 'TOEFL iBT Specialist', 'Academic Writing Certificate'],
    expertise: ['TOEFL Preparation', 'Academic Writing', 'University Preparation'],
    message: 'University preparation specialist with 9 years helping students achieve their dream TOEFL scores for US universities.',
    status: 'APPROVED',
    createdAt: '2024-10-05T14:20:00.000Z',
    user: {
      id: '25',
      email: 'toefl.expert@prep.edu',
      fullName: 'Dr. Jennifer Lee',
      phoneNumber: '+84967890105',
      dateOfBirth: '1979-04-30T00:00:00.000Z',
      createdAt: '2024-10-02T10:30:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Test Preparation']
    }
  },
  {
    id: 'csa21',
    userId: '26',
    certification: ['TESOL', 'Customer Service English Certificate'],
    expertise: ['Customer Service English', 'Call Center Training', 'Service Communication'],
    message: 'Customer service trainer for multinational BPO companies. Specialized in training Vietnamese staff for international customers.',
    status: 'APPROVED',
    createdAt: '2024-10-03T11:45:00.000Z',
    user: {
      id: '26',
      email: 'service.trainer@bpo.com',
      fullName: 'Mark Johnson',
      phoneNumber: '+84978901206',
      dateOfBirth: '1985-08-12T00:00:00.000Z',
      createdAt: '2024-09-30T13:20:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Service Excellence']
    }
  },

  // Recent Applications (last few days)
  {
    id: 'csa22',
    userId: '27',
    certification: ['CELTA', 'Pronunciation Specialist Certificate'],
    expertise: ['Pronunciation', 'Accent Reduction', 'Phonetics'],
    message: 'Pronunciation coach with linguistics background. Help professionals sound more confident and clear in international meetings.',
    status: 'PENDING',
    createdAt: '2024-10-29T10:15:00.000Z',
    user: {
      id: '27',
      email: 'pronunciation.coach@accent.com',
      fullName: 'Sophie Anderson',
      phoneNumber: '+84989012307',
      dateOfBirth: '1988-01-22T00:00:00.000Z',
      createdAt: '2024-10-26T14:30:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Pronunciation Training']
    }
  },
  {
    id: 'csa23',
    userId: '28',
    certification: ['TEFL', 'Real Estate English Certificate'],
    expertise: ['Real Estate English', 'Property Investment', 'Contract Language'],
    message: 'Real estate professional with international experience. Want to help Vietnamese realtors communicate with foreign investors.',
    status: 'PENDING',
    createdAt: '2024-10-29T16:45:00.000Z',
    user: {
      id: '28',
      email: 'realtor.international@property.vn',
      fullName: 'Kevin Zhang',
      phoneNumber: '+84990123408',
      dateOfBirth: '1984-11-18T00:00:00.000Z',
      createdAt: '2024-10-27T08:20:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Real Estate English']
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
  },
  {
    id: 'sc4',
    courseSellerId: '7',
    status: false,
    subscriptionPlanId: 'sp1', // Starter Plan
    createdAt: '2024-08-15T09:20:00.000Z',
    expiresAt: '2024-11-15T09:20:00.000Z',
    updatedAt: '2024-10-15T09:20:00.000Z',
    renewalCount: 2,
    lastRenewalAt: '2024-10-15T09:20:00.000Z',
    notes: 'New instructor, started with basic plan',
    user: mockUsers[6],
    subscriptionPlan: mockSubscriptionPlans[0]
  },
  {
    id: 'sc5',
    courseSellerId: '14',
    status: true,
    subscriptionPlanId: 'sp1', // Starter Plan
    createdAt: '2024-09-10T14:45:00.000Z',
    expiresAt: '2024-12-10T14:45:00.000Z',
    updatedAt: '2024-11-10T14:45:00.000Z',
    renewalCount: 1,
    lastRenewalAt: '2024-11-10T14:45:00.000Z',
    notes: 'Testing platform before upgrading',
    user: {
      id: '14',
      email: 'trainer.lisa@corporate.com',
      fullName: 'Lisa Park',
      phoneNumber: '+84956789094',
      dateOfBirth: '1984-09-30T00:00:00.000Z',
      createdAt: '2024-10-12T08:15:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Business Training']
    },
    subscriptionPlan: mockSubscriptionPlans[0]
  },

  // Active Basic Plan Subscriptions
  {
    id: 'sc6',
    courseSellerId: '15',
    status: true,
    subscriptionPlanId: 'sp2', // Basic Plan
    createdAt: '2024-05-20T11:30:00.000Z',
    expiresAt: '2025-01-20T11:30:00.000Z',
    updatedAt: '2024-11-20T11:30:00.000Z',
    renewalCount: 6,
    lastRenewalAt: '2024-11-20T11:30:00.000Z',
    notes: 'Consistent performer, good course ratings',
    user: {
      id: '15',
      email: 'examiner.robert@ielts.org',
      fullName: 'Robert Smith',
      phoneNumber: '+84967890195',
      dateOfBirth: '1981-07-14T00:00:00.000Z',
      createdAt: '2024-10-09T12:45:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Test Preparation']
    },
    subscriptionPlan: mockSubscriptionPlans[1]
  },
  {
    id: 'sc7',
    courseSellerId: '16',
    status: false,
    subscriptionPlanId: 'sp2', // Basic Plan
    createdAt: '2024-07-03T16:15:00.000Z',
    expiresAt: '2024-12-03T16:15:00.000Z',
    updatedAt: '2024-11-03T16:15:00.000Z',
    renewalCount: 4,
    lastRenewalAt: '2024-11-03T16:15:00.000Z',
    notes: 'Tech specialist, growing student base',
    user: {
      id: '16',
      email: 'tech.teacher@software.com',
      fullName: 'Alex Chen',
      phoneNumber: '+84978901296',
      dateOfBirth: '1989-11-25T00:00:00.000Z',
      createdAt: '2024-10-07T15:30:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Technical Communication']
    },
    subscriptionPlan: mockSubscriptionPlans[1]
  },
  {
    id: 'sc8',
    courseSellerId: '17',
    status: true,
    subscriptionPlanId: 'sp2', // Basic Plan
    createdAt: '2024-04-12T08:45:00.000Z',
    expiresAt: '2024-12-12T08:45:00.000Z',
    updatedAt: '2024-10-12T08:45:00.000Z',
    renewalCount: 7,
    lastRenewalAt: '2024-10-12T08:45:00.000Z',
    notes: 'International teacher, very reliable',
    user: {
      id: '17',
      email: 'teacher.maria@international.edu',
      fullName: 'Maria Rodriguez',
      phoneNumber: '+84989012397',
      dateOfBirth: '1986-02-28T00:00:00.000Z',
      createdAt: '2024-10-05T09:20:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Language Education']
    },
    subscriptionPlan: mockSubscriptionPlans[1]
  },

  // Active Professional Plan Subscriptions
  {
    id: 'sc9',
    courseSellerId: '25',
    status: true,
    subscriptionPlanId: 'sp3', // Professional Plan
    createdAt: '2024-03-08T12:20:00.000Z',
    expiresAt: '2025-02-08T12:20:00.000Z',
    updatedAt: '2024-11-08T12:20:00.000Z',
    renewalCount: 8,
    lastRenewalAt: '2024-11-08T12:20:00.000Z',
    notes: 'Top performer, excellent student feedback',
    user: {
      id: '25',
      email: 'toefl.expert@prep.edu',
      fullName: 'Dr. Jennifer Lee',
      phoneNumber: '+84967890105',
      dateOfBirth: '1979-04-30T00:00:00.000Z',
      createdAt: '2024-10-02T10:30:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Test Preparation']
    },
    subscriptionPlan: mockSubscriptionPlans[2]
  },
  {
    id: 'sc10',
    courseSellerId: '26',
    status: true,
    subscriptionPlanId: 'sp3', // Professional Plan
    createdAt: '2024-06-25T15:10:00.000Z',
    expiresAt: '2025-01-25T15:10:00.000Z',
    updatedAt: '2024-10-25T15:10:00.000Z',
    renewalCount: 5,
    lastRenewalAt: '2024-10-25T15:10:00.000Z',
    notes: 'Corporate trainer, bulk course creator',
    user: {
      id: '26',
      email: 'service.trainer@bpo.com',
      fullName: 'Mark Johnson',
      phoneNumber: '+84978901206',
      dateOfBirth: '1985-08-12T00:00:00.000Z',
      createdAt: '2024-09-30T13:20:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Service Excellence']
    },
    subscriptionPlan: mockSubscriptionPlans[2]
  },

  // Active Enterprise Plan Subscriptions
  {
    id: 'sc11',
    courseSellerId: '22',
    status: false,
    subscriptionPlanId: 'sp4', // Enterprise Plan
    createdAt: '2024-01-10T10:00:00.000Z',
    expiresAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2024-10-10T10:00:00.000Z',
    renewalCount: 9,
    lastRenewalAt: '2024-10-10T10:00:00.000Z',
    notes: 'Aviation training institute, multiple instructors',
    user: {
      id: '22',
      email: 'pilot.captain@airline.com',
      fullName: 'Captain David Wright',
      phoneNumber: '+84934567802',
      dateOfBirth: '1980-10-08T00:00:00.000Z',
      createdAt: '2024-10-20T11:25:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Aviation English']
    },
    subscriptionPlan: mockSubscriptionPlans[3]
  },
  {
    id: 'sc12',
    courseSellerId: '24',
    status: true,
    subscriptionPlanId: 'sp4', // Enterprise Plan
    createdAt: '2024-02-28T13:45:00.000Z',
    expiresAt: '2025-02-28T13:45:00.000Z',
    updatedAt: '2024-10-28T13:45:00.000Z',
    renewalCount: 8,
    lastRenewalAt: '2024-10-28T13:45:00.000Z',
    notes: 'Financial training organization, premium content',
    user: {
      id: '24',
      email: 'cfa.banker@investment.com',
      fullName: 'William Thompson',
      phoneNumber: '+84956789004',
      dateOfBirth: '1983-06-25T00:00:00.000Z',
      createdAt: '2024-10-18T12:15:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Financial English']
    },
    subscriptionPlan: mockSubscriptionPlans[3]
  },

  // Expired Subscriptions (status: false)
  {
    id: 'sc13',
    courseSellerId: '29',
    status: false,
    subscriptionPlanId: 'sp1', // Starter Plan
    createdAt: '2024-05-15T09:30:00.000Z',
    expiresAt: '2024-10-15T09:30:00.000Z',
    updatedAt: '2024-10-15T09:30:00.000Z',
    renewalCount: 4,
    lastRenewalAt: '2024-08-15T09:30:00.000Z',
    notes: 'Subscription expired, no renewal yet',
    lastNotificationAt: '2024-10-10T08:00:00.000Z',
    user: {
      id: '29',
      email: 'expired.teacher1@example.com',
      fullName: 'Tom Wilson',
      phoneNumber: '+84901234567',
      dateOfBirth: '1990-03-15T00:00:00.000Z',
      createdAt: '2024-05-10T10:00:00.000Z',
      englishLevel: 'B2',
      learningGoals: ['Teaching']
    },
    subscriptionPlan: mockSubscriptionPlans[0]
  },
  {
    id: 'sc14',
    courseSellerId: '30',
    status: false,
    subscriptionPlanId: 'sp2', // Basic Plan
    createdAt: '2024-03-20T14:15:00.000Z',
    expiresAt: '2024-10-20T14:15:00.000Z',
    updatedAt: '2024-10-20T14:15:00.000Z',
    renewalCount: 6,
    lastRenewalAt: '2024-08-20T14:15:00.000Z',
    notes: 'Failed to renew due to payment issues',
    lastNotificationAt: '2024-10-18T09:00:00.000Z',
    user: {
      id: '30',
      email: 'payment.issue@example.com',
      fullName: 'Sarah Chen',
      phoneNumber: '+84912345678',
      dateOfBirth: '1988-07-22T00:00:00.000Z',
      createdAt: '2024-03-15T12:30:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Business English']
    },
    subscriptionPlan: mockSubscriptionPlans[1]
  },
  {
    id: 'sc15',
    courseSellerId: '31',
    status: false,
    subscriptionPlanId: 'sp3', // Professional Plan
    createdAt: '2024-01-25T11:45:00.000Z',
    expiresAt: '2024-10-25T11:45:00.000Z',
    updatedAt: '2024-10-25T11:45:00.000Z',
    renewalCount: 8,
    lastRenewalAt: '2024-07-25T11:45:00.000Z',
    notes: 'Moved to competitor platform',
    lastNotificationAt: '2024-10-20T10:00:00.000Z',
    user: {
      id: '31',
      email: 'competitor.move@example.com',
      fullName: 'Michael Davis',
      phoneNumber: '+84923456789',
      dateOfBirth: '1985-12-10T00:00:00.000Z',
      createdAt: '2024-01-20T14:20:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Academic English']
    },
    subscriptionPlan: mockSubscriptionPlans[2]
  },

  // Recently Active Subscriptions
  {
    id: 'sc16',
    courseSellerId: '32',
    status: true,
    subscriptionPlanId: 'sp2', // Basic Plan
    createdAt: '2024-10-01T09:00:00.000Z',
    expiresAt: '2025-01-01T09:00:00.000Z',
    updatedAt: '2024-11-01T09:00:00.000Z',
    renewalCount: 1,
    lastRenewalAt: '2024-11-01T09:00:00.000Z',
    notes: 'New subscriber, promising start',
    user: {
      id: '32',
      email: 'new.instructor@fresh.com',
      fullName: 'Emily Taylor',
      phoneNumber: '+84934567890',
      dateOfBirth: '1992-05-18T00:00:00.000Z',
      createdAt: '2024-09-28T16:30:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Professional Development']
    },
    subscriptionPlan: mockSubscriptionPlans[1]
  },
  {
    id: 'sc17',
    courseSellerId: '33',
    status: true,
    subscriptionPlanId: 'sp1', // Starter Plan
    createdAt: '2024-10-15T13:20:00.000Z',
    expiresAt: '2025-01-15T13:20:00.000Z',
    updatedAt: '2024-10-15T13:20:00.000Z',
    renewalCount: 0,
    lastRenewalAt: '2024-10-15T13:20:00.000Z',
    notes: 'Just started, monitoring performance',
    user: {
      id: '33',
      email: 'just.started@newbie.com',
      fullName: 'Ryan Kim',
      phoneNumber: '+84945678901',
      dateOfBirth: '1994-09-08T00:00:00.000Z',
      createdAt: '2024-10-12T11:15:00.000Z',
      englishLevel: 'B2',
      learningGoals: ['Teaching', 'Language Skills']
    },
    subscriptionPlan: mockSubscriptionPlans[0]
  },

  // Long-term Loyal Subscribers
  {
    id: 'sc18',
    courseSellerId: '34',
    status: true,
    subscriptionPlanId: 'sp3', // Professional Plan
    createdAt: '2023-08-10T10:30:00.000Z',
    expiresAt: '2024-12-10T10:30:00.000Z',
    updatedAt: '2024-08-10T10:30:00.000Z',
    renewalCount: 15,
    lastRenewalAt: '2024-08-10T10:30:00.000Z',
    notes: 'Long-term loyal customer, excellent track record',
    user: {
      id: '34',
      email: 'loyal.veteran@longtime.com',
      fullName: 'Professor James Liu',
      phoneNumber: '+84956789012',
      dateOfBirth: '1975-11-30T00:00:00.000Z',
      createdAt: '2023-08-05T09:45:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Teaching', 'Academic Excellence']
    },
    subscriptionPlan: mockSubscriptionPlans[2]
  },
  {
    id: 'sc19',
    courseSellerId: '35',
    status: true,
    subscriptionPlanId: 'sp4', // Enterprise Plan
    createdAt: '2023-11-20T15:45:00.000Z',
    expiresAt: '2024-11-20T15:45:00.000Z',
    updatedAt: '2024-11-20T15:45:00.000Z',
    renewalCount: 12,
    lastRenewalAt: '2024-11-20T15:45:00.000Z',
    notes: 'Enterprise client, multiple course creators',
    user: {
      id: '35',
      email: 'enterprise.director@institution.edu',
      fullName: 'Dr. Amanda Foster',
      phoneNumber: '+84967890123',
      dateOfBirth: '1978-02-14T00:00:00.000Z',
      createdAt: '2023-11-15T12:00:00.000Z',
      englishLevel: 'C2',
      learningGoals: ['Institutional Teaching', 'Management']
    },
    subscriptionPlan: mockSubscriptionPlans[3]
  },

  // Users with Payment Issues (soon to expire)
  {
    id: 'sc20',
    courseSellerId: '36',
    status: true,
    subscriptionPlanId: 'sp2', // Basic Plan
    createdAt: '2024-07-15T12:00:00.000Z',
    expiresAt: '2024-11-05T12:00:00.000Z', // Expires soon
    updatedAt: '2024-09-15T12:00:00.000Z',
    renewalCount: 3,
    lastRenewalAt: '2024-09-15T12:00:00.000Z',
    notes: 'Payment method expired, needs update',
    lastNotificationAt: '2024-10-30T08:00:00.000Z',
    user: {
      id: '36',
      email: 'payment.expiring@warning.com',
      fullName: 'Grace Wong',
      phoneNumber: '+84978901234',
      dateOfBirth: '1989-06-25T00:00:00.000Z',
      createdAt: '2024-07-10T14:30:00.000Z',
      englishLevel: 'B2',
      learningGoals: ['Teaching', 'Skill Development']
    },
    subscriptionPlan: mockSubscriptionPlans[1]
  },

  // Upgraded Subscriptions
  {
    id: 'sc21',
    courseSellerId: '37',
    status: true,
    subscriptionPlanId: 'sp3', // Professional Plan (upgraded from Basic)
    createdAt: '2024-06-01T10:15:00.000Z',
    expiresAt: '2024-12-01T10:15:00.000Z',
    updatedAt: '2024-09-01T10:15:00.000Z', // Upgraded date
    renewalCount: 3,
    lastRenewalAt: '2024-09-01T10:15:00.000Z',
    notes: 'Upgraded from Basic Plan due to course growth',
    user: {
      id: '37',
      email: 'upgraded.success@growth.com',
      fullName: 'Daniel Park',
      phoneNumber: '+84989012345',
      dateOfBirth: '1987-08-12T00:00:00.000Z',
      createdAt: '2024-05-28T13:45:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Business Growth']
    },
    subscriptionPlan: mockSubscriptionPlans[2]
  },

  // Trial Period Subscriptions
  {
    id: 'sc22',
    courseSellerId: '38',
    status: true,
    subscriptionPlanId: 'sp1', // Starter Plan
    createdAt: '2024-10-20T14:30:00.000Z',
    expiresAt: '2024-11-20T14:30:00.000Z',
    updatedAt: '2024-10-20T14:30:00.000Z',
    renewalCount: 0,
    lastRenewalAt: '2024-10-20T14:30:00.000Z',
    notes: 'Trial period, evaluating platform fit',
    user: {
      id: '38',
      email: 'trial.period@evaluation.com',
      fullName: 'Linda Zhang',
      phoneNumber: '+84990123456',
      dateOfBirth: '1991-04-03T00:00:00.000Z',
      createdAt: '2024-10-18T10:20:00.000Z',
      englishLevel: 'C1',
      learningGoals: ['Teaching', 'Platform Testing']
    },
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
    notificationType: mockNotificationTypes[0],
    userIds: ['1']
  },
  {
    id: 'n2',
    title: 'Payment Successful',
    content: 'Your payment of 2,500,000 VND has been processed successfully.',
    createdAt: '2024-10-20T15:30:00.000Z',
    seen: true,
    notificationTypeId: 'nt2',
    notificationType: mockNotificationTypes[1],
    userIds: ['2']
  },
  {
    id: 'n3',
    title: 'Subscription Renewal Reminder',
    content: 'Your subscription will expire in 5 days. Please renew to continue using our services.',
    createdAt: '2024-10-25T08:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt3',
    notificationType: mockNotificationTypes[2],
    userIds: ['1', '3', '5']
  },
  {
    id: 'n4',
    title: 'Course Rejected',
    content: 'Your course "Basic Grammar Fundamentals" has been rejected. Reason: Content quality needs improvement. Please review our guidelines and resubmit.',
    createdAt: '2024-10-29T14:20:00.000Z',
    seen: false,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['18']
  },
  {
    id: 'n5',
    title: 'Course Under Review',
    content: 'Your course "Medical English for Healthcare Professionals" is currently under review. We will notify you within 3-5 business days.',
    createdAt: '2024-10-28T11:45:00.000Z',
    seen: true,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['5']
  },
  {
    id: 'n6',
    title: 'Course Approved',
    content: 'Congratulations! Your course "IELTS 8.5+ Guarantee Course" has been approved and is now available to students.',
    createdAt: '2024-10-27T16:30:00.000Z',
    seen: true,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['3']
  },
  {
    id: 'n7',
    title: 'Course Update Required',
    content: 'Your course "Business Presentation Skills" requires updates to comply with new content standards. Please update within 7 days.',
    createdAt: '2024-10-26T09:15:00.000Z',
    seen: false,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['17']
  },

  // Payment and subscription notifications
  {
    id: 'n8',
    title: 'Payment Failed',
    content: 'Your payment of 399,000 VND for monthly subscription has failed. Please update your payment method to avoid service interruption.',
    createdAt: '2024-10-29T08:30:00.000Z',
    seen: false,
    notificationTypeId: 'nt2',
    notificationType: mockNotificationTypes[1],
    userIds: ['7']
  },
  {
    id: 'n9',
    title: 'Payment Successful',
    content: 'Your subscription payment of 699,000 VND has been processed successfully. Your Professional Plan is now active.',
    createdAt: '2024-10-28T12:45:00.000Z',
    seen: true,
    notificationTypeId: 'nt2',
    notificationType: mockNotificationTypes[1],
    userIds: ['25']
  },
  {
    id: 'n10',
    title: 'Wallet Top-up Successful',
    content: 'Your wallet has been topped up with 2,500,000 VND via MOMO. Transaction ID: TXN789456123.',
    createdAt: '2024-10-27T14:20:00.000Z',
    seen: true,
    notificationTypeId: 'nt2',
    notificationType: mockNotificationTypes[1],
    userIds: ['2']
  },
  {
    id: 'n11',
    title: 'Course Purchase Successful',
    content: 'You have successfully purchased "Technical English for Engineers" for 2,850,000 VND. Start learning now!',
    createdAt: '2024-10-26T10:15:00.000Z',
    seen: true,
    notificationTypeId: 'nt2',
    notificationType: mockNotificationTypes[1],
    userIds: ['4']
  },
  {
    id: 'n12',
    title: 'Withdrawal Processed',
    content: 'Your earnings withdrawal of 1,250,000 VND has been processed and will arrive in your bank account within 1-3 business days.',
    createdAt: '2024-10-25T16:45:00.000Z',
    seen: true,
    notificationTypeId: 'nt2',
    notificationType: mockNotificationTypes[1],
    userIds: ['1']
  },

  // Subscription reminders and warnings
  {
    id: 'n13',
    title: 'Subscription Expires Tomorrow',
    content: 'Your Basic Plan subscription expires tomorrow. Renew now to avoid interruption of services.',
    createdAt: '2024-10-29T09:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt3',
    notificationType: mockNotificationTypes[2],
    userIds: ['7']
  },
  {
    id: 'n14',
    title: 'Subscription Expired',
    content: 'Your Starter Plan subscription has expired. Your courses are now hidden from students. Please renew to reactivate.',
    createdAt: '2024-10-28T00:01:00.000Z',
    seen: false,
    notificationTypeId: 'nt3',
    notificationType: mockNotificationTypes[2],
    userIds: ['5']
  },
  {
    id: 'n15',
    title: 'Payment Method Expiring',
    content: 'Your payment method ending in ****1234 expires next month. Please update to ensure uninterrupted service.',
    createdAt: '2024-10-27T11:30:00.000Z',
    seen: true,
    notificationTypeId: 'nt3',
    notificationType: mockNotificationTypes[2],
    userIds: ['16', '22', '26']
  },
  {
    id: 'n16',
    title: 'Subscription Auto-Renewed',
    content: 'Your Professional Plan has been automatically renewed for another month. Thank you for being a valued member!',
    createdAt: '2024-10-25T00:05:00.000Z',
    seen: true,
    notificationTypeId: 'nt3',
    notificationType: mockNotificationTypes[2],
    userIds: ['3']
  },

  // System notifications
  {
    id: 'n17',
    title: 'System Maintenance Scheduled',
    content: 'Scheduled maintenance on November 3rd, 2024 from 2:00 AM to 4:00 AM (GMT+7). Platform will be temporarily unavailable.',
    createdAt: '2024-10-29T10:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '2', '3', '4', '5', '6', '7', '15', '16', '17', '22', '24', '25', '26']
  },
  {
    id: 'n18',
    title: 'New Feature: AI Course Assistant',
    content: 'Introducing our new AI-powered course creation assistant! Create better courses faster with intelligent suggestions.',
    createdAt: '2024-10-28T13:00:00.000Z',
    seen: true,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '3', '5', '15', '16', '17', '25', '26']
  },
  {
    id: 'n19',
    title: 'Platform Update Complete',
    content: 'Our recent platform update is now live! New features include improved video player, better mobile experience, and enhanced analytics.',
    createdAt: '2024-10-27T08:00:00.000Z',
    seen: true,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '2', '3', '4', '5', '6', '7', '15', '16', '17', '22', '24', '25', '26']
  },
  {
    id: 'n20',
    title: 'Security Update Required',
    content: 'For your account security, please update your password. We recommend using a strong, unique password.',
    createdAt: '2024-10-26T15:30:00.000Z',
    seen: false,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['18', '19', '20', '21']
  },

  // Application status notifications
  {
    id: 'n21',
    title: 'Course Seller Application Approved',
    content: 'Congratulations! Your course seller application has been approved. You can now start creating and selling courses.',
    createdAt: '2024-10-25T14:20:00.000Z',
    seen: true,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['14', '15', '16', '17']
  },
  {
    id: 'n22',
    title: 'Course Seller Application Rejected',
    content: 'Your course seller application has been rejected. Reason: Insufficient teaching experience. You may reapply after gaining more experience.',
    createdAt: '2024-10-24T11:45:00.000Z',
    seen: false,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['18', '19', '20', '21']
  },
  {
    id: 'n23',
    title: 'Application Under Review',
    content: 'Thank you for your course seller application. We are currently reviewing your qualifications and will respond within 5-7 business days.',
    createdAt: '2024-10-26T16:30:00.000Z',
    seen: true,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['9', '10', '11', '12', '13']
  },

  // Student engagement notifications for course sellers
  {
    id: 'n24',
    title: 'New Student Enrolled',
    content: 'A new student has enrolled in your course "Business English Mastery Pro". Total enrollments: 248 students.',
    createdAt: '2024-10-29T15:45:00.000Z',
    seen: false,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['1']
  },
  {
    id: 'n25',
    title: 'Course Rating Received',
    content: 'Your course "IELTS 8.5+ Guarantee Course" received a 5-star rating! Student comment: "Excellent preparation materials!"',
    createdAt: '2024-10-28T18:20:00.000Z',
    seen: true,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['3']
  },
  {
    id: 'n26',
    title: 'Student Question Posted',
    content: 'A student posted a question in your course "Technical English for Engineers". Please respond to maintain engagement.',
    createdAt: '2024-10-27T13:15:00.000Z',
    seen: true,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['16']
  },
  {
    id: 'n27',
    title: 'Course Milestone Achieved',
    content: 'Congratulations! Your course "Medical English for Healthcare Professionals" has reached 100 enrollments.',
    createdAt: '2024-10-26T12:30:00.000Z',
    seen: true,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['5']
  },

  // Promotional notifications for course sellers
  {
    id: 'n28',
    title: 'Black Friday Sale Starting Soon',
    content: 'Prepare for our biggest sale of the year! Black Friday course promotions start November 24th. Boost your earnings!',
    createdAt: '2024-10-28T09:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '3', '5', '7', '15', '16', '17', '22', '24', '25', '26']
  },
  {
    id: 'n29',
    title: 'Monthly Earnings Report Available',
    content: 'Your October earnings report is now available. Total earnings: 3,450,000 VND. View detailed analytics in your dashboard.',
    createdAt: '2024-10-31T08:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '3', '5', '25', '26']
  },
  {
    id: 'n30',
    title: 'Course Promotion Opportunity',
    content: 'Your course is eligible for our "Featured Course" promotion. Apply now to increase visibility and enrollments.',
    createdAt: '2024-10-27T10:45:00.000Z',
    seen: true,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['17', '22', '25']
  },

  // Administrative notifications for course sellers
  {
    id: 'n31',
    title: 'Content Policy Update',
    content: 'We have updated our content policies. Please review the new guidelines to ensure your courses remain compliant.',
    createdAt: '2024-10-25T12:00:00.000Z',
    seen: true,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '3', '5', '7', '15', '16', '17', '22', '24', '25', '26']
  },
  {
    id: 'n32',
    title: 'Tax Documentation Required',
    content: 'Please submit your tax documentation by November 15th to ensure compliance with Vietnamese tax regulations.',
    createdAt: '2024-10-24T14:30:00.000Z',
    seen: false,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '3', '5', '25', '26']
  },

  // Community notifications
  {
    id: 'n33',
    title: 'Instructor Community Event',
    content: 'Join our monthly instructor meetup on November 10th at 7 PM. Topic: "Engaging Students in Online Learning". Register now!',
    createdAt: '2024-10-26T11:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '3', '5', '7', '15', '16', '17', '22', '24', '25', '26']
  },
  {
    id: 'n34',
    title: 'Instructor of the Month',
    content: 'Congratulations Dr. Jennifer Lee! You have been selected as Instructor of the Month for October 2024.',
    createdAt: '2024-10-31T10:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['25']
  },

  // Technical notifications
  {
    id: 'n35',
    title: 'Course Performance Analytics',
    content: 'Your course completion rate has improved by 15% this month! Students are loving your engaging content.',
    createdAt: '2024-10-30T16:20:00.000Z',
    seen: false,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '17']
  },
  {
    id: 'n36',
    title: 'Video Quality Improvement Needed',
    content: 'Some videos in your course have quality issues. Please re-upload for better student experience.',
    createdAt: '2024-10-29T13:45:00.000Z',
    seen: false,
    notificationTypeId: 'nt1',
    notificationType: mockNotificationTypes[0],
    userIds: ['7']
  },

  // Holiday and general announcements
  {
    id: 'n37',
    title: 'Holiday Schedule Announcement',
    content: 'Platform operation schedule during Tet Holiday 2025. Customer support will be limited from January 28 - February 5.',
    createdAt: '2024-10-23T09:30:00.000Z',
    seen: true,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '3', '5', '7', '15', '16', '17', '22', '24', '25', '26']
  },

  // Urgent notifications
  {
    id: 'n38',
    title: 'Urgent: Payment System Maintenance',
    content: 'Emergency maintenance on payment system from 11 PM to 1 AM tonight. Payments may be temporarily unavailable.',
    createdAt: '2024-10-30T20:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['1', '2', '3', '4', '5', '6', '7', '15', '16', '17', '22', '24', '25', '26']
  },

  // Welcome notifications
  {
    id: 'n39',
    title: 'Welcome to Our Platform!',
    content: 'Welcome! Get started by exploring our course creation tools and instructor resources.',
    createdAt: '2024-10-15T13:25:00.000Z',
    seen: true,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['15', '16', '17']
  },

  // Course purchase notifications for students
  {
    id: 'n40',
    title: 'Course Purchase Confirmation',
    content: 'Thank you for purchasing "Grammar Mastery Complete Edition". Access your course materials now!',
    createdAt: '2024-10-30T14:30:00.000Z',
    seen: false,
    notificationTypeId: 'nt2',
    notificationType: mockNotificationTypes[1],
    userIds: ['2', '4', '6']
  },

  // Course completion notifications
  {
    id: 'n41',
    title: 'Course Completion Certificate',
    content: 'Congratulations! You have completed "Business English Mastery Pro". Download your certificate from your dashboard.',
    createdAt: '2024-10-29T18:15:00.000Z',
    seen: true,
    notificationTypeId: 'nt4',
    notificationType: mockNotificationTypes[3],
    userIds: ['2', '4']
  },

  // Subscription notifications for students
  {
    id: 'n42',
    title: 'Course Access Expiring',
    content: 'Your access to premium courses will expire in 3 days. Renew your subscription to continue learning.',
    createdAt: '2024-10-28T10:00:00.000Z',
    seen: false,
    notificationTypeId: 'nt3',
    notificationType: mockNotificationTypes[2],
    userIds: ['2', '4', '6']
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