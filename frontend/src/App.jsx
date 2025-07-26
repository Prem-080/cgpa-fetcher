import React, { useState } from 'react';
import { Button, TextField, CircularProgress, Snackbar, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import Lottie from 'lottie-react';
import animationData from './fetching.json';
import API_URL from './config';

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

  // Semester Options
  const semesters = [
    { value: 'I_I', label: 'I Year I Semester' },
    { value: 'I_II', label: 'I Year II Semester' },
    { value: 'II_I', label: 'II Year I Semester' },
    { value: 'II_II', label: 'II Year II Semester' },
    { value: 'III_I', label: 'III Year I Semester' },
    { value: 'III_II', label: 'III Year II Semester' },
    { value: 'IV_I', label: 'IV Year I Semester' },
    { value: 'IV_II', label: 'IV Year II Semester' }
  ];

  // Sleep Function
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Add Log Function to console
  const addLog = async (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    await sleep(500);
  };

  // Fetch CGPA Function
  const fetchCGPA = async () => {
    if (!roll.trim()) {
      setError('Please enter a roll number');
      return;
    }

    if (!semester) {
      setError('Please select a semester');
      return;
    }
    // Reset all states
    setLogs([]);
    setLoading(true);
    setCgpa('');
    setStudentName('');
    setScreenshots([]);
    setError('');
    
    try {
      await addLog(`Starting CGPA fetch for roll: ${roll}, semester: ${semester}`);
      
      await addLog('Making API request...');
      const res = await fetch(`${API_URL}/fetch-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roll: roll.trim().toUpperCase(),  // Ensure roll number is uppercase
          semester 
        }),
      });
      
      const data = await res.json();
      await addLog(`API Response received`);
      
      if (data.error) {
        await addLog(`Error from API: ${data.error}`);
        // Check for semester-specific errors
        if (data.error.includes('semester') || data.error.includes('SEMES')) {
          setError(`⚠️ ${data.error}`);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      if (data.studentName) {
        await addLog(`Student Name: ${data.studentName}`);
        setStudentName(data.studentName);
      }
      
      await addLog(`CGPA found: ${data.cgpa}`);
      setCgpa(data.cgpa);
      
      if (data.screenshots && data.screenshots.length > 0) {
        await addLog(`Received ${data.screenshots.length} screenshots`);
        setScreenshots(data.screenshots);
      }
    } catch (e) {
      await addLog(`Error occurred: ${e.message}`);
      setError(`❌ ${e.message}`);
    } finally {
      await addLog('Fetch process completed');
      setLoading(false);
    }
  };
  // Main UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">CGPA Fetcher</h1>
        {/* Enter Semester */}
        <FormControl fullWidth variant="outlined">
            <InputLabel>Select Semester</InputLabel>
            <Select
              value={semester}
              onChange={e => setSemester(e.target.value)}
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

        {/* Enter Roll Number */}
        <div className="space-y-4">
          <TextField
            label="Enter Roll Number"
            value={roll}
            onChange={e => setRoll(e.target.value)}
            fullWidth
            variant="outlined"
            onKeyDown={e => e.key === 'Enter' && !loading && fetchCGPA()}
            disabled={loading}
          />

        {/* Fetch CGPA */}

          <Button
            variant="contained"
            color="primary"
            onClick={fetchCGPA}
            disabled={loading}
            fullWidth
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <CircularProgress size={20} color="inherit" />
                <span>Fetching...</span>
              </div>
            ) : (
              'Fetch CGPA'
            )}
          </Button>
        </div>

        {/* Debug Console */}
        {logs.length > 0 && (
          <div className="mt-4 border rounded-lg p-3 bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2">Debug Console</h3>
            <div className="bg-black rounded p-2 max-h-40 overflow-y-auto font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className="text-green-400">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Student Name and CGPA */}
        {(studentName || cgpa) && (
          <div className="mt-6 text-center space-y-2">
            {studentName && (
              <div className="text-lg font-semibold text-gray-800">
                {studentName}
              </div>
            )}
            {cgpa && (
              <div>
                <span className="text-lg font-semibold"></span>
                <span className="text-2xl font-bold text-green-600 animate-bounce">{cgpa}</span>
              </div>
            )}
          </div>
        )}

        {/* Show Screenshots */}
        {screenshots.length > 0 && (
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Screenshots:</h2>
            <div className="flex flex-wrap gap-2">
              {screenshots.map(s => (
                <div key={s.name} className="relative group">
                  <a
                    href={`data:image/png;base64,${s.data}`}
                    download={`${s.name}.png`}
                    className="block border rounded shadow transition-transform"
                  >
                    <img 
                      src={`data:image/png;base64,${s.data}`} 
                      alt={s.name} 
                      className="w-32 h-20 object-contain bg-white"
                    />
                  </a>
                  {/* Hover Preview */}
                  <div className="hidden group-hover:block absolute z-50 top-0 left-1/2 transform -translate-y-full -translate-x-1/2">
                    <img
                      src={`data:image/png;base64,${s.data}`}
                      alt={`${s.name} preview`}
                      className="w-[60rem] max-w-none border-4 border-white rounded-lg shadow-xl transition-transform duration-200 scale-50 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Error */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={4000} 
          onClose={() => setError('')}
        >
          <Alert severity={error.includes('⚠️') ? 'warning' : 'error'} onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}

export default App;