import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Mail, Lock, User, Globe, Chrome } from "lucide-react";
import { auth } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

export function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [language, setLanguage] = useState<"en" | "kn">("en");

  const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (isLogin) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name.trim() });
    }
    navigate("/app");
  } catch (error: any) {
    const msg = error.code === "auth/email-already-in-use"
      ? "This email is already registered. Please login instead."
      : error.code === "auth/weak-password"
      ? "Password must be at least 6 characters."
      : error.code === "auth/invalid-email"
      ? "Please enter a valid email address."
      : error.message;
    alert(msg);
  }
};

 const handleForgotPassword = async () => {
  if (!email.trim()) {
    alert("Enter your email address first.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email.trim());
    alert("Password reset email sent! Check your inbox.");
  } catch (error: any) {
    alert("Could not send reset email. Check your email address.");
  }
};

 const handleGoogleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();

    await signInWithPopup(auth, provider);

    navigate("/app");
  } catch (error: any) {
    alert(error.message);
  }
};

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Language Toggle */}
        <div className="absolute top-0 right-0 -translate-y-16">
          <button
            onClick={() => setLanguage(language === "en" ? "kn" : "en")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <Globe className="w-4 h-4" />
            <span>{language === "en" ? "ಕನ್ನಡ" : "English"}</span>
          </button>
        </div>

        <div className="bg-card border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold mb-2">
              <span style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>ಪ್ರಜಾ</span>
              <span className="text-primary">Shakthi</span>
            </div>
            <p className="text-gray-400">
              {language === "en"
                ? isLogin
                  ? "Welcome back, citizen!"
                  : "Join the civic revolution"
                : isLogin
                ? "ಮತ್ತೆ ಸ್ವಾಗತ, ನಾಗರಿಕ!"
                : "ನಾಗರಿಕ ಕ್ರಾಂತಿಗೆ ಸೇರಿ"}
            </p>
          </div>

          {/* Toggle Login/Signup */}
          <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg transition-all ${
                isLogin ? "bg-primary" : "hover:bg-white/5"
              }`}
            >
              {language === "en" ? "Login" : "ಲಾಗಿನ್"}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg transition-all ${
                !isLogin ? "bg-primary" : "hover:bg-white/5"
              }`}
            >
              {language === "en" ? "Sign Up" : "ಸೈನ್ ಅಪ್"}
            </button>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 mb-6 bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center gap-3 border border-white/10"
          >
            <Chrome className="w-5 h-5" />
            <span>
              {language === "en"
                ? "Continue with Google"
                : "Google ನೊಂದಿಗೆ ಮುಂದುವರಿಸಿ"}
            </span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-gray-400">
                {language === "en" ? "or" : "ಅಥವಾ"}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm mb-2 text-gray-400">
                  {language === "en" ? "Full Name" : "ಪೂರ್ಣ ಹೆಸರು"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={language === "en" ? "Enter your name" : "ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ"}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm mb-2 text-gray-400">
                {language === "en" ? "Email Address" : "ಇಮೇಲ್ ವಿಳಾಸ"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={language === "en" ? "Enter your email" : "ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ"}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-400">
                {language === "en" ? "Password" : "ಪಾಸ್ವರ್ಡ್"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                   value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={language === "en" ? "Enter your password" : "ನಿಮ್ಮ ಪಾಸ್ವರ್ಡ್ ನಮೂದಿಸಿ"}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:underline"
                >
                  {language === "en" ? "Forgot Password?" : "ಪಾಸ್ವರ್ಡ್ ಮರೆತಿರುವಿರಾ?"}
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary/90 rounded-xl transition-colors font-medium"
            >
              {language === "en"
                ? isLogin
                  ? "Login"
                  : "Create Account"
                : isLogin
                ? "ಲಾಗಿನ್"
                : "ಖಾತೆ ರಚಿಸಿ"}
            </button>
          </form>

          {/* Terms */}
          {!isLogin && (
            <p className="text-xs text-gray-400 text-center mt-6">
              {language === "en"
                ? "By signing up, you agree to our Terms of Service and Privacy Policy"
                : "ಸೈನ್ ಅಪ್ ಮಾಡುವ ಮೂಲಕ, ನೀವು ನಮ್ಮ ಸೇವಾ ನಿಯಮಗಳು ಮತ್ತು ಗೋಪ್ಯತಾ ನೀತಿಗೆ ಒಪ್ಪುತ್ತೀರಿ"}
            </p>
          )}
        </div>

        {/* Back to Landing */}
        <button
          onClick={() => navigate("/landing")}
          className="mt-6 w-full text-center text-gray-400 hover:text-white transition-colors"
        >
          {language === "en" ? "← Back to Home" : "← ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ"}
        </button>

        <button
          onClick={() => navigate("/admin/auth")}
          className="mt-3 w-full text-center text-orange-400/80 hover:text-orange-400 text-sm transition-colors"
        >
          {language === "en" ? "Department / Admin Portal →" : "ಇಲಾಖೆ / ಆಡಳಿತ ಪೋರ್ಟಲ್ →"}
        </button>
      </motion.div>
    </div>
  );
}
