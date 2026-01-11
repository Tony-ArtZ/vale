"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const { register, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, email, password);
      router.push("/");
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#02040a]">
      {/* Deep Space Atmosphere */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-[#02040a] to-[#02040a]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-sm p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light tracking-wide text-white">
            Begin Journey
          </h1>
          <p className="text-xs text-blue-200/40 mt-2 uppercase tracking-widest">
            Create your profile
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl mb-6 text-xs text-center flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-blue-200/50 pl-1">
              Name
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="bg-black/20 border-white/5 focus:border-blue-500/50 focus:bg-black/40 rounded-xl h-12 text-sm transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-blue-200/50 pl-1">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="bg-black/20 border-white/5 focus:border-blue-500/50 focus:bg-black/40 rounded-xl h-12 text-sm transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-blue-200/50 pl-1">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-black/20 border-white/5 focus:border-blue-500/50 focus:bg-black/40 rounded-xl h-12 text-sm transition-all"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-12 rounded-xl mt-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register"}
          </Button>

          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-[#0b0c15] px-2 text-white/20">
                Access Options
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-white/10 text-blue-100/60 hover:bg-white/5 hover:text-white rounded-xl h-11 text-xs font-normal relative"
            onClick={() =>
              (window.location.href = "http://localhost:8080/auth/google")
            }
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
              />
            </svg>
            Continue with Google
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-blue-200/30">
          Already enlisted?{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline underline-offset-4"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
