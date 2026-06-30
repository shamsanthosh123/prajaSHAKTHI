import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  MapPin,
  CheckCircle2,
  Users,
  Building2,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  Play,
  Globe,
} from "lucide-react";

function CounterAnimation({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <>{count.toLocaleString()}</>;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"en" | "kn">("en");

  const stats = [
    { icon: MapPin, label: "Issues Reported", labelKn: "ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆಗಳು", value: 45678, color: "text-primary" },
    { icon: CheckCircle2, label: "Resolved", labelKn: "ಪರಿಹರಿಸಲಾಗಿದೆ", value: 38942, color: "text-success" },
    { icon: Users, label: "Active Citizens", labelKn: "ಸಕ್ರಿಯ ನಾಗರಿಕರು", value: 12543, color: "text-warning" },
    { icon: Building2, label: "Districts Covered", labelKn: "ಜಿಲ್ಲೆಗಳು", value: 31, color: "text-primary" },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Detection",
      titleKn: "AI ಆಧಾರಿತ ಪತ್ತೆ",
      description: "Automatically categorize and prioritize issues using advanced AI",
      descriptionKn: "ಸುಧಾರಿತ AI ಬಳಸಿ ಸಮಸ್ಯೆಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ವರ್ಗೀಕರಿಸಿ",
    },
    {
      icon: Shield,
      title: "Real-time Tracking",
      titleKn: "ನೈಜ ಸಮಯ ಟ್ರ್ಯಾಕಿಂಗ್",
      description: "Track your complaint from submission to resolution",
      descriptionKn: "ನಿಮ್ಮ ದೂರನ್ನು ಸಲ್ಲಿಸುವುದರಿಂದ ಪರಿಹಾರದವರೆಗೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    },
    {
      icon: Zap,
      title: "Instant Alerts",
      titleKn: "ತತ್ಕ್ಷಣ ಎಚ್ಚರಿಕೆಗಳು",
      description: "Get notified about updates and nearby issues",
      descriptionKn: "ನವೀಕರಣಗಳು ಮತ್ತು ಹತ್ತಿರದ ಸಮಸ್ಯೆಗಳ ಬಗ್ಗೆ ಸೂಚನೆ ಪಡೆಯಿರಿ",
    },
    {
      icon: TrendingUp,
      title: "Community Impact",
      titleKn: "ಸಮುದಾಯ ಪ್ರಭಾವ",
      description: "Earn points and badges for contributing to your community",
      descriptionKn: "ನಿಮ್ಮ ಸಮುದಾಯಕ್ಕೆ ಕೊಡುಗೆ ನೀಡಲು ಅಂಕಗಳು ಮತ್ತು ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ಗಳಿಸಿ",
    },
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      nameKn: "ರಾಜೇಶ್ ಕುಮಾರ್",
      location: "Bengaluru",
      locationKn: "ಬೆಂಗಳೂರು",
      quote: "Reported a pothole and it was fixed within 3 days! Amazing platform.",
      quoteKn: "ಒಂದು ಗುಂಡಿಯನ್ನು ವರದಿ ಮಾಡಿದೆ ಮತ್ತು ಅದನ್ನು 3 ದಿನಗಳಲ್ಲಿ ಸರಿಪಡಿಸಲಾಯಿತು!",
      points: 1250,
    },
    {
      name: "Priya Sharma",
      nameKn: "ಪ್ರಿಯಾ ಶರ್ಮಾ",
      location: "Mysuru",
      locationKn: "ಮೈಸೂರು",
      quote: "The AI assistant helped me report issues in Kannada. Very helpful!",
      quoteKn: "AI ಸಹಾಯಕವು ಕನ್ನಡದಲ್ಲಿ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಲು ಸಹಾಯ ಮಾಡಿತು!",
      points: 980,
    },
    {
      name: "Suresh Gowda",
      nameKn: "ಸುರೇಶ್ ಗೌಡ",
      location: "Mangaluru",
      locationKn: "ಮಂಗಳೂರು",
      quote: "Great way to connect with local authorities. Transparency at its best!",
      quoteKn: "ಸ್ಥಳೀಯ ಅಧಿಕಾರಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಲು ಉತ್ತಮ ಮಾರ್ಗ!",
      points: 1540,
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Report Issue",
      titleKn: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
      description: "Take a photo or describe the problem",
      descriptionKn: "ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ",
    },
    {
      step: 2,
      title: "AI Analysis",
      titleKn: "AI ವಿಶ್ಲೇಷಣೆ",
      description: "Our AI categorizes and assigns priority",
      descriptionKn: "ನಮ್ಮ AI ವರ್ಗೀಕರಿಸುತ್ತದೆ ಮತ್ತು ಆದ್ಯತೆ ನೀಡುತ್ತದೆ",
    },
    {
      step: 3,
      title: "Verification",
      titleKn: "ಪರಿಶೀಲನೆ",
      description: "Department verifies and takes action",
      descriptionKn: "ಇಲಾಖೆ ಪರಿಶೀಲಿಸುತ್ತದೆ ಮತ್ತು ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ",
    },
    {
      step: 4,
      title: "Resolution",
      titleKn: "ಪರಿಹಾರ",
      description: "Issue resolved and AI verified",
      descriptionKn: "ಸಮಸ್ಯೆ ಪರಿಹರಿಸಲಾಗಿದೆ ಮತ್ತು AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="text-3xl font-bold">
              <span style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>ಪ್ರಜಾ</span>
              <span className="text-primary">Shakthi</span>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === "en" ? "kn" : "en")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>{language === "en" ? "ಕನ್ನಡ" : "English"}</span>
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-6 py-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              {language === "en" ? "Get Started" : "ಪ್ರಾರಂಭಿಸಿ"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
                <span className="text-primary">
                  {language === "en" ? "AI-Powered Civic Platform" : "AI ಆಧಾರಿತ ನಾಗರಿಕ ವೇದಿಕೆ"}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                {language === "en" ? (
                  <>
                    Empower Your
                    <br />
                    <span className="text-primary">Community</span>
                  </>
                ) : (
                  <>
                    ನಿಮ್ಮ ಸಮುದಾಯವನ್ನು
                    <br />
                    <span className="text-primary">ಸಬಲಗೊಳಿಸಿ</span>
                  </>
                )}
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                {language === "en"
                  ? "Report, track, and resolve public infrastructure issues with AI-assisted classification and transparent status updates."
                  : "AI ಶ��್ತಿಯೊಂದಿಗೆ ಸಾರ್ವಜನಿಕ ಮೂಲಸೌಕರ್ಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ, ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ಪರಿಹರಿಸಿ."}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/auth")}
                  className="px-8 py-4 bg-primary hover:bg-primary/90 rounded-xl transition-all flex items-center gap-2 group"
                >
                  <span>{language === "en" ? "Start Reporting" : "ವರದಿ ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿ"}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  <span>{language === "en" ? "Watch Demo" : "ಡೆಮೊ ನೋಡಿ"}</span>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative">
                {/* Karnataka Map Visualization */}
                <div className="w-full h-[500px] bg-gradient-to-br from-card via-card to-primary/10 rounded-3xl border border-white/10 backdrop-blur-xl p-8 relative overflow-hidden">
                  <svg
                    viewBox="0 0 400 500"
                    className="w-full h-full text-primary/30"
                  >
                    <path
                      d="M200,50 L300,100 L350,180 L340,280 L300,360 L250,420 L180,450 L100,420 L60,340 L50,240 L80,150 L140,80 Z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  {/* Floating markers */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 bg-primary rounded-full"
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`,
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ambient Background */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              {language === "en" ? "Powerful Features" : "ಶಕ್ತಿಶಾಲಿ ವೈಶಿಷ್ಟ್ಯಗಳು"}
            </h2>
            <p className="text-xl text-gray-400">
              {language === "en"
                ? "Everything you need to make a real impact"
                : "ನಿಜವಾದ ಪರಿಣಾಮ ಬೀರಲು ನಿಮಗೆ ಬೇಕಾದ ಎಲ್ಲವೂ"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:border-primary/50 transition-all group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {language === "en" ? feature.title : feature.titleKn}
                </h3>
                <p className="text-gray-400">
                  {language === "en" ? feature.description : feature.descriptionKn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-card/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              {language === "en" ? "How It Works" : "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ"}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold relative">
                    {item.step}
                    {index < howItWorks.length - 1 && (
                      <div className="hidden md:block absolute left-full top-1/2 w-full h-0.5 bg-primary/30" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {language === "en" ? item.title : item.titleKn}
                  </h3>
                  <p className="text-gray-400">
                    {language === "en" ? item.description : item.descriptionKn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-12 text-center relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {language === "en" ? "Ready to Make a Difference?" : "ಬದಲಾವಣೆ ತರಲು ಸಿದ್ಧರಿದ್ದೀರಾ?"}
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                {language === "en"
                  ? "Create an account and submit your first verified civic report"
                  : "ಕರ್ನಾಟಕದಲ್ಲಿ ಸಾವಿರಾರು ಸಕ್ರಿಯ ನಾಗರಿಕರನ್ನು ಸೇರಿ"}
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="px-8 py-4 bg-white text-primary hover:bg-gray-100 rounded-xl transition-all inline-flex items-center gap-2 group font-bold"
              >
                <span>{language === "en" ? "Get Started Now" : "ಈಗ ಪ್ರಾರಂಭಿಸಿ"}</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <div className="text-2xl font-bold mb-4">
            <span style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>ಪ್ರಜಾ</span>
            <span className="text-primary">Shakthi</span>
          </div>
          <p>{language === "en" ? "Powering Citizens. Transforming Communities." : "ನಾಗರಿಕರನ್ನು ಸಬಲಗೊಳಿಸುವುದು. ಸಮುದಾಯಗಳನ್ನು ಪರಿವರ್ತಿಸುವುದು."}</p>
        </div>
      </footer>
    </div>
  );
}
