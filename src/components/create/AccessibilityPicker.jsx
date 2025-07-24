import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function AccessibilityPicker({ selected = [], onChange }) {
  const { t } = useLanguage();
  const accessibilityOptions = [
    { value: "wheelchair", label: t('accessibility.wheelchair') },
    { value: "stroller", label: t('accessibility.stroller') },
    { value: "limited_mobility", label: t('accessibility.limited_mobility') },
    { value: "vision_impaired", label: t('accessibility.vision_impaired') },
    { value: "hearing_impaired", label: t('accessibility.hearing_impaired') }
  ];

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {accessibilityOptions.map(option => (
        <Badge
          key={option.value}
          variant={selected.includes(option.value) ? "default" : "outline"}
          className={`px-3 py-1 cursor-pointer ${
            selected.includes(option.value) ? "bg-indigo-600 hover:bg-indigo-700" : ""
          }`}
          onClick={() => toggleOption(option.value)}
        >
          {option.label}
        </Badge>
      ))}
    </div>
  );
}