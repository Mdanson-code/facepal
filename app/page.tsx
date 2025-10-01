'use client';

import Link from 'next/link';
import { useTheme } from './context/ThemeContext';

export default function Home() {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <main className={`min-h-screen transition-colors
      ${darkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Theme toggle */}
      <div className="absolute top-8 right-8">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full ${darkMode ? 'text-white' : 'text-black'}`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Hero Section */}
      <div className="w-full min-h-screen flex flex-col justify-center px-6 md:px-8">
        <div className="max-w-[800px] mx-auto w-full">
          {/* Product Name - Apple-style small heading */}
          <h1 className={`text-sm font-semibold tracking-wide mb-6
            ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            FACEPAL
          </h1>

          {/* Main Headline - Large, light, impactful */}
          <h2 className={`text-5xl md:text-7xl font-light leading-tight md:leading-tight mb-8
            ${darkMode ? 'text-white' : 'text-black'}`}>
            AI video calls.
            <br />
            Reimagined.
          </h2>

          {/* Subtitle - Clean, crisp, understated */}
          <p className={`text-xl md:text-2xl font-light mb-12 max-w-xl
            ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Experience natural conversations with AI avatars in stunning clarity.
          </p>

          {/* CTA - Apple-style button */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/avatar"
              className={`inline-flex items-center text-lg space-x-2 
                ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}
            >
              <span>Start video call</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
