import Lottie from "lottie-react";
import animationData from "../fetching.json";

export default function LoadingAnimation({ loading, logs }) {
  if (!loading) return null;

  return (
    <div className="flex flex-col items-center py-8 animate-fadeIn">
      
      {logs.length > 0 && (
        <p className="text-sm text-gray-600 mt-2">
          {logs[logs.length - 1].split("] ")[1]}
        </p>
      )}
      <div className="flex gap-1.5 mt-3">
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
