import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { compressImageToBase64 } from "../lib/firebaseData";
import {
  MapPin, Building2, Calendar, Send,
  FileImage, Sparkles, Loader2, AlertTriangle,
} from "lucide-react";
import { useLang } from "./LanguageContext";

// severity colour helper
const SEV_COLOR: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  High:     "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Medium:   "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Low:      "bg-green-500/20 text-green-400 border border-green-500/30",
};

export function ComplaintPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [descLang, setDescLang] = useState<"en" | "kn">("en");

  // ── Read real AI data passed from ReportIssue ──────────────────────────────
  const state = location.state as {
    aiResult: Record<string, string>;
    imageUrl: string;
    imageFile: File;
    fileName: string;
    location: string;
    coords: { lat: number; lng: number } | null;
    extraDesc: string;
    timestamp: string;
  } | null;

  // If someone navigates here directly without state, redirect back
  if (!state || !state.aiResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <AlertTriangle className="w-12 h-12 text-orange-400" />
        <h2 className="text-xl font-bold">{t("No complaint data found", "ದೂರಿನ ಡೇಟಾ ಕಂಡುಬಂದಿಲ್ಲ")}</h2>
        <p className="text-gray-400 text-sm">{t("Please start a new report", "ದಯವಿಟ್ಟು ಹೊಸ ವರದಿ ಪ್ರಾರಂಭಿಸಿ")}</p>
        <button
          onClick={() => navigate("/app/report")}
          className="px-6 py-3 bg-primary rounded-xl font-medium"
        >
          {t("Report Issue", "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ")}
        </button>
      </div>
    );
  }

  const { aiResult, imageUrl, location: locationText, coords, extraDesc, timestamp } = state;
  const date = new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Save to Firestore ──────────────────────────────────────────────────────
const handleSubmit = async () => {
  setSubmitting(true);
  try {
    let finalImageUrl = "";

    if (state.imageFile) {
      setUploadProgress(50);
      finalImageUrl = await compressImageToBase64(state.imageFile);
      setUploadProgress(100);
    }

    const docRef = await addDoc(collection(db, "complaints"), {
      userId:    auth.currentUser?.uid ?? "",
      userEmail: auth.currentUser?.email ?? "",
      userName:  auth.currentUser?.displayName || "Citizen",
      issueType:     aiResult.issueType,
      severity:      aiResult.severity,
      titleEn:       aiResult.titleEn,
      titleKn:       aiResult.titleKn,
      descriptionEn: aiResult.descriptionEn,
      descriptionKn: aiResult.descriptionKn,
      department:    aiResult.department,
      urgency:       aiResult.urgency,
      confidence:    aiResult.confidence,
      location: locationText,
      coords:   coords ?? null,
      extraDesc: extraDesc || "",
      imageUrl: finalImageUrl,
      status:   "Submitted",
      priority: aiResult.severity,
      locationVerification: "pending",
      verificationStatus: "pending",
      votes:    { urgent: 0, needsAttention: 0, alreadyFixed: 0 },
      voterIds: {},
      heroPoints: 50,
      assignedTo: "",
      assignedOfficerId: "",
      assignedOfficerName: "",
      adminNote: "",
      internalNotes: [],
      publicUpdates: [],
      timeline: [
        { id: "submit-1", type: "submitted", title: "Complaint Submitted", at: Timestamp.now(), isPublic: true },
      ],
      statusHistory: [
        { status: "Submitted", at: Timestamp.now(), note: "Complaint submitted" },
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    navigate(`/app/tracking/${docRef.id}`);
  } catch (err) {
    console.error(err);
    alert(t("Failed to submit. Please try again.", "ಸಲ್ಲಿಕೆ ವಿಫಲವಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    setSubmitting(false);
  }
};

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 pb-8">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">{t("Preview & Submit", "ಪೂರ್ವಾವಲೋಕನ & ಸಲ್ಲಿಸಿ")}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {t("Review your complaint before submitting", "ಸಲ್ಲಿಸುವ ಮೊದಲು ನಿಮ್ಮ ದೂರನ್ನು ಪರಿಶೀಲಿಸಿ")}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── Photo Evidence ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-white/10 flex items-center gap-2">
            <FileImage className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">{t("Evidence Photo", "ಸಾಕ್ಷ್ಯ ಫೋಟೋ")}</span>
          </div>

          {imageUrl ? (
            <img src={imageUrl} alt="Issue" className="w-full max-h-52 object-cover" />
          ) : (
            <div className="h-40 flex items-center justify-center bg-white/5">
              <FileImage className="w-10 h-10 text-gray-600" />
            </div>
          )}

          {/* AI badge */}
          <div className="p-4 bg-green-500/10 border-t border-green-500/20 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-400">
                {t("Gemini AI Verified", "Gemini AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ")}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {Math.round((parseFloat(aiResult.confidence) || 0) * 100)}% {t("confidence", "ವಿಶ್ವಾಸ")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Complaint Details ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-white/10 rounded-2xl p-4 space-y-4"
        >
          <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">
            {t("Complaint Details", "ದೂರಿನ ವಿವರಗಳು")}
          </h2>

          {/* Title */}
          <div>
            <p className="text-xs text-gray-500 mb-1">{t("Issue Title", "ಸಮಸ್ಯೆ ಶೀರ್ಷಿಕೆ")}</p>
            <p className="font-semibold text-base leading-snug">
              {lang === "en" ? aiResult.titleEn : aiResult.titleKn}
            </p>
          </div>

          {/* Category + Severity */}
          <div>
            <p className="text-xs text-gray-500 mb-2">{t("Category & Severity", "ವರ್ಗ & ತೀವ್ರತೆ")}</p>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-medium">
                {aiResult.issueType}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${SEV_COLOR[aiResult.severity] ?? SEV_COLOR.Medium}`}>
                {aiResult.severity}
              </span>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t("Department", "ಇಲಾಖೆ")}</p>
              <p className="font-medium text-sm">{aiResult.department}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t("Location", "ಸ್ಥಳ")}</p>
              <p className="font-medium text-sm">{locationText}</p>
              {coords && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t("Date", "ದಿನಾಂಕ")}</p>
              <p className="font-medium text-sm">{date}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── AI Description ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card border border-white/10 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">{t("AI Generated Description", "AI ರಚಿಸಿದ ವಿವರಣೆ")}</h2>
          <div className="flex gap-1.5">
            <button
              onClick={() => setDescLang("en")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                descLang === "en" ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10 text-gray-400"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setDescLang("kn")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                descLang === "kn" ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10 text-gray-400"
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        <div
          className="p-4 bg-white/5 rounded-xl text-gray-300 text-sm leading-relaxed"
          style={descLang === "kn" ? { fontFamily: "'Noto Sans Kannada', sans-serif" } : {}}
        >
          {descLang === "en" ? aiResult.descriptionEn : aiResult.descriptionKn}
        </div>

        {/* Urgency */}
        <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <p className="text-xs font-medium text-orange-400 mb-1">
            {t("Why urgent?", "ತುರ್ತು ಏಕೆ?")}
          </p>
          <p className="text-xs text-gray-300">{aiResult.urgency}</p>
        </div>

        {/* Extra desc if provided */}
        {extraDesc && (
          <div className="mt-3 p-3 bg-white/5 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">{t("Your additional notes", "ನಿಮ್ಮ ಹೆಚ್ಚಿನ ಟಿಪ್ಪಣಿಗಳು")}</p>
            <p className="text-xs text-gray-300">{extraDesc}</p>
          </div>
        )}
      </motion.div>

      {/* ── Hero Points Preview ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-card border border-white/10 rounded-2xl p-4 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-2xl flex-shrink-0">
          🏆
        </div>
        <div>
          <p className="font-semibold">{t("You'll earn 50 Hero Points!", "ನೀವು 50 ಹೀರೋ ಪಾಯಿಂಟ್‌ಗಳನ್ನು ಗಳಿಸುತ್ತೀರಿ!")}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {t("For reporting this civic issue", "ಈ ನಾಗರಿಕ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿದ್ದಕ್ಕಾಗಿ")}
          </p>
        </div>
        <div className="ml-auto text-2xl font-bold text-yellow-400">+50</div>
      </motion.div>

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="flex gap-3"
      >
        <button
          onClick={() => navigate("/app/report")}
          className="px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors"
        >
          {t("Back to Edit", "ಸಂಪಾದಿಸಲು ಹಿಂತಿರುಗಿ")}
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 py-3.5 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {uploadProgress > 0 && uploadProgress < 100
                ? t(`Uploading photo ${Math.round(uploadProgress)}%`, `ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ${Math.round(uploadProgress)}%`)
                : t("Submitting…", "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ…")}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {t("Submit Complaint", "ದೂರು ಸಲ್ಲಿಸಿ")}
            </>
          )}
        </button>
      </motion.div>

    </div>
  );
}
