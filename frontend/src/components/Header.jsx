import React from "react";
import githubLogo from "../assets/github-mark/github-mark.png";

function Header() {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative group">
              <span className="text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110 inline-block">
                🎓
              </span>
              <div className="hidden group-hover:block absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">
                CGPA Fetcher
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">
                TKRCET Results
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <a
              href="https://github.com/Prem-080"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 group"
            >
              <span className="hidden sm:inline-block ml-1 text-sm">
                <img
                  className="inline-block pr-1 text-xl group-hover:animate-pulse"
                  src={githubLogo}
                  alt="GitHub Logo"
                  width={"25px"}
                />
                GitHub
              </span>
            </a>
            <a
              href="https://www.tkrcet.ac.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 group"
            >
              <span className="text-xl group-hover:animate-pulse">🏫</span>
              <span className="hidden sm:inline-block ml-1 text-sm">
                TKRCET
              </span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
