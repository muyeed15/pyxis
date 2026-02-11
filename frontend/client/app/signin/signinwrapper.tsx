'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

export default function SignInWrapper() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-white overflow-hidden relative">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row gap-8 md:gap-12 z-10"
      >
        <div className="flex-1 flex flex-col justify-center space-y-6">
          <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
            Sign In
          </motion.h1>
          <motion.form variants={containerVariants} className="space-y-4">
             <motion.div variants={itemVariants}>
              <input
                type="email"
                placeholder="Email Address"

                className="w-full px-6 py-4 rounded-full bg-gray-50 border border-gray-200 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-6 py-4 rounded-full bg-gray-50 border border-gray-200 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
              />
            </motion.div>
          </motion.form>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-6 md:border-l md:border-gray-100 md:pl-12">
          <motion.div variants={containerVariants} className="space-y-4 flex flex-col">
            <motion.button 
              variants={itemVariants}
              className="w-full px-6 py-4 rounded-full bg-black text-white font-medium text-lg hover:opacity-80 transition-opacity"
            >
              Sign In
            </motion.button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm">Or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            <motion.button 
              variants={itemVariants}
              className="w-full px-6 py-3.5 rounded-full bg-transparent border border-gray-200 text-black font-medium flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </motion.button>
          </motion.div>

          <motion.p variants={itemVariants} className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="text-black font-semibold hover:underline">
              Sign up
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </main>
  );
}