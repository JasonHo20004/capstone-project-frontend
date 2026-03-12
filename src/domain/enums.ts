/**
 * Domain Enums - business-level enumerations
 */

export enum UserRole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  COURSESELLER = 'COURSESELLER'
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
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
  NEW = 'NEW',
  LEARNING = 'LEARNING',
  REVIEW = 'REVIEW',
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
