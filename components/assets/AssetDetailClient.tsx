"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Badge, Modal, ModalFooter, Input, Select } from "@/components/ui";
import { toast } from "sonner";
import { updateAssetStatus } from "@/app/actions/assets";
import { allocateAsset, returnAsset, createTransferRequest } from "@/app/actions/allocation";
import { createMaintenanceRequest } from "@/app/actions/maintenance";
import { permissions } from "@/lib/rbac";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  User,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Send,
  Building2,
  FolderOpen,
  ShieldCheck
} from "lucide-react";
import { Role, AssetStatus, MaintenancePriority } from "@prisma/client";

interface AssetDetailClientProps {
  asset: any;
  users: any[];
  departments: any[];
  currentUser: {
    id: string;
    role: Role;
    departmentId: string | null;
  };
}

const statusMap: Record<AssetStatus, { label: string; color: string }> = {
  AVAILABLE: { label: "Available", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  ALLOCATED: { label: "Allocated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  RESERVED: { label: "Reserved", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  UNDER_MAINTENANCE: { label: "In Repair", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  LOST: { label: "Lost", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  RETIRED: { label: "Retired", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  DISPOSED: { label: "Disposed", color: "bg-slate-700/10 text-slate-700 border-slate-700/20" },
};

export default function AssetDetailClient({
  asset,
  users,
  departments,
  currentUser,
}: AssetDetailClientProps) {
  const [isPending, startTransition] = useTransition();
  
  // Modals state
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  // Form states
  const [allocUserId, setAllocUserId] = useState("");
  const [allocDeptId, setAllocDeptId] = useState("");
  const [allocExpectedReturn, setAllocExpectedReturn] = useState("");

  const [returnNotes, setReturnNotes] = useState("");

  const [transferToUserId, setTransferToUserId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const [maintIssue, setMaintIssue] = useState("");
  const [maintPriority, setMaintPriority] = useState<MaintenancePriority>("MEDIUM");

  const userRole = currentUser.role;
  const isManager = permissions.canRegisterAsset(userRole);
  
  const activeAllocation = asset.allocations?.find((a: any) => a.status === "ACTIVE");

  const handleAllocateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allocUserId && !allocDeptId) {
      toast.error("Please assign the asset to either a user or a department.");
      return;
    }

    const formData = new FormData();
    formData.append("assetId", asset.id);
    formData.append("userId", allocUserId);
    formData.append("departmentId", allocDeptId);
    formData.append("expectedReturnDate", allocExpectedReturn);

    startTransition(async () => {
      const res = await allocateAsset(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Asset allocated successfully.");
        setAllocateOpen(false);
      }
    });
  };

  const handleReturnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeAllocation) return;

    const formData = new FormData();
    formData.append("allocationId", activeAllocation.id);
    formData.append("conditionNotes", returnNotes);

    startTransition(async () => {
      const res = await returnAsset(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Asset returned to inventory.");
        setReturnOpen(false);
      }
    });
  };

  const handleTransferSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("assetId", asset.id);
    formData.append("toUserId", transferToUserId);
    formData.append("notes", transferNotes);

    startTransition(async () => {
      const res = await createTransferRequest(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Asset transfer request initiated.");
        setTransferOpen(false);
      }
    });
  };

  const handleMaintenanceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (maintIssue.trim().length < 10) {
      toast.error("Issue description must be at least 10 characters.");
      return;
    }

    const formData = new FormData();
    formData.append("assetId", asset.id);
    formData.append("issue", maintIssue);
    formData.append("priority", maintPriority);

    startTransition(async () => {
      const res = await createMaintenanceRequest(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Maintenance request submitted successfully.");
        setMaintenanceOpen(false);
      }
    });
  };

  const handleForceStatusChange = (newStatus: AssetStatus) => {
    if (!confirm(`Are you sure you want to force status of this asset to ${newStatus}?`)) return;

    startTransition(async () => {
      const res = await updateAssetStatus(asset.id, newStatus);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Asset status updated to ${newStatus}.`);
      }
    });
  };

  const activeStatusConfig = statusMap[asset.status as AssetStatus] || { label: asset.status, color: "" };

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <Link href="/assets" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-all hover:bg-muted cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Catalog / Detail View</span>
          <h1 className="text-2xl font-extrabold text-foreground mt-0.5">{asset.name}</h1>
        </div>
      </div>

      {/* Grid: Details Panel & Actions Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left 2 Columns: Core Specs & Custom JSON Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Core Specs Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-3xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-md border border-primary/20">
                  {asset.assetTag}
                </span>
                <span className="text-sm font-semibold text-muted-foreground">Serial: {asset.serialNumber}</span>
              </div>
              <Badge className={`border font-semibold ${activeStatusConfig.color}`}>
                {activeStatusConfig.label}
              </Badge>
            </div>

            {/* Photo & Details row */}
            <div className="flex flex-col md:flex-row gap-6">
              {asset.photoUrl ? (
                <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                  <img src={asset.photoUrl} alt={asset.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full md:w-48 h-48 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/10 shrink-0">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
                  <span className="text-3xs uppercase tracking-wider font-semibold">No Image Uploaded</span>
                </div>
              )}

              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 flex-1">
                <div>
                  <span className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground">Category</span>
                  <span className="text-sm font-semibold text-foreground mt-0.5 block">{asset.category?.name || "Uncategorized"}</span>
                </div>
                <div>
                  <span className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground">Current Location</span>
                  <span className="text-sm font-semibold text-foreground mt-0.5 block flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-secondary shrink-0" />
                    {asset.location}
                  </span>
                </div>
                <div>
                  <span className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground">Acquisition Date</span>
                  <span className="text-sm font-semibold text-foreground mt-0.5 block">
                    {new Date(asset.acquisitionDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground">Acquisition Cost</span>
                  <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                    ${Number(asset.acquisitionCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground">Original Condition</span>
                  <span className="text-sm font-semibold text-foreground mt-0.5 block capitalize">{asset.condition.toLowerCase()}</span>
                </div>
                <div>
                  <span className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground">Shareability</span>
                  <span className="text-sm font-semibold text-foreground mt-0.5 block">
                    {asset.isBookable ? (
                      <span className="text-teal-brand font-bold">Enabled for Bookings</span>
                    ) : (
                      <span className="text-muted-foreground">Assigned Only</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom fields schema mapping */}
            {asset.category?.customFields && Object.keys(asset.category.customFields).length > 0 && (
              <div className="pt-6 border-t border-border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Specifications Metadata</h3>
                <div className="grid gap-4 sm:grid-cols-2 bg-muted/20 p-4 rounded-lg border border-border">
                  {Object.entries(asset.category.customFields).map(([fieldName, spec]: [string, any]) => {
                    const value = asset.documents?.[fieldName];
                    const displayValue =
                      value === undefined || value === ""
                        ? "-"
                        : typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : String(value);

                    return (
                      <div key={fieldName} className="flex flex-col gap-0.5 border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
                        <span className="text-3xs text-muted-foreground font-semibold">{fieldName}</span>
                        <span className="text-sm font-semibold text-foreground">{displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Allocation & Maintenance History Timeline */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Allocation History */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-3xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 pb-3 border-b border-border">
                <User className="h-4 w-4 text-primary" />
                Allocation Timeline
              </h3>
              <div className="flow-root max-h-[400px] overflow-y-auto pr-1">
                {asset.allocations && asset.allocations.length > 0 ? (
                  <ul role="list" className="-mb-8">
                    {asset.allocations.map((alloc: any, idx: number) => (
                      <li key={alloc.id}>
                        <div className="relative pb-8">
                          {idx !== asset.allocations.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-white ${
                                alloc.status === "ACTIVE" 
                                  ? "bg-blue-500 border-blue-500" 
                                  : "bg-slate-400 border-slate-400"
                              }`}>
                                <Clock className="h-4 w-4" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <p className="text-xs font-semibold text-foreground">
                                {alloc.user?.name || alloc.department?.name || "Unassigned"}
                              </p>
                              <p className="text-3xs text-muted-foreground mt-0.5">
                                Allocated: {new Date(alloc.allocatedAt).toLocaleDateString()}
                              </p>
                              {alloc.returnedAt ? (
                                <p className="text-3xs text-emerald-600 font-bold mt-0.5">
                                  Returned: {new Date(alloc.returnedAt).toLocaleDateString()}
                                </p>
                              ) : (
                                alloc.expectedReturnDate && (
                                  <p className={`text-3xs font-bold mt-0.5 ${
                                    new Date(alloc.expectedReturnDate) < new Date() ? "text-destructive" : "text-primary"
                                  }`}>
                                    Due: {new Date(alloc.expectedReturnDate).toLocaleDateString()}
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    No allocation record. Asset remains in stock.
                  </div>
                )}
              </div>
            </div>

            {/* Maintenance History */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-3xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 pb-3 border-b border-border">
                <Wrench className="h-4 w-4 text-secondary" />
                Maintenance Logs
              </h3>
              <div className="flow-root max-h-[400px] overflow-y-auto pr-1">
                {asset.maintenanceRequests && asset.maintenanceRequests.length > 0 ? (
                  <ul role="list" className="-mb-8">
                    {asset.maintenanceRequests.map((req: any, idx: number) => (
                      <li key={req.id}>
                        <div className="relative pb-8">
                          {idx !== asset.maintenanceRequests.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-white ${
                                req.status === "RESOLVED"
                                  ? "bg-emerald-500 border-emerald-500"
                                  : req.status === "PENDING"
                                  ? "bg-amber-500 border-amber-500"
                                  : "bg-red-500 border-red-500"
                              }`}>
                                <Wrench className="h-4 w-4" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <p className="text-xs font-semibold text-foreground truncate max-w-[200px]" title={req.issue}>
                                {req.issue}
                              </p>
                              <p className="text-3xs text-muted-foreground mt-0.5">
                                Raised: {new Date(req.createdAt).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge className="text-3xs px-1 py-0 px-1.5 font-bold uppercase">
                                  {req.status}
                                </Badge>
                                <span className="text-3xs text-muted-foreground font-semibold">Priority: {req.priority}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    No recorded maintenance incidents. Excellent!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Operations Panel */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-3xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground pb-3 border-b border-border flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              Operational Actions
            </h3>

            <div className="flex flex-col gap-3">
              {/* AVAILABLE actions */}
              {asset.status === "AVAILABLE" && isManager && (
                <Button onClick={() => setAllocateOpen(true)} className="w-full cursor-pointer">
                  Allocate Asset
                </Button>
              )}

              {/* ALLOCATED actions */}
              {asset.status === "ALLOCATED" && (
                <>
                  {isManager && (
                    <Button onClick={() => setReturnOpen(true)} className="w-full cursor-pointer" variant="outline">
                      Return Check-in
                    </Button>
                  )}
                  {activeAllocation?.userId === currentUser.id && (
                    <Button onClick={() => setTransferOpen(true)} className="w-full cursor-pointer">
                      Propose Transfer
                    </Button>
                  )}
                </>
              )}

              {/* Maintenance action (any user can raise) */}
              {asset.status !== "UNDER_MAINTENANCE" && (
                <Button onClick={() => setMaintenanceOpen(true)} className="w-full cursor-pointer" variant="secondary">
                  Report Repair Need
                </Button>
              )}

              {/* Admin status overrides */}
              {isManager && (
                <div className="pt-4 border-t border-border space-y-2.5">
                  <label className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground">Force Override Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleForceStatusChange("LOST")}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200 cursor-pointer"
                    >
                      Mark Lost
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleForceStatusChange("RETIRED")}
                      className="text-slate-500 hover:bg-slate-50 hover:text-slate-600 border-slate-200 cursor-pointer"
                    >
                      Mark Retire
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleForceStatusChange("AVAILABLE")}
                      className="text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 border-emerald-200 cursor-pointer col-span-2"
                    >
                      Force Available
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals Section */}
      
      {/* Allocate Modal */}
      <Modal open={allocateOpen} onClose={() => setAllocateOpen(false)} title="Allocate Asset" description={`Set the active custodian for ${asset.assetTag}.`}>
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          <Select
            label="Assign to Employee"
            value={allocUserId}
            onChange={(e) => {
              setAllocUserId(e.target.value);
              if (e.target.value) setAllocDeptId(""); // Mutual exclusivity
            }}
            options={[{ value: "", label: "Select Employee..." }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
          />
          <div className="text-center text-xs text-muted-foreground font-semibold my-1">— OR —</div>
          <Select
            label="Assign to Department"
            value={allocDeptId}
            onChange={(e) => {
              setAllocDeptId(e.target.value);
              if (e.target.value) setAllocUserId(""); // Mutual exclusivity
            }}
            options={[{ value: "", label: "Select Department..." }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
          />
          <Input
            label="Expected Return Date"
            type="date"
            value={allocExpectedReturn}
            onChange={(e) => setAllocExpectedReturn(e.target.value)}
          />
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setAllocateOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Allocating..." : "Confirm Allocation"}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Process Return" description={`Return ${asset.assetTag} back to system inventory.`}>
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <Input
            label="Condition Check-in Notes"
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="e.g. Good condition, charger returned"
            required
          />
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setReturnOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Returning..." : "Check In Return"}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Transfer Request Modal */}
      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Propose Asset Transfer" description={`Propose handoff of ${asset.assetTag} to another teammate.`}>
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <Select
            label="Target Teammate"
            value={transferToUserId}
            onChange={(e) => setTransferToUserId(e.target.value)}
            options={[{ value: "", label: "Select Teammate..." }, ...users.filter(u => u.id !== currentUser.id).map((u) => ({ value: u.id, label: u.name }))]}
            required
          />
          <Input
            label="Handoff Justification Notes"
            value={transferNotes}
            onChange={(e) => setTransferNotes(e.target.value)}
            placeholder="Reason for changing custodians"
          />
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setTransferOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Submitting..." : "Send Transfer Request"}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Maintenance Request Modal */}
      <Modal open={maintenanceOpen} onClose={() => setMaintenanceOpen(false)} title="Report Device Incident" description={`Submit a ticket for ${asset.assetTag} malfunctions.`}>
        <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
          <Input
            label="Describe Malfunctions / Issue details"
            value={maintIssue}
            onChange={(e) => setMaintIssue(e.target.value)}
            placeholder="Explain what is broken in detail (min 10 chars)..."
            required
          />
          <Select
            label="Ticket Priority"
            value={maintPriority}
            onChange={(e) => setMaintPriority(e.target.value as any)}
            options={[
              { value: "LOW", label: "Low (General checkup)" },
              { value: "MEDIUM", label: "Medium (Buggy / usable)" },
              { value: "HIGH", label: "High (Non-functional parts)" },
              { value: "CRITICAL", label: "Critical (Device dead / core broken)" },
            ]}
            required
          />
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setMaintenanceOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Submitting..." : "Raise Ticket"}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
