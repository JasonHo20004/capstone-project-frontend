import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface QuestionData {
  questionText: string;
  questionType: string;
  options: string[];
  answer: Record<string, any>;
  questionOrder: number;
  imageUrl?: string;
}

interface SectionData {
  title: string;
  skill?: string;
  passageContent: string;
  mediaUrl?: string;
  imageUrl?: string;
  questions: QuestionData[];
}

interface ExamPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: SectionData[];
}

const SECTION_INSTRUCTIONS: Record<string, string> = {
  TRUE_FALSE_NOT_GIVEN:
    "Do the following statements agree with the information given in the passage?\n\nWrite:\nTRUE   —   if the statement agrees with the information\nFALSE   —   if the statement contradicts the information\nNOT GIVEN   —   if there is no information on this",
  YES_NO_NOT_GIVEN:
    "Do the following statements agree with the views/claims of the writer?\n\nWrite:\nYES   —   if the statement agrees with the views of the writer\nNO   —   if the statement contradicts the views of the writer\nNOT GIVEN   —   if it is impossible to say what the writer thinks about this",
  MULTIPLE_CHOICE: "Choose the correct letter, A, B, C or D.",
  MULTIPLE_CHOICE_MULTI_ANSWER: "Choose TWO letters, A–E.",
  GAP_FILL:
    "Complete the sentences below.\n\nChoose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.",
  SHORT_ANSWER:
    "Answer the questions below.\n\nChoose NO MORE THAN THREE WORDS from the passage for each answer.",
  MATCHING:
    "Look at the following statements and match each one with the correct option in the list below.",
};

function renderPassage(content: string) {
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  if (paragraphs.length < 2) {
    return <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</p>;
  }
  let labelIdx = 0;
  return (
    <>
      {paragraphs.map((para, i) => {
        const isTitle = i === 0 && para.length <= 90 && !para.endsWith(".");
        if (isTitle) {
          return <h2 key={i} className="text-base font-bold text-slate-900 mb-4">{para}</h2>;
        }
        const label = String.fromCharCode(65 + labelIdx++);
        return (
          <div key={i} className="flex gap-3 mb-4">
            <span className="text-xs font-bold text-slate-400 mt-1 w-5 shrink-0">{label}</span>
            <p className="text-sm text-slate-700 leading-relaxed">{para}</p>
          </div>
        );
      })}
    </>
  );
}

function ReadOnlyQuestion({ q }: { q: QuestionData }) {
  const options = q.options || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="font-medium text-sm text-slate-800 mb-3">
        <span className="text-slate-500 font-bold mr-2">{q.questionOrder}.</span>
        {q.questionText}
      </p>

      {q.imageUrl && (
        <img src={q.imageUrl} alt="" className="max-w-full rounded-lg border border-slate-200 mb-3" />
      )}

      {q.questionType === "MULTIPLE_CHOICE" && options.length > 0 && (
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isCorrect = q.answer?.correctIndex === idx;
            return (
              <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700"
              }`}>
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-500"
                }`}>
                  {letter}
                </span>
                {opt}
              </div>
            );
          })}
        </div>
      )}

      {(q.questionType === "TRUE_FALSE_NOT_GIVEN" || q.questionType === "YES_NO_NOT_GIVEN") && (
        <div className="flex gap-2 flex-wrap">
          {(q.questionType === "TRUE_FALSE_NOT_GIVEN"
            ? ["TRUE", "FALSE", "NOT GIVEN"]
            : ["YES", "NO", "NOT GIVEN"]
          ).map((opt) => (
            <span key={opt} className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
              q.answer?.correctAnswer === opt
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-400"
            }`}>
              {opt}
            </span>
          ))}
        </div>
      )}

      {(q.questionType === "GAP_FILL" || q.questionType === "SHORT_ANSWER" || q.questionType === "MATCHING") && (
        <div className="flex items-center gap-2">
          <span className="border-b-2 border-indigo-300 min-w-[120px] px-2 py-1 text-sm text-emerald-700 font-medium">
            {q.answer?.text?.[0] || q.answer?.correctAnswer || ""}
          </span>
          <span className="text-xs text-slate-400">← đáp án đúng</span>
        </div>
      )}
    </div>
  );
}

export default function ExamPreviewModal({ isOpen, onClose, title, sections }: ExamPreviewModalProps) {
  const [sectionIdx, setSectionIdx] = useState(0);

  if (!isOpen) return null;

  const section = sections[sectionIdx] ?? sections[0];
  if (!section) return null;

  const isListening = section.skill === "LISTENING";

  const groups: { type: string; questions: QuestionData[] }[] = [];
  for (const q of section.questions) {
    const last = groups[groups.length - 1];
    if (last && last.type === q.questionType) last.questions.push(q);
    else groups.push({ type: q.questionType, questions: [q] });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f8fafc] font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 h-12 flex items-center justify-between px-6 shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold shrink-0">
            <Eye className="w-3.5 h-3.5" />
            Preview
          </div>
          <span className="text-sm font-semibold text-slate-700 truncate">{title || "Untitled"}</span>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {sections.map((s, i) => (
            <button key={i} onClick={() => setSectionIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                i === sectionIdx ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {s.title || `Section ${i + 1}`}
            </button>
          ))}
        </div>

        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-white p-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            {isListening ? "Questions Context" : "Reading Passage"}
          </p>

          {isListening ? (
            <div className="space-y-4">
              {section.mediaUrl
                ? <audio controls className="w-full" src={section.mediaUrl} />
                : <div className="flex items-center justify-center h-20 rounded-xl bg-slate-100 text-slate-400 text-sm">Chưa có audio</div>
              }
              {section.passageContent && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transcript</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{section.passageContent}</p>
                </div>
              )}
            </div>
          ) : (
            section.passageContent
              ? renderPassage(section.passageContent)
              : <p className="text-sm text-slate-400 italic">Chưa có nội dung passage</p>
          )}

          {section.imageUrl && (
            <div className="mt-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diagram / Map</p>
              <img src={section.imageUrl} alt="diagram" className="w-full rounded-lg border border-slate-200" />
            </div>
          )}
        </div>

        {/* Right panel: questions */}
        <div className="w-1/2 overflow-y-auto bg-slate-50 p-6">
          <div className="space-y-5">
            {groups.length === 0 && (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Chưa có câu hỏi</div>
            )}
            {groups.map((group) => {
              const first = group.questions[0];
              const last = group.questions[group.questions.length - 1];
              const rangeLabel = first.questionOrder === last.questionOrder
                ? `Question ${first.questionOrder}`
                : `Questions ${first.questionOrder}–${last.questionOrder}`;
              const instruction = !isListening ? SECTION_INSTRUCTIONS[group.type] : undefined;
              return (
                <div key={`g-${first.questionOrder}`} className="space-y-4">
                  {instruction && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{rangeLabel}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{instruction}</p>
                    </div>
                  )}
                  {group.questions.map((q) => <ReadOnlyQuestion key={q.questionOrder} q={q} />)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      {sections.length > 1 && (
        <div className="bg-white border-t border-slate-200 h-11 flex items-center justify-between px-6 shrink-0">
          <button onClick={() => setSectionIdx((i) => Math.max(0, i - 1))} disabled={sectionIdx === 0}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-slate-400">Section {sectionIdx + 1} / {sections.length}</span>
          <button onClick={() => setSectionIdx((i) => Math.min(sections.length - 1, i + 1))} disabled={sectionIdx === sections.length - 1}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-30">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
