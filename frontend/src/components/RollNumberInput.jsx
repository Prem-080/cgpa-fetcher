import { TextField } from "@mui/material";

export default function RollNumberInput({
  value,
  onChange,
  onKeyPress,
  disabled,
}) {
  return (
    <TextField
      label="Enter Roll Number"
      value={value}
      onChange={onChange}
      fullWidth
      variant="outlined"
      onKeyDown={onKeyPress}
      disabled={disabled}
      placeholder="e.g., 20XX1A0XXX"
      helperText={
        value && value.length < 10
          ? "Roll number should be 10 characters"
          : ""
      }
    />
  );
}
