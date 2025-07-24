import * as React from "react"
import { Check } from "lucide-react"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false);
  
  React.useEffect(() => {
    setIsChecked(checked || false);
  }, [checked]);
  
  const handleChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    if (onCheckedChange) {
      onCheckedChange(newValue);
    }
  };
  
  return (
    <button
      type="button"
      ref={ref}
      role="checkbox"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      className={`h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        isChecked ? "bg-indigo-600 border-indigo-600" : "bg-white"
      } ${className || ""}`}
      onClick={handleChange}
      {...props}
    >
      {isChecked && (
        <span className="flex items-center justify-center text-white">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
export default Checkbox;