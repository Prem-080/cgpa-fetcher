import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const SEMESTERS = [
  { value: "I_I", label: "I Year I Semester" },
  { value: "I_II", label: "I Year II Semester" },
  { value: "II_I", label: "II Year I Semester" },
  { value: "II_II", label: "II Year II Semester" },
  { value: "III_I", label: "III Year I Semester" },
  { value: "III_II", label: "III Year II Semester" },
  { value: "IV_I", label: "IV Year I Semester" },
  { value: "IV_II", label: "IV Year II Semester" },
];

export default function SemesterSelector({ value, onChange, disabled }) {
  return (
    <FormControl fullWidth variant="outlined">
      <InputLabel>Select Semester</InputLabel>
      <Select
        value={value}
        onChange={onChange}
        label="Select Semester"
        disabled={disabled}
      >
        {SEMESTERS.map((sem) => (
          <MenuItem key={sem.value} value={sem.value}>
            {sem.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
