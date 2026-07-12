"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui";
import { Calendar, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createBooking } from "@/app/actions/bookings";
import Link from "next/link";

interface NewBookingFormProps {
  bookableAssets: any[];
  initialBookings: any[];
}

export default function NewBookingForm({ bookableAssets, initialBookings }: NewBookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [assetId, setAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!assetId) {
      toast.error("Please select a resource to book.");
      return;
    }

    const formData = new FormData();
    formData.append("assetId", assetId);
    formData.append("title", title);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);

    startTransition(async () => {
      const res = await createBooking(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Resource booked successfully!");
        router.push("/bookings");
        router.refresh();
      }
    });
  };

  // Find bookings of the currently selected asset to show in conflict helper
  const selectedAssetBookings = initialBookings.filter(
    (b) => b.assetId === assetId
  );

  return (
    <div className="space-y-6">
      {/* Back button and page header */}
      <div className="flex items-center gap-4">
        <Link href="/bookings">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Bookings
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Book a Resource</h1>
          <p className="text-sm text-muted-foreground">Reserve a room, vehicle, or specialized equipment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Reservation Form</CardTitle>
            <CardDescription>Enter details to reserve the resource</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Select Resource / Asset <span className="text-destructive">*</span>
                </label>
                <Select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  options={[
                    { value: "", label: "Choose an asset to reserve..." },
                    ...bookableAssets.map((a) => ({
                      value: a.id,
                      label: `${a.name} (${a.assetTag} - ${a.location})`,
                    })),
                  ]}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Booking Title <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Design Sync / Client Presentation / Project Field Trip"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Start Time <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    End Time <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Link href="/bookings">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Existing Reservations Sidebar / Conflict Helper */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Active Reservations
            </CardTitle>
            <CardDescription>
              Check scheduled times to avoid conflicts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!assetId ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-xs font-medium">Select a resource to view its current reservation schedule.</p>
              </div>
            ) : selectedAssetBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <p className="text-xs font-semibold text-success mb-1">No Active Reservations</p>
                <p className="text-2xs text-muted-foreground/80">This resource has no scheduled bookings. You can reserve any slot!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {selectedAssetBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs space-y-1"
                  >
                    <div className="font-semibold text-foreground truncate">{b.title}</div>
                    <div className="text-3xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(b.startTime).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(b.endTime).toLocaleString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-3xs text-muted-foreground/80 font-medium">
                      Booker: {b.user?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
