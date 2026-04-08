"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  Briefcase,
  KeyRound,
  ArrowLeft
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CLIENT" | "ENGINEER">("CLIENT");
  
  const [otpCode, setOtpCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Register the user
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok || !registerData.success) {
        throw new Error(registerData.message || "Registration failed");
      }

      // Send the OTP
      const otpRes = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "VERIFY_EMAIL" }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok || !otpData.success) {
        throw new Error("Account created, but failed to send OTP email.");
      }

      setSuccessMsg("We've sent a 6-digit code to your email.");
      setStep(2);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      setIsLoading(false);
      return;
    }

    try {
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, type: "VERIFY_EMAIL" }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || "Invalid OTP code");
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        throw new Error("Verified, but failed to log in automatically.");
      }

      if (role === "ENGINEER") {
        router.push("/form/engineer");
      } else {
        router.push("/form/client");
      }
      router.refresh();

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      document.cookie = `oauth_role=${role}; path=/; max-age=120`;
      await signIn("google", { callbackUrl: "/" });
    } catch (err: any) {
      setError("Google sign in failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10">
        
        {/* Step 1: Registration Form */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[#f0b31e] shadow-lg shadow-yellow-500/30 mx-auto mb-4">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
                Create Account
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                Join our platform to get started
              </p>
            </div>

            {/* Role Tabs */}
            <div className="flex p-1 mb-6 bg-gray-50 rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => setRole("CLIENT")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  role === "CLIENT"
                    ? "bg-white text-[#f0b31e] shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole("ENGINEER")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  role === "ENGINEER"
                    ? "bg-white text-[#f0b31e] shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Engineer
              </button>
            </div>

            {error && (
              <div className="mb-6 text-red-500 text-sm font-medium text-center bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-[#f0b31e] focus:ring-1 focus:ring-[#f0b31e] outline-none transition-all text-sm text-black"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-[#f0b31e] focus:ring-1 focus:ring-[#f0b31e] outline-none transition-all text-sm text-black"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 h-12 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-[#f0b31e] focus:ring-1 focus:ring-[#f0b31e] outline-none transition-all text-sm text-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#f0b31e] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-4 bg-[#f0b31e] hover:bg-[#e0a61a] text-white rounded-xl text-base font-semibold shadow-md shadow-yellow-500/20 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 text-xs uppercase tracking-wider font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-[#f0b31e] font-semibold hover:underline">
                  Log In
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification Form */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <button 
              onClick={() => setStep(1)}
              className="absolute top-6 left-6 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="text-center mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-blue-50 shadow-lg shadow-blue-500/10 mx-auto mb-4">
                <KeyRound className="h-7 w-7 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
                Check Your Email
              </h1>
              <p className="text-gray-500 mt-2 text-sm px-4">
                {successMsg}
              </p>
            </div>

            {error && (
              <div className="mb-6 text-red-500 text-sm font-medium text-center bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">6-Digit OTP Code</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.5em] text-lg font-bold h-14 rounded-xl border border-gray-200 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-base font-semibold shadow-md transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Continue"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}