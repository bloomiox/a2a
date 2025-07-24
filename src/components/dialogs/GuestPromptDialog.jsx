import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, CheckCircle2 } from "lucide-react";

export default function GuestPromptDialog({ 
  isOpen, 
  onClose, 
  onContinueAsGuest,
  tour
}) {
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    try {
      await User.login();
      onClose();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create an account to save your progress</DialogTitle>
          <DialogDescription>
            You're exploring {tour?.title || "this tour"} as a guest. Sign up or log in to:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            <span>Track your progress as you explore</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            <span>Save tours for offline access</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            <span>Create and share your own tours</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            <span>Receive personalized tour recommendations</span>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onContinueAsGuest}
          >
            Continue as Guest
          </Button>
          <Button 
            className="flex-1 gap-2"
            onClick={handleLogin}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}