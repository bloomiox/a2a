
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from '@/components/i18n/LanguageContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    preferred_language: "English",
    desired_role: "Tourist", // What role they're applying for
    experience: "", // Relevant experience for guides/drivers
    availability: "", // Full-time/Part-time/Weekends
    phone: "",
    about: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long!");
      setLoading(false);
      return;
    }

    try {
      // Use Supabase to create a new user account
      const { supabase } = await import("@/api/supabaseClient");
      
      console.log("Attempting to sign up user:", formData.email);
      
      // Try signup with minimal metadata first
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            // Only include essential data to avoid trigger issues
            email: formData.email
          }
        }
      });

      console.log("Signup response:", { 
        user: data?.user ? { id: data.user.id, email: data.user.email } : null, 
        session: data?.session ? 'exists' : null,
        error: error ? { 
          message: error.message, 
          status: error.status,
          details: error.details 
        } : null 
      });

      if (error) {
        console.error("Signup error details:", {
          message: error.message,
          status: error.status,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Provide more user-friendly error messages
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        } else if (error.message.includes('Database error')) {
          throw new Error('There was a database issue during registration. Please try again or contact support.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        }
        
        throw error;
      }

      if (data.user) {
        // Handle profile creation - either by trigger or manually
        try {
          // Wait a moment for the trigger to create the profile (if it exists)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Store extra info in additional_info JSONB field
          const additionalInfo = {
            full_name: formData.full_name,
            desired_role: formData.desired_role,
            phone: formData.phone,
            about: formData.about,
            experience: formData.experience,
            availability: formData.availability
          };

          // First, check if profile exists
          const { data: existingProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (checkError && checkError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log("Profile doesn't exist, creating it manually");
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                preferred_language: formData.preferred_language || 'English',
                user_group: [formData.desired_role],
                additional_info: additionalInfo,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error("Profile creation error:", insertError);
              // Don't fail registration if profile creation fails
            } else {
              console.log("Profile created successfully with registration data");
            }
          } else if (!checkError) {
            // Profile exists, update it
            console.log("Profile exists, updating with registration data");
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({
                preferred_language: formData.preferred_language || 'English',
                user_group: [formData.desired_role],
                additional_info: additionalInfo,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.user.id);

            if (updateError) {
              console.error("Profile update error:", updateError);
              // Don't fail registration if profile update fails
            } else {
              console.log("Profile updated successfully with registration data");
            }
          } else {
            console.error("Error checking profile existence:", checkError);
          }
        } catch (error) {
          console.error("Profile update error:", error);
          // Don't fail registration if profile update fails
        }

        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container max-w-[900px] mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(createPageUrl("Landing"))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t('auth.createAccount')}</CardTitle>
            <CardDescription>
              {t('auth.registerDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t('auth.fullName')}</Label>
                  <Input
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    required
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('auth.phone')}</Label>
                  <Input
                    id="phone"
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('auth.phonePlaceholder')}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('auth.desiredRole')}</Label>
                  <Select
                    value={formData.desired_role}
                    onValueChange={(value) => handleInputChange('desired_role', value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('auth.selectRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tourist">{t('auth.roles.tourist')}</SelectItem>
                      <SelectItem value="Guide">{t('auth.roles.guide')}</SelectItem>
                      <SelectItem value="Driver">{t('auth.roles.driver')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {t('auth.roleDescription')}
                  </p>
                </div>

                {(formData.desired_role === 'Guide' || formData.desired_role === 'Driver') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="experience">{t('auth.experience')}</Label>
                      <Input
                        id="experience"
                        value={formData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        placeholder={t('auth.experiencePlaceholder')}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('auth.availability')}</Label>
                      <Select
                        value={formData.availability}
                        onValueChange={(value) => handleInputChange('availability', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('auth.selectAvailability')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">{t('auth.availability.fullTime')}</SelectItem>
                          <SelectItem value="part-time">{t('auth.availability.partTime')}</SelectItem>
                          <SelectItem value="weekends">{t('auth.availability.weekends')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="about">{t('auth.about')}</Label>
                  <Input
                    id="about"
                    value={formData.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    placeholder={t('auth.aboutPlaceholder')}
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('auth.aboutDescription')}
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.register')
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-gray-500 text-center w-full">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link
                to={createPageUrl("Login")}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {t('auth.login')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('auth.registrationSuccess')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('auth.registrationPending')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => navigate(createPageUrl("Login"))}
              className="w-full"
            >
              {t('auth.backToLogin')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
