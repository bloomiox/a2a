
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AppWrapper from '@/components/common/ThemeWrapper';
import FeatureGate, { useFeature } from '@/components/common/FeatureGate';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Tour } from "@/api/entities";
import { User } from "@/api/entities";
import { UserProgress } from "@/api/entities";
import { TourAssignment } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Map as MapIcon, // Aliased Map to MapIcon to avoid conflict with global Map constructor
  Activity,
  Settings,
  Search,
  AlertTriangle,
  Clock,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  ChevronDown,
  Plus,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Radio,
  Mic,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import ActiveToursMonitor from '../components/admin/ActiveToursMonitor';
import LiveAudioBroadcast from '../components/admin/LiveAudioBroadcast';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import SystemLogs from '../components/admin/SystemLogs';
import AppSettings from '../components/admin/AppSettings';
import BroadcastDebugPanel from '../components/debug/BroadcastDebugPanel';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { DriverLocation } from "@/api/entities";
import { TourStop } from "@/api/entities";
import { AudioTrack } from "@/api/entities";
import { TourSignup } from "@/api/entities";
import { exportTourStopsCSV } from "@/api/functions";
// Removed: import { audioRelay } from '@/api/functions';

const DriverTrackingMap = ({ tour, driverLocation }) => {
  return (
    <div className="bg-gray-100 h-full w-full flex items-center justify-center">
      {tour ? (
        <div>
          <p className="text-lg font-semibold">Tracking Tour: {tour.title}</p>
          <p className="text-sm text-gray-500">Driver Location: {driverLocation ? `${driverLocation.latitude?.toFixed(4)}, ${driverLocation.longitude?.toFixed(4)}` : 'N/A'}</p>
        </div>
      ) : (
        <p>No tour data to display.</p>
      )}
    </div>
  );
};

const TourSignupsTable = () => {
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSignups();
  }, []);

  const loadSignups = async () => {
    try {
      setLoading(true);
      const signupsData = await TourSignup.filter({}, '-created_at', 100);
      
      // Get tour details for each signup
      const signupsWithTours = await Promise.all(
        signupsData.map(async (signup) => {
          try {
            const tour = await Tour.get(signup.tour_id);
            return { ...signup, tour };
          } catch (error) {
            return { ...signup, tour: null };
          }
        })
      );
      
      setSignups(signupsWithTours);
    } catch (error) {
      console.error('Error loading signups:', error);
      setSignups([]);
    } finally {
      setLoading(false);
    }
  };

  const updateSignupStatus = async (signupId, newStatus) => {
    try {
      await TourSignup.update(signupId, { status: newStatus });
      loadSignups(); // Reload data
    } catch (error) {
      console.error('Error updating signup status:', error);
    }
  };

  const filteredSignups = signups.filter(signup => 
    signup.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    signup.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    signup.tour?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search signups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={loadSignups} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tour</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSignups.map((signup) => (
              <TableRow key={signup.id}>
                <TableCell className="font-medium">{signup.name}</TableCell>
                <TableCell>{signup.email}</TableCell>
                <TableCell>{signup.tour?.title || 'Unknown Tour'}</TableCell>
                <TableCell>
                  <Badge variant={
                    signup.status === 'confirmed' ? 'success' :
                    signup.status === 'pending' ? 'secondary' :
                    signup.status === 'cancelled' ? 'destructive' : 'outline'
                  }>
                    {signup.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {signup.created_at ? format(new Date(signup.created_at), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {signup.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateSignupStatus(signup.id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSignupStatus(signup.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

const TouristManagement = ({ tourists, userActivity }) => {
  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Total Tours</TableHead>
            <TableHead>Completed Tours</TableHead>
            <TableHead>Last Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tourists.map((tourist) => (
            <TableRow key={tourist.id}>
              <TableCell className="font-medium">{tourist.full_name || 'N/A'}</TableCell>
              <TableCell>{tourist.email || 'N/A'}</TableCell>
              <TableCell>{(userActivity.filter(act => act.user_id === tourist.id) || []).length}</TableCell>
              <TableCell>{(userActivity.filter(act => act.user_id === tourist.id && act.status === 'completed') || []).length}</TableCell>
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
    </ScrollArea>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTours: 0,
    activeUsers: 0,
    completedTours: 0
  });
  const [users, setUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [userActivity, setUserActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    role: "user",
    user_group: ["Tourist"]
  });
  const [userGroupFilter, setUserGroupFilter] = useState("All");
  const [inviteStatus, setInviteStatus] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTourForAssignment, setSelectedTourForAssignment] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const { t } = useLanguage();
  const [tourists, setTourists] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);
  const [driversLocations, setDriversLocations] = useState({});
  const [showLiveAudioDialog, setShowLiveAudioDialog] = useState(false);
  const [activeToursForBroadcast, setActiveToursForBroadcast] = useState([]);

  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  const [toursPage, setToursPage] = useState(1);
  const [toursPerPage, setToursPerPage] = useState(10);

  // Get tab from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const url = new URL(window.location);
    url.searchParams.set('tab', newTab);
    window.history.pushState({}, '', url);
  };

  useEffect(() => {
    loadDashboardData();
    // No longer calling loadActiveToursForBroadcast() on initial load
  }, []);

  const loadActiveToursForBroadcast = async () => {
    try {
      // Load active tours directly instead of using audioRelay function
      const assignments = await TourAssignment.filter({ status: 'in_progress' }) || [];

      if (assignments.length === 0) {
        setActiveToursForBroadcast([]);
        return;
      }

      const tourIds = [...new Set(assignments.map(a => a.tour_id).filter(Boolean))];
      const driverIds = [...new Set(assignments.map(a => a.driver_id).filter(Boolean))];

      const [toursData, driversData] = await Promise.all([
        tourIds.length > 0 ? Tour.filter({ id: { $in: tourIds } }) || [] : [],
        driverIds.length > 0 ? User.filter({ id: { $in: driverIds } }) || [] : []
      ]);

      // Use native JavaScript Map constructor (not the lucide-react icon)
      const toursMap = new window.Map(toursData.map(t => [t.id, t]));
      const driversMap = new window.Map(driversData.map(d => [d.id, d]));

      const activeTours = assignments.map(assignment => ({
        tour_id: assignment.tour_id,
        driver_id: assignment.driver_id,
        tour: toursMap.get(assignment.tour_id),
        driver: driversMap.get(assignment.driver_id) || {
          id: assignment.driver_id,
          full_name: `Driver ${assignment.driver_id.slice(-4)}`
        },
        assignment: assignment
      })).filter(item => item.tour); // Filter out items where the tour object is missing

      setActiveToursForBroadcast(activeTours);
      console.log(`[ADMIN] Loaded ${activeTours.length} active tours for broadcast`);

    } catch (error) {
      console.error("Error loading active tours for broadcast:", error);
      setActiveToursForBroadcast([]);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use filter() instead of list() to get all data reliably
      const usersData = await User.filter({}, '-created_at', 1000) || [];
      const toursData = await Tour.filter({}, '-created_at', 1000) || [];

      console.log("Loaded users:", usersData.length);
      console.log("Loaded tours:", toursData.length);

      const assignmentsData = await TourAssignment.filter({}, '-created_at', 1000) || [];
      const userProgressData = await UserProgress.filter({}, '-created_at', 1000) || [];

      setUsers(usersData);
      setTours(toursData);

      const completedTourAssignments = assignmentsData.filter(a => a.status === 'completed');

      let activeUsersCount = 0;
      try {
        const activeUsers = await User.filter({
          last_active_date: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
        });
        activeUsersCount = activeUsers.length;
      } catch (error) {
        console.error("Error loading active users:", error);
      }

      setStats({
        totalUsers: usersData.length,
        totalTours: toursData.length,
        activeUsers: activeUsersCount,
        completedTours: completedTourAssignments.length
      });

      setUserActivity(userProgressData);
      setAssignments(assignmentsData);

      const driverUsers = usersData.filter(user => (user.user_group || []).includes("Driver"));
      setDrivers(driverUsers);
      console.log("Found drivers:", driverUsers);

      const touristUsers = usersData.filter(user => (user.user_group || []).includes("Tourist"));
      setTourists(touristUsers);

      setBookings([]); // Placeholder for bookings

    } catch (err) {
      console.error("Critical error in loadDashboardData:", err);
      setError(t("admin.errorLoadingDashboard") || "Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadDriversSafely = async () => {
    // This is now handled in loadDashboardData, but we keep the function in case it's used elsewhere.
    // If called independently, it would re-filter from the already loaded 'users' state.
    if (!drivers.length && users.length) {
      const driverUsers = users.filter(user => (user.user_group || []).includes("Driver"));
      setDrivers(driverUsers);
    }
  };

  const loadTouristsSafely = async () => {
    // This is now handled in loadDashboardData
    // If called independently, it would re-filter from the already loaded 'users' state.
    if (!tourists.length && users.length) {
      const touristUsers = users.filter(user => (user.user_group || []).includes("Tourist"));
      setTourists(touristUsers);
    }
  };

  const loadBookingsSafely = async () => {
    try {
      setBookings([]); // Placeholder, replace with actual booking loading logic if needed
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookings([]);
    }
  };

  const handleShowTracking = async (tour) => {
    if (!tour || !tour.id) {
      alert(t("admin.tracking.invalidTourData"));
      return;
    }

    try {
      const freshTour = await Tour.get(tour.id);
      if (!freshTour) {
        alert(t("admin.tracking.tourNotFound"));
        loadDashboardData(); // Refresh dashboard to remove stale data
        return;
      }

      const driverLocData = await DriverLocation.filter(
        { driver_id: freshTour.assignment?.driver_id },
        '-timestamp',
        1
      ) || [];

      if (driverLocData.length > 0) {
        setDriversLocations(prev => ({ ...prev, [freshTour.assignment.driver_id]: driverLocData[0] }));
      }

      setTrackingData({ ...freshTour, assignment: freshTour.assignment || tour.assignment });
      setShowTrackingDialog(true);
    } catch (error) {
      if (error.message && error.message.includes("Object not found")) {
        alert(t("admin.tracking.tourDeleted"));
        loadDashboardData(); // Refresh dashboard to remove stale data
      } else {
        console.error("Error loading tour for tracking:", error);
        alert(t("admin.tracking.errorLoadingData"));
      }
    }
  };

  const handleAssignTour = async (tourId, driverId, assignmentStartTime) => {
    if (!tourId) {
      alert(t("admin.assignment.missingTourId"));
      return;
    }

    try {
      const tourExists = await Tour.get(tourId);
      if (!tourExists) {
        alert(t("admin.assignment.tourNotFound"));
        loadDashboardData();
        return;
      }

      // Check if there's already an active assignment for this tour
      const existingAssignments = await TourAssignment.filter({
        tour_id: tourId,
        status: { $in: ['assigned', 'in_progress'] }
      });

      if (existingAssignments.length > 0) {
        alert(t("admin.assignment.tourAlreadyAssigned"));
        return;
      }

      await TourAssignment.create({
        tour_id: tourId,
        driver_id: driverId,
        start_time: assignmentStartTime,
        status: "assigned",
        completed_stops: [],
        notes: `Assigned by admin on ${new Date().toLocaleString()}`
      });

      alert(t("admin.assignment.assignmentSuccess"));
      loadDashboardData();
      setShowAssignDialog(false);
      setSelectedDriver(null);
      setSelectedTourForAssignment(null);
      setStartTime(new Date().toISOString().slice(0, 16));
    } catch (error) {
      if (error.message && error.message.includes("Object not found")) {
        alert(t("admin.assignment.tourNotFound"));
        loadDashboardData();
      } else {
        console.error("Error assigning tour:", error);
        alert(t("admin.assignment.errorAssigning"));
      }
    }
  };

  const handleUnassignTour = async (assignment) => {
    if (!confirm(t("admin.assignment.confirmUnassign"))) {
      return;
    }

    try {
      if (assignment.status === 'in_progress') {
        alert(t("admin.assignment.cannotUnassignInProgress"));
        return;
      }

      await TourAssignment.delete(assignment.id);
      alert(t("admin.assignment.unassignSuccess"));
      loadDashboardData();
    } catch (error) {
      console.error("Error unassigning tour:", error);
      alert(t("admin.assignment.errorUnassigning"));
    }
  };

  const handleUpdateAssignmentStatus = async (assignmentId, newStatus) => {
    try {
      const updateData = { status: newStatus };

      if (newStatus === 'in_progress') {
        updateData.start_time = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.end_time = new Date().toISOString();
      }

      await TourAssignment.update(assignmentId, updateData);
      loadDashboardData();
    } catch (error) {
      console.error("Error updating assignment status:", error);
      alert(t("admin.assignment.errorUpdatingStatus"));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'assigned': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];

    return users.filter(user => {
      const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = userGroupFilter === "All" || (user.user_group || []).includes(userGroupFilter);

      // If showInactiveUsers is true, show all users. If false, only show active users
      const matchesActivity = showInactiveUsers ? true : (
        user.last_active_date &&
        new Date(user.last_active_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      return matchesSearch && matchesGroup && matchesActivity;
    });
  }, [users, searchQuery, userGroupFilter, showInactiveUsers]);

  const augmentedTours = useMemo(() => {
    if (!tours || !Array.isArray(tours) || !assignments || !Array.isArray(assignments)) return [];

    return tours.map(tour => {
      const assignment = assignments.find(a => a.tour_id === tour.id);
      return { ...tour, assignment };
    });
  }, [tours, assignments]);

  const filteredTours = useMemo(() => {
    if (!augmentedTours || !Array.isArray(augmentedTours)) return [];

    return augmentedTours.filter(tour => {
      return tour.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.description?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [augmentedTours, searchQuery]);

  const paginatedUsers = useMemo(() => {
    if (!filteredUsers || !Array.isArray(filteredUsers)) return [];
    return filteredUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);
  }, [filteredUsers, usersPage, usersPerPage]);

  const paginatedTours = useMemo(() => {
    if (!filteredTours || !Array.isArray(filteredTours)) return [];
    return filteredTours.slice((toursPage - 1) * toursPerPage, toursPage * toursPerPage);
  }, [filteredTours, toursPage, toursPerPage]);

  const filteredTourists = useMemo(() => {
    if (!tourists || !Array.isArray(tourists)) return [];
    return tourists.filter(user => {
      return user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [tourists, searchQuery]);

  const filteredBookings = useMemo(() => {
    if (!bookings || !Array.isArray(bookings)) return [];
    return bookings.filter(booking => {
      return true;
    });
  }, [bookings]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-8 w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-md"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-12 w-1/4 mb-4"></div>
          <div className="bg-gray-200 h-96"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-xl font-semibold text-red-600">{t('common.loadingError')}</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        <Button onClick={loadDashboardData} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  console.log("Rendering dashboard with:", {
    usersCount: Array.isArray(users) ? users.length : 0,
    toursCount: Array.isArray(tours) ? tours.length : 0,
    filteredUsersCount: Array.isArray(filteredUsers) ? filteredUsers.length : 0,
    filteredToursCount: Array.isArray(filteredTours) ? filteredTours.length : 0,
    paginatedUsersCount: Array.isArray(paginatedUsers) ? paginatedUsers.length : 0,
    paginatedToursCount: Array.isArray(paginatedTours) ? paginatedTours.length : 0
  });

  const handleDeleteTour = async (tourId) => {
    if (!confirm(t('admin.confirmDeleteTour'))) {
      return;
    }
    try {
      await Tour.delete(tourId);
      const relatedAssignments = await TourAssignment.filter({ tour_id: tourId }) || [];
      for (const assignment of relatedAssignments) {
        await TourAssignment.delete(assignment.id);
      }
      const relatedStops = await TourStop.filter({ tour_id: tourId }) || [];
      for (const stop of relatedStops) {
        const relatedTracks = await AudioTrack.filter({ stop_id: stop.id }) || [];
        for (const track of relatedTracks) {
          await AudioTrack.delete(track.id);
        }
        await TourStop.delete(stop.id);
      }
      loadDashboardData();
    } catch (error) {
      console.error("Error deleting tour:", error);
      alert(t('admin.errorDeleteTour'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm(t("admin.userManagement.confirmDeleteUser"))) {
      return;
    }
    try {
      await User.delete(userId);
      loadDashboardData();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(t("admin.userManagement.errorDeleteUser"));
    }
  };

  const handleEditUser = async (userData) => {
    try {
      await User.update(userData.id, userData);
      loadDashboardData();
      setIsEditUserOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      alert(t("admin.userManagement.errorUpdateUser"));
    }
  };

  const handleCreateUser = async () => {
    try {
      setInviteStatus("sending");
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real application, you would make an API call here:
      // await User.create(newUser); 

      alert(t("admin.inviteUser.mockInvitationSent", { email: newUser.email, groups: newUser.user_group.join(", ") }));

      setNewUser({ full_name: "", email: "", role: "user", user_group: ["Tourist"] });
      setInviteStatus("success");
      loadDashboardData();

      setTimeout(() => {
        setIsCreateUserOpen(false);
        setInviteStatus(null);
      }, 1500);
    } catch (error) {
      console.error("Error creating user:", error);
      setInviteStatus("error");
      alert(t("admin.inviteUser.errorCreatingUser"));
    }
  };

  const handleUserGroupChange = (group) => {
    setNewUser(prev => {
      const currentGroups = prev.user_group || [];
      if (currentGroups.includes(group)) {
        return { ...prev, user_group: currentGroups.filter(g => g !== group) };
      } else {
        return { ...prev, user_group: [...currentGroups, group] };
      }
    });
  };

  const handleUpdateUserGroups = async (userId, groups) => {
    try {
      const userData = users.find(u => u.id === userId);
      if (!userData) return;

      await User.update(userId, { ...userData, user_group: groups });
      loadDashboardData();
    } catch (error) {
      console.error("Error updating user groups:", error);
      alert(t("admin.userManagement.errorUpdateGroups"));
    }
  };

  const handleExportTourStops = async (tourId, tourTitle) => {
    try {
      const response = await exportTourStopsCSV({ tourId });

      if (response.status === 200) {
        // Create blob and download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${tourTitle.replace(/[^a-z0-9_.-]/gi, '_')}_stops_export.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting tour stops:', error);
      alert(t('admin.tours.errorExportingStops'));
    }
  };

  return (
    <AppWrapper>
      <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.dashboardTitle')}</h1>
          <p className="text-gray-500">{t('admin.dashboardSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            className="gap-2"
          >
            <RefreshCw size={14} />
            {t('common.refresh')}
          </Button>
          <Badge variant="secondary" className="text-sm">
            {t('admin.adminAccess')}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="active_tours">{t('admin.tabs.activeTours')}</TabsTrigger>
          <FeatureGate feature="enableAnalytics">
            <TabsTrigger value="analytics">{t('nav.analytics')}</TabsTrigger>
          </FeatureGate>
          <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
          <TabsTrigger value="tours">{t('admin.tabs.tours')}</TabsTrigger>
          <TabsTrigger value="tourists">{t('admin.tabs.tourists')}</TabsTrigger>
          <TabsTrigger value="crm">CRM & Signups</TabsTrigger>
          <TabsTrigger value="activity_log">{t('admin.tabs.activityLog')}</TabsTrigger>
          <TabsTrigger value="system_errors">{t('admin.tabs.systemErrors')}</TabsTrigger>
          <TabsTrigger value="app_settings">{t('admin.tabs.appSettings')}</TabsTrigger>
          <TabsTrigger value="broadcast_debug">🔧 Broadcast Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('admin.stats.totalUsers')}</p>
                    <h3 className="text-2xl font-bold mt-1">{stats.totalUsers}</h3>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('admin.stats.totalTours')}</p>
                    <h3 className="text-2xl font-bold mt-1">{stats.totalTours}</h3>
                  </div>
                  <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <MapIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('admin.stats.activeUsers')}</p>
                    <h3 className="text-2xl font-bold mt-1">{stats.activeUsers}</h3>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('admin.stats.completedTours')}</p>
                    <h3 className="2xl font-bold mt-1">{stats.completedTours}</h3>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Settings className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active_tours">
          <div className="space-y-6">
            <ActiveToursMonitor />

            {/* Live Audio Broadcast Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Radio className="h-5 w-5" />
                      Live Audio Communication
                    </CardTitle>
                    <CardDescription>
                      Broadcast live audio to drivers during active tours
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      loadActiveToursForBroadcast(); // Load tours before opening dialog
                      setShowLiveAudioDialog(true);
                    }}
                    className="gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Start Broadcasting
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Select an active tour to broadcast live audio instructions to the driver.
                  This feature is useful for providing real-time guidance or additional information about specific stops.
                  {activeToursForBroadcast.length > 0 && (
                    <div className="mt-2 text-green-600">
                      {activeToursForBroadcast.length} active tour{activeToursForBroadcast.length !== 1 ? 's' : ''} available for broadcast
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <FeatureGate 
            feature="enableAnalytics"
            fallback={
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4 text-4xl">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Disabled</h3>
                <p className="text-gray-500">Analytics feature is currently disabled in app settings.</p>
              </div>
            }
          >
            <AdminAnalytics
              tours={tours}
              users={users}
              assignments={assignments}
              userActivity={userActivity}
              onRefresh={loadDashboardData}
            />
          </FeatureGate>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>User Management</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowInactiveUsers(!showInactiveUsers)}
                  >
                    {showInactiveUsers ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showInactiveUsers ? 'Show Active Only' : 'Show All Users'}
                  </Button>
                  <Button onClick={() => setIsCreateUserOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-gray-600">
                Total Users: {users.length} | Filtered: {filteredUsers.length} | Showing: {paginatedUsers.length}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={userGroupFilter} onValueChange={setUserGroupFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Groups</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Tour Guide">Tour Guide</SelectItem>
                    <SelectItem value="Driver">Driver</SelectItem>
                    <SelectItem value="Tourist">Tourist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                Debug: Total users loaded: {users.length}, After search filter: {filteredUsers.length}, Show inactive: {showInactiveUsers.toString()}
              </div>

              {paginatedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {users.length === 0 ? "No users in the system." : "No users match your current filters."}
                  </p>
                  {users.length > 0 && filteredUsers.length === 0 && (
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        setUserGroupFilter("All");
                        setShowInactiveUsers(true);
                      }}
                      className="mt-2"
                      variant="outline"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Groups</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              {userItem.profile_image ? (
                                <img
                                  src={userItem.profile_image}
                                  alt={userItem.full_name}
                                  className="h-8 w-8 rounded-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <UserIcon size={14} className="text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{userItem.full_name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{userItem.email || 'N/A'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                            {userItem.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 gap-1">
                                  {(userItem.user_group || []).length} groups
                                  <ChevronDown size={12} />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Manage User Groups</DialogTitle>
                                  <DialogDescription>
                                    Assign groups to {userItem.full_name}
                                  </DialogDescription>

                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                  {["Admin", "Tour Guide", "Driver", "Tourist"].map((group) => (
                                    <div key={group} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${userItem.id}-${group}`}
                                        checked={(userItem.user_group || []).includes(group)}
                                        onCheckedChange={(checked) => {
                                          const updatedGroups = checked
                                            ? [...(userItem.user_group || []), group]
                                            : (userItem.user_group || []).filter(g => g !== group);
                                          handleUpdateUserGroups(userItem.id, updatedGroups);
                                        }}
                                      />
                                      <Label
                                        htmlFor={`${userItem.id}-${group}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {group}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={(e) => e.currentTarget.closest('[role="dialog"]')?.querySelector('[aria-label="Close"]')?.click()}>Done</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(userItem.user_group || []).map(group => (
                              <Badge key={group} variant="outline" className="text-xs h-5 px-1">
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {userItem.last_active_date && new Date(userItem.last_active_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {userItem.last_active_date ? (
                            format(new Date(userItem.last_active_date), 'MMM d, yyyy')
                          ) : (
                            'Never'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(userItem);
                                setIsEditUserOpen(true);
                              }}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(userItem.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  {t('admin.pagination.showingUsers', {
                    start: Math.min((usersPage - 1) * usersPerPage + 1, filteredUsers.length),
                    end: Math.min(usersPage * usersPerPage, filteredUsers.length),
                    total: filteredUsers.length
                  })}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage(1)}
                    disabled={usersPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                    disabled={usersPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="p-2 text-sm">
                    {t('admin.pagination.page', { current: usersPage, total: Math.ceil(filteredUsers.length / usersPerPage) })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage(prev => prev + 1)}
                    disabled={usersPage * usersPerPage >= filteredUsers.length}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage(Math.ceil(filteredUsers.length / usersPerPage))}
                    disabled={usersPage * usersPerPage >= filteredUsers.length}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={usersPerPage.toString()}
                  onValueChange={(value) => {
                    setUsersPerPage(Number(value));
                    setUsersPage(1); // Reset to first page on perPage change
                  }}
                >
                  <SelectTrigger className="w-[70px] h-9">
                    <SelectValue placeholder={usersPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map(size => (
                      <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tours">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('admin.tours.title')}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("Financials"))}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    {t('admin.tours.financials')}
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl("Create"))}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('admin.tours.createTour')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-gray-600">
                {t('admin.tours.totalTours')}: {tours.length} | {t('admin.tours.filtered')}: {filteredTours.length} | {t('admin.tours.showing')}: {paginatedTours.length}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder={t('admin.tours.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {paginatedTours.length === 0 ? (
                <div className="text-center py-8">
                  <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t('admin.tours.noToursFound')}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {tours.length === 0 ? t('admin.tours.noToursSystem') : t('admin.tours.noToursSearch')}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.tours.table.tour')}</TableHead>
                      <TableHead>{t('admin.tours.table.status')}</TableHead>
                      <TableHead>{t('admin.tours.table.assignedTo')}</TableHead>
                      <TableHead>{t('admin.tours.table.manage')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTours.map((tour) => (
                      <TableRow key={tour.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {tour.preview_image ? (
                              <img
                                src={tour.preview_image}
                                alt={tour.title}
                                className="h-10 w-10 rounded object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                                <MapIcon size={16} className="text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{tour.title || t('common.notAvailable')}</div>
                              <div className="text-sm text-gray-500">
                                {tour.location?.city ? `${tour.location.city}, ${tour.location.country}` : t('common.notAvailable')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tour.assignment?.status ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusBadge(tour.assignment.status)}>
                                {t(`assignment_status.${tour.assignment.status}`)}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline">{t('assignment_status.unassigned')}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {tour.assignment?.driver_id ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <UserIcon size={16} className="text-gray-500" />
                                <span>{drivers.find(d => d.id === tour.assignment.driver_id)?.full_name || tour.assignment.driver_id}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnassignTour(tour.assignment)}
                                  disabled={tour.assignment.status === 'in_progress'}
                                >
                                  {t('admin.assignment.unassign')}
                                </Button>
                                {tour.assignment.status === 'assigned' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateAssignmentStatus(tour.assignment.id, 'in_progress')}
                                  >
                                    {t('admin.assignment.startTour')}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTourForAssignment(tour);
                                setShowAssignDialog(true);
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              {t('admin.tours.assignDriver')}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(createPageUrl(`Create?edit=true&id=${tour.id}`))}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTour(tour.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(createPageUrl(`TourDetails?id=${tour.id}`))}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportTourStops(tour.id, tour.title)}
                            >
                              <Download className="h-4 w-4 text-green-600" />
                            </Button>
                            {tour.assignment && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowTracking(tour)}
                              >
                                <MapIcon size={14} className="text-blue-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  {t('admin.pagination.showingTours', {
                    start: Math.min((toursPage - 1) * toursPerPage + 1, filteredTours.length),
                    end: Math.min(toursPage * toursPerPage, filteredTours.length),
                    total: filteredTours.length
                  })}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setToursPage(1)}
                    disabled={toursPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setToursPage(prev => Math.max(1, prev - 1))}
                    disabled={toursPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="p-2 text-sm">
                    {t('admin.pagination.page', { current: toursPage, total: Math.ceil(filteredTours.length / toursPerPage) })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setToursPage(prev => prev + 1)}
                    disabled={toursPage * toursPerPage >= filteredTours.length}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setToursPage(Math.ceil(filteredTours.length / toursPerPage))}
                    disabled={toursPage * toursPerPage >= filteredTours.length}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={toursPerPage.toString()}
                  onValueChange={(value) => {
                    setToursPerPage(Number(value));
                    setToursPage(1); // Reset to first page
                  }}
                >
                  <SelectTrigger className="w-[70px] h-9">
                    <SelectValue placeholder={toursPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map(size => (
                      <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tourists">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.tourists.title')}</CardTitle>
              <CardDescription>{t('admin.tourists.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Input
                  placeholder={t('admin.tourists.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <ScrollArea className="h-[calc(100vh-250px)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.tourists.table.name')}</TableHead>
                      <TableHead>{t('admin.tourists.table.email')}</TableHead>
                      <TableHead>{t('admin.tourists.table.totalTours')}</TableHead>
                      <TableHead>{t('admin.tourists.table.completedTours')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTourists.map((tourist) => (
                      <TableRow key={tourist.id}>
                        <TableCell>{tourist.full_name || t('common.notAvailable')}</TableCell>
                        <TableCell>{tourist.email || t('common.notAvailable')}</TableCell>
                        <TableCell>{(userActivity.filter(act => act.user_id === tourist.id) || []).length}</TableCell>
                        <TableCell>{(userActivity.filter(act => act.user_id === tourist.id && act.status === 'completed') || []).length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crm">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tour Signups</CardTitle>
                <CardDescription>Manage tourist signups for public tours</CardDescription>
              </CardHeader>
              <CardContent>
                <TourSignupsTable />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tourist Management</CardTitle>
                <CardDescription>View and manage registered tourists</CardDescription>
              </CardHeader>
              <CardContent>
                <TouristManagement tourists={filteredTourists} userActivity={userActivity} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity_log">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.activityLog.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.activityLog.table.user')}</TableHead>
                      <TableHead>{t('admin.activityLog.table.action')}</TableHead>
                      <TableHead>{t('admin.activityLog.table.tour')}</TableHead>
                      <TableHead>{t('admin.activityLog.table.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActivity.map((activity, index) => (
                      <TableRow key={activity.id || index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserIcon size={14} className="text-gray-500" />
                            <span>{users.find(u => u.id === activity.user_id)?.full_name || activity.user_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {activity.status === 'completed' ? t('activity_status.completedTour') : activity.status === 'in_progress' ? t('activity_status.progressedInTour') : t('activity_status.startedTour')}
                          </Badge>
                        </TableCell>
                        <TableCell>{tours.find(t => t.id === activity.tour_id)?.title || activity.tour_id}</TableCell>
                        <TableCell>
                          {format(new Date(activity.updated_at || activity.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system_errors">
          <SystemLogs />
        </TabsContent>

        <TabsContent value="app_settings">
          <AppSettings />
        </TabsContent>

        <TabsContent value="broadcast_debug">
          <BroadcastDebugPanel />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.editUser.title')}</DialogTitle>
            <DialogDescription>
              {t('admin.editUser.description')}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">{t('admin.editUser.fullName')}</Label>
                <Input
                  id="edit-user-name"
                  value={selectedUser.full_name}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    full_name: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-role">{t('admin.editUser.role')}</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({
                    ...selectedUser,
                    role: value
                  })}
                >
                  <SelectTrigger id="edit-user-role">
                    <SelectValue placeholder={t('admin.editUser.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t('roles.user')}</SelectItem>
                    <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => selectedUser && handleEditUser(selectedUser)}>
              {t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.inviteUser.title')}</DialogTitle>
            <DialogDescription>
              {t('admin.inviteUser.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">{t('admin.inviteUser.fullName')}</Label>
              <Input
                id="new-user-name"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder={t('admin.inviteUser.fullNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">{t('admin.inviteUser.emailAddress')}</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder={t('admin.inviteUser.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-role">{t('admin.inviteUser.role')}</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger id="new-user-role">
                  <SelectValue placeholder={t('admin.inviteUser.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t('roles.user')}</SelectItem>
                  <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>{t('admin.inviteUser.userGroups')}</Label>
              {["Admin", "Tour Guide", "Driver", "Tourist"].map((group) => (
                <div key={group} className="flex items-center space-x-2">
                  <Checkbox
                    id={`new-user-${group}`}
                    checked={(newUser.user_group || []).includes(group)}
                    onCheckedChange={() => handleUserGroupChange(group)}
                  />
                  <Label
                    htmlFor={`new-user-${group}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t(`user_groups.${group.replace(' ', '')}`)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!newUser.email || !newUser.full_name || inviteStatus === "sending"}
            >
              {inviteStatus === "sending" ? (
                <><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>{t('common.sending')}</>
              ) : inviteStatus === "success" ? (
                <><CheckCircle className="h-4 w-4 mr-2" />{t('common.sent')}</>
              ) : inviteStatus === "error" ? (
                <><AlertTriangle className="h-4 w-4 mr-2" />{t('common.tryAgain')}</>
              ) : (
                <><Mail className="h-4 w-4 mr-2" />{t('admin.inviteUser.sendInvitation')}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.assignTour.title')}</DialogTitle>
            <DialogDescription>
              {t('admin.assignTour.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.assignTour.selectedTour')}</Label>
              <div className="p-3 border rounded-md bg-gray-50">
                <div className="font-medium">{selectedTourForAssignment?.title || t('admin.assignTour.noTourSelected')}</div>
                {selectedTourForAssignment?.description && (
                  <div className="text-sm text-gray-600 mt-1">{selectedTourForAssignment.description}</div>
                )}
                {selectedTourForAssignment?.location && (
                  <div className="text-sm text-gray-500 mt-1">
                    📍 {selectedTourForAssignment.location.city}, {selectedTourForAssignment.location.country}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-driver-select">{t('admin.assignTour.selectDriver')}</Label>
              {drivers.length > 0 ? (
                <Select
                  value={selectedDriver || ""}
                  onValueChange={setSelectedDriver}
                >
                  <SelectTrigger id="assign-driver-select">
                    <SelectValue placeholder={t('admin.assignTour.chooseDriver')} />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{driver.full_name}</span>
                          <span className="text-sm text-gray-500">{driver.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 border rounded-md bg-yellow-50 border-yellow-200">
                  <div className="text-sm text-yellow-800">
                    ⚠️ {t('admin.assignTour.noDriversFound')}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-yellow-700"
                    onClick={() => {
                      setShowAssignDialog(false);
                      setActiveTab("users");
                    }}
                  >
                    {t('admin.assignTour.goToUserManagement')}
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-start-time">{t('admin.assignTour.startTime')}</Label>
              <Input
                id="assign-start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (selectedDriver && selectedTourForAssignment && startTime) {
                  handleAssignTour(
                    selectedTourForAssignment.id,
                    selectedDriver,
                    startTime
                  );
                }
              }}
              disabled={!selectedDriver || !selectedTourForAssignment || !startTime}
            >
              {t('admin.assignTour.assignButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('admin.trackTour.title')}</DialogTitle>
            <DialogDescription>
              {t('admin.trackTour.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[500px] relative">
            <DriverTrackingMap tour={trackingData} driverLocation={driversLocations[trackingData?.assignment?.driver_id]} />
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between text-sm">
              <div>
                <span className="font-medium">{t('admin.trackTour.driver')}: </span>
                {drivers.find(d => d.id === trackingData?.assignment?.driver_id)?.full_name || trackingData?.assignment?.driver_id || t('common.notAvailable')}
              </div>
              <div>
                <span className="font-medium">{t('admin.trackTour.started')}: </span>
                {trackingData?.assignment?.start_time &&
                  format(new Date(trackingData.assignment.start_time), 'PPp')}
              </div>
            </div>
            <Progress
              value={
                ((trackingData?.assignment?.completed_stops?.length || 0) / (trackingData?.stops?.length || 1)) * 100
              }
            />
            <div className="text-sm text-center text-gray-500">
              {t('admin.trackTour.stopsProgress', {
                completed: trackingData?.assignment?.completed_stops?.length || 0,
                total: trackingData?.stops?.length || 0
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Audio Broadcast Dialog */}
      <Dialog open={showLiveAudioDialog} onOpenChange={setShowLiveAudioDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Live Audio Broadcast</DialogTitle>
            <DialogDescription>
              Select an active tour and broadcast live audio to the driver
            </DialogDescription>
          </DialogHeader>
          <LiveAudioBroadcast
            activeTours={activeToursForBroadcast}
            onClose={() => setShowLiveAudioDialog(false)}
          />
        </DialogContent>
      </Dialog>
      </div>
    </AppWrapper>
  );
}
