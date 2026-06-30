import { useEffect, useState, useRef } from "react";
import { Bot, Loader2, Send, User, Sparkles, MessageSquare, AlertCircle, ArrowDown } from "lucide-react";
import { useAuth } from "./AuthContext";
import { subscribeToComplaints } from "../lib/firebaseData";
import { useLang } from "./LanguageContext";
import type { Complaint } from "../types";

type Message = { role: "user" | "assistant"; content: string };
const GEMINI_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY;

// A clean, lightweight helper to render basic markdown elements safely
function formatMarkdown(text: string) {
  if (!text) return "";
  
  // Format code blocks
  let formatted = text.replace(/```(json|javascript|typescript|html|css)?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-black/40 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-emerald-400"><code class="language-${lang || 'txt'}">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
  });

  // Format bold text
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  
  // Format lists
  formatted = formatted.replace(/^\s*-\s+(.*?)$/gm, '<li class="ml-4 list-disc text-gray-200">$1</li>');
  
  // Wrap sequential <li> tags in a <ul>
  formatted = formatted.replace(/(<li.*<\/li>)/g, '<ul class="my-2 space-y-1">$1</ul>');
  // Clean double-nested lists from multi-line replaces
  formatted = formatted.replace(/<\/ul>\s*<ul class="my-2 space-y-1">/g, "");

  // Format line breaks
  formatted = formatted.replace(/\n/g, "<br />");

  return formatted;
}

export function AIAssistant() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your PrajaShakthi AI Civic Assistant. I can help answer questions about your complaints, tell you how to report issues, and guide you on Karnataka civic services. Ask me anything!"
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => user ? subscribeToComplaints(setComplaints, user.uid) : undefined, [user]);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, loading]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // Show button if user scrolled up more than 150px
      setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 150);
    }
  };

  const send = async (textToSend?: string) => {
    const question = (textToSend || input).trim();
    if (!question || loading) return;
    setMessages((current) => [...current, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const complaintContext = complaints.slice(0, 20).map((item) => ({
        id: item.id,
        title: item.titleEn,
        type: item.issueType,
        status: item.status,
        department: item.department,
        location: item.location,
        officialUpdate: item.adminNote,
      }));
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are PrajaShakthi's concise civic support assistant for Karnataka.
Your goal is to assist citizens with their reports, help translate complaints, analyze details, and provide step-by-step guidance.
Currently the citizen interface is in language: ${lang === "kn" ? "Kannada" : "English"}.
Answer in the same language as the citizen (either Kannada or English). Keep your tone polite, helpful, and concise.
Never invent complaint details, status updates, or government actions that are not in the provided records.

The citizen's complaint records are: ${JSON.stringify(complaintContext)}
Question: ${question}`,
              }],
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
          }),
        },
      );
      if (!response.ok) throw new Error(`Assistant service returned ${response.status}`);
      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") || "I could not generate a response.";
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        content: `I couldn't reach the AI service. You can still view exact complaint updates under My Complaints. ${error instanceof Error ? error.message : ""}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    t("What is the status of my complaints?", "ನನ್ನ ದೂರುಗಳ ಸ್ಥಿತಿ ಏನು?"),
    t("How do I report a water leakage issue?", "ನೀರ ಸೋರಿಕೆಯ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡುವುದು ಹೇಗೆ?"),
    t("Translate my latest complaint into Kannada", "ನನ್ನ ಕೊನೆಯ ದೂರನ್ನು ಕನ್ನಡಕ್ಕೆ ಅನುವಾದಿಸಿ"),
    t("Who is responsible for street light issues?", "ಬೀದಿ ದೀಪದ ಸಮಸ್ಯೆಗಳಿಗೆ ಯಾರು ಜವಾಬ್ದಾರರು?"),
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto h-[calc(100vh-60px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            <Bot className="text-blue-400 w-8 h-8 animate-pulse" /> {t("AI Civic Assistant", "AI ನಾಗರಿಕ ಸಹಾಯಕ")}
          </h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            {t("Uses your live complaint records as context.", "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ದೂರುಗಳ ವಿವರಗಳನ್ನು ಸಂದರ್ಭವಾಗಿ ಬಳಸುತ್ತದೆ.")}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl relative shadow-2xl overflow-hidden">
        {/* Chat History Container */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
        >
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex gap-4 animate-fade-in ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div 
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
                  message.role === "user" 
                    ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white" 
                    : "bg-slate-800 border border-white/10 text-blue-400"
                }`}
              >
                {message.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div 
                className={`max-w-[75%] p-4 rounded-2xl shadow-md ${
                  message.role === "user" 
                    ? "bg-indigo-600/90 text-white rounded-tr-none" 
                    : "bg-slate-800/90 text-gray-100 border border-white/10 rounded-tl-none"
                }`}
              >
                <div 
                  className="prose prose-invert max-w-none text-[15px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-blue-400">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-slate-800/50 border border-white/5 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 text-gray-400">
                <Loader2 className="animate-spin w-4 h-4 text-blue-400" />
                <span>{t("Thinking…", "ಚಿಂತಿಸುತ್ತಿದೆ…")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-24 right-6 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center z-10"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}

        {/* Suggestion Chips */}
        {messages.length === 1 && !loading && (
          <div className="px-6 pb-4 pt-2">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              {t("Frequently Asked Suggestions:", "ಪುನರಾವರ್ತಿತ ಪ್ರಶ್ನೆಗಳ ಸಲಹೆಗಳು:")}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggest, index) => (
                <button
                  key={index}
                  onClick={() => send(suggest)}
                  className="text-xs px-3.5 py-2 bg-slate-800/80 hover:bg-indigo-950/80 hover:text-indigo-200 border border-white/5 hover:border-indigo-500/30 rounded-full transition-all text-left text-gray-300 shadow-sm"
                >
                  {suggest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-white/10 flex gap-3 items-center">
          <input 
            value={input} 
            onChange={(event) => setInput(event.target.value)} 
            onKeyDown={(event) => event.key === "Enter" && send()} 
            placeholder={t("Ask about a complaint or civic service…", "ದೂರು ಅಥವಾ ನಾಗರಿಕ ಸೇವೆಯ ಬಗ್ಗೆ ಕೇಳಿ…")} 
            className="flex-1 bg-slate-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/55 rounded-xl px-4 py-3 outline-none text-white transition-all text-[15px]" 
          />
          <button 
            disabled={!input.trim() || loading} 
            onClick={() => send()} 
            className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
