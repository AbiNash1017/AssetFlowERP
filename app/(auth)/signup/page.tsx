"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { signupSchema } from "@/lib/validations/auth";
import { THEME } from "@/lib/constants/styles";
import { toast } from "sonner";
import { KeyRound, Mail, User, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";

const AVATAR_STYLES = [
  { id: "lorelei", label: "Illustrated" },
  { id: "adventurer", label: "Adventure" },
  { id: "bottts", label: "Robots" },
  { id: "fun-emoji", label: "Emoji" },
];

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // DiceBear Avatar States
  const [avatarStyle, setAvatarStyle] = useState("lorelei");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Initialize random seed on mount
  useEffect(() => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  }, []);

  // Update avatar URL when style or seed changes
  useEffect(() => {
    if (avatarSeed) {
      setAvatarUrl(`https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${avatarSeed}`);
    }
  }, [avatarStyle, avatarSeed]);

  const handleRandomizeAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validate using Zod
    const validation = signupSchema.safeParse({ name, email, password });
    if (!validation.success) {
      const fieldErrors: typeof errors = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0] === "name") fieldErrors.name = err.message;
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await signUp.email({
        name,
        email,
        password,
        image: avatarUrl,
        callbackURL: "/login",
      });

      if (response?.error) {
        toast.error(response.error.message || "Failed to create account.");
      } else {
        toast.success("Account created successfully! Please sign in.");
        router.push("/login");
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* Left panel: Decorative / Branding */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-primary px-6 py-12 text-white lg:w-1/2 xl:w-7/12 lg:px-12 lg:py-24">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Glow effect */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-secondary/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-teal-brand/20 blur-3xl"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
            <ShieldCheck className="h-6 w-6 text-secondary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AssetFlow</span>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6 py-12 lg:py-0">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl leading-tight">
            Register your <br />
            <span className="text-secondary">Employee Account</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Join the AssetFlow platform to view allocated items, book shared workspaces/devices, and report asset maintenance issues easily.
          </p>

          {/* User-friendly rules highlight */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md space-y-3">
            <h4 className="font-bold text-sm text-secondary flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Role Assignment Policy
            </h4>
            <p className="text-xs text-white/70 leading-relaxed">
              To maintain system integrity, new user registrations are default-assigned the <strong>Employee</strong> role. Promoting employees to <strong>Asset Manager</strong> or <strong>Department Head</strong> must be performed manually by a System Administrator.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          &copy; {new Date().getFullYear()} AssetFlow. All rights reserved.
        </div>
      </div>

      {/* Right panel: Signup Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 lg:px-20 xl:px-24 bg-card">
        <div className="mx-auto w-full max-w-sm">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Sign Up</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:text-primary/80 underline decoration-2 underline-offset-4">
                Sign in to your account
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Avatar Selection Section */}
              <div className="rounded-xl border border-border p-4 bg-muted/30 space-y-3">
                <span className="block text-sm font-semibold text-foreground">Choose Profile Avatar</span>
                
                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative h-16 w-16 shrink-0 rounded-full border border-border bg-card overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Style selector */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {AVATAR_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setAvatarStyle(style.id)}
                          className={`text-xs py-1 px-2 rounded-md border text-center font-medium transition-all ${
                            avatarStyle === style.id
                              ? "bg-primary border-primary text-primary-foreground shadow-sm"
                              : "bg-card border-border text-foreground hover:bg-accent"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>

                    {/* Randomize button */}
                    <button
                      type="button"
                      onClick={handleRandomizeAvatar}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Randomize Seed</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-foreground">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${THEME.classes.input} pl-10 ${errors.name ? "border-destructive ring-1 ring-destructive" : ""}`}
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive font-medium">
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${THEME.classes.input} pl-10 ${errors.email ? "border-destructive ring-1 ring-destructive" : ""}`}
                    placeholder="you@company.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive font-medium">
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                  Password
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${THEME.classes.input} pl-10 pr-10 ${errors.password ? "border-destructive ring-1 ring-destructive" : ""}`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive font-medium">
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`${THEME.classes.btnPrimary} w-full flex items-center justify-center gap-2 py-2.5 mt-2`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
