import Layout from "./Layout.jsx";

import Home from "./Home";

import Explore from "./Explore";

import Create from "./Create";

import Play from "./Play";

import Profile from "./Profile";

import Settings from "./Settings";

import WelcomePage from "./WelcomePage";

import Search from "./Search";

import AdminDashboard from "./AdminDashboard";

import TourDetails from "./TourDetails";

import Landing from "./Landing";

import Driver from "./Driver";

import CRM from "./CRM";

import Financials from "./Financials";

import Tourists from "./Tourists";

import Register from "./Register";

import Login from "./Login";

import ReportIssue from "./ReportIssue";

import CreatorDashboard from "./CreatorDashboard";

import DriverNavigation from "./DriverNavigation";

import DriverHistory from "./DriverHistory";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Explore: Explore,
    
    Create: Create,
    
    Play: Play,
    
    Profile: Profile,
    
    Settings: Settings,
    
    WelcomePage: WelcomePage,
    
    Search: Search,
    
    AdminDashboard: AdminDashboard,
    
    TourDetails: TourDetails,
    
    Landing: Landing,
    
    Driver: Driver,
    
    CRM: CRM,
    
    Financials: Financials,
    
    Tourists: Tourists,
    
    Register: Register,
    
    Login: Login,
    
    ReportIssue: ReportIssue,
    
    CreatorDashboard: CreatorDashboard,
    
    DriverNavigation: DriverNavigation,
    
    DriverHistory: DriverHistory,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Explore" element={<Explore />} />
                
                <Route path="/Create" element={<Create />} />
                
                <Route path="/Play" element={<Play />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/WelcomePage" element={<WelcomePage />} />
                
                <Route path="/Search" element={<Search />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/TourDetails" element={<TourDetails />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Driver" element={<Driver />} />
                
                <Route path="/CRM" element={<CRM />} />
                
                <Route path="/Financials" element={<Financials />} />
                
                <Route path="/Tourists" element={<Tourists />} />
                
                <Route path="/Register" element={<Register />} />
                
                <Route path="/Login" element={<Login />} />
                
                <Route path="/ReportIssue" element={<ReportIssue />} />
                
                <Route path="/CreatorDashboard" element={<CreatorDashboard />} />
                
                <Route path="/DriverNavigation" element={<DriverNavigation />} />
                
                <Route path="/DriverHistory" element={<DriverHistory />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}