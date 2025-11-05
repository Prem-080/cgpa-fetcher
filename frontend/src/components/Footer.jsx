import React from 'react'

function Footer() {
  return (
    <footer className="bg-white/95 backdrop-blur-sm shadow-md mt-8">
  <div className="container mx-auto px-4 py-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Section */}
      <div className="text-center md:text-left">
        <h3 className="font-semibold text-gray-800 mb-2">Quick Links</h3>
        <div className="flex flex-col gap-1">
          <a
            href="https://www.tkrcet.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            TKRCET Website
          </a>
          <a
            href="https://www.tkrcetautonomous.org/Login.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Results Portal
          </a>
        </div>
      </div>

      {/* Center Section */}
      <div className="text-center">
        <h3 className="font-semibold text-gray-800 mb-2">About</h3>
        <p className="text-sm text-gray-600">
          A fast and efficient way to check your semester results and CGPA.
          Built with ❤️ for TKRCET students.
        </p>
      </div>

      {/* Right Section */}
      <div className="text-center md:text-right">
        <h3 className="font-semibold text-gray-800 mb-2">Contact</h3>
        <div className="flex flex-col gap-1">
          <a
            href="mailto:premkumar080@gmail.com"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Report Issues
          </a>
          <a
            href="https://github.com/Prem-080"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
    
    {/* Copyright */}
    <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
      © {new Date().getFullYear()} CGPA Fetcher. All rights reserved.
    </div>
  </div>
</footer>
  )
}

export default Footer