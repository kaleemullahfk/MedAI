"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { loginUser, getCurrentUser } from "@/services/auth";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      // Login API
      const login = await loginUser(email, password);

      // Save JWT Token
      localStorage.setItem("token", login.access_token);

      // Get Logged-in User
      const user = await getCurrentUser();

      // Redirect Based on Role
      if (user.role === "doctor") {
        router.push("/doctor");
      } else if (user.role === "patient") {
        router.push("/patient");
      } else if (user.role === "admin") {
        router.push("/admin");
      } else {
        alert("Unknown user role.");
      }
    }
      catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error
        ) {
          const err = error as {
            response?: {
              data?: {
                detail?: string;
              };
            };
          };

          alert(
            err.response?.data?.detail ||
            "Invalid Email or Password"
          );
        } else {
          alert("Invalid Email or Password");
        }
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-[420px] p-8 space-y-5 shadow-xl">
        <h1 className="text-3xl font-bold text-center">
          🩺 MEDAI
        </h1>

        <p className="text-center text-gray-500">
          AI Powered Healthcare Platform
        </p>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>

          <Input
            id="email"
            type="email"
            placeholder="doctor@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>

          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleLogin}
        >
          Login
        </Button>
      </Card>
    </div>
  );
}