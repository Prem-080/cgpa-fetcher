import { useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";

function DialogBox({ logs, loading, processingTime }) {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <>
      {import.meta.env.MODE !== "production" && logs.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => setShowDebug(!showDebug)}
            variant="outlined"
            color="primary"
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

      <Dialog
        open={showDebug}
        onClose={() => setShowDebug(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <div className="flex items-center justify-between">
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
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="bg-gray-900 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto font-mono text-xs">
            {logs.map((log, index) => (
              <div key={index} className="text-green-400 mb-2 leading-relaxed">
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

    </>
  );
}

export default DialogBox;
