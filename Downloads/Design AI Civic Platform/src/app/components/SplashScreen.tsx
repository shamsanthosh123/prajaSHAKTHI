import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

export function SplashScreen() {
  const navigate = useNavigate();
  const [showKannada, setShowKannada] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowKannada(true), 300);
    const timer2 = setTimeout(() => setShowEnglish(true), 1200);
    const timer3 = setTimeout(() => setShowMap(true), 1800);
    const timer4 = setTimeout(() => setShowTagline(true), 2400);
    const timer5 = setTimeout(() => navigate("/landing"), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Karnataka Map Outline Background */}
      {showMap && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <svg
            width="400"
            height="500"
            viewBox="0 0 400 500"
            className="text-primary"
          >
            <motion.path
              d="M200,50 L300,100 L350,180 L340,280 L300,360 L250,420 L180,450 L100,420 L60,340 L50,240 L80,150 L140,80 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      )}

      {/* Logo and Text */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Kannada Text */}
        {showKannada && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="text-7xl md:text-9xl font-bold text-white relative">
              <span className="inline-block" style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>
                ಪ್ರಜಾ
              </span>
              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 text-primary blur-2xl opacity-60"
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <span style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>
                  ಪ್ರಜಾ
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* English Text */}
        {showEnglish && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl md:text-8xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-primary to-blue-300 bg-clip-text text-transparent">
              Shakthi
            </span>
          </motion.div>
        )}

        {/* Tagline */}
        {showTagline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-gray-300 text-lg md:text-xl tracking-wide text-center px-6"
          >
            Powering Citizens. Transforming Communities.
          </motion.div>
        )}
      </div>

      {/* Ambient Light Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
