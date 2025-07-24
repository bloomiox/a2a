import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { SendEmail } from "@/api/integrations";
import { User } from "@/api/entities";
import { useLanguage } from '@/components/i18n/LanguageContext';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ArrowLeft, Phone } from "lucide-react";

export default function ReportIssue() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    issueType: "",
    title: "",
    description: "",
    urgency: "medium"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await User.me();
      
      // Send email to support
      await SendEmail({
        to: "support@audiotour.com", // Replace with actual support email
        subject: `${t('driver.reportIssue')}: ${formData.title}`,
        body: `
${t('driver.issueType')}: ${formData.issueType}
${t('driver.urgency')}: ${formData.urgency}
${t('common.reportedBy')}: ${user.full_name} (${user.email})

${t('driver.description')}:
${formData.description}
        `
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl("Driver"));
      }, 2000);
    } catch (error) {
      console.error("Error submitting issue:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Driver"))}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('driver.reportIssue')}</h1>
            <p className="text-gray-600">{t('driver.reportIssueDesc')}</p>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t('driver.reportIssue')}
            </CardTitle>
            <CardDescription className="text-amber-100">
              {t('driver.reportIssueDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {success ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-900 mb-2">{t('driver.issueReported')}</h3>
                <p className="text-green-700 mb-6">{t('driver.supportWillContact')}</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
                  <div className="flex items-center justify-center gap-2 text-green-800">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">{t('driver.navigation.emergencyContact')}: +387 61 234 567</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">
                      {t('driver.issueType')}
                    </label>
                    <Select
                      value={formData.issueType}
                      onValueChange={(value) => setFormData({...formData, issueType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('driver.selectIssueType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">{t('issues.technical')}</SelectItem>
                        <SelectItem value="navigation">{t('issues.navigation')}</SelectItem>
                        <SelectItem value="customer">{t('issues.customer')}</SelectItem>
                        <SelectItem value="safety">{t('issues.safety')}</SelectItem>
                        <SelectItem value="other">{t('issues.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">
                      {t('driver.urgency')}
                    </label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(value) => setFormData({...formData, urgency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('driver.selectUrgency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('urgency.low')}</SelectItem>
                        <SelectItem value="medium">{t('urgency.medium')}</SelectItem>
                        <SelectItem value="high">{t('urgency.high')}</SelectItem>
                        <SelectItem value="critical">{t('urgency.critical')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700">
                    {t('driver.issueTitle')}
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder={t('driver.issueTitlePlaceholder')}
                    required
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700">
                    {t('driver.description')}
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder={t('driver.issueDescriptionPlaceholder')}
                    required
                    className="h-32 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => navigate(createPageUrl("Driver"))}
                    className="flex-1"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-amber-600 hover:bg-amber-700" 
                    disabled={loading}
                  >
                    {loading ? t('common.submitting') : t('driver.submitIssue')}
                  </Button>
                </div>

                {/* Emergency Contact */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-semibold">{t('driver.navigation.emergencyContact')}</span>
                  </div>
                  <p className="text-red-700 text-sm mb-3">
                    {t('emergency.description')}
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => window.open('tel:+38761234567')}
                  >
                    {t('driver.navigation.callSupport')} +387 61 234 567
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}