import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Navigation,
  Globe,
  Users,
  ArrowRight,
  Volume2,
  Star,
  Languages,
  WifiOff,
  MapPin,
  Clock,
  Calendar,
  DollarSign,

  Menu,
  X,
  Phone,
  Mail,
  MapPinIcon,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Award,
  Shield,
  Headphones,
  Target,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { Tour } from "@/api/entities";

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [publicTours, setPublicTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    loadPublicTours();
  }, []);

  const loadPublicTours = async () => {
    try {
      setLoading(true);
      // Load public tours (assuming there's a is_public field)
      const tours = await Tour.filter({ is_public: true }, '-created_at', 6);
      setPublicTours(tours || []);
    } catch (error) {
      console.error('Error loading public tours:', error);
      setPublicTours([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    navigate(createPageUrl("Register"));
  };

  const handleTourClick = (tour) => {
    const url = `${createPageUrl('TourDetails')}?id=${tour.id}`;
    console.log('Navigating to:', url);
    navigate(url);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    // Here you would typically send the contact form to your backend
    toast({
      title: "Message Sent!",
      description: "We'll get back to you soon.",
    });
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };



  const features = [
    {
      icon: <Globe className="h-8 w-8 text-indigo-600" />,
      title: t('landing.features.globalTours.title'),
      description: t('landing.features.globalTours.description')
    },
    {
      icon: <Navigation className="h-8 w-8 text-indigo-600" />,
      title: t('landing.features.gpsNavigation.title'),
      description: t('landing.features.gpsNavigation.description')
    },
    {
      icon: <Volume2 className="h-8 w-8 text-indigo-600" />,
      title: t('landing.features.audioQuality.title'),
      description: t('landing.features.audioQuality.description')
    },
    {
      icon: <WifiOff className="h-8 w-8 text-indigo-600" />,
      title: t('landing.features.offlineMode.title'),
      description: t('landing.features.offlineMode.description')
    },
    {
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      title: t('landing.features.expertCreators.title'),
      description: t('landing.features.expertCreators.description')
    },
    {
      icon: <Languages className="h-8 w-8 text-indigo-600" />,
      title: t('landing.features.multiLanguage.title'),
      description: t('landing.features.multiLanguage.description')
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Headphones className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">AudioGuide</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('tours')}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Tours
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Contact
              </button>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Login"))}
              >
                Login
              </Button>
              <Button
                onClick={handleSignup}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-indigo-600 p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => scrollToSection('home')}
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium text-left"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium text-left"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection('tours')}
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium text-left"
                >
                  Tours
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium text-left"
                >
                  Contact
                </button>
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("Login"))}
                    className="w-full"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={handleSignup}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Home Section */}
      <section id="home" className="pt-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
          <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-5"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                <Badge className="mb-4 bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                  <Star className="h-4 w-4 mr-1" />
                  {t('landing.hero.badge')}
                </Badge>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                  {t('landing.hero.title')}
                  <br />
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {t('landing.hero.subtitle')}
                  </span>
                </h1>

                <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                  {t('landing.hero.description')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    onClick={() => scrollToSection('tours')}
                    className="text-lg bg-indigo-600 hover:bg-indigo-700"
                  >
                    Explore Tours
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => scrollToSection('about')}
                    className="text-lg"
                  >
                    Learn More
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">1000+</div>
                      <div className="text-indigo-100">Audio Tours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">50+</div>
                      <div className="text-indigo-100">Countries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">100K+</div>
                      <div className="text-indigo-100">Happy Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">4.9★</div>
                      <div className="text-indigo-100">Rating</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              About AudioGuide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're passionate about making travel more immersive and educational through expertly crafted audio experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h3>
              <p className="text-gray-600 mb-6">
                AudioGuide was founded with a simple mission: to transform how people explore the world.
                We believe that every destination has incredible stories to tell, and our audio tours bring
                these stories to life in ways that traditional guidebooks simply can't match.
              </p>
              <p className="text-gray-600 mb-6">
                Our team of local historians, professional guides, and audio specialists work together to
                create immersive experiences that educate, entertain, and inspire travelers from around the globe.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Expert-curated content</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Local insights</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <Award className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Award Winning</h4>
                  <p className="text-sm text-gray-600">Recognized for excellence in travel technology</p>
                </div>
                <div className="text-center">
                  <Shield className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Trusted Platform</h4>
                  <p className="text-sm text-gray-600">Secure and reliable for millions of users</p>
                </div>
                <div className="text-center">
                  <Globe className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Global Reach</h4>
                  <p className="text-sm text-gray-600">Tours available in 50+ countries worldwide</p>
                </div>
                <div className="text-center">
                  <Target className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Personalized</h4>
                  <p className="text-sm text-gray-600">Tailored experiences for every traveler</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tours Section */}
      <section id="tours" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Tours
            </h2>
            <p className="text-xl text-gray-600">
              Join our expertly guided tours and explore amazing destinations
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-t-xl"></div>
                  <div className="bg-gray-100 p-6 rounded-b-xl">
                    <div className="bg-gray-200 h-6 w-3/4 mb-2"></div>
                    <div className="bg-gray-200 h-4 w-full mb-4"></div>
                    <div className="bg-gray-200 h-10 w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : publicTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publicTours.map((tour) => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => handleTourClick(tour)}
                >
                  <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                    {tour.preview_image ? (
                      <img
                        src={tour.preview_image}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white text-indigo-600">
                        {tour.theme || 'Cultural'}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {tour.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {tour.description || 'Discover amazing places and stories on this guided tour.'}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        {tour.location?.city || 'Unknown'}, {tour.location?.country || 'Location'}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        {tour.duration ? `${Math.floor(tour.duration / 60)}h ${tour.duration % 60}m` : '1 hour'}
                      </div>
                      {tour.financials?.price_per_tourist > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <DollarSign className="h-4 w-4 mr-2" />
                          ${tour.financials.price_per_tourist} per person
                        </div>
                      )}
                      {(!tour.financials?.price_per_tourist || tour.financials.price_per_tourist === 0) && (
                        <div className="flex items-center text-sm text-green-600 font-medium">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('booking.freeTour')}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when button is clicked
                        handleTourClick(tour);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {t('booking.viewDetails')}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tours Available</h3>
              <p className="text-gray-500">Check back soon for exciting new tours!</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">1000+</div>
              <div className="text-gray-600">{t('landing.stats.audioTours')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">50+</div>
              <div className="text-gray-600">{t('landing.stats.countries')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">100K+</div>
              <div className="text-gray-600">{t('landing.stats.happyUsers')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            {t('landing.cta.title')}
          </h2>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleSignup}
            className="text-lg bg-white text-indigo-600 hover:bg-gray-100"
          >
            {t('landing.cta.button')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPinIcon className="h-6 w-6 text-indigo-600 mt-1 mr-4" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Address</h4>
                    <p className="text-gray-600">123 Tourism Street<br />Travel City, TC 12345</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-indigo-600 mt-1 mr-4" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Phone</h4>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-indigo-600 mt-1 mr-4" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600">hello@audioguide.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <Facebook className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <Twitter className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <Youtube className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contact-name">Name</Label>
                    <Input
                      id="contact-name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact-subject">Subject</Label>
                  <Input
                    id="contact-subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="What's this about?"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact-message">Message</Label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us more..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Headphones className="h-8 w-8 text-indigo-400" />
                <span className="ml-2 text-xl font-bold">AudioGuide</span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                Discover the world through immersive audio experiences. Join millions of travelers
                who trust AudioGuide for their next adventure.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection('home')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('about')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('tours')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Tours
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('contact')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 AudioGuide by Bloom Travel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>


    </div>
  );
}