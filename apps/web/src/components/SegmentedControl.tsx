interface Option<TValue extends string> {
  value: TValue;
  label: string;
}

interface SegmentedControlProps<TValue extends string> {
  label: string;
  value: TValue;
  options: Array<Option<TValue>>;
  onChange: (value: TValue) => void;
  compact?: boolean;
}

export function SegmentedControl<TValue extends string>({
  label,
  value,
  options,
  onChange,
  compact = false
}: SegmentedControlProps<TValue>) {
  return (
    <fieldset className={compact ? "segmented compact" : "segmented"}>
      <legend>{label}</legend>
      <div className="segmented-options">
        {options.map((option) => (
          <button
            aria-pressed={option.value === value}
            className={option.value === value ? "is-selected" : ""}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
