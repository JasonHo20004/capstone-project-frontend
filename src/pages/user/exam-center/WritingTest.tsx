import { Link } from "react-router-dom";

export default function WritingTest() {
  return (
    <div className="bg-[#f8fafc] h-screen flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            W
          </div>
          <h1 className="font-bold text-slate-800">IELTS Writing Assessment</h1>
          <div className="h-4 w-[1px] bg-slate-300 mx-2"></div>
          <span className="text-sm font-medium text-slate-500">Task 2: Essay</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md">
            <span className="material-symbols-outlined text-slate-500 text-[20px]">timer</span>
            <span className="font-mono font-bold text-slate-700">38:45</span>
          </div>
          <Link
            to="/exam/results/writing"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Submit Essay
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Prompt */}
        <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-y-auto p-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Task Prompt</h2>
            <h3 className="text-lg font-bold text-slate-900 mb-4">The Impact of Remote Work</h3>
            <p className="text-sm text-slate-600 mb-4 italic border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-50/50 rounded-r">
              &quot;Some people believe that remote work has improved work-life balance, while others argue it has blurred the lines between professional and personal life. Discuss both views and give your own opinion.&quot;
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Give reasons for your answer and include any relevant examples from your own knowledge or experience.</p>
              <p>Write at least 250 words.</p>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Tips</h4>
            <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside">
              <li>Plan your essay structure before writing.</li>
              <li>Use a mix of complex and simple sentences.</li>
              <li>Check for spelling and grammar errors.</li>
              <li>Ensure you address all parts of the prompt.</li>
            </ul>
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="w-2/3 bg-white flex flex-col h-full">
          <div className="p-2 border-b border-slate-200 flex items-center gap-1 bg-slate-50">
            <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors" title="Bold">
              <span className="material-symbols-outlined text-[20px]">format_bold</span>
            </button>
            <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors" title="Italic">
              <span className="material-symbols-outlined text-[20px]">format_italic</span>
            </button>
            <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors" title="Underline">
              <span className="material-symbols-outlined text-[20px]">format_underlined</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-300 mx-2"></div>
            <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors" title="Bullet List">
              <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
            </button>
            <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors" title="Numbered List">
              <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
            </button>
            <div className="ml-auto flex items-center gap-3 px-3">
              <span className="text-xs font-medium text-slate-400">
                Word Count: <span className="text-slate-700 font-bold">142</span>
              </span>
            </div>
          </div>
          <textarea
            className="flex-1 p-8 text-lg leading-relaxed text-slate-800 outline-none resize-none font-serif"
            placeholder="Start typing your essay here..."
            defaultValue={`The shift towards remote work has been one of the most significant changes in the modern workforce, accelerated by global events. This transformation has sparked a debate regarding its impact on employees' lives. While proponents argue that it offers unparalleled flexibility, critics suggest it erodes the boundary between work and home.

On the one hand, remote work provides a level of autonomy that traditional office environments often lack. Employees can tailor their schedules to fit personal commitments, such as childcare or exercise, leading to a more balanced lifestyle. The elimination of the daily commute also saves time and reduces stress, contributing to overall well-being.

However, the lack of physical separation between the office and the living room can make it difficult to 'switch off.' Many remote workers report working longer hours and feeling pressured to be constantly available. This phenomenon, often referred to as 'always-on' culture, can lead to burnout and anxiety.`}
          ></textarea>
        </div>
      </div>
    </div>
  );
}

