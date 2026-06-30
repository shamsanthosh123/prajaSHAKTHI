import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Upload, Camera, X, FileImage, MapPin,
  ChevronRight, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";
import { useLang } from "./LanguageContext";

declare global {
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// ── Gemini API key – put yours here or in .env ────────────────────────────────
const GEMINI_KEY = "AIzaSyAfzrf_eQSHgZ8aPsrP5bSgvTuelZdk5wU";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
// ── helpers ───────────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const d = await r.json();
    return d.display_name?.split(",").slice(0, 3).join(", ") ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function analyzeWithGemini(file: File, extraDesc: string) {
  const base64 = await fileToBase64(file);
  const mime = file.type || "image/jpeg";

  const prompt = `You are an AI assistant for PrajaShakthi, a Karnataka civic issue reporting platform.

Analyze this image and return ONLY a valid JSON object (no markdown, no backticks) with these exact fields:

{
  "issueType": "one of: Pothole, Garbage, Water Leakage, Street Light, Road Damage, Open Drain, Fallen Tree, Other",
  "severity": "one of: Critical, High, Medium, Low",
  "titleEn": "short issue title in English (max 10 words)",
  "titleKn": "same title in Kannada script",
  "descriptionEn": "2-3 sentence professional complaint description in English",
  "descriptionKn": "same description in Kannada script",
  "department": "one of: BBMP Roads, BBMP Solid Waste, BESCOM, BWSSB Water Board, BDA, BBMP Parks, Other",
  "urgency": "one sentence explaining why this needs attention",
  "confidence": 0.0 to 1.0
}

${extraDesc ? `Additional context from reporter: ${extraDesc}` : ""}

Return ONLY the JSON. No explanation, no markdown.`;

  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mime, data: base64 } },
          { text: prompt },
        ],
      },
    ],
   generationConfig: { temperature: 0.2, maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 } },
  };

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  // strip any accidental markdown
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── severity colour ───────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
  High:     "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Medium:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Low:      "bg-green-500/20 text-green-400 border-green-500/30",
};

// ─────────────────────────────────────────────────────────────────────────────
export function ReportIssue() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extraDesc, setExtraDesc] = useState("");

  // GPS
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "found" | "error">("detecting");
  const [locationText, setLocationText] = useState(t("Detecting location…", "ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಲಾಗುತ್ತಿದೆ…"));
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // AI
  const [aiStatus, setAiStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [aiResult, setAiResult] = useState<Record<string, string> | null>(null);
  const [aiError, setAiError] = useState("");

  // ── auto-detect GPS on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setLocationText(t("Location not supported", "ಸ್ಥಳ ಬೆಂಬಲಿತವಲ್ಲ"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        setGpsStatus("found");
        const addr = await reverseGeocode(lat, lng);
        setLocationText(addr);
      },
      () => {
        setGpsStatus("error");
        setLocationText(t("Location access denied", "ಸ್ಥಳ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ"));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // ── file handlers ────────────────────────────────────────────────────────
  const pickFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setAiResult(null);
    setAiStatus("idle");
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) pickFile(e.target.files[0]);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]);
  };

  // ── Gemini analysis ──────────────────────────────────────────────────────
  const runAnalysis = async () => {
  if (!file) return;
  setAiStatus("analyzing");
  setAiError("");
  
  // retry up to 3 times with delay
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await new Promise(r => setTimeout(r, attempt * 1500));
      const result = await analyzeWithGemini(file, extraDesc);
      setAiResult(result);
      setAiStatus("done");
      return;
    } catch (err: unknown) {
      if (attempt === 3) {
        setAiStatus("error");
        setAiError(err instanceof Error ? err.message : "Analysis failed after 3 attempts");
      }
    }
  }
};

  // ── proceed to preview ───────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!aiResult || !file) return;
    navigate("/app/preview", {
      state: {
        aiResult,
        imageUrl: preview,
        imageFile: file,
        fileName: file.name,
        location: locationText,
        coords,
        extraDesc,
        timestamp: new Date().toISOString(),
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 pb-8">

      {/* ── GPS Location ── */}
      <div className="bg-card border border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          gpsStatus === "found" ? "bg-green-500/20" :
          gpsStatus === "error" ? "bg-red-500/20" : "bg-primary/10"
        }`}>
          {gpsStatus === "detecting" ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : gpsStatus === "found" ? (
            <MapPin className="w-5 h-5 text-green-400" />
          ) : (
            <MapPin className="w-5 h-5 text-red-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">{t("Your location", "ನಿಮ್ಮ ಸ್ಥಳ")}</p>
          <p className="text-sm font-medium truncate">{locationText}</p>
          {coords && (
            <p className="text-xs text-gray-500 mt-0.5">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </div>
        {gpsStatus === "error" && (
          <button
            onClick={() => window.location.reload()}
            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            {t("Retry", "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ")}
          </button>
        )}
      </div>

      {/* ── Upload Zone ── */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-white/20 hover:border-primary/60 bg-card/50"
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
              isDragging ? "bg-primary scale-110" : "bg-primary/10"
            }`}>
              <Upload className={`w-8 h-8 ${isDragging ? "text-white" : "text-primary"}`} />
            </div>
            <h3 className="font-bold text-lg mb-1">
              {t("Upload Photo of Issue", "ಸಮಸ್ಯೆಯ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ")}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {t("Drag & drop or click to browse", "ಡ್ರ್ಯಾಗ್ & ಡ್ರಾಪ್ ಅಥವಾ ಕ್ಲಿಕ್ ಮಾಡಿ")}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-sm text-primary transition-colors"
              >
                <Camera className="w-4 h-4" />
                {t("Take Photo", "ಫೋಟೋ ತೆಗೆಯಿರಿ")}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-colors"
              >
                <FileImage className="w-4 h-4" />
                {t("Gallery", "ಗ್ಯಾಲರಿ")}
              </button>
            </div>
          </div>
        ) : (
          /* ── Image Preview ── */
          <div className="relative rounded-2xl overflow-hidden bg-card border border-white/10">
            <img
              src={preview!}
              alt="Issue"
              className="w-full max-h-64 object-cover"
            />
            <button
              onClick={() => { setFile(null); setPreview(null); setAiResult(null); setAiStatus("idle"); }}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <FileImage className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-white">{file.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Extra description ── */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">
          {t("Additional details (optional)", "ಹೆಚ್ಚಿನ ವಿವರಗಳು (ಐಚ್ಛಿಕ)")}
        </label>
        <textarea
          value={extraDesc}
          onChange={(e) => setExtraDesc(e.target.value)}
          placeholder={t(
            "Describe the issue in detail…",
            "ಸಮಸ್ಯೆಯನ್ನು ವಿವರವಾಗಿ ವಿವರಿಸಿ…"
          )}
          className="w-full h-24 px-4 py-3 bg-card border border-white/10 rounded-xl focus:outline-none focus:border-primary transition-colors resize-none text-sm"
        />
      </div>

      {/* ── Analyze Button ── */}
      {file && aiStatus !== "done" && (
        <button
          onClick={runAnalysis}
          disabled={aiStatus === "analyzing"}
          className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
        >
          {aiStatus === "analyzing" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("Analyzing with Gemini AI…", "Gemini AI ಯೊಂದಿಗೆ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…")}
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              {t("Analyze with AI", "AI ಯೊಂದಿಗೆ ವಿಶ್ಲೇಷಿಸಿ")}
            </>
          )}
        </button>
      )}

      {/* ── AI Error ── */}
      {aiStatus === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
          <p className="font-medium mb-1">⚠ {t("Analysis failed", "ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ")}</p>
          <p className="text-xs opacity-80">{aiError}</p>
          <button onClick={runAnalysis} className="mt-2 text-xs underline">
            {t("Try again", "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ")}
          </button>
        </div>
      )}

      {/* ── AI Result Card ── */}
      {aiStatus === "done" && aiResult && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-green-500/30 rounded-2xl overflow-hidden"
        >
          {/* header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border-b border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">
              {t("Gemini AI Analysis Complete", "Gemini AI ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ")}
            </span>
            <span className="ml-auto text-xs text-gray-400">
              {Math.round((parseFloat(aiResult.confidence) || 0) * 100)}% {t("confidence", "ವಿಶ್ವಾಸ")}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {/* category + severity */}
            <div className="flex gap-3 flex-wrap">
              <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-medium">
                {aiResult.issueType}
              </span>
              <span className={`px-3 py-1 border rounded-full text-sm font-medium ${SEV_COLOR[aiResult.severity] ?? SEV_COLOR.Medium}`}>
                {aiResult.severity}
              </span>
              <span className="px-3 py-1 bg-white/5 text-gray-300 border border-white/10 rounded-full text-sm">
                {aiResult.department}
              </span>
            </div>

            {/* title */}
            <div>
              <p className="text-xs text-gray-400 mb-1">{t("Issue Title", "ಸಮಸ್ಯೆ ಶೀರ್ಷಿಕೆ")}</p>
              <p className="font-semibold">{lang === "en" ? aiResult.titleEn : aiResult.titleKn}</p>
            </div>

            {/* description */}
            <div>
              <p className="text-xs text-gray-400 mb-1">{t("Description", "ವಿವರಣೆ")}</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {lang === "en" ? aiResult.descriptionEn : aiResult.descriptionKn}
              </p>
            </div>

            {/* urgency */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
              <p className="text-xs text-orange-400 font-medium mb-0.5">
                {t("Why urgent?", "ತುರ್ತು ಏಕೆ?")}
              </p>
              <p className="text-xs text-gray-300">{aiResult.urgency}</p>
            </div>

            {/* Kannada translation toggle */}
            {lang === "en" && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400 mb-1">ಕನ್ನಡ ಅನುವಾದ</p>
                <p className="text-sm text-gray-300" style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>
                  {aiResult.descriptionKn}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Submit to Preview ── */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => navigate("/app")}
          className="px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors"
        >
          {t("Cancel", "ರದ್ದು")}
        </button>
        <button
          onClick={handleSubmit}
          disabled={aiStatus !== "done"}
          className="flex-1 py-3.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold flex items-center justify-center gap-2 transition-all group"
        >
          {t("Submit Complaint →", "ದೂರು ಸಲ್ಲಿಸಿ →")}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
