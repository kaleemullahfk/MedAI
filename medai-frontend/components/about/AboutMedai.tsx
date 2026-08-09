"use client";

import {
  Info,
  HeartPulse,
  Stethoscope,
  Users,
  CalendarCheck,
  FileText,
  Pill,
  Bot,
  Activity,
  BookOpen,
  Brain,
  ShieldCheck,
  UserCog,
  Database,
  Server,
  Microchip,
  ClipboardList,
  MessageCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Software information (real values from the project)
// ---------------------------------------------------------------------------
const SOFTWARE = {
  name: "MEDAI",
  version: "1.0.0",
  platform: "Web Application",
  category: "Healthcare / Artificial Intelligence",
  purpose: "Digital Healthcare Management & AI Assistance",
  status: "Active Development",
  type: "AI-Powered Healthcare Management Platform",
};

const DESCRIPTION =
  "MEDAI is an AI-powered healthcare platform designed to connect patients, doctors, and administrators through a unified digital healthcare environment. The platform provides appointment management, medical report handling, prescription management, AI-powered healthcare assistance, and intelligent medical analysis.";

const FEATURES = [
  { label: "Patient Management", icon: Users },
  { label: "Doctor Management", icon: Stethoscope },
  { label: "Appointment Booking", icon: CalendarCheck },
  { label: "Medical Reports", icon: FileText },
  { label: "Digital Prescriptions", icon: Pill },
  { label: "AI Medical Chatbot", icon: Bot },
  { label: "AI Symptom Checker", icon: Activity },
  { label: "AI Disease Explanation", icon: BookOpen },
  { label: "AI Medicine Recommendation", icon: Brain },
  { label: "AI Prescription Analyzer", icon: ClipboardList },
  { label: "AI Medical Report Analysis", icon: FileText },
  { label: "Role-Based Dashboards", icon: UserCog },
  { label: "Secure User Management", icon: ShieldCheck },
];

// Technologies actually used (verified from package.json + requirements.txt).
const TECHNOLOGIES = [
  { label: "Next.js 16", icon: Server },
  { label: "React 19", icon: Server },
  { label: "TypeScript", icon: Server },
  { label: "Tailwind CSS", icon: Server },
  { label: "Axios", icon: Server },
  { label: "FastAPI", icon: Server },
  { label: "Python", icon: Server },
  { label: "PostgreSQL", icon: Database },
  { label: "SQLAlchemy", icon: Database },
  { label: "Alembic", icon: Database },
  { label: "Groq LLM", icon: Microchip },
  { label: "Tesseract OCR", icon: Microchip },
  { label: "PyMuPDF", icon: Microchip },
  { label: "JWT / Bcrypt", icon: ShieldCheck },
];

const ROLES = [
  { label: "Administrator", icon: UserCog, color: "text-amber-400" },
  { label: "Doctor", icon: Stethoscope, color: "text-teal-400" },
  { label: "Patient", icon: Users, color: "text-blue-400" },
];

const WHATSAPP_URL = "https://wa.me/923121356624";
const FACEBOOK_URL = "https://www.facebook.com/share/1Bo2W51j3B/";

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/15 text-blue-600">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h2>
  );
}

export function AboutMedai() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <HeartPulse className="h-9 w-9" />
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          About MEDAI
        </h1>
        <p className="mt-1 text-muted-foreground">AI-Powered Healthcare Platform</p>
      </div>

      {/* Software Information card */}
      <section className="rounded-2xl bg-card p-6 shadow ring-1 ring-foreground/10 transition hover:shadow-lg">
        <SectionTitle icon={Info}>Software Information</SectionTitle>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ["Software", SOFTWARE.name],
            ["Version", SOFTWARE.version],
            ["Platform", SOFTWARE.platform],
            ["Category", SOFTWARE.category],
            ["Purpose", SOFTWARE.purpose],
            ["Status", SOFTWARE.status],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-start justify-between gap-4 rounded-lg border px-4 py-3"
            >
              <dt className="text-sm font-medium text-muted-foreground">{k}</dt>
              <dd className="text-right text-sm font-semibold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Description */}
      <section className="rounded-2xl bg-card p-6 shadow ring-1 ring-foreground/10 transition hover:shadow-lg">
        <SectionTitle icon={Info}>About MEDAI</SectionTitle>
        <p className="leading-7 text-muted-foreground">{DESCRIPTION}</p>
      </section>

      {/* Core Features */}
      <section className="rounded-2xl bg-card p-6 shadow ring-1 ring-foreground/10 transition hover:shadow-lg">
        <SectionTitle icon={ClipboardList}>Core Features</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 transition hover:bg-muted/50"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-600">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-foreground">{f.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* User Roles */}
      <section className="rounded-2xl bg-card p-6 shadow ring-1 ring-foreground/10 transition hover:shadow-lg">
        <SectionTitle icon={Users}>User Roles</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.label}
                className="flex flex-col items-center gap-2 rounded-xl border p-6 text-center transition hover:bg-muted/50"
              >
                <Icon className={cn("h-10 w-10", r.color)} />
                <span className="font-semibold text-foreground">{r.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="rounded-2xl bg-card p-6 shadow ring-1 ring-foreground/10 transition hover:shadow-lg">
        <SectionTitle icon={Server}>Technology Stack</SectionTitle>
        <div className="flex flex-wrap gap-2.5">
          {TECHNOLOGIES.map((t) => {
            const Icon = t.icon;
            return (
              <span
                key={t.label}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-blue-500 hover:bg-blue-600/10"
              >
                <Icon className="h-4 w-4 text-blue-600" />
                {t.label}
              </span>
            );
          })}
        </div>
      </section>

      {/* Contact Information */}
      <section className="rounded-2xl bg-card p-6 shadow ring-1 ring-foreground/10 transition hover:shadow-lg">
        <SectionTitle icon={MessageCircle}>Contact Information</SectionTitle>

        <div className="space-y-6">
          {/* Owner */}
          <div className="flex flex-col items-start gap-4 rounded-xl border p-6 sm:flex-row sm:items-center">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600/15 text-xl font-bold text-blue-600">
              K
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">Kaleemullah Shaikh</p>
              <p className="text-sm text-muted-foreground">Project Owner</p>
              <p className="text-sm text-muted-foreground">{SOFTWARE.name}</p>
            </div>
          </div>

          {/* WhatsApp + Facebook */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact MEDAI on WhatsApp"
              className="group flex items-center gap-4 rounded-xl border p-5 transition hover:border-green-500/60 hover:bg-green-600/10 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-600/15 text-green-500">
                <MessageCircle className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm font-bold text-foreground">WhatsApp</span>
                <span className="block text-sm text-muted-foreground">
                  Chat with us on WhatsApp
                </span>
              </span>
            </a>

            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit MEDAI on Facebook"
              className="group flex items-center gap-4 rounded-xl border p-5 transition hover:border-blue-500/60 hover:bg-blue-600/10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-500">
                {/* Facebook "f" */}
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-bold text-foreground">Facebook</span>
                <span className="block text-sm text-muted-foreground">
                  Visit us on Facebook
                </span>
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}