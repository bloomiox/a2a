import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp } from "lucide-react";
import { TourReview } from "@/api/entities";
import { User } from "@/api/entities";
import { format } from "date-fns";

export default function ReviewsList({ tourId, limit = 5 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewersData, setReviewersData] = useState({});

  useEffect(() => {
    loadReviews();
  }, [tourId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const reviewsData = await TourReview.filter(
        { tour_id: tourId }, 
        '-created_date', 
        limit
      );
      
      setReviews(reviewsData || []);

      // Load reviewer information (names) for each review
      const reviewerIds = [...new Set(reviewsData.map(r => r.user_id))];
      const reviewersInfo = {};
      
      await Promise.all(
        reviewerIds.map(async (userId) => {
          try {
            const userData = await User.get(userId);
            reviewersInfo[userId] = userData;
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error);
            reviewersInfo[userId] = { full_name: "Anonymous User" };
          }
        })
      );
      
      setReviewersData(reviewersInfo);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500">Be the first to review this tour!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const reviewer = reviewersData[review.user_id] || { full_name: "Anonymous User" };
        
        return (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={reviewer.profile_image} alt={reviewer.full_name} />
                  <AvatarFallback>{reviewer.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{reviewer.full_name}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.tour_completed && (
                          <Badge variant="outline" className="text-xs">
                            Completed Tour
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(review.created_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}