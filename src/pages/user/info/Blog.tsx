import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Blog = () => {
  const posts = [
    {
      id: 1,
      title: '10 mẹo thiết yếu để học tiếng Anh nhanh hơn',
      excerpt: 'Khám phá các chiến lược đã được chứng minh để tăng tốc hành trình học tiếng Anh và đạt độ lưu loát nhanh hơn bạn nghĩ.',
      author: 'Dr. Sarah Johnson',
      authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      date: 'Jan 15, 2025',
      category: 'Mẹo học tập',
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop',
      readTime: 'Đọc trong 5 phút',
    },
    {
      id: 2,
      title: 'Sức mạnh của sự đắm chìm: Cách tạo môi trường tiếng Anh',
      excerpt: 'Tìm hiểu cách bao quanh mình bằng tiếng Anh trong cuộc sống hằng ngày và tăng tốc học tập thông qua kỹ thuật immersion.',
      author: 'Michael Chen',
      authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      date: 'Jan 12, 2025',
      category: 'Phương pháp học',
      thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
      readTime: 'Đọc trong 8 phút',
    },
    {
      id: 3,
      title: 'Làm chủ tiếng Anh thương mại: Hướng dẫn đầy đủ',
      excerpt: 'Tất cả những gì bạn cần biết về giao tiếp tiếng Anh chuyên nghiệp, từ email đến thuyết trình.',
      author: 'Emma Williams',
      authorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      date: 'Jan 10, 2025',
      category: 'Tiếng Anh thương mại',
      thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
      readTime: 'Đọc trong 10 phút',
    },
    {
      id: 4,
      title: 'Các lỗi ngữ pháp thường gặp và cách tránh',
      excerpt: 'Nhận diện và sửa các lỗi ngữ pháp phổ biến mà người học tiếng Anh hay mắc phải, kèm ví dụ thực tế.',
      author: 'David Martinez',
      authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      date: 'Jan 8, 2025',
      category: 'Ngữ pháp',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop',
      readTime: 'Đọc trong 6 phút',
    },
    {
      id: 5,
      title: 'Thi Speaking IELTS: Chiến lược đạt Band 7+',
      excerpt: 'Mẹo từ giám khảo IELTS giúp bạn vượt qua bài thi speaking và đạt band điểm mục tiêu.',
      author: 'Prof. Lisa Anderson',
      authorImage: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop',
      date: 'Jan 5, 2025',
      category: 'Luyện thi',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop',
      readTime: 'Đọc trong 12 phút',
    },
    {
      id: 6,
      title: 'Xây dựng từ vựng: Đúng cách',
      excerpt: 'Các kỹ thuật hiệu quả để mở rộng vốn từ và ghi nhớ lâu dài.',
      author: 'Rachel Green',
      authorImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
      date: 'Jan 3, 2025',
      category: 'Từ vựng',
      thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop',
      readTime: 'Đọc trong 7 phút',
    },
  ];

  const featuredPost = posts[0];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 font-['Be Vietnam Pro']">
                Tài nguyên và mẹo học tập
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Lời khuyên từ chuyên gia, mẹo học tập và góc nhìn giúp bạn chinh phục tiếng Anh
              </p>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border hover:shadow-accent transition-all">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-video md:aspect-auto">
                    <img
                      src={featuredPost.thumbnail}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-4 left-4 bg-secondary shadow-md">
                      Nổi bật
                    </Badge>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <Badge variant="outline" className="w-fit mb-4">
                      {featuredPost.category}
                    </Badge>
                    <h2 className="text-3xl font-bold mb-4 font-['Be Vietnam Pro']">
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 mb-6">
                      <img
                        src={featuredPost.authorImage}
                        alt={featuredPost.author}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{featuredPost.author}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {featuredPost.date}
                          </span>
                          <span>•</span>
                          <span>{featuredPost.readTime}</span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-fit bg-gradient-primary shadow-accent">
                      Đọc bài viết
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 font-['Be Vietnam Pro']">Bài viết mới nhất</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.slice(1).map((post) => (
                <article
                  key={post.id}
                  className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-accent transition-all border border-border hover:border-primary/20 group"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge variant="outline" className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm">
                      {post.category}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors font-['Be Vietnam Pro']">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <img
                        src={post.authorImage}
                        alt={post.author}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{post.author}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{post.date}</span>
                          <span>•</span>
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-4xl font-bold text-primary-foreground font-['Be Vietnam Pro']">
                Đăng ký nhận bản tin
              </h2>
              <p className="text-xl text-primary-foreground/80">
                Nhận mẹo học và tài nguyên mới nhất qua email
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="flex-1 h-12 px-4 rounded-lg border-0 focus:ring-2 focus:ring-secondary"
                />
                <Button size="lg" variant="secondary" className="shadow-accent">
                  Đăng ký
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
