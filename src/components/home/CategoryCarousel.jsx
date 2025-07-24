import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLanguage } from '@/components/i18n/LanguageContext';
import {
  Palette,
  Landmark,
  Mountain,
  Utensils,
  Backpack,
  Building2,
  Brush
} from 'lucide-react';

export default function CategoryCarousel() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const categories = [
    { name: "cultural", title: t('themes.cultural'), Icon: Landmark, color: "text-blue-500", bgColor: "bg-blue-50" },
    { name: "historical", title: t('themes.historical'), Icon: Palette, color: "text-amber-500", bgColor: "bg-amber-50" },
    { name: "nature", title: t('themes.nature'), Icon: Mountain, color: "text-green-500", bgColor: "bg-green-50" },
    { name: "culinary", title: t('themes.culinary'), Icon: Utensils, color: "text-red-500", bgColor: "bg-red-50" },
    { name: "adventure", title: t('themes.adventure'), Icon: Backpack, color: "text-orange-500", bgColor: "bg-orange-50" },
    { name: "architectural", title: t('themes.architectural'), Icon: Building2, color: "text-slate-500", bgColor: "bg-slate-50" },
    { name: "art", title: t('themes.art'), Icon: Brush, color: "text-purple-500", bgColor: "bg-purple-50" },
  ];

  const handleCategoryClick = (category) => {
    navigate(createPageUrl(`Explore?theme=${category.name}`));
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4">
      <div className="flex gap-4 pb-4">
        {categories.map((category) => (
          <button
            key={category.name}
            className={`flex-shrink-0 h-28 w-36 flex flex-col items-center justify-center gap-2 rounded-2xl transition-transform hover:scale-105 ${category.bgColor}`}
            onClick={() => handleCategoryClick(category)}
          >
            <div className={`h-12 w-12 rounded-full bg-white flex items-center justify-center`}>
              <category.Icon className={`h-6 w-6 ${category.color}`} />
            </div>
            <div className={`font-semibold text-sm ${category.color.replace('500', '800')}`}>{category.title}</div>
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}