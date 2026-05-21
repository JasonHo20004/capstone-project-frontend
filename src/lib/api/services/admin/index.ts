export { dashboardService } from './dashboard/dashboard.service';
export { userManagementService } from './user-management/user.service';
export { courseManagementService } from './course-management/course.service';
export { transactionManagementService } from './transaction-management/transaction.service';
export { revenueManagementService } from './revenue-management/revenue.service';
export { reportManagementService } from './reports/report.service';
export { adminUserPlanService } from './user-plans/user-plan.service';

export type { CreateUserRequest, UpdateUserRequest } from './user-management/user.service';
export type { UpdateCourseRequest } from './course-management/course.service';
export type {
  ReportWithRelations,
  ResolveReportRequest,
} from './reports/report.service';