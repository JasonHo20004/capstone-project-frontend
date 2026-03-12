import { Link } from "react-router-dom";

export default function ReadingTest() {
  return (
    <div className="bg-[#f8fafc] h-screen flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            L
          </div>
          <h1 className="font-bold text-slate-800">Academic LMS</h1>
          <div className="h-4 w-[1px] bg-slate-300 mx-2"></div>
          <span className="text-sm font-medium text-slate-500">Reading Test: The Future of AI</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md">
            <span className="material-symbols-outlined text-slate-500 text-[20px]">timer</span>
            <span className="font-mono font-bold text-slate-700">45:12</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-700">Sarah Connor</p>
              <p className="text-[10px] text-slate-500">ID: 99281</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
              SC
            </div>
          </div>
          <Link
            to="/exam/results/reading"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Submit
          </Link>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Reading Passage */}
        <div className="w-1/2 bg-white border-r border-slate-200 flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-indigo-500">article</span>
              Passage 1
            </h2>
            <div className="flex gap-2">
              <button
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-[20px]">zoom_in</span>
              </button>
              <button
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-[20px]">zoom_out</span>
              </button>
              <button
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                title="Highlight"
              >
                <span className="material-symbols-outlined text-[20px]">ink_highlighter</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none custom-scrollbar">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              The Evolution of Artificial Intelligence in Healthcare
            </h3>
            <p className="mb-4">
              Artificial intelligence (AI) is rapidly transforming the landscape of healthcare, offering unprecedented opportunities to improve patient outcomes, reduce costs, and enhance the efficiency of medical services. From diagnostic algorithms to robotic surgery, AI technologies are being integrated into various aspects of medical practice, promising a future where healthcare is more personalized, accessible, and effective.
            </p>
            <p className="mb-4">
              One of the most significant applications of AI in healthcare is in the field of medical imaging. Machine learning algorithms, trained on vast datasets of medical images, can now identify anomalies such as tumors, fractures, and retinal diseases with an accuracy that often rivals or exceeds that of human experts. For instance, a study published in <em>Nature</em> demonstrated that an AI system could detect breast cancer in mammograms with fewer false positives and false negatives than radiologists. This capability not only speeds up the diagnostic process but also reduces the likelihood of misdiagnosis, leading to earlier interventions and better survival rates.
            </p>
            <p className="mb-4">
              Beyond diagnostics, AI is playing a crucial role in drug discovery and development. The traditional process of bringing a new drug to market is time-consuming and expensive, often taking over a decade and costing billions of dollars. AI can accelerate this process by analyzing biological data to identify potential drug candidates, predicting their efficacy and toxicity, and optimizing clinical trial designs. Pharmaceutical companies are increasingly partnering with AI firms to leverage these capabilities, hoping to bring life-saving treatments to patients faster.
            </p>
            <p className="mb-4">
              However, the integration of AI into healthcare is not without challenges. Data privacy and security are paramount concerns, as AI systems rely on large volumes of sensitive patient data. Ensuring that this data is protected from breaches and misuse is essential for maintaining public trust. Additionally, there are ethical considerations regarding the accountability of AI decisions. If an AI algorithm makes an error that results in patient harm, determining liability can be complex. As such, regulatory frameworks must evolve to address these issues while fostering innovation.
            </p>
            <p className="mb-4">
              Furthermore, the &quot;black box&quot; nature of some AI models, particularly deep learning networks, poses a barrier to clinical adoption. Physicians need to understand the rationale behind an AI&apos;s recommendation to trust and act upon it. Explainable AI (XAI) is an emerging field aimed at making AI decision-making processes transparent and interpretable to human users. By providing insights into how an AI arrived at a specific conclusion, XAI can help bridge the gap between technological capability and clinical practice.
            </p>
            <p>
              In conclusion, while AI holds immense promise for the future of healthcare, its successful implementation requires a balanced approach that addresses technical, ethical, and regulatory challenges. By fostering collaboration between technologists, clinicians, and policymakers, we can harness the power of AI to create a healthcare system that is not only more efficient but also more humane.
            </p>
          </div>
        </div>

        {/* Right Panel: Questions */}
        <div className="w-1/2 bg-[#f8fafc] flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
            <h2 className="font-bold text-slate-700">Questions 1-5</h2>
            <div className="text-xs font-medium text-slate-500">Multiple Choice</div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-8">
              {/* Question 1 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </span>
                  <p className="font-medium text-slate-800 pt-1">
                    According to the passage, how does AI impact medical imaging?
                  </p>
                </div>
                <div className="space-y-3 pl-12">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q1"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      It completely replaces the need for human radiologists.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q1"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      defaultChecked
                    />
                    <span className="text-sm text-slate-900 font-medium">
                      It can identify anomalies with accuracy comparable to or better than experts.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q1"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      It increases the cost of diagnostic procedures significantly.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q1"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      It is primarily used for organizing patient records rather than diagnosis.
                    </span>
                  </label>
                </div>
              </div>

              {/* Question 2 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </span>
                  <p className="font-medium text-slate-800 pt-1">
                    What is mentioned as a benefit of using AI in drug discovery?
                  </p>
                </div>
                <div className="space-y-3 pl-12">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q2"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      It eliminates the need for clinical trials entirely.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q2"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      It allows drugs to be marketed without regulatory approval.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q2"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      It accelerates the identification of potential candidates and optimizes trials.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q2"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      It reduces the cost of drugs to zero for patients.
                    </span>
                  </label>
                </div>
              </div>

              {/* Question 3 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </span>
                  <p className="font-medium text-slate-800 pt-1">The &quot;black box&quot; nature of AI refers to:</p>
                </div>
                <div className="space-y-3 pl-12">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q3"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      The physical color of the computer servers.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q3"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      The high cost of implementing AI systems.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q3"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      The lack of transparency in how some AI models make decisions.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group">
                    <input
                      type="radio"
                      name="q3"
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      The ability of AI to store data securely.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Navigator */}
          <div className="bg-white border-t border-slate-200 p-4 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Navigator</span>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                  <span className="text-slate-600">Flagged</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-slate-200"></span>
                  <span className="text-slate-600">Unanswered</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                <button
                  key={num}
                  className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors
                    ${num === 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : num === 5 ? "bg-orange-100 text-orange-600 border border-orange-200" : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"}`}
                >
                  {num}
                </button>
              ))}
              <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

