/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

export default function App() {
  return (
    <div className="min-h-screen bg-brand-brown flex items-center justify-center p-4 overflow-hidden">
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md h-[90vh] flex flex-col items-center justify-between py-12"
      >
        {/* Top Decorative Flourish */}
        <div className="w-full flex flex-col items-center space-y-4">
          <svg 
            className="w-48 h-auto" 
            viewBox="0 0 200 60" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M100 15C110 15 120 5 130 5C140 5 150 15 140 25C130 35 110 25 100 25C90 25 70 35 60 25C50 15 60 5 70 5C80 5 90 15 100 15Z" 
              stroke="#FFF8E1" 
              strokeWidth="2"
            />
            <circle cx="100" cy="10" fill="#FFF8E1" r="2.5" />
            <path 
              d="M20 45H180" 
              stroke="#FFF8E1" 
              strokeLinecap="round" 
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* QR Code Section */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-[90%] aspect-square bg-white shadow-2xl flex items-center justify-center overflow-hidden"
        >
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsG2AuXpTxKAwMo0mj7Wanfn46VmP0ioR8m0zc_V0SxsG8JdNUJ4E0BhFfZk8OIduO72KpeJva7Znej7su1vSfHOqXb0-83NGP-7D4KBEQgtJAfTi_YjNKVhrKhW8f9MWTtcAdoR5RBqf8DiqZg64nkX1jaHzHg5rf9k6e8awsLKIoE-bfCEX-yzArwaAjn1A9vDJ4q9Nmk24JG8w1BadM2MgY5oqP4dISukFX8f-dzrBbuLJ8io4eGvcvGsSxs-4vVrlOMpDnKOw" 
            alt="Menu QR Code" 
            className="w-[120%] h-[120%] object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Text Instruction Section */}
        <div className="text-center w-full space-y-2">
          <p className="font-instruction text-brand-cream text-xl italic opacity-90">
            Scan to view our
          </p>
          <h1 className="font-decorative text-brand-cream text-7xl font-bold uppercase tracking-[0.2em]">
            MENU
          </h1>
        </div>

        {/* Bottom Decorative Line */}
        <div className="w-[90%] h-1 bg-brand-cream rounded-full" />
      </motion.main>
    </div>
  );
}
