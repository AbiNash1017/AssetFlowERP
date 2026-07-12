"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Badge, Modal, ModalFooter, Card, CardHeader, CardTitle, CardContent, Tabs } from "@/components/ui";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, List, Plus, ChevronLeft, ChevronRight, X, Clock, Calendar, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cancelBooking, rescheduleBooking } from "@/app/actions/bookings";

interface BookingsClientProps {
  initialBookings: any[];
  bookableAssets: any[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function BookingsClient({ initialBookings, bookableAssets, currentUser }: BookingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());

  // Booking detail / Reschedule modal states
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    startTransition(async () => {
      const res = await cancelBooking(bookingId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Booking cancelled successfully.");
        setDetailModalOpen(false);
        router.refresh();
      }
    });
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    startTransition(async () => {
      const res = await rescheduleBooking(selectedBooking.id, newStartTime, newEndTime);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Booking rescheduled successfully.");
        setRescheduleModalOpen(false);
        setDetailModalOpen(false);
        router.refresh();
      }
    });
  };

  // Filter logic
  const filteredBookings = initialBookings.filter((b) => {
    const matchesAsset = selectedAssetId === "ALL" || b.assetId === selectedAssetId;
    const matchesStatus = selectedStatus === "ALL" || b.status === selectedStatus;
    return matchesAsset && matchesStatus;
  });

  // Calendar rendering helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: firstDayIndex }, (_, i) => null);
  const calendarCells = [...emptyCells, ...daysArray];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "asset",
      header: "Resource",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-foreground">{row.original.asset?.name}</span>
          <div className="text-3xs text-muted-foreground font-mono">{row.original.asset?.assetTag}</div>
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Booking Title",
      cell: ({ row }) => <span className="font-medium text-foreground">{row.getValue("title")}</span>,
    },
    {
      accessorKey: "user",
      header: "Booked By",
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium">{row.original.user?.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.user?.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "startTime",
      header: "Start Time",
      cell: ({ row }) => <span className="font-mono text-xs">{new Date(row.getValue("startTime")).toLocaleString()}</span>,
    },
    {
      accessorKey: "endTime",
      header: "End Time",
      cell: ({ row }) => <span className="font-mono text-xs">{new Date(row.getValue("endTime")).toLocaleString()}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        const colorMap: Record<string, "success" | "secondary" | "destructive" | "outline" | "default"> = {
          UPCOMING: "secondary",
          ONGOING: "success",
          COMPLETED: "default",
          CANCELLED: "destructive",
        };
        return <Badge variant={colorMap[val] || "outline"}>{val}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const b = row.original;
        const isOwner = b.userId === currentUser.id;
        const isManager = ["ASSET_MANAGER", "ADMIN"].includes(currentUser.role);
        const canCancel = b.status === "UPCOMING" && (isOwner || isManager);

        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBooking(b);
                setNewStartTime(new Date(b.startTime).toISOString().slice(0, 16));
                setNewEndTime(new Date(b.endTime).toISOString().slice(0, 16));
                setDetailModalOpen(true);
              }}
            >
              Details
            </Button>
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleCancelBooking(b.id)}
              >
                Cancel
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and New Booking Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Resource Bookings</h1>
          <p className="text-muted-foreground">Book and manage shared assets, conference rooms, and equipment</p>
        </div>
        <Link href="/bookings/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Book a Slot
          </Button>
        </Link>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Filter by Resource
              </label>
              <Select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                options={[
                  { value: "ALL", label: "All Bookable Resources" },
                  ...bookableAssets.map((a) => ({
                    value: a.id,
                    label: `${a.name} (${a.assetTag})`,
                  })),
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Filter by Status
              </label>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: "ALL", label: "All Booking Statuses" },
                  { value: "UPCOMING", label: "Upcoming" },
                  { value: "ONGOING", label: "Ongoing" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Conflicts Alert Section */}
      {(() => {
        const activeBookings = initialBookings.filter(b => b.status === "UPCOMING" || b.status === "ONGOING");
        const conflicts: { b1: any; b2: any }[] = [];
        
        for (let i = 0; i < activeBookings.length; i++) {
          for (let j = i + 1; j < activeBookings.length; j++) {
            const b1 = activeBookings[i];
            const b2 = activeBookings[j];
            
            if (b1.assetId === b2.assetId) {
              const start1 = new Date(b1.startTime).getTime();
              const end1 = new Date(b1.endTime).getTime();
              const start2 = new Date(b2.startTime).getTime();
              const end2 = new Date(b2.endTime).getTime();
              
              if (start1 < end2 && end1 > start2) {
                conflicts.push({ b1, b2 });
              }
            }
          }
        }

        if (conflicts.length === 0) return null;

        return (
          <Card className="border-destructive/40 bg-destructive/5 text-destructive-foreground">
            <CardHeader className="pb-3 flex flex-row items-center gap-2 border-b border-destructive/15">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg font-bold text-destructive">Scheduling Conflicts Detected</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                The following active reservations overlap in time for the same resource. Please reschedule or cancel one of them to resolve the conflict.
              </p>
              <div className="grid gap-3">
                {conflicts.map(({ b1, b2 }, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs gap-3">
                    <div>
                      <span className="font-bold text-foreground">Resource: {b1.asset?.name} ({b1.asset?.assetTag})</span>
                      <div className="mt-1 text-muted-foreground">
                        <span className="font-semibold text-foreground">Booking A:</span> "{b1.title}" by {b1.user?.name || "User"} 
                        <span className="font-mono text-3xs ml-1">({new Date(b1.startTime).toLocaleString()} - {new Date(b1.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                      </div>
                      <div className="text-muted-foreground mt-0.5">
                        <span className="font-semibold text-foreground">Booking B:</span> "{b2.title}" by {b2.user?.name || "User"} 
                        <span className="font-mono text-3xs ml-1">({new Date(b2.startTime).toLocaleString()} - {new Date(b2.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 self-end sm:self-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-foreground border-border hover:bg-muted"
                        onClick={() => {
                          setSelectedBooking(b1);
                          setNewStartTime(new Date(b1.startTime).toISOString().slice(0, 16));
                          setNewEndTime(new Date(b1.endTime).toISOString().slice(0, 16));
                          setDetailModalOpen(true);
                        }}
                      >
                        Reschedule A
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-foreground border-border hover:bg-muted"
                        onClick={() => {
                          setSelectedBooking(b2);
                          setNewStartTime(new Date(b2.startTime).toISOString().slice(0, 16));
                          setNewEndTime(new Date(b2.endTime).toISOString().slice(0, 16));
                          setDetailModalOpen(true);
                        }}
                      >
                        Reschedule B
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* View Switcher Tabs */}
      <div className="flex justify-between items-center border-b border-border">
        <Tabs
          tabs={[
            { id: "calendar", label: "Calendar View", icon: <CalendarDays className="h-4 w-4" /> },
            { id: "table", label: "Table List", icon: <List className="h-4 w-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <div className="text-xs text-muted-foreground">
          Showing {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "calendar" ? (
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
            <CardTitle className="text-lg font-bold text-foreground">
              {monthNames[month]} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-border text-center bg-muted/40 font-semibold text-xs py-2 text-muted-foreground uppercase tracking-wider">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            {/* Calendar grid cells */}
            <div className="grid grid-cols-7 grid-rows-5 auto-rows-fr divide-x divide-y divide-border min-h-[500px]">
              {calendarCells.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty-${idx}`} className="bg-muted/10 p-2 min-h-[90px]" />;
                }

                // Find bookings on this specific day
                const cellDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayBookings = filteredBookings.filter((b) => {
                  const bDate = new Date(b.startTime);
                  const bDateStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(
                    bDate.getDate()
                  ).padStart(2, "0")}`;
                  return bDateStr === cellDateStr;
                });

                const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`p-2 min-h-[95px] flex flex-col justify-between hover:bg-muted/10 transition-colors ${
                      isToday ? "bg-primary/5 border-primary" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>
                    {/* Booking indicators inside day */}
                    <div className="mt-1 space-y-1 flex-1 flex flex-col justify-start overflow-y-auto max-h-[100px] scrollbar-thin">
                      {dayBookings.slice(0, 3).map((b) => {
                        const statusColors: Record<string, string> = {
                          UPCOMING: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
                          ONGOING: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
                          COMPLETED: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20",
                          CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
                        };
                        return (
                          <button
                            key={b.id}
                            onClick={() => {
                              setSelectedBooking(b);
                              setNewStartTime(new Date(b.startTime).toISOString().slice(0, 16));
                              setNewEndTime(new Date(b.endTime).toISOString().slice(0, 16));
                              setDetailModalOpen(true);
                            }}
                            className={`w-full text-left truncate text-3xs font-medium px-1.5 py-0.5 rounded border ${
                              statusColors[b.status] || "bg-muted text-foreground"
                            } transition-transform hover:scale-95`}
                            title={`${b.asset?.name}: ${b.title}`}
                          >
                            <span className="font-bold">{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> {b.title}
                          </button>
                        );
                      })}
                      {dayBookings.length > 3 && (
                        <div className="text-4xs text-center text-muted-foreground font-semibold">
                          + {dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <DataTable columns={columns} data={filteredBookings} />
          </CardContent>
        </Card>
      )}

      {/* Booking Details Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Booking Details"
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">{selectedBooking.title}</h3>
              <p className="text-sm text-muted-foreground">Resource Reservation Details</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-border py-4 my-2">
              <div>
                <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Resource / Asset
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {selectedBooking.asset?.name}
                </span>
                <span className="block text-xs text-muted-foreground font-mono">
                  {selectedBooking.asset?.assetTag}
                </span>
              </div>
              <div>
                <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Reserved By
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {selectedBooking.user?.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {selectedBooking.user?.email}
                </span>
              </div>
              <div>
                <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Start Time
                </span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {new Date(selectedBooking.startTime).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  End Time
                </span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {new Date(selectedBooking.endTime).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Status
                </span>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedBooking.status === "UPCOMING"
                        ? "secondary"
                        : selectedBooking.status === "ONGOING"
                        ? "success"
                        : selectedBooking.status === "COMPLETED"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>
            </div>

            <ModalFooter>
              {selectedBooking.status === "UPCOMING" &&
                (selectedBooking.userId === currentUser.id ||
                  ["ASSET_MANAGER", "ADMIN"].includes(currentUser.role)) && (
                  <>
                    <Button variant="outline" onClick={() => setRescheduleModalOpen(true)}>
                      Reschedule
                    </Button>
                    <Button variant="destructive" onClick={() => handleCancelBooking(selectedBooking.id)}>
                      Cancel Reservation
                    </Button>
                  </>
                )}
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        open={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Reservation"
        size="md"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Update the start and end time for your reservation of <strong>{selectedBooking?.asset?.name}</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                New Start Time
              </label>
              <Input
                type="datetime-local"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                New End Time
              </label>
              <Input
                type="datetime-local"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Save Changes"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
