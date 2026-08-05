"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  Loader2,
  ShieldAlert,
  Trash2,
  KeyRound,
  Pencil,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  getAdminUsers,
  createAdminUser,
  toggleUserActive,
  deleteUser,
  resetUserPassword,
} from "@/services/admin";
import { toApiError } from "@/services/api";
import type { User } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

const createUserSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["patient", "doctor", "admin"]),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const roleStyles: Record<string, string> = {
  patient: "bg-blue-100 text-blue-700",
  doctor: "bg-emerald-100 text-emerald-700",
  admin: "bg-violet-100 text-violet-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = () => {
    getAdminUsers()
      .then(setUsers)
      .catch((err) => setError(toApiError(err).message));
  };

  useEffect(() => {
    let cancelled = false;
    getAdminUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { full_name: "", email: "", password: "", role: "patient" },
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesTerm =
        !term ||
        u.full_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      return matchesRole && matchesTerm;
    });
  }, [users, search, roleFilter]);

  const onCreate = async (values: CreateUserForm) => {
    try {
      const created = await createAdminUser(values);
      toast.success(`${created.full_name} created as ${created.role}.`);
      setUsers((prev) => (prev ? [...prev, created] : [created]));
      setShowCreate(false);
      reset();
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const onToggle = async (user: User) => {
    setBusyId(user.id);
    setError(null);
    try {
      const updated = await toggleUserActive(user.id);
      setUsers((prev) => prev?.map((u) => (u.id === user.id ? updated : u)) ?? prev);
      toast.success(`${updated.full_name} ${updated.is_active ? "enabled" : "disabled"}.`);
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (user: User) => {
    if (!confirm(`Delete ${user.full_name}? This cannot be undone.`)) return;
    setBusyId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev?.filter((u) => u.id !== user.id) ?? prev);
      toast.success(`${user.full_name} deleted.`);
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const onResetPassword = async (user: User) => {
    const next = prompt(`Enter a new password for ${user.full_name} (min 8 chars):`);
    if (!next) return;
    if (next.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setResetting(true);
    try {
      await resetUserPassword(user.id, next);
      toast.success(`Password reset for ${user.full_name}.`);
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setResetting(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage all patients, doctors, and admins.
          </p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)}>
          <UserPlus className="h-4 w-4" />
          {showCreate ? "Cancel" : "Add User"}
        </Button>
      </div>

      {/* Create user form */}
      {showCreate && (
        <Card className="p-6">
          <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 sm:grid-cols-2" noValidate>
            <div className="space-y-2">
              <Label htmlFor="nu-full_name">Full name</Label>
              <Input id="nu-full_name" placeholder="e.g. Ali Khan" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nu-email">Email</Label>
              <Input id="nu-email" type="email" placeholder="user@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nu-password">Password</Label>
              <Input id="nu-password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nu-role">Role</Label>
              <select
                id="nu-role"
                className="w-full rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("role")}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </span>
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="w-full rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-44"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      {users === null ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="No users found"
          description={search || roleFilter !== "all" ? "Try a different search or filter." : "Create your first user to get started."}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card shadow ring-1 ring-foreground/10">
          <table className="w-full min-w-max">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left" scope="col">ID</th>
                <th className="p-4 text-left" scope="col">Name</th>
                <th className="p-4 text-left" scope="col">Email</th>
                <th className="p-4 text-left" scope="col">Role</th>
                <th className="p-4 text-left" scope="col">Status</th>
                <th className="p-4 text-left" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="p-4">{user.id}</td>
                  <td className="p-4 font-medium">{user.full_name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyles[user.role] ?? "bg-gray-100 text-gray-700"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.is_active ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {user.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggle(user)}
                        disabled={busyId === user.id}
                        className="rounded-md p-2 hover:bg-muted disabled:opacity-50"
                        title={user.is_active ? "Disable" : "Enable"}
                        aria-label={`${user.is_active ? "Disable" : "Enable"} ${user.full_name}`}
                      >
                        {busyId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pencil className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onResetPassword(user)}
                        disabled={resetting}
                        className="rounded-md p-2 hover:bg-muted disabled:opacity-50"
                        title="Reset password"
                        aria-label={`Reset password for ${user.full_name}`}
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(user)}
                        disabled={busyId === user.id}
                        className="rounded-md p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        title="Delete user"
                        aria-label={`Delete ${user.full_name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
