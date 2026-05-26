import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';

const LABELS: Record<string, string> = {
  admin: 'Admin',
  users: 'Người dùng',
  courses: 'Khóa học',
  lessons: 'Bài học',
  exams: 'Bài thi',
  dictation: 'Dictation',
  transactions: 'Giao dịch',
  commission: 'Hoa hồng',
  withdrawals: 'Rút tiền',
  applications: 'Đơn đăng ký',
  moderation: 'Kiểm duyệt',
  tags: 'Tag',
  'user-plans': 'Gói người dùng',
  'speaking-topics': 'Speaking Topics',
  new: 'Tạo mới',
  edit: 'Chỉnh sửa',
  writing: 'Writing',
  speaking: 'Speaking',
};

const isId = (segment: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
  /^[0-9]+$/.test(segment) ||
  segment.length > 20;

export default function AdminBreadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {segments.map((segment, idx) => {
          const path = '/' + segments.slice(0, idx + 1).join('/');
          const isLast = idx === segments.length - 1;
          const label = LABELS[segment] ?? (isId(segment) ? '#' + segment.slice(0, 8) : segment);
          return (
            <Fragment key={path}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={path}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
