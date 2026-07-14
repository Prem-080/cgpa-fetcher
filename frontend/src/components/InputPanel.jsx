import SemesterSelector from "./SemesterSelector";
import RollNumberInput from "./RollNumberInput";
import FetchButton from "./FetchButton";

export default function InputPanel({
  roll,
  semester,
  loading,
  onRollChange,
  onSemesterChange,
  onFetch,
  onKeyPress,
}) {
  return (
    <div className="lg:w-2/5 w-2/3">
      <div className="bg-white p-6 lg:p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center gap-2">
          <span className="text-3xl">🎓</span> CGPA Fetcher
        </h1>

        <div className="space-y-4">
          <div>
            <SemesterSelector
              value={semester}
              onChange={onSemesterChange}
              disabled={loading}
            />
          </div>

          <div>
            <RollNumberInput
              value={roll}
              onChange={onRollChange}
              onKeyPress={onKeyPress}
              disabled={loading}
            />
          </div>
          <div>
            <FetchButton
              onClick={onFetch}
              loading={loading}
              disabled={!roll.trim() || !semester}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
