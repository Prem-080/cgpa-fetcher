import React from "react";

function Results({
    studentName,
    cgpa,
    sgpa,
    screenshots,
    
}) {
  return (
    <>
      {/* Right Panel - Results and Screenshots */}
      <div className="w-full lg:flex-1 lg:min-w-0">
        {/* Results Display */}
        {(studentName || cgpa) && (
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl shadow-lg mb-6">
            {studentName && (
              <div className="text-center text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                <span className="text-xl sm:text-2xl">👤</span> {studentName}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {cgpa && (
                <div className="result-card text-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg sm:rounded-xl border border-green-100 shadow-md hover:shadow-lg">
                  <div className="text-sm sm:text-base font-medium text-gray-600 mb-1 sm:mb-2">
                    CGPA
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {cgpa}
                  </div>
                </div>
              )}
              {sgpa && (
                <div className="result-card text-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg sm:rounded-xl border border-blue-100 shadow-md hover:shadow-lg">
                  <div className="text-sm sm:text-base font-medium text-gray-600 mb-1 sm:mb-2">
                    SGPA
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {sgpa}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Screenshots - Enhanced */}
        {screenshots.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg">
              <span className="text-xl">📸</span> Screenshots (
              {screenshots.length})
            </h2>
            <div className="screenshot-grid">
              {screenshots.map((s) => (
                <div key={s.name} className="screenshot-item group">
                  <a
                    href={`data:image/jpeg;base64,${s.data}`}
                    download={`${s.name}.jpg`}
                    className="block h-full"
                  >
                    <img
                      src={`data:image/jpeg;base64,${s.data}`}
                      alt={s.name}
                      className="screenshot-img group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-black bg-opacity-75 px-3 py-2 rounded-full">
                        📥 Download Screenshot
                      </span>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Results;
