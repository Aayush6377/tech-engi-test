"use client";

import { useAuth } from "@/hooks/useAuth";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { LucideLoader } from "lucide-react";
import { useEffect, useState } from "react";

interface User {
  name: string;
  email: string;
}

export default function Profile() {
  const { user } = useAuth() as { user: User };
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = localStorage.getItem("user");

      // const res = await fetch("/api/user", {
      //   credentials: "include"
      // });

      if (res) {
        await JSON.parse(res);
      }
    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData: Record<string, any>) => {
    try {
      const res = await fetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedData)
      });

      if (res.ok) {
        await res.json();
      }
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="w-full h-[50vh] flex justify-center items-center">
      <LucideLoader className='animate-spin text-[var(--primary)]' size={40} />
    </div>
  )
  if (!user) return <p>No user found</p>;

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        <div className="space-y-6">
          <UserMetaCard user={user} onUpdate={updateProfile} />

          <UserInfoCard user={user} onUpdate={updateProfile} />

          <UserAddressCard user={user} />
        </div>
      </div>
    </div>
  );
}
