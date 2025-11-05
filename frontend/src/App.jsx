import React, { useState, useCallback, useMemo } from "react";
import {
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import Lottie from "lottie-react";
import animationData from "./fetching.json";
import { default as Footer } from "./components/Footer";
import { default as Header } from "./components/Header";
import { VITE_API_URL } from "./config";

// Main App
function App() {
  // State Variables
  const [roll, setRoll] = useState("");
  const [loading, setLoading] = useState(false);
  const [cgpa, setCgpa] = useState("");
  const [sgpa, setSgpa] = useState("");
  const [studentName, setStudentName] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [semester, setSemester] = useState("");
  const [processingTime, setProcessingTime] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  // Memoized semester options (no need to recreate on every render)
  const semesters = useMemo(
    () => [
      { value: "I_I", label: "I Year I Semester" },
      { value: "I_II", label: "I Year II Semester" },
      { value: "II_I", label: "II Year I Semester" },
      { value: "II_II", label: "II Year II Semester" },
      { value: "III_I", label: "III Year I Semester" },
      { value: "III_II", label: "III Year II Semester" },
      { value: "IV_I", label: "IV Year I Semester" },
      { value: "IV_II", label: "IV Year II Semester" },
    ],
    []
  );

  // Optimized add log function (no artificial delay)
  const addLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // Input validation
  const validateInputs = useCallback(() => {
    if (!roll.trim()) {
      setError("Please enter a roll number");
      return false;
    }
    if (!semester) {
      setError("Please select a semester");
      return false;
    }
    // Basic roll number format validation
    const rollPattern = /^[0-9]{2}[a-zA-Z0-9]{6}[a-zA-Z0-9]{2}$/i;
    if (!rollPattern.test(roll.trim())) {
      setError("Please enter a valid roll number format (e.g., 20XX1A0XXX)");
      return false;
    }
    return true;
  }, [roll, semester]);

  // Optimized fetch function with better error handling and timing
  const fetchCGPA = useCallback(async () => {
    if (!validateInputs()) return;

    // Reset loading states and errors, but keep previous values until new ones arrive
    setLogs([]);
    setLoading(true);
    setError("");
    setProcessingTime("");
    // Don't reset the display values until we have new ones
    const prevValues = {
      cgpa: cgpa,
      sgpa: sgpa,
      studentName: studentName,
      screenshots: screenshots,
    };

    const startTime = Date.now();

    try {
      addLog(`🚀 Starting CGPA fetch for ${roll.toUpperCase()}, ${semester}`);
      addLog("📡 Connecting to server...");

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 15 second timeout
      const res = await fetch(`${VITE_API_URL}/fetch-grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll: roll.trim().toUpperCase(),
          semester,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const clientTime = Date.now() - startTime;

      addLog(`✅ Response received in ${clientTime}ms`);

      // Show server processing time if available
      if (data.processingTime) {
        setProcessingTime(data.processingTime);
        addLog(`⚡ Server processing: ${data.processingTime}`);
      }

      if (data.error) {
        addLog(`❌ Server error: ${data.error}`);
        // Restore previous values on error
        setCgpa(prevValues.cgpa);
        setSgpa(prevValues.sgpa);
        setStudentName(prevValues.studentName);
        setScreenshots(prevValues.screenshots);
        // Enhanced error handling for different error types
        if (
          data.error.includes("not available yet") ||
          data.error.includes("semester")
        ) {
          setError(`⚠️ ${data.error}`);
        } else if (data.error.includes("CGPA not found")) {
          setError(
            "❌ CGPA not found. Please check your roll number and try again."
          );
        } else if (data.error.includes("Could not find")) {
          setError(
            "🔍 Login failed. Please verify your roll number or try again later."
          );
        } else {
          setError(`❌ ${data.error}`);
        }
        return;
      }

      // Success path with better logging
      if (data.studentName) {
        addLog(`👤 Student: ${data.studentName}`);
        setStudentName(data.studentName);
      }

      if (data.cgpa) {
        // Extract numeric CGPA value
        const cgpaValue = data.cgpa.split(":").pop().trim();
        addLog(`🎯 CGPA: ${cgpaValue}`);
        setCgpa(cgpaValue);
      }

      if (data.sgpaValue) {
        addLog(`📊 SGPA: ${data.sgpaValue}`);
        setSgpa(data.sgpaValue);
      }

      if (data.screenshots && data.screenshots.length > 0) {
        addLog(`📸 Screenshots: ${data.screenshots.length} received`);
        setScreenshots(data.screenshots);
      }

      addLog(`🎉 Fetch completed successfully in ${clientTime}ms`);
      // Print last fetch completed time in browser console (dev and prod)
      console.log(`Fetch completed at: ${clientTime}`);
    } catch (e) {
      const clientTime = Date.now() - startTime;

      // Restore previous values on error
      setCgpa(prevValues.cgpa);
      setSgpa(prevValues.sgpa);
      setStudentName(prevValues.studentName);
      setScreenshots(prevValues.screenshots);

      if (e.name === "AbortError") {
        addLog(`⏰ Request timed out after 30 seconds`);
        setError("⏰ Request timed out. Please try again.");
      } else if (e.message.includes("Failed to fetch")) {
        addLog(`🌐 Network error: Unable to connect to server`);
        setError("🌐 Network error. Please check your internet connection.");
      } else {
        addLog(`💥 Error after ${clientTime}ms: ${e.message}`);
        setError(`❌ ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [roll, semester, validateInputs, addLog]);

  // Handle Enter key press
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !loading) {
        fetchCGPA();
      }
    },
    [fetchCGPA, loading]
  );

  // Handle roll number input with auto-formatting
  const handleRollChange = useCallback(
    (e) => {
      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (value.length <= 10) {
        // Standard roll number length
        setRoll(value);
        // Clear error when user starts typing
        if (error) setError("");
      }
    },
    [error]
  );

  // Handle semester change
  const handleSemesterChange = useCallback(
    (e) => {
      setSemester(e.target.value);
      // Clear error when user selects semester
      if (error) setError("");
    },
    [error]
  );

  // Enhanced loading animation with Lottie
  const LoadingAnimation = useMemo(() => {
    if (!loading) return null;

    return (
      <div className="mt-4 flex flex-col items-center">
        <div className="w-24 h-24">
          <Lottie animationData={animationData} loop={true} autoplay={true} />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {logs.length > 0 && logs[logs.length - 1].split("] ")[1]}
        </p>
        {processingTime && (
          <p className="text-xs text-blue-600 mt-1">
            Server processing: {processingTime}
          </p>
        )}
      </div>
    );
  }, [loading, logs, processingTime]);

  // Main UI
  return (
    <>
    <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-4 lg:p-8">
        <div className="container mx-auto max-h-screen">
          <div className="lg:flex lg:gap-8 lg:items-center h-full">
            {/* Left Panel - Input Form */}
            <div className="bg-white p-6 lg:p-8 rounded-xl shadow-lg lg:w-2/5 mx-auto mb-8 lg:mb-0">
              <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center gap-2">
                <span className="text-3xl">🎓</span> CGPA Fetcher
              </h1>

              {/* Semester Selection */}
              <div className="mb-4">
                <FormControl fullWidth variant="outlined" className="mb-4">
                  <InputLabel>Select Semester</InputLabel>
                  <Select
                    value={semester}
                    onChange={handleSemesterChange}
                    label="Select Semester"
                    disabled={loading}
                  >
                    {semesters.map((sem) => (
                      <MenuItem key={sem.value} value={sem.value}>
                        {sem.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              {/* Roll Number Input */}
              <div className="mb-4">
                <TextField
                  label="Enter Roll Number"
                  value={roll}
                  onChange={handleRollChange}
                  fullWidth
                  variant="outlined"
                  onKeyDown={handleKeyPress}
                  disabled={loading}
                  placeholder="e.g., 20XX1A0XXX"
                  helperText={
                    roll && roll.length < 10
                      ? "Roll number should be 10 characters"
                      : ""
                  }
                  className="mb-4"
                />
              </div>
              {/* Fetch Button */}
              <Button
                variant="contained"
                color="primary"
                onClick={fetchCGPA}
                disabled={loading || !roll.trim() || !semester}
                fullWidth
                size="large"
                className="mb-4 h-14 text-lg"
                sx={{
                  background:
                    "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                  boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "scale(1.02)",
                  },
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <CircularProgress size={24} color="inherit" />
                    <span>Fetching CGPA...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🚀</span>
                    <span>Fetch CGPA</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Right Panel - Results and Screenshots */}
            <div className="w-full sm:w-4/5 lg:w-3/5 xl:w-2/3">
              {/* Results Display */}
              {(studentName || cgpa) && (
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl shadow-lg mb-6 w-full">
                  {studentName && (
                    <div className="text-center text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                      <span className="text-xl sm:text-2xl">👤</span>{" "}
                      {studentName}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
                    {cgpa && (
                      <div className="text-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg sm:rounded-xl border border-green-100 shadow-md hover:shadow-lg transition-all duration-300 w-full">
                        <div className="text-sm sm:text-base font-medium text-gray-600 mb-1 sm:mb-2">
                          CGPA
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                          {cgpa}
                        </div>
                      </div>
                    )}
                    {sgpa && (
                      <div className="text-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg sm:rounded-xl border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300 w-full">
                        <div className="text-sm sm:text-base font-medium text-gray-600 mb-1 sm:mb-2">
                          SGPA
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {sgpa}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Screenshots - Enhanced */}
              {screenshots.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                    <span className="text-xl">📸</span> Screenshots (
                    {screenshots.length})
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {screenshots.map((s) => (
                      <div key={s.name} className="relative group">
                        <a
                          href={`data:image/jpeg;base64,${s.data}`}
                          download={`${s.name}.jpg`}
                          className="block border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                          <img
                            src={`data:image/jpeg;base64,${s.data}`}
                            alt={s.name}
                            className="w-full h-32 lg:h-40 object-cover bg-white hover:scale-105 transition-transform duration-300"
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
          </div>

          {/* Debug Console Button */}
          {import.meta.env.MODE !== "production" && logs.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={() => setShowDebug(!showDebug)}
                variant="outlined"
                color="primary"
                className="px-6 py-2"
                sx={{
                  borderRadius: "9999px",
                  textTransform: "none",
                  fontSize: "0.9rem",
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <CircularProgress size={16} />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    Show Debug Console
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* Debug Console Dialog */}
          <Dialog
            open={showDebug}
            onClose={() => setShowDebug(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span> Debug Console
                {processingTime && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full ml-2">
                    {processingTime}
                  </span>
                )}
              </div>
              <IconButton onClick={() => setShowDebug(false)} size="small">
                <span className="text-xl">×</span>
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <div className="bg-gray-900 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto font-mono text-xs">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="text-green-400 mb-2 leading-relaxed"
                  >
                    {log}
                  </div>
                ))}
                {loading && (
                  <div className="text-yellow-400 animate-pulse">
                    ⏳ Processing...
                  </div>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDebug(false)} color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Error Snackbar */}
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError("")}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              severity={error.includes("⚠️") ? "warning" : "error"}
              onClose={() => setError("")}
              variant="filled"
            >
              {error}
            </Alert>
          </Snackbar>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default App;
