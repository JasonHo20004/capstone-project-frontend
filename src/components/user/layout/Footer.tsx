import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shadow-accent transition-transform group-hover:scale-105">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold font-['Be Vietnam Pro']">SkillBoost</span>
            </Link>
            <p className="text-primary-foreground/80 leading-relaxed">
              Nâng tầm kỹ năng tiếng Anh với các khóa học do chuyên gia giảng dạy và trải nghiệm học tập tương tác.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-secondary flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-secondary flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-secondary flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-secondary flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-['Be Vietnam Pro']">Liên kết nhanh</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/courses" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Xem khóa học
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-['Be Vietnam Pro']">Hỗ trợ</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Trung tâm trợ giúp
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Câu hỏi thường gặp
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 font-['Be Vietnam Pro']">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-primary-foreground/80">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>support@skillboost.com</span>
              </li>
              <li className="flex items-start gap-3 text-primary-foreground/80">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-primary-foreground/80">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>123 Learning Street, Education City, EC 12345</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-primary-foreground/60">
          <p>© {currentYear} SkillBoost. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
