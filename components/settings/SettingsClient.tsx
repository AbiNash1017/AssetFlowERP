"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Input, Select, Button } from "@/components/ui";
import { updateUserProfile } from "@/app/actions/user-profile";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { RefreshCw, User, Lock, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SettingsClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

const AVATAR_STYLES = [
  { id: "lorelei", label: "Illustrated" },
  { id: "adventurer", label: "Adventure" },
  { id: "bottts", label: "Robots" },
  { id: "fun-emoji", label: "Emoji" },
];

export default function SettingsClient({ currentUser }: SettingsClientProps) {
  const router = useRouter();

  // Profile States
  const [name, setName] = useState(currentUser.name);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // DiceBear Avatar States
  const [avatarStyle, setAvatarStyle] = useState("lorelei");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.image || "");

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Initialize seed from existing image URL or generate a fresh one
  useEffect(() => {
    if (currentUser.image && currentUser.image.includes("dicebear.com")) {
      try {
        const url = new URL(currentUser.image);
        const pathSegments = url.pathname.split("/");
        const style = pathSegments[pathSegments.length - 2];
        const seed = url.searchParams.get("seed");
        if (style && seed) {
          setAvatarStyle(style);
          setAvatarSeed(seed);
        }
      } catch (e) { /* ignore */ }
    } else {
      // No image yet — generate a default one and auto-apply it
      const initialSeed = Math.random().toString(36).substring(7);
      setAvatarSeed(initialSeed);
      const url = `https://api.dicebear.com/9.x/lorelei/svg?seed=${initialSeed}`;
      setAvatarUrl(url);
    }
  }, []);

  // Update avatar URL when style or seed changes
  const handleStyleChange = (style: string) => {
    setAvatarStyle(style);
    const seed = avatarSeed || Math.random().toString(36).substring(7);
    if (!avatarSeed) setAvatarSeed(seed);
    setAvatarUrl(`https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`);
  };

  const handleRandomizeAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatarSeed(seed);
    setAvatarUrl(`https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${seed}`);
  };

  // Handle Profile Update — uses server action to write directly to DB
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateUserProfile(name, avatarUrl || null);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Profile updated! Avatar is now visible across the app.");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      });

      if (res?.error) {
        toast.error(res.error.message || "Failed to change password. Make sure your current password is correct.");
      } else {
        toast.success("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-all hover:bg-muted cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User Account / Settings</span>
          <h1 className="text-2xl font-extrabold text-foreground mt-0.5">Account Settings</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-primary" /> Profile Specifications
            </CardTitle>
            <CardDescription>Customize your display name and visual avatar credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar Picker UI */}
              <div className="flex flex-col items-center sm:flex-row gap-5 p-4 rounded-xl border border-border bg-muted/20">
                <div className="relative h-20 w-20 rounded-full border border-border bg-card overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-bold text-2xl text-primary bg-primary/10">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 flex-1 w-full">
                  <Select
                    label="Avatar Style"
                    value={avatarStyle}
                    onChange={(e) => handleStyleChange(e.target.value)}
                    options={AVATAR_STYLES.map(style => ({ value: style.id, label: style.label }))}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRandomizeAvatar}
                    className="w-full flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Randomize Avatar
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Email Address (Locked)"
                  value={currentUser.email}
                  disabled
                  readOnly
                  hint="Email updates must be processed through system administrators."
                />

                <Input
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Abinash Das"
                  required
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isSavingProfile} className="w-full flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? "Saving Profile..." : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-primary" /> Security & Passwords
            </CardTitle>
            <CardDescription>Update your login credentials to secure your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                hint="Must be at least 8 characters long."
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              
              <div className="pt-6">
                <Button type="submit" disabled={isSavingPassword} className="w-full flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  {isSavingPassword ? "Updating Password..." : "Change Login Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
