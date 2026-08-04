"use client";

import { useState } from "react";

import { bookAppointment } from "@/services/patient";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function BookAppointment() {
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    try {
      await bookAppointment({
        doctor_id: Number(doctorId),
        appointment_date: date,
        appointment_time: time,
        reason,
      });

      alert("Appointment Booked Successfully");

      setDoctorId("");
      setDate("");
      setTime("");
      setReason("");

    } catch (error) {
      console.error(error);
      alert("Booking Failed");
    }
  };

  return (
    <Card className="max-w-2xl p-8 space-y-6">

      <h1 className="text-3xl font-bold">
        Book Appointment
      </h1>

      <div className="space-y-2">
        <Label>Doctor ID</Label>

        <Input
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          placeholder="Enter Doctor ID"
        />
      </div>

      <div className="space-y-2">
        <Label>Date</Label>

        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Time</Label>

        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Reason</Label>

        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason"
        />
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full"
      >
        Book Appointment
      </Button>

    </Card>
  );
}