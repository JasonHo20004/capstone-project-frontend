import { Link } from "react-router-dom";

export default function ToeicExamOverview() {
  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/exam-center" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
              </div>
              <h1 className="font-bold text-lg tracking-tight">TOEIC® Listening and Reading Test</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>120 Mins</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
              <span className="material-symbols-outlined text-[16px]">help</span>
              <span>200 Questions</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#10b981]/20 to-transparent rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] text-xs font-bold uppercase tracking-wider mb-4">
                  Business English
                </span>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Master Business Communication</h2>
                <p className="text-slate-600 leading-relaxed mb-6 max-w-2xl">
                  The TOEIC Listening and Reading test measures the everyday English skills of people working in an international environment. This practice exam simulates the actual test conditions to help you prepare effectively.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/exam/test/listening"
                    className="px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg shadow-[#10b981]/20 transition-all flex items-center gap-2"
                  >
                    <span>Start Full Exam</span>
                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  </Link>
                  <button className="px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-2">
                    <span>Download Syllabus</span>
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
              <nav className="flex gap-8">
                <button className="pb-4 border-b-2 border-[#10b981] text-[#10b981] font-bold text-sm">
                  Description
                </button>
                <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
                  Exam Breakdown
                </button>
                <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
                  Study Plan
                </button>
                <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
                  Reviews
                </button>
              </nav>
            </div>

            {/* Description Content */}
            <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-bold text-slate-900 mb-4">About this Exam</h3>
              <p className="text-slate-600 mb-6">
                The test is a two-hour multiple-choice assessment that consists of 200 questions divided into two sections: Listening and Reading.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                    <span className="material-symbols-outlined">headphones</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">Section I: Listening</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Test takers listen to a variety of questions and short conversations recorded in English, then answer questions based on what they have heard (100 items total).
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Part 1: Photographs
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Part 2: Question-Response
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Part 3: Conversations
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Part 4: Talks
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                    <span className="material-symbols-outlined">menu_book</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">Section II: Reading</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Test takers read a variety of materials and respond at their own pace (100 items total).
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      Part 5: Incomplete Sentences
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      Part 6: Text Completion
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      Part 7: Reading Comprehension
                    </li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-4">What you'll learn</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 mt-0.5 text-[20px]">check_circle</span>
                  <span className="text-sm text-slate-600">Understand detailed explanations and instructions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 mt-0.5 text-[20px]">check_circle</span>
                  <span className="text-sm text-slate-600">Comprehend complex business documents</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 mt-0.5 text-[20px]">check_circle</span>
                  <span className="text-sm text-slate-600">Follow extended conversations and talks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 mt-0.5 text-[20px]">check_circle</span>
                  <span className="text-sm text-slate-600">Connect information across multiple texts</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Exam Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Exam Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Format</span>
                  <span className="text-sm font-semibold text-slate-900">Multiple Choice</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Questions</span>
                  <span className="text-sm font-semibold text-slate-900">200 Items</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Duration</span>
                  <span className="text-sm font-semibold text-slate-900">2 Hours</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Skill Level</span>
                  <span className="text-sm font-semibold text-slate-900">Intermediate - Advanced</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Language</span>
                  <span className="text-sm font-semibold text-slate-900">English</span>
                </div>
              </div>
            </div>

            {/* Instructor / Provider */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Provided By</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400 text-[24px]">school</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">ETS Official</p>
                  <p className="text-xs text-slate-500">Educational Testing Service</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                The creator of the TOEIC tests, ETS is the world's largest private nonprofit educational testing and assessment organization.
              </p>
              <button className="w-full py-2 text-sm font-semibold text-[#10b981] border border-[#10b981]/20 rounded-lg hover:bg-[#10b981]/5 transition-colors">
                View Provider Profile
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Business</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Communication</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Workplace</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">International</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

