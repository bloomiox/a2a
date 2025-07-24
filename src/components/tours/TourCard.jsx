
import React from 'react';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Tour } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  MapPin,
  Play,
  Edit,
  Trash2,
  CheckCircle,
  BarChart,
  Users
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/components/i18n/LanguageContext';

const TourCard = React.memo(({
  tour,
  onTourDeleted,
  className = ""
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        if (tour && tour.created_by === user.email) {
          setIsOwner(true);
        }
      } catch (error) {
        // Not logged in
      }
    };
    if (onTourDeleted) { // Only fetch user if deletion functionality is enabled
      fetchUser();
    }
  }, [tour?.created_by, onTourDeleted, tour]);

  const handleDeleteTour = async (e) => {
    e.stopPropagation();
    if (!tour || !tour.id) return;
    setIsDeleting(true);
    try {
      await Tour.delete(tour.id);
      if (onTourDeleted) {
        onTourDeleted(tour.id);
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting tour:", error);
      alert(t('tours.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    if (tour && tour.id) {
      navigate(createPageUrl(`TourDetails?id=${tour.id}`));
    }
  };

  if (!tour) return null;

  const difficultyColors = {
    easy: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800",
    challenging: "bg-red-100 text-red-800",
  };

  return (
    <Card
      onClick={handleCardClick}
      className={`overflow-hidden bg-transparent rounded-2xl flex flex-col ${className} cursor-pointer group`}
    >
      <div className="relative">
        <img
          src={tour.preview_image || "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1974&auto=format&fit=crop"}
          alt={tour.title}
          className="w-full h-48 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-2xl"></div>

        <div className="absolute bottom-0 left-0 p-4">
            <h3 className="text-lg font-bold text-white line-clamp-2">{tour.title}</h3>
            {tour.location?.city && (
                <span className="flex items-center gap-1.5 text-xs text-white/90 mt-1">
                    <MapPin size={12} /> {tour.location.city}
                </span>
            )}
        </div>
        
        {isOwner && onTourDeleted && (
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                navigate(createPageUrl(`Create?edit=true&id=${tour.id}`));
              }}
            >
              <Edit size={14} />
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('tours.confirmDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('tours.confirmDeleteDesc', { title: tour.title })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => {e.stopPropagation(); setShowDeleteDialog(false)}}>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTour} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? t('common.deleting') : t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <CardContent className="p-0 pt-3 flex-grow flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-2 flex-grow mb-3">
          {tour.description || t('tours.noDescription')}
        </p>

        <div className="flex flex-wrap gap-2 items-center text-xs mb-3">
          {tour.theme && (
            <Badge variant="secondary" className="capitalize">{t(`themes.${tour.theme}`)}</Badge>
          )}
          {tour.difficulty && (
            <Badge className={`${difficultyColors[tour.difficulty]} capitalize`}>
              {t(`difficulty.${tour.difficulty}`)}
            </Badge>
          )}
        </div>

        <div className="flex items-center text-sm text-muted-foreground gap-4 pt-3">
          {tour.duration && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {Math.floor(tour.duration / 60)}h {tour.duration % 60}m
            </span>
          )}
          {tour.financials?.price_per_tourist > 0 ? (
            <span className="flex items-center gap-1.5 font-semibold text-accent">
              ${tour.financials.price_per_tourist}
            </span>
          ) : (
             <Badge variant="outline">Free</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TourCard.displayName = "TourCard";

export default TourCard;
