"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Users, CalendarDays, Loader2, ShieldAlert } from "lucide-react";

import { getAdminStats, getAdminUsers, toggleUserActive } from "@/services/admin";
import { toApiError } from "@/services/api";
import type { AdminStats } from "@/services/admin";
import type { User } from "@/types/auth";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then((statsData) => {
        if (!cancelled) setStats(statsData);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    getAdminUsers()
      .then((usersData) => {
        if (!cancelled) setUsers(usersData);
      })
      .catch(() => {
        // error state already handled above
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (userId: number) => {
    setTogglingId(userId);
    setError(null);
    try {
      const updated = await toggleUserActive(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setTogglingId(null);
    }
  };

  const statCards = stats
    ? [
        { label: "Doctors", value: stats.doctors, icon: Stethoscope },
        { label: "Patients", value: stats.patients, icon: Users },
        { label: "Appointments", value: stats.appointments, icon: CalendarDays },
      ]
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full h-32 animate-pulse rounded-xl bg-muted" />
        ) : (
          statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="flex items-center gap-4 rounded-2xl bg-card p-6 shadow-lg ring-1 ring-foreground/10"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-600">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-foreground/10">
        <div className="flex items-center gap-2 border-b p-6">
          <ShieldAlert className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-bold">Users</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left" scope="col">ID</th>
                <th className="p-4 text-left" scope="col">Name</th>
                <th className="p-4 text-left" scope="col">Email</th>
                <th className="p-4 text-left" scope="col">Role</th>
                <th className="p-4 text-left" scope="col">Status</th>
                <th className="p-4 text-left" scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="p-4">{user.id}</td>
                  <td className="p-4 font-medium">{user.full_name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4 capitalize">{user.role}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {user.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggle(user.id)}
                      disabled={togglingId === user.id}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                    >
                      {togglingId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.is_active ? (
                        "Disable"
                      ) : (
                        "Enable"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
