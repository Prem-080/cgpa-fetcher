import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import Header from "./components/Header";
import Footer from "./components/Footer";
import InputPanel from "./components/InputPanel";
import Results from "./components/Results";
import DialogBox from "./components/DialogBox";
import LoadingAnimation from "./components/LoadingAnimation";
import { VITE_API_URL } from "./config";

function App() {
  const [roll, setRoll] = useState("");
  const [loading, setLoading] = useState(false);
  const [cgpa, setCgpa] = useState("");
  const [sgpa, setSgpa] = useState("");
  const [studentName, setStudentName] = useState("");
  const [screenshots, setScreenshots] = useState([]);

  const [logs, setLogs] = useState([]);
  const [semester, setSemester] = useState("");
  const [processingTime, setProcessingTime] = useState("");

  const addLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const validateInputs = useCallback(() => {
    if (!roll.trim()) {
      toast.error("Please enter a roll number");
      return false;
    }
    if (!semester) {
      toast.error("Please select a semester");
      return false;
    }
    const rollPattern = /^[0-9]{2}[a-zA-Z0-9]{6}[a-zA-Z0-9]{2}$/i;
    if (!rollPattern.test(roll.trim())) {
      toast.error("Please enter a valid roll number format (e.g., 20XX1A0XXX)");
      return false;
    }
    return true;
  }, [roll, semester]);

  const fetchCGPA = useCallback(async () => {
    if (!validateInputs()) return;

    setLogs([]);
    setLoading(true);
    setProcessingTime("");

    const startTime = Date.now();

    try {
      addLog(`Starting CGPA fetch for ${roll.toUpperCase()}, ${semester}`);
      addLog("Connecting to server...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${VITE_API_URL}/api/v1/fetch-grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll: roll.trim().toUpperCase(),
          semester,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      const clientTime = Date.now() - startTime;

      addLog(`Response received in ${clientTime}ms`);

      if (!res.ok || data.error) {
        const message = data.error || `Server error (${res.status})`;
        addLog(`Server error: ${message}`);

        if (
          message.toLowerCase().includes("not available") ||
          message.toLowerCase().includes("semester")
        ) {
          toast.warning(message);
        } else if (message.toLowerCase().includes("cgpa not found")) {
          toast.error("CGPA not found. Please check your roll number.");
        } else if (
          message.toLowerCase().includes("could not find") ||
          message.toLowerCase().includes("login failed")
        ) {
          toast.error("Login failed. Please verify your roll number.");
        } else {
          toast.error(message);
        }
        return;
      }

      if (data.studentName) {
        addLog(`👤 Student: ${data.studentName}`);
        setStudentName(data.studentName);
      }

      if (data.cgpa) {
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
      toast.success(`Fetched successfully in ${clientTime}ms`);
    } catch (e) {
      if (e.name === "AbortError") {
        addLog(`⏰ Request timed out after 30 seconds`);
        toast.error("Request timed out. Please try again.");
      } else if (e.message.includes("Failed to fetch")) {
        addLog(`🌐 Network error: Unable to connect to server`);
        toast.error("Network error. Please check your internet connection.");
      } else {
        addLog(`💥 Error: ${e.message}`);
        toast.error(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [roll, semester, validateInputs, addLog]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !loading) {
        fetchCGPA();
      }
    },
    [fetchCGPA, loading]
  );

  const handleRollChange = useCallback(
    (e) => {
      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (value.length <= 10) {
        setRoll(value);
      }
    },
    []
  );

  const handleSemesterChange = useCallback(
    (e) => {
      setSemester(e.target.value);
    },
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <Header />
      <main className="container mx-auto min-h-[calc(100vh-8rem)] px-4 py-8">
        <div className="lg:flex lg:gap-8 flex flex-col gap-8 items-center justify-center">
          <InputPanel
            roll={roll}
            semester={semester}
            loading={loading}
            onRollChange={handleRollChange}
            onSemesterChange={handleSemesterChange}
            onFetch={fetchCGPA}
            onKeyPress={handleKeyPress}
          />

          {(studentName || cgpa) && (
            <div className="w-full lg:flex-1 animate-slideUp">
              <Results
                studentName={studentName}
                cgpa={cgpa}
                sgpa={sgpa}
                screenshots={screenshots}
              />
            </div>
          )}
        </div>

        <LoadingAnimation loading={loading} logs={logs} />

        <DialogBox
          logs={logs}
          loading={loading}
          processingTime={processingTime}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
