import { Link } from "react-router-dom";

export default function ListeningTest() {
  return (
    <div className="bg-[#f8fafc] h-screen flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            L
          </div>
          <h1 className="font-bold text-slate-800">IELTS Advanced Listening</h1>
          <div className="h-4 w-[1px] bg-slate-300 mx-2"></div>
          <span className="text-sm font-medium text-slate-500">Section 3: Academic Discussion</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md">
            <span className="material-symbols-outlined text-slate-500 text-[20px]">timer</span>
            <span className="font-mono font-bold text-slate-700">12:30</span>
          </div>
          <Link
            to="/exam/results/listening"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Submit
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Audio Player Banner */}
        <div className="bg-white border-b border-slate-200 p-6 shrink-0 shadow-sm z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-6">
            <button className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200 transition-all hover:scale-105 text-white">
              <span className="material-symbols-outlined text-[28px] ml-1">play_arrow</span>
            </button>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                <span>Current Track: University Project Discussion</span>
                <span>02:14 / 05:30</span>
              </div>
              {/* Waveform Visualization */}
              <div className="h-12 flex items-center gap-0.5 opacity-80">
                {[...Array(60)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${i < 24 ? "bg-indigo-500" : "bg-slate-200"}`}
                    style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                  ></div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                <span className="material-symbols-outlined">volume_up</span>
              </button>
              <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                <span className="material-symbols-outlined">speed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Questions Area */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">Questions 21-25</h2>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  Multiple Choice
                </span>
              </div>
              <p className="text-slate-600 mb-8 italic">
                Choose the correct letter, <span className="font-bold text-slate-900">A</span>,{" "}
                <span className="font-bold text-slate-900">B</span>, or{" "}
                <span className="font-bold text-slate-900">C</span>.
              </p>

              <div className="space-y-8">
                {/* Question 21 */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm border border-indigo-100">
                      21
                    </span>
                    <p className="font-medium text-slate-800 pt-1">
                      What does the student say about the project deadline?
                    </p>
                  </div>
                  <div className="pl-12 space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600">
                        A
                      </div>
                      <input type="radio" name="q21" className="hidden peer" />
                      <span className="text-sm text-slate-700">It has been extended by one week.</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600">
                        B
                      </div>
                      <input type="radio" name="q21" className="hidden peer" />
                      <span className="text-sm text-slate-700">It is sooner than they expected.</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600">
                        C
                      </div>
                      <input type="radio" name="q21" className="hidden peer" />
                      <span className="text-sm text-slate-700">It conflicts with their exam schedule.</span>
                    </label>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Question 22 */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm border border-indigo-100">
                      22
                    </span>
                    <p className="font-medium text-slate-800 pt-1">
                      Which resource did the tutor recommend they use?
                    </p>
                  </div>
                  <div className="pl-12 space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600">
                        A
                      </div>
                      <input type="radio" name="q22" className="hidden peer" />
                      <span className="text-sm text-slate-700">The university library archives.</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600">
                        B
                      </div>
                      <input type="radio" name="q22" className="hidden peer" />
                      <span className="text-sm text-slate-700">Online academic journals.</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600">
                        C
                      </div>
                      <input type="radio" name="q22" className="hidden peer" />
                      <span className="text-sm text-slate-700">Interviews with local business owners.</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">Questions 26-30</h2>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  Matching
                </span>
              </div>
              <p className="text-slate-600 mb-8 italic">
                What opinion does the student express about each of the following research methods?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Opinions</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>
                      <span className="font-bold text-slate-900">A</span> Too time-consuming
                    </p>
                    <p>
                      <span className="font-bold text-slate-900">B</span> Difficult to analyze
                    </p>
                    <p>
                      <span className="font-bold text-slate-900">C</span> Surprisingly effective
                    </p>
                    <p>
                      <span className="font-bold text-slate-900">D</span> Not relevant to the topic
                    </p>
                    <p>
                      <span className="font-bold text-slate-900">E</span> Too expensive
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-700">
                      <span className="font-bold mr-2">26.</span> Online Surveys
                    </span>
                    <select className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2">
                      <option>Select...</option>
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                      <option>D</option>
                      <option>E</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-700">
                      <span className="font-bold mr-2">27.</span> Focus Groups
                    </span>
                    <select className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2">
                      <option>Select...</option>
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                      <option>D</option>
                      <option>E</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-700">
                      <span className="font-bold mr-2">28.</span> Case Studies
                    </span>
                    <select className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2">
                      <option>Select...</option>
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                      <option>D</option>
                      <option>E</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

