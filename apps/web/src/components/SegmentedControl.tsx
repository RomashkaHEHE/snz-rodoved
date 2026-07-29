import { useRef, type KeyboardEvent } from "react";
import { resolveSegmentedKeyboardIndex } from "../segmentedControlKeyboard";

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
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    const nextIndex = resolveSegmentedKeyboardIndex(event.key, currentIndex, options.length);
    if (nextIndex === null) {
      return;
    }

    const nextOption = options[nextIndex];
    if (!nextOption) {
      return;
    }

    event.preventDefault();
    onChange(nextOption.value);
    window.requestAnimationFrame(() => buttonRefs.current[nextIndex]?.focus());
  }

  return (
    <fieldset className={compact ? "segmented compact" : "segmented"}>
      <legend>{label}</legend>
      <div className="segmented-options">
        {options.map((option, optionIndex) => (
          <button
            aria-pressed={option.value === value}
            className={option.value === value ? "is-selected" : ""}
            key={option.value}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, optionIndex)}
            ref={(element) => {
              buttonRefs.current[optionIndex] = element;
            }}
            tabIndex={option.value === value ? 0 : -1}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
