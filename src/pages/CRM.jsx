
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Tour } from "@/api/entities";
import { TourAssignment } from "@/api/entities";
import { useLanguage } from '@/components/i18n/LanguageContext';
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Mail, Phone } from "lucide-react";

export default function CRM() {
  const { t } = useLanguage();
  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadTourists();
  }, []);

  const loadTourists = async () => {
    try {
      setLoading(true);
      const users = await User.list();
      const tourists = users.filter(user => 
        user.user_group?.includes("Tourist")
      );

      // Get tour assignments for each tourist
      const touristData = await Promise.all(
        tourists.map(async (tourist) => {
          const assignments = await TourAssignment.filter({
            tourist_id: tourist.id
          });
          
          const tourDetails = await Promise.all(
            assignments.map(async (assignment) => {
              const tour = await Tour.get(assignment.tour_id);
              return {
                ...tour,
                assignment_date: assignment.start_time,
                status: assignment.status
              };
            })
          );

          return {
            ...tourist,
            tours: tourDetails
          };
        })
      );

      setTourists(touristData);
    } catch (error) {
      console.error("Error loading tourist data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('crm.title')}</h1>
          <p className="text-gray-500">{t('crm.subtitle')}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t('crm.searchTourists')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('crm.touristsList')}</CardTitle>
          <CardDescription>{t('crm.touristsListDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tourist</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Assigned Tours</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tourists
                .filter(tourist => 
                  tourist.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  tourist.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((tourist) => (
                  <TableRow key={tourist.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{tourist.full_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2" />
                          {tourist.email}
                        </div>
                        {tourist.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2" />
                            {tourist.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {tourist.tours.map(tour => (
                          <Badge
                            key={tour.id}
                            variant={tour.status === 'completed' ? 'success' : 'default'}
                            className="mr-1"
                          >
                            {tour.title}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      ${tourist.tours.reduce((total, tour) => total + (tour.price || 0), 0)}
                    </TableCell>
                    <TableCell>
                      {tourist.last_active_date ? 
                        format(new Date(tourist.last_active_date), 'MMM d, yyyy') :
                        'Never'
                      }
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
