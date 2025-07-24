

import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  Home,
  Compass, // Replaces Map
  Search, // Kept to avoid breaking existing sheet links
  Plus,
  User as UserIcon,
  Settings, // Kept to avoid breaking existing sheet links
  Menu,
  ChevronLeft,
  LogOut,
  Navigation,
  ClipboardList,
  MapPin,
  AlertTriangle,
  BarChart3,
  BookUser, // New for Admin users
  Shield, // New for Admin users
  Headphones,
  Clock // New: for Driver History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useLanguage, LanguageProvider } from '@/components/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ErrorBoundary from "@/components/ErrorBoundary"; // Import the new ErrorBoundary

// This is our new Design System.
// By defining CSS variables here, we can apply a consistent theme across the entire application.
const DesignSystemStyles = () => (
  <style jsx global>{`
    :root {
      --background: 240 10% 98%; /* Lighter, cleaner background */
      --foreground: 240 10% 3.9%;
      --card: 0 0% 100%;
      --card-foreground: 240 10% 3.9%;
      --popover: 0 0% 100%;
      --popover-foreground: 240 10% 3.9%;
      --primary: 195 80% 30%; /* Deep, sophisticated Teal */
      --primary-foreground: 0 0% 100%;
      --secondary: 240 4.8% 95.9%;
      --secondary-foreground: 240 5.9% 10%;
      --muted: 240 4.8% 95.9%;
      --muted-foreground: 240 3.8% 46.1%;
      --accent: 25 95% 53%; /* Vibrant, warm Orange for CTAs */
      --accent-foreground: 0 0% 100%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 0 0% 98%;
      --border: 240 5.9% 90%;
      --input: 240 5.9% 90%;
      --ring: 195 80% 30%;
      --radius: 0.75rem; /* Softer, more modern corners */
    }
    .dark {
      /* Add dark mode variables if needed later */
    }
    body {
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      font-family: 'Figtree', sans-serif; /* A modern, friendly font */
    }
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap');
  `}</style>
);


export default function Layout({ children, currentPageName }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if this is the landing page or auth pages
  const isLandingPage = currentPageName === "Landing";
  const isExploreOrSearchPage = ["Explore", "Search"].includes(currentPageName);
  const isAuthPage = ["Login", "Register"].includes(currentPageName);
  const isPlayPage = currentPageName === "Play";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        setIsLoggedIn(true);

        // Handle role-based redirections for logged-in users
        if (location.pathname === "/" || location.pathname === "/Login" || location.pathname === "/login") {
          if (userData.user_group?.includes("Driver")) {
            navigate(createPageUrl("Driver"));
          } else if (userData.user_group?.includes("Admin")) {
            navigate(createPageUrl("AdminDashboard"));
          } else if (userData.user_group?.includes("Tourist")) {
            navigate(createPageUrl("Home"));
          } else {
            // Default to Home for regular users
            navigate(createPageUrl("Home"));
          }
        }
      } catch (error) {
        setIsLoggedIn(false);
        // If not logged in and trying to access protected routes, redirect to landing
        // Allow access to Landing, Login, Register, Explore, and Search pages without authentication
        if (!isLandingPage && !isExploreOrSearchPage && !isAuthPage) {
          navigate(createPageUrl("Landing"));
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location.pathname, isLandingPage, isExploreOrSearchPage, isAuthPage]);

  const handleLogout = async () => {
    await User.logout();
    setIsLoggedIn(false);
    setUser(null);
    navigate(createPageUrl("Landing"));
  };

  const handleLogin = async () => {
    try {
      await User.login();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Add a condition to show driver-specific navigation
  const showDriverNav = user?.user_group?.includes("Driver");
  const showAdminNav = user?.user_group?.includes("Admin");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-primary font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <DesignSystemStyles />
      {isLandingPage || isAuthPage || (!isLoggedIn && (isExploreOrSearchPage || isPlayPage)) ? (
        <SimpleLayout
          isLoggedIn={isLoggedIn}
          navigate={navigate}
          children={children}
        />
      ) : isPlayPage ? (
        <PlayLayout children={children} />
      ) : (
        <MainLayout
          currentPageName={currentPageName}
          handleLogout={handleLogout}
          children={children}
          showDriverNav={showDriverNav}
          showAdminNav={showAdminNav}
          user={user}
        />
      )}
    </LanguageProvider>
  );
}

// Simple layout for landing page and guest users
function SimpleLayout({ isLoggedIn, navigate, children }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container px-4 mx-auto h-16 flex items-center justify-between">
          <Link to={createPageUrl("Landing")} className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">TurbaTours</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {!isLoggedIn && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate(createPageUrl("Login"))}
                >
                  {t('auth.login')}
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl("Register"))}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {t('auth.signup')}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}

// Play page layout
function PlayLayout({ children }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("Explore")} className="flex items-center gap-2 text-primary">
            <ChevronLeft size={22} />
            <span className="font-medium text-lg">{t('common.back')}</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex-1 pt-16 pb-24">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}

// Main layout for authenticated users
function MainLayout({ currentPageName, handleLogout, children, showDriverNav, showAdminNav, user }) {
  const { t } = useLanguage();
  const location = useLocation(); // To determine active link for footer
  const [driverTourId, setDriverTourId] = useState(null);

  // Fetch driver's active tour assignment
  useEffect(() => {
    const fetchDriverAssignment = async () => {
      if (showDriverNav && user?.id) {
        try {
          const { TourAssignment } = await import('@/api/entities');
          const assignments = await TourAssignment.filter({
            driver_id: user.id,
            status: 'in_progress'
          }, '-created_date', 1);
          
          if (assignments && assignments.length > 0) {
            setDriverTourId(assignments[0].tour_id);
          } else {
            // If no in_progress tour, check for assigned tours
            const assignedAssignments = await TourAssignment.filter({
              driver_id: user.id,
              status: 'assigned'
            }, 'start_time', 1);
            
            if (assignedAssignments && assignedAssignments.length > 0) {
              setDriverTourId(assignedAssignments[0].tour_id);
            }
          }
        } catch (error) {
          console.error("Error fetching driver assignment:", error);
        }
      }
    };

    fetchDriverAssignment();
  }, [showDriverNav, user?.id]);
  
  const homeUrl = useMemo(() => {
    if (showAdminNav) return createPageUrl("AdminDashboard");
    if (showDriverNav) return createPageUrl("Driver");
    return createPageUrl("Home");
  }, [showAdminNav, showDriverNav]);

  const NAV_ITEMS = {
    tourist: [
      { page: "Home", label: t('nav.home'), icon: Home },
      { page: "Explore", label: t('nav.explore'), icon: Compass },
      { page: "Create", label: t('nav.createTour'), icon: Plus, isCentral: true },
      { page: "CreatorDashboard", label: t('nav.analytics'), icon: BarChart3 },
      { page: "Profile", label: t('nav.profile'), icon: UserIcon },
    ],
    driver: [
      { page: "Driver", label: t('nav.myTours'), icon: ClipboardList },
      { page: "DriverHistory", label: t('nav.history'), icon: Clock },
      { 
        page: "DriverNavigation", 
        label: t('nav.navigation'), 
        icon: Navigation, 
        isCentral: true,
        tourId: driverTourId
      },
      { page: "ReportIssue", label: t('nav.reportIssue'), icon: AlertTriangle },
      { page: "Profile", label: t('nav.profile'), icon: UserIcon },
    ],
    admin: [
      { page: "AdminDashboard", label: t('nav.admin'), icon: Shield },
      { page: "Explore", label: t('nav.explore'), icon: Compass },
      { page: "Create", label: t('nav.createTour'), icon: Plus, isCentral: true },
      { page: "CreatorDashboard", label: t('nav.analytics'), icon: BarChart3 },
      { page: "Profile", label: t('nav.profile'), icon: UserIcon },
    ]
  };

  let navItems = NAV_ITEMS.tourist;
  if(showAdminNav) {
    navItems = NAV_ITEMS.admin;
  } else if(showDriverNav) {
    navItems = NAV_ITEMS.driver;
  }

  // Determine which set of nav items to display in the sheet
  const sheetNavItems = NAV_ITEMS.tourist; // Default to tourist for general users

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container px-4 mx-auto h-16 flex items-center justify-between">
          <Link to={homeUrl} className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">TurbaTours</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="text-foreground/70" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-6 pt-12">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    {user?.profile_image ? (
                        <img src={user.profile_image} alt={user.full_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                            {user?.full_name?.charAt(0)}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-lg">{user?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <nav className="flex-grow mt-6 space-y-1">
                    {/* Hardcoded links for Sheet (as per original logic, but with new styles) */}
                    <SheetClose asChild>
                      <Link
                        to={createPageUrl("Home")}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                      >
                        <Home size={22} className="text-primary" />
                        <span>{t('nav.home')}</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to={createPageUrl("Explore")}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                      >
                        <Compass size={22} className="text-primary" />
                        <span>{t('nav.explore')}</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to={createPageUrl("Search")}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                      >
                        <Search size={22} className="text-primary" />
                        <span>{t('nav.search')}</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to={createPageUrl("Create")}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                      >
                        <Plus size={22} className="text-primary" />
                        <span>{t('nav.createTour')}</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to={createPageUrl("CreatorDashboard")}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                      >
                        <BarChart3 size={22} className="text-primary" />
                        <span>Analytics</span>
                      </Link>
                    </SheetClose>

                    {showDriverNav && (
                      <>
                        <SheetClose asChild>
                          <Link
                            to={createPageUrl("Driver")}
                            className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                          >
                            <ClipboardList size={22} className="text-primary" />
                            <span>{t('nav.myTours')}</span>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            to={createPageUrl("DriverHistory")}
                            className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                          >
                            <Clock size={22} className="text-primary" />
                            <span>{t('nav.history')}</span>
                          </Link>
                        </SheetClose>
                      </>
                    )}

                    {showAdminNav && (
                       <SheetClose asChild key="AdminDashboard">
                        <Link
                          to={createPageUrl("AdminDashboard")}
                          className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                        >
                          <Shield size={22} className="text-primary" />
                          <span>{t('nav.admin')}</span>
                        </Link>
                      </SheetClose>
                    )}

                    <Separator className="my-4" />

                    <SheetClose asChild>
                      <Link
                        to={createPageUrl("Profile")}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                      >
                        <UserIcon size={22} className="text-primary" />
                        <span>{t('nav.profile')}</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to={createPageUrl("Settings")}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium"
                      >
                        <Settings size={22} className="text-primary" />
                        <span>{t('nav.settings')}</span>
                      </Link>
                    </SheetClose>
                  </nav>

                  <div className="mt-auto">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 px-4 py-3 h-auto"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-4 h-5 w-5" />
                      <span className="font-medium">{t('auth.logout')}</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16 pb-24">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
        <div className="container mx-auto h-20 flex items-center justify-around">
          {navItems.map(item => {
            let url;
            if (item.tab) {
              url = createPageUrl(`${item.page}?tab=${item.tab}`);
            } else if (item.page === "DriverNavigation" && item.tourId) {
              url = createPageUrl(`${item.page}?tourId=${item.tourId}`);
            } else {
              url = createPageUrl(item.page);
            }
            
            let isActive = item.tab
              ? location.pathname === createPageUrl(item.page) && new URLSearchParams(location.search).get('tab') === item.tab
              : location.pathname.includes(createPageUrl(item.page));

            // Adjust logic for AdminDashboard home tab to be active for base route
            // This condition is now largely irrelevant for the new admin nav, as admin items no longer use 'tab'
            // and the `isActive` will simply use `includes`
            if (item.page === "AdminDashboard" && item.tab === "overview" && location.pathname === createPageUrl("AdminDashboard") && !new URLSearchParams(location.search).get('tab')) {
              isActive = true;
            }

            // Special handling for driver navigation button - disable if no tour assigned
            const isDriverNavDisabled = item.page === "DriverNavigation" && !item.tourId;

            return (
              <Link
                key={item.page + (item.tab || '')}
                to={isDriverNavDisabled ? "#" : url}
                className={`flex flex-col items-center gap-1.5 px-2 transition-colors ${
                  isDriverNavDisabled 
                    ? "text-muted-foreground opacity-50 cursor-not-allowed" 
                    : isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                } ${item.isCentral ? "-mt-8" : ""}`}
                onClick={isDriverNavDisabled ? (e) => e.preventDefault() : undefined}
              >
                {item.isCentral ? (
                  <div className={`h-16 w-16 rounded-full ${isDriverNavDisabled ? 'bg-muted' : 'bg-accent'} text-accent-foreground flex items-center justify-center shadow-lg ${!isDriverNavDisabled ? 'shadow-accent/30' : ''}`}>
                    <item.icon size={30} />
                  </div>
                ) : (
                  <>
                    <item.icon size={22} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </footer>
    </div>
  );
}

