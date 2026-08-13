'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const TypewriterText = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 50); // Speed of typing
    
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="text-zinc-400 font-mono text-sm mb-6 h-6 flex items-center justify-center">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-2 h-4 bg-zinc-400 ml-1"
      />
    </div>
  );
};

export default function StealthLogin() {
  const [otp, setOtp] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  // Show input after typing effect finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInput(true);
    }, 2000); // Wait for the typewriter text to finish
    return () => clearTimeout(timer);
  }, []);

  // Focus input automatically on mount and keep it focused
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
    const handleGlobalClick = () => {
      if (showInput && inputRef.current) {
        inputRef.current.focus();
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [showInput]);

  const verifyOtp = async (code) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (res.ok) {
        router.push('/admin');
      } else {
        setOtp('');
        setIsError(true);
        setIsLoading(false);
        // Remove error state after shake animation
        setTimeout(() => setIsError(false), 500);
      }
    } catch (e) {
      setOtp('');
      setIsError(true);
      setIsLoading(false);
      setTimeout(() => setIsError(false), 500);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setIsError(false);

    if (value.length === 6) {
      verifyOtp(value);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <TypewriterText text="> INICIANDO CONEXÃO SEGURA... AGUARDANDO OTP" />

        <AnimatePresence>
          {showInput && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={isError ? { opacity: 1, y: 0, x: [-10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Subtle glow effect behind the input */}
              <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-full blur opacity-20 transition-opacity duration-500"></div>
              
              <input
                ref={inputRef}
                type="password"
                value={otp}
                onChange={handleChange}
                disabled={isLoading}
                className="relative w-48 h-12 bg-zinc-900/50 border border-zinc-800/50 rounded-full text-center text-zinc-300 text-lg tracking-[0.5em] outline-none backdrop-blur-md focus:border-zinc-700 focus:bg-zinc-900 transition-all duration-300"
                style={{ 
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  caretColor: 'transparent' // completely stealth
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Background ambient light */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-zinc-800 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none"
      />
    </div>
  );
}
