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
import Results from "./components/Results";
import DialogBox from "./components/DialogBox";

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
        <div className="container mx-auto min-h-[calc(100vh-8rem)] w-full">
          <div className="lg:flex lg:gap-8  flex flex-col gap-8 items-center justify-center">
            {/* Left Panel - Input Form */}
            <div
              className={`cgpa-input bg-white p-6 lg:p-8 rounded-xl lg:w-2/5 w-2/3 shadow-lg mb-8 lg:mb-0 `}
            >
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
            {(studentName || cgpa) && (
              <div className="lg:flex-1">
                <Results
                  studentName={studentName}
                  cgpa={cgpa}
                  sgpa={sgpa}
                  screenshots={screenshots}
                />
              </div>
            )}
          </div>

          <DialogBox
            logs={logs}
            loading={loading}
            error={error}
            setError={setError}
            processingTime={processingTime}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}

export default App;
