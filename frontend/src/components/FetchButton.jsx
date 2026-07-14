import { Button, CircularProgress } from "@mui/material";

export default function FetchButton({ onClick, loading, disabled }) {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      disabled={disabled}
      fullWidth
      size="large"
      sx={{
        background:
          "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
        boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
        transition: "transform 0.2s",
        height: 56,
        fontSize: "1rem",
        textTransform: "none",
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
  );
}
