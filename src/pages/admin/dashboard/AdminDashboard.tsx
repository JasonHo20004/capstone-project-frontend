import { 
  Users, 
  BookOpen, 
  DollarSign, 
  UserCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  mockDashboardStats, 
  mockRevenueData, 
  mockUserGrowthData, 
  mockCourseStatusData 
} from '@/data/mock';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import ActivityFeed from '@/components/admin/ActivityFeed';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminDashboard() {
  const stats = mockDashboardStats;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Mock activities data
  const activities = [
    {
      id: '1',
      title: 'Người dùng mới đăng ký',
      description: 'jane.smith@example.com',
      timestamp: '2 phút trước',
      type: 'info' as const
    },
    {
      id: '2',
      title: 'Khóa học được duyệt',
      description: '"Business English Mastery"',
      timestamp: '15 phút trước',
      type: 'success' as const
    },
    {
      id: '3',
      title: 'Đơn đăng ký mới',
      description: 'Michael Johnson',
      timestamp: '1 giờ trước',
      type: 'warning' as const
    },
    {
      id: '4',
      title: 'Báo cáo vi phạm',
      description: 'Khóa học có nội dung không phù hợp',
      timestamp: '2 giờ trước',
      type: 'error' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Tổng quan về hệ thống SkillBoost
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers}
          icon={Users}
          trend={{
            value: stats.monthlyGrowth.users,
            label: "so với tháng trước"
          }}
        />
        
        <StatCard
          title="Tổng khóa học"
          value={stats.totalCourses}
          icon={BookOpen}
          trend={{
            value: stats.monthlyGrowth.courses,
            label: "so với tháng trước"
          }}
        />
        
        <StatCard
          title="Doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          trend={{
            value: stats.monthlyGrowth.revenue,
            label: "so với tháng trước"
          }}
        />
        
        <StatCard
          title="Đơn chờ duyệt"
          value={stats.pendingApplications}
          icon={UserCheck}
          description="Cần xem xét"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ChartCard 
          title="Doanh thu theo tháng"
          description="Biểu đồ doanh thu 6 tháng gần nhất"
          className="col-span-4"
        >
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={mockRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Trạng thái khóa học"
          description="Phân bố trạng thái các khóa học"
          className="col-span-3"
        >
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={mockCourseStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mockCourseStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard 
          title="Tăng trưởng người dùng"
          description="Số lượng người dùng mới theo tháng"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockUserGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}