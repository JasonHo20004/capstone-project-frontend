// Enums
export enum UserRole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  COURSESELLER = 'COURSESELLER'
}

export enum PaymentMethod {
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
  BANKING = 'BANKING',
  APPLEPAY = 'APPLEPAY'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  PAYMENT = 'PAYMENT',
  MONTHLYFEE = 'MONTHLYFEE',
  WITHDRAW = 'WITHDRAW'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum CourseStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REFUSE = 'REFUSE',
  INACTIVE = 'INACTIVE',
  DELETE = 'DELETE',
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED'
}

export enum CourseLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2'
}

export enum SessionStatus {
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK'
}

export enum SkillType {
  READING = 'READING',
  LISTENING = 'LISTENING',
  WRITING = 'WRITING',
  SPEAKING = 'SPEAKING'
}

export enum MediaType {
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum FlashcardStatus {
  LEARNING = 'LEARNING',
  REVIEW = 'REVIEW'
}

export enum TestType {
  FINAL = 'FINAL'
}

export enum EReasonType {
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  COPYRIGHT_VIOLATION = 'COPYRIGHT_VIOLATION',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  UNRESPONSIVE_INSTRUCTOR = 'UNRESPONSIVE_INSTRUCTOR',
  INCOMPLETE_CONTENT = 'INCOMPLETE_CONTENT'
}

// Base Interfaces
export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth: string; // DateTime as ISO string
  createdAt: string; // DateTime as ISO string
  englishLevel?: string;
  learningGoals: string[];
  role?: UserRole;
  
  // Relations (optional)
  refreshTokens?: RefreshToken[];
  administratorProfile?: AdministratorProfile;
  comments?: Comment[];
  courseSellerApplication?: CourseSellerApplication;
  courseSellerProfile?: CourseSellerProfile;
  courses?: Course[];
  flashcardDecks?: FlashcardDeck[];
  inAppNotifications?: InAppNotification[];
  policy?: Policy;
  practiceSessions?: PracticeSession[];
  ratings?: Rating[];
  reports?: Report[];
  subscriptionContracts?: SubscriptionContract[];
  topupOrders?: TopupOrder[];
  userActivities?: UserActivity[];
  userAnswers?: UserAnswer[];
  userFlashcardProgress?: UserFlashcardProgress[];
  userLessons?: UserLesson[];
  userNotifications?: UserNotification[];
  wallet?: Wallet;
  order?: Order[];
  cart?: Cart;
}

export interface RefreshToken {
  id: string;
  hashedToken: string;
  userId: string;
  revoked: boolean;
  createdAt: string;
  
  // Relations
  user?: User;
}

export interface NotificationType {
  id: string;
  name: string;
  isLocked: boolean;
  
  // Relations
  notifications?: Notification[];
}

export interface EnglishTestType {
  id: string;
  name: string;
  
  // Relations
  scoreConversions?: ScoreConversion[];
  tests?: Test[];
}

export interface Tag {
  id: string;
  name: string;
  
  // Relations
  deckTags?: DeckTag[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  maxCourses: number;
  monthlyFee: number; // Decimal as number
  
  // Relations
  subscriptionContracts?: SubscriptionContract[];
}

export interface CourseSellerProfile {
  id: string;
  certification: string[];
  expertise: string[];
  isActive: boolean;
  userId: string;
  
  // Relations
  user?: User;
}

export interface AdministratorProfile {
  id: string;
  userId: string;
  
  // Relations
  user?: User;
}

export interface CourseSellerApplication {
  id: string;
  userId: string;
  certification: string[];
  expertise: string[];
  message?: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  createdAt: string;
  
  // Relations
  user?: User;
}

export interface Wallet {
  id: string;
  allowance: number; // Decimal as number
  userId: string;
  
  // Relations
  transactions?: Transaction[];
  user?: User;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  seen: boolean;
  notificationTypeId: string;
  
  // Relations
  notificationType?: NotificationType;
  userNotifications?: UserNotification[];
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
  contractId?: string;
  courseId?: string;
  metadata?: Record<string, unknown>; // Json type
  
  // Relations
  user?: User;
}

export interface Test {
  id: string;
  title: string;
  durationInMinutes?: number;
  totalScore?: number;
  passingScore?: number;
  englishTestTypeId: string;
  practiceCount?: number;
  createdAt: string;
  maxAttempts?: number;
  testType?: TestType;
  updatedAt?: string;
  
  // Relations
  courseTests?: CourseTest[];
  courses?: Course[];
  practiceSessions?: PracticeSession[];
  questions?: Question[];
  sections?: Section[];
  englishTestType?: EnglishTestType;
}

export interface CourseTest {
  courseId: string;
  testId: string;
  
  // Relations
  course?: Course;
  test?: Test;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  createdAt: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  
  // Relations
  deckTags?: DeckTag[];
  user?: User;
  flashcards?: Flashcard[];
}

export interface TopupOrder {
  id: string;
  userId: string;
  realMoney: number; // Decimal as number
  realAmount?: number; // Decimal as number
  currency: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  
  // Relations
  user?: User;
  transactions?: Transaction[];
}

export interface ScoreConversion {
  id: string;
  englishTestTypeId: string;
  skill: SkillType;
  rawScore: number;
  scaledScore: number;
  
  // Relations
  englishTestType?: EnglishTestType;
}

export interface UserNotification {
  notificationId: string;
  userId: string;
  
  // Relations
  notification?: Notification;
  user?: User;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  price: number; // Decimal as number
  category?: string;
  courseLevel?: CourseLevel;
  courseSellerId: string;
  finalTestId?: string;
  ratingCount?: number;
  status: CourseStatus;
  createdAt: string;
  
  // Relations
  user?: User;
  test?: Test;
  courseTests?: CourseTest[];
  ratings?: Rating[];
  lessons?: Lesson[];
  reports?: Report[];
  cartItems?: CartItem[];
  userActivities?: UserActivity[];
}

export interface Section {
  id: string;
  title: string;
  testId?: string;
  skill?: SkillType;
  durationInSeconds?: number;
  totalQuestions?: number;
  totalScore?: number;
  
  // Relations
  passage?: Passage[];
  questions?: Question[];
  test?: Test;
}

export interface Flashcard {
  id: string;
  frontContent: string;
  backContent: string;
  exampleSentence?: string;
  audioUrl?: string;
  deckId: string;
  
  // Relations
  deck?: FlashcardDeck;
  userProgress?: UserFlashcardProgress[];
}

export interface DeckTag {
  tagId: string;
  deckId: string;
  
  // Relations
  deck?: FlashcardDeck;
  tag?: Tag;
}

export interface UserFlashcardProgress {
  userId: string;
  flashcardId: string;
  status: FlashcardStatus;
  nextReviewAt: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  learningStep: number;
  
  // Relations
  flashcard?: Flashcard;
  user?: User;
}

export interface PracticeSession {
  id: string;
  userId: string;
  testId: string;
  selectedSections: string[];
  status: SessionStatus;
  createdAt: string;
  completedAt?: string;
  overallScaledScore?: number;
  scoresBySkill?: Record<string, unknown>; // Json type
  rawScoresBySkill?: Record<string, unknown>; // Json type
  
  // Relations
  test?: Test;
  user?: User;
  userAnswers?: UserAnswer[];
}

export interface SubscriptionContract {
  id: string;
  courseSellerId: string;
  status: boolean;
  subscriptionPlanId: string;
  createdAt: string;
  expiresAt: string;
  updatedAt?: string;
  renewalCount: number;
  lastRenewalAt?: string;
  notes?: string;
  lastNotificationAt?: string;
  
  // Relations
  user?: User;
  subscriptionPlan?: SubscriptionPlan;
  transactions?: Transaction[];
}

export interface Rating {
  id: string;
  score: number;
  userId: string;
  courseId: string;
  content?: string;
  createdAt: string;
  replyContent?: string;
  repliedAt?: string;
  isReported: boolean;
  
  // Relations
  course?: Course;
  user?: User;
}

export interface Transaction {
  id: string;
  amount: number; // Decimal as number
  status: TransactionStatus;
  createdAt: string;
  description?: string;
  walletId: string;
  transactionType: TransactionType;
  topupOrderId?: string;
  subscriptionContractId?: string;
  orderId?: string;
  
  // Relations
  wallet?: Wallet;
  topupOrder?: TopupOrder;
  subscriptionContract?: SubscriptionContract;
  userActivities?: UserActivity[];
  order?: Order;
}

export interface CartItem {
  id: string;
  courseId: string;
  addedAt: string;
  priceAtTime: number;
  cartId: string;
  
  // Relations
  course?: Course;
  cart?: Cart;
}

export interface Cart {
  id: string;
  userId?: string;
  createdAt: string;
  
  // Relations
  user?: User;
  order?: Order[];
  cartItems?: CartItem[];
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  createdAt: string;
  cartId: string;
  transactionId?: string;
  
  // Relations
  user?: User;
  cart?: Cart;
  transaction?: Transaction;
}

export interface UserLesson {
  lessonId: string;
  userId: string;
  
  // Relations
  lesson?: Lesson;
  user?: User;
}

export interface UserAnswer {
  id: string;
  practiceSessionId: string;
  questionId: string;
  userId: string;
  answerText?: string;
  selectedOptionIndex?: number;
  isCorrect?: boolean;
  
  // Relations
  practiceSession?: PracticeSession;
  question?: Question;
  user?: User;
}

export interface UserActivity {
  id: string;
  userId: string;
  transactionId: string;
  courseId: string;
  createdAt: string;
  expiresAt?: string;
  
  // Relations
  transaction?: Transaction;
  user?: User;
  course?: Course;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  parentCommentId?: string;
  lessonId: string;
  
  // Relations
  lesson?: Lesson;
  user?: User;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  durationInSeconds?: number;
  lessonOrder?: number;
  materials: string[];
  commentCount?: number;
  courseId: string;
  
  // Relations
  comments?: Comment[];
  course?: Course;
  mediaAssets?: MediaAsset[];
  userLessons?: UserLesson[];
}

export interface Passage {
  id: string;
  sectionId: string;
  content: string;
  passageOrder?: number;
  
  // Relations
  section?: Section;
  questions?: Question[];
}

export interface MediaAsset {
  id: string;
  assetType: MediaType;
  assetUrl: string;
  lessonId: string;
  
  // Relations
  lesson?: Lesson;
  questions?: Question[];
}

export interface Question {
  id: string;
  sectionId?: string;
  questionText?: string;
  imageUrl?: string;
  questionType: QuestionType;
  options: string[];
  correctAnswerIndex?: number;
  wordLimit?: number;
  correctAnswer?: string;
  passageId?: string;
  mediaId?: string;
  questionOrder?: number;
  testId?: string;
  
  // Relations
  mediaAsset?: MediaAsset;
  passage?: Passage;
  section?: Section;
  test?: Test;
  userAnswers?: UserAnswer[];
}

export interface Policy {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  
  // Relations
  user?: User;
}

export interface Report {
  id: string;
  content: string;
  reasonType: EReasonType;
  userId: string;
  courseId: string;
  createdAt: string;
  
  // Relations
  course?: Course;
  user?: User;
}

// API Response types (commonly used)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Course with computed fields (commonly needed)
export interface CourseWithStats extends Course {
  averageRating: number;
  lessonsCount: number;
  ratingsCount: number;
  lessons: Lesson[];
  courseSeller: User;
}

// User for authentication contexts
export interface AuthUser extends Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'profilePicture'> {
  courseSellerProfile?: CourseSellerProfile;
  administratorProfile?: AdministratorProfile;
}