"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";

import { bookAppointment } from "@/services/patient";
import { getDoctors, type DoctorListItem } from "@/services/doctors";
import { toApiError } from "@/services/api";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const appointmentSchema = z
  .object({
    doctor_id: z.string().min(1, "Select a doctor"),
    appointment_date: z.string().min(1, "Choose a date"),
    appointment_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use 24h format, e.g. 14:30"),
    reason: z.string().max(500, "Reason is too long"),
  })
  .refine(
    (data) => {
      if (!data.appointment_date) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(data.appointment_date) >= today;
    },
    { message: "Cannot book for a past date", path: ["appointment_date"] },
  );

type AppointmentForm = z.infer<typeof appointmentSchema>;

export default function BookAppointment() {
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctor_id: "",
      appointment_date: "",
      appointment_time: "",
      reason: "",
    },
  });

  useEffect(() => {
    getDoctors()
      .then(setDoctors)
      .catch(() => toast.error("Could not load the doctor list."))
      .finally(() => setLoadingDoctors(false));
  }, []);

  const onSubmit = async (values: AppointmentForm) => {
    try {
      await bookAppointment({
        doctor_id: Number(values.doctor_id),
        appointment_date: values.appointment_date,
        appointment_time: values.appointment_time,
        reason: values.reason,
      });
      toast.success("Appointment booked successfully.");
      reset();
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <Card className="max-w-2xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Book Appointment</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="doctor_id">Doctor</Label>
          <select
            id="doctor_id"
            disabled={loadingDoctors}
            aria-invalid={!!errors.doctor_id}
            className="w-full rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            {...register("doctor_id")}
          >
            <option value="">
              {loadingDoctors ? "Loading doctors…" : "Select a doctor"}
            </option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.user?.full_name ?? `Doctor #${doctor.id}`} —{" "}
                {doctor.specialization} ({doctor.hospital})
              </option>
            ))}
          </select>
          {errors.doctor_id && (
            <p className="text-sm text-destructive">{errors.doctor_id.message}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appointment_date">Date</Label>
            <Input
              id="appointment_date"
              type="date"
              aria-invalid={!!errors.appointment_date}
              {...register("appointment_date")}
            />
            {errors.appointment_date && (
              <p className="text-sm text-destructive">
                {errors.appointment_date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment_time">Time (24h)</Label>
            <Input
              id="appointment_time"
              type="time"
              aria-invalid={!!errors.appointment_time}
              {...register("appointment_time")}
            />
            {errors.appointment_time && (
              <p className="text-sm text-destructive">
                {errors.appointment_time.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Input
            id="reason"
            placeholder="Briefly describe your visit"
            {...register("reason")}
          />
          {errors.reason && (
            <p className="text-sm text-destructive">{errors.reason.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting || loadingDoctors}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Booking…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Book Appointment
            </span>
          )}
        </Button>
      </form>
    </Card>
  );
}
