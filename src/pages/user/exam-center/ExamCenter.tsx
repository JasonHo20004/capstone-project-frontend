import { Link } from "react-router-dom";

export default function ExamCenter() {
  return (
    <div className="bg-[#f6f8f8] text-slate-900 min-h-screen font-display flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[#13b6ec]/10 bg-white flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#13b6ec] rounded-lg p-2 text-white">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">ExamCenter</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">LMS Professional</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-[#13b6ec]/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 bg-[#13b6ec]/10 text-[#13b6ec] rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[22px] fill-1">history_edu</span>
            <span className="text-sm font-bold">Exam Center</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-[#13b6ec]/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">analytics</span>
            <span className="text-sm font-medium">My Results</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-[#13b6ec]/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">library_books</span>
            <span className="text-sm font-medium">Study Materials</span>
          </a>
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Support
          </div>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-[#13b6ec]/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-[#13b6ec]/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">help</span>
            <span className="text-sm font-medium">Help Center</span>
          </a>
        </nav>
        <div className="p-4 mt-auto border-t border-[#13b6ec]/10">
          <div className="bg-[#13b6ec]/5 rounded-xl p-4">
            <p className="text-xs font-bold text-[#13b6ec] mb-1">Upgrade to Pro</p>
            <p className="text-[11px] text-slate-500 leading-tight mb-3">
              Get unlimited access to advanced mock exams.
            </p>
            <button className="w-full bg-[#13b6ec] text-white text-xs font-bold py-2 rounded-lg shadow-sm cursor-pointer hover:bg-[#13b6ec]/90 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[#13b6ec]/10 bg-white px-4 md:px-8 flex items-center justify-between z-10">
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search for practice tests, modules, or difficulty..."
                className="w-full bg-[#13b6ec]/5 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#13b6ec]/20 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 text-slate-500 hover:bg-[#13b6ec]/5 rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-[#13b6ec]/5 rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
            </button>
            <div className="h-8 w-[1px] bg-[#13b6ec]/10 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">Alex Johnson</p>
                <p className="text-[10px] text-slate-500 mt-1">Student ID: 48291</p>
              </div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBe8aI7-e53HyfvZEHeRZwoVRIfXp2APcDjWSKV71idYyePXq_bqXhDTiAVbNt9FQSvpXk8NRyTDJ0QoLObesrvrzNxAjFSXTn9UuhLrGSiYD5u7EEdxi8uYXQc-jlpnrX_iWET_bZlCPV8JMU89C0kUJB_ToTm8y1Oq7Y8PM_yjupSinryAeL1w2ICs7OpIMEU0PrqcQ_OBL-4Mt_NXm_Z74hHcpzntO8IRGVwEAlraa7hWbY8vTK017GzyeQtVUYd8lP7dPoInzg"
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-[#13b6ec]/20"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {/* Title and Info */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Exam Center</h2>
                <p className="text-slate-500 mt-1">
                  Select your certification track and start your practice session.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Tests are timed and follow official guidelines</span>
              </div>
            </div>

            <div className="bg-white border border-[#13b6ec]/10 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
              {/* Search Bar */}
              <div className="flex-1 min-w-[240px] relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search tests..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#13b6ec]/20 transition-all outline-none"
                />
              </div>
              {/* Skill Filter */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-[#13b6ec]/30 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">extension</span>
                  <span>Skill</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                </button>
              </div>
              {/* Difficulty Filter */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-[#13b6ec]/30 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">
                    signal_cellular_alt
                  </span>
                  <span>Difficulty</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                </button>
              </div>
              {/* Duration Filter */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-[#13b6ec]/30 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
                  <span>Duration</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                </button>
              </div>
              {/* Reset Filters */}
              <button className="text-xs font-bold text-slate-400 hover:text-[#13b6ec] transition-colors px-2 cursor-pointer">
                Clear All
              </button>
            </div>

            {/* Certification Selector (Tabs) */}
            <div className="flex p-1 bg-white rounded-xl shadow-sm border border-[#13b6ec]/5 mb-8 w-fit overflow-x-auto">
              <button className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all bg-[#13b6ec] text-white shadow-md whitespace-nowrap cursor-pointer">
                All Exams
              </button>
              <button className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all text-slate-500 hover:bg-[#13b6ec]/5 whitespace-nowrap cursor-pointer">
                IELTS
              </button>
              <button className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all text-slate-500 hover:bg-[#13b6ec]/5 whitespace-nowrap cursor-pointer">
                TOEIC
              </button>
              <button className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all text-slate-500 hover:bg-[#13b6ec]/5 whitespace-nowrap cursor-pointer">
                TOEFL
              </button>
            </div>

            {/* Test Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Test Card 1: IELTS */}
              <div className="bg-white rounded-xl border border-[#13b6ec]/10 shadow-[0_4px_20px_-2px_rgba(19,182,236,0.08)] overflow-hidden group">
                <div className="h-32 bg-gradient-to-br from-[#13b6ec] to-[#13b6ec]/60 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest">
                      IELTS TRACK
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
                    <span className="material-symbols-outlined text-white text-[24px]">school</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      IELTS Academic Mock Test #1
                    </h3>
                    <span className="bg-[#13b6ec]/10 text-[#13b6ec] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                      Academic
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Duration
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">timer</span>{" "}
                        180 mins
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-100"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Difficulty
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-orange-400">bolt</span>{" "}
                        Advanced
                      </span>
                    </div>
                  </div>
                  <div className="mb-8">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                      Modules Covered
                    </p>
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 group-hover:bg-[#13b6ec]/5 group-hover:text-[#13b6ec] transition-colors"
                        title="Reading"
                      >
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 group-hover:bg-[#13b6ec]/5 group-hover:text-[#13b6ec] transition-colors"
                        title="Listening"
                      >
                        <span className="material-symbols-outlined text-[18px]">headphones</span>
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 group-hover:bg-[#13b6ec]/5 group-hover:text-[#13b6ec] transition-colors"
                        title="Speaking"
                      >
                        <span className="material-symbols-outlined text-[18px]">mic</span>
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 group-hover:bg-[#13b6ec]/5 group-hover:text-[#13b6ec] transition-colors"
                        title="Writing"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/exam/test/reading"
                    className="w-full bg-[#13b6ec] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#13b6ec]/20 hover:bg-[#13b6ec]/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Start Practice Test</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Test Card 2: TOEIC */}
              <div className="bg-white rounded-xl border border-[#13b6ec]/10 shadow-[0_4px_20px_-2px_rgba(19,182,236,0.08)] overflow-hidden group">
                <div className="h-32 bg-gradient-to-br from-[#10b981] to-[#10b981]/60 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest">
                      TOEIC TRACK
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
                    <span className="material-symbols-outlined text-white text-[24px]">corporate_fare</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      TOEIC Listening Practice B
                    </h3>
                    <span className="bg-[#10b981]/10 text-[#10b981] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                      Business
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Duration
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">timer</span>{" "}
                        45 mins
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-100"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Difficulty
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-green-500">bolt</span>{" "}
                        Intermediate
                      </span>
                    </div>
                  </div>
                  <div className="mb-8">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                      Modules Covered
                    </p>
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded-lg bg-[#10b981]/5 flex items-center justify-center text-[#10b981] border border-[#10b981]/10"
                        title="Listening"
                      >
                        <span className="material-symbols-outlined text-[18px]">headphones</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/exam/toeic"
                    className="w-full bg-[#10b981] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#10b981]/20 hover:bg-[#10b981]/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>View Exam Details</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Test Card 3: TOEFL */}
              <div className="bg-white rounded-xl border border-[#13b6ec]/10 shadow-[0_4px_20px_-2px_rgba(19,182,236,0.08)] overflow-hidden group">
                <div className="h-32 bg-gradient-to-br from-[#8b5cf6] to-[#8b5cf6]/60 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest">
                      TOEFL TRACK
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
                    <span className="material-symbols-outlined text-white text-[24px]">language</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      TOEFL Reading & Writing Essentials
                    </h3>
                    <span className="bg-[#8b5cf6]/10 text-[#8b5cf6] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                      Essential
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Duration
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">timer</span>{" "}
                        120 mins
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-100"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Difficulty
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-red-500">bolt</span>{" "}
                        Expert
                      </span>
                    </div>
                  </div>
                  <div className="mb-8">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                      Modules Covered
                    </p>
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded-lg bg-[#8b5cf6]/5 flex items-center justify-center text-[#8b5cf6] border border-[#8b5cf6]/10"
                        title="Reading"
                      >
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg bg-[#8b5cf6]/5 flex items-center justify-center text-[#8b5cf6] border border-[#8b5cf6]/10"
                        title="Writing"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/exam/test/writing"
                    className="w-full bg-[#8b5cf6] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#8b5cf6]/20 hover:bg-[#8b5cf6]/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Start Practice Test</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Test Card 4: IELTS Small */}
              <div className="bg-white rounded-xl border border-[#13b6ec]/10 shadow-[0_4px_20px_-2px_rgba(19,182,236,0.08)] overflow-hidden group">
                <div className="h-32 bg-slate-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#13b6ec] opacity-90"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[48px] opacity-20">
                      record_voice_over
                    </span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest">
                      IELTS TRACK
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      IELTS Speaking Workshop
                    </h3>
                    <span className="bg-[#13b6ec]/10 text-[#13b6ec] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                      Speaking
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Duration
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">timer</span>{" "}
                        15 mins
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-100"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Difficulty
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-[#13b6ec]">bolt</span>{" "}
                        Beginner
                      </span>
                    </div>
                  </div>
                  <div className="mb-8">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                      Modules Covered
                    </p>
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded-lg bg-[#13b6ec]/5 flex items-center justify-center text-[#13b6ec] border border-[#13b6ec]/10"
                        title="Speaking"
                      >
                        <span className="material-symbols-outlined text-[18px]">mic</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/exam/test/speaking"
                    className="w-full bg-[#13b6ec] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#13b6ec]/20 hover:bg-[#13b6ec]/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Start Workshop</span>
                    <span className="material-symbols-outlined text-[20px]">mic_none</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

