import React, { useState, useCallback, useMemo } from 'react';
import { Button, TextField, CircularProgress, Snackbar, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import Lottie from 'lottie-react';
import animationData from './fetching.json';
import { VITE_API_URL } from './config';


// Main App
function App() {
  // State Variables
  const [roll, setRoll] = useState('');
  const [loading, setLoading] = useState(false);
  const [cgpa, setCgpa] = useState('');
  const [studentName, setStudentName] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [semester, setSemester] = useState('');
  const [processingTime, setProcessingTime] = useState('');

  // Memoized semester options (no need to recreate on every render)
  const semesters = useMemo(() => [
    { value: 'I_I', label: 'I Year I Semester' },
    { value: 'I_II', label: 'I Year II Semester' },
    { value: 'II_I', label: 'II Year I Semester' },
    { value: 'II_II', label: 'II Year II Semester' },
    { value: 'III_I', label: 'III Year I Semester' },
    { value: 'III_II', label: 'III Year II Semester' },
    { value: 'IV_I', label: 'IV Year I Semester' },
    { value: 'IV_II', label: 'IV Year II Semester' }
  ], []);

  // Optimized add log function (no artificial delay)
  const addLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // Input validation
  const validateInputs = useCallback(() => {
    if (!roll.trim()) {
      setError('Please enter a roll number');
      return false;
    }
    if (!semester) {
      setError('Please select a semester');
      return false;
    }
    // Basic roll number format validation
    const rollPattern = /^[0-9]{2}[A-Z0-9]{2}[0-9][A-Z][0-9]{4}$/i;
    if (!rollPattern.test(roll.trim())) {
      setError('Please enter a valid roll number format (e.g., 20XX1A0XXX)');
      return false;
    }
    return true;
  }, [roll, semester]);

  // Optimized fetch function with better error handling and timing
  const fetchCGPA = useCallback(async () => {
    if (!validateInputs()) return;

    // Reset all states
    setLogs([]);
    setLoading(true);
    setCgpa('');
    setStudentName('');
    setScreenshots([]);
    setError('');
    setProcessingTime('');
    
    const startTime = Date.now();
    
    try {
      addLog(`🚀 Starting CGPA fetch for ${roll.toUpperCase()}, ${semester}`);
      addLog('📡 Connecting to server...');
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 15 second timeout
      const res = await fetch(`${VITE_API_URL}/fetch-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roll: roll.trim().toUpperCase(),
          semester 
        }),
        signal: controller.signal
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
        // Enhanced error handling for different error types
        if (data.error.includes('not available yet') || data.error.includes('semester')) {
          setError(`⚠️ ${data.error}`);
        } else if (data.error.includes('CGPA not found')) {
          setError('❌ CGPA not found. Please check your roll number and try again.');
        } else if (data.error.includes('Could not find')) {
          setError('🔍 Login failed. Please verify your roll number or try again later.');
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
        addLog(`🎯 CGPA: ${data.cgpa}`);
        setCgpa(data.cgpa);
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
      
      if (e.name === 'AbortError') {
        addLog(`⏰ Request timed out after 30 seconds`);
        setError('⏰ Request timed out. Please try again.');
      } else if (e.message.includes('Failed to fetch')) {
        addLog(`🌐 Network error: Unable to connect to server`);
        setError('🌐 Network error. Please check your internet connection.');
      } else {
        addLog(`💥 Error after ${clientTime}ms: ${e.message}`);
        setError(`❌ ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [roll, semester, validateInputs, addLog]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !loading) {
      fetchCGPA();
    }
  }, [fetchCGPA, loading]);

  // Handle roll number input with auto-formatting
  const handleRollChange = useCallback((e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 10) { // Standard roll number length
      setRoll(value);
      // Clear error when user starts typing
      if (error) setError('');
    }
  }, [error]);

  // Handle semester change
  const handleSemesterChange = useCallback((e) => {
    setSemester(e.target.value);
    // Clear error when user selects semester
    if (error) setError('');
  }, [error]);

  // Enhanced loading animation with Lottie
  const LoadingAnimation = useMemo(() => {
    if (!loading) return null;
    
    return (
      <div className="mt-4 flex flex-col items-center">
        <div className="w-24 h-24">
          <Lottie 
            animationData={animationData} 
            loop={true}
            autoplay={true}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {logs.length > 0 && logs[logs.length - 1].split('] ')[1]}
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          🎓 CGPA Fetcher
        </h1>
        
        {/* Semester Selection */}
        <div className='mb-4'>
        <FormControl fullWidth variant="outlined" className="mb-4">
          <InputLabel>Select Semester</InputLabel>
          <Select
            value={semester}
            onChange={handleSemesterChange}
            label="Select Semester"
            disabled={loading}
          >
            {semesters.map(sem => (
              <MenuItem key={sem.value} value={sem.value}>
                {sem.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </div>
        {/* Roll Number Input */}
        <div className='mb-4'>
        <TextField
          label="Enter Roll Number"
          value={roll}
          onChange={handleRollChange}
          fullWidth
          variant="outlined"
          onKeyDown={handleKeyPress}
          disabled={loading}
          placeholder="e.g., 20XX1A0XXX"
          helperText={roll && roll.length < 10 ? "Roll number should be 10 characters" : ""}
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
          className="mb-4"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <CircularProgress size={20} color="inherit" />
              <span>Fetching CGPA...</span>
            </div>
          ) : (
            '🚀 Fetch CGPA'
          )}
        </Button>

          
        {/* Debug Console - Improved */}
        {import.meta.env.MODE !== 'production' && logs.length > 0 && (
          <div className="mt-4 border rounded-lg p-3 bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              📊 Debug Console
              {processingTime && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {processingTime}
                </span>
              )}
            </h3>
            <div className="bg-black rounded p-3 max-h-48 overflow-y-auto font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1 leading-relaxed">
                  {log}
                </div>
              ))}
              {loading && (
                <div className="text-yellow-400 animate-pulse">
                  ⏳ Processing...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Display */}
        {(studentName || cgpa) && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            {studentName && (
              <div className="text-center text-lg font-semibold text-gray-800 mb-2">
                👤 {studentName}
              </div>
            )}
            {cgpa && (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">CGPA</div>
                <div className="text-3xl font-bold text-green-600 animate-bounce">
                  {cgpa}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Screenshots - Enhanced */}
        {screenshots.length > 0 && (
          <div className="mt-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              📸 Screenshots ({screenshots.length})
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {screenshots.map(s => (
                <div key={s.name} className="relative group">
                  <a
                    href={`data:image/jpeg;base64,${s.data}`}
                    download={`${s.name}.jpg`}
                    className="block border rounded-lg shadow hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <img 
                      src={`data:image/jpeg;base64,${s.data}`} 
                      alt={s.name} 
                      className="w-full h-24 object-cover bg-white hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                      <span className="text-white text-xs opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 px-2 py-1 rounded">
                        📥 Download
                      </span>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Snackbar */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity={error.includes('⚠️') ? 'warning' : 'error'} 
            onClose={() => setError('')}
            variant="filled"
          >
            {error}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}

export default App;