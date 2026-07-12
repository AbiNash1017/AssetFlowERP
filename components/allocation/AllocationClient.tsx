"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { Button, Badge, Modal, ModalFooter, Input, Select } from "@/components/ui";
import { ColumnDef } from "@tanstack/react-table";
import { permissions } from "@/lib/rbac";
import { toast } from "sonner";
import { allocateAsset, returnAsset, approveTransferRequest, rejectTransferRequest, createTransferRequest } from "@/app/actions/allocation";
import { 
  FolderSync, 
  Plus, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  FileText,
  Clock,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { Role, AllocationStatus, TransferStatus } from "@prisma/client";

interface AllocationClientProps {
  allocations: any[];
  transfers: any[];
  assets: any[];
  users: any[];
  departments: any[];
  currentUser: {
    id: string;
    role: Role;
    departmentId: string | null;
  };
}

export default function AllocationClient({
  allocations,
  transfers,
  assets,
  users,
  departments,
  currentUser,
}: AllocationClientProps) {
  const [isPending, startTransition] = useTransition();
  const userRole = currentUser.role;
  const isManager = permissions.canAllocateAsset(userRole);

  // Table Tabs: "Active Allocations" vs "History"
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "RETURNED" | "TRANSFERS">("ACTIVE");

  // Modal States
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // Form States
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [allocUserId, setAllocUserId] = useState("");
  const [allocDeptId, setAllocDeptId] = useState("");
  const [allocExpectedReturn, setAllocExpectedReturn] = useState("");

  const [activeAllocToReturn, setActiveAllocToReturn] = useState<any | null>(null);
  const [returnNotes, setReturnNotes] = useState("");

  // Conflict Check State
  const [conflictHolder, setConflictHolder] = useState<string | null>(null);

  // Filter lists based on user role
  // Employees should only see their own allocations.
  const myAllocations = allocations.filter(
    (a) => a.userId === currentUser.id
  );

  const displayAllocations = isManager ? allocations : myAllocations;

  const activeAllocations = displayAllocations.filter((a) => a.status === "ACTIVE" || a.status === "OVERDUE");
  const returnedAllocations = displayAllocations.filter((a) => a.status === "RETURNED");

  // Filter transfers user can approve
  const pendingTransfers = transfers.filter((t) => t.status === "PENDING");

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    setConflictHolder(null);

    if (!assetId) return;

    // Check if selected asset is allocated
    const asset = assets.find((a) => a.id === assetId);
    if (asset && asset.status !== "AVAILABLE") {
      const activeAlloc = allocations.find((a) => a.assetId === assetId && a.status === "ACTIVE");
      const holder = activeAlloc?.user?.name || activeAlloc?.department?.name || "another custodian";
      setConflictHolder(holder);
    }
  };

  const handleAllocateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (conflictHolder) {
      toast.error("Asset is currently allocated. Propose a transfer instead.");
      return;
    }

    if (!allocUserId && !allocDeptId) {
      toast.error("Please assign to either an employee or department.");
      return;
    }

    const formData = new FormData();
    formData.append("assetId", selectedAssetId);
    formData.append("userId", allocUserId);
    formData.append("departmentId", allocDeptId);
    formData.append("expectedReturnDate", allocExpectedReturn);

    startTransition(async () => {
      const res = await allocateAsset(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Asset allocation completed.");
        setAllocateOpen(false);
        // Reset states
        setSelectedAssetId("");
        setAllocUserId("");
        setAllocDeptId("");
        setAllocExpectedReturn("");
      }
    });
  };

  const openReturnModal = (alloc: any) => {
    setActiveAllocToReturn(alloc);
    setReturnNotes("");
    setReturnOpen(true);
  };

  const handleReturnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeAllocToReturn) return;

    const formData = new FormData();
    formData.append("allocationId", activeAllocToReturn.id);
    formData.append("conditionNotes", returnNotes);

    startTransition(async () => {
      const res = await returnAsset(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Returned asset checked in.");
        setReturnOpen(false);
      }
    });
  };

  const handleApproveTransfer = (requestId: string) => {
    startTransition(async () => {
      const res = await approveTransferRequest(requestId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Transfer proposal approved successfully.");
      }
    });
  };

  const handleRejectTransfer = (requestId: string) => {
    const notes = prompt("Enter reason for rejection (optional):") || "";
    startTransition(async () => {
      const res = await rejectTransferRequest(requestId, notes);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Transfer proposal rejected.");
      }
    });
  };

  // Columns for Allocations Table
  const allocColumns: ColumnDef<any>[] = [
    {
      accessorKey: "asset",
      header: "Asset Tag",
      cell: ({ row }) => (
        <Link
          href={`/assets/${row.original.asset?.id}`}
          className="font-mono font-bold text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded border border-primary/25 cursor-pointer"
        >
          {row.original.asset?.assetTag}
        </Link>
      ),
    },
    {
      id: "assetName",
      header: "Asset Name",
      cell: ({ row }) => <span className="font-semibold">{row.original.asset?.name}</span>,
    },
    {
      id: "custodian",
      header: "Custodian / Department",
      cell: ({ row }) => {
        const u = row.original.user;
        const d = row.original.department;
        return (
          <div className="flex flex-col">
            {u ? (
              <span className="text-sm font-semibold">{u.name}</span>
            ) : d ? (
              <span className="text-sm font-semibold text-secondary">{d.name} (Dept)</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Unassigned</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "allocatedAt",
      header: "Allocated At",
      cell: ({ row }) => <span>{new Date(row.getValue("allocatedAt")).toLocaleDateString()}</span>,
    },
    {
      accessorKey: "expectedReturnDate",
      header: "Due Return Date",
      cell: ({ row }) => {
        const val = row.getValue("expectedReturnDate") as string;
        if (!val) return <span className="text-xs text-muted-foreground italic">Indefinite</span>;
        
        const isOverdue = row.original.status === "OVERDUE" || (new Date(val) < new Date() && row.original.status === "ACTIVE");
        return (
          <span className={isOverdue ? "text-destructive font-bold" : ""}>
            {new Date(val).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as AllocationStatus;
        const isOverdue = val === "OVERDUE" || (row.original.expectedReturnDate && new Date(row.original.expectedReturnDate) < new Date() && val === "ACTIVE");
        
        if (isOverdue) {
          return <Badge variant="destructive" className="animate-pulse">OVERDUE</Badge>;
        }
        return (
          <Badge variant={val === "RETURNED" ? "outline" : "success"}>
            {val}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const alloc = row.original;
        if (alloc.status === "RETURNED" || !isManager) return null;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openReturnModal(alloc)}
            className="cursor-pointer"
          >
            Check In
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Asset Allocations & Transfer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isManager 
              ? "Oversee, check-in, and manage custody changes for company assets." 
              : "Review and manage the company assets currently checked out to you."}
          </p>
        </div>

        {isManager && (
          <Button onClick={() => setAllocateOpen(true)} className="flex items-center gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Allocate Asset</span>
          </Button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "ACTIVE" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Allocations ({activeAllocations.length})
        </button>
        <button
          onClick={() => setActiveTab("RETURNED")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "RETURNED" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Checked In History ({returnedAllocations.length})
        </button>
        {isManager && (
          <button
            onClick={() => setActiveTab("TRANSFERS")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "TRANSFERS" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Transfers ({pendingTransfers.length})
          </button>
        )}
      </div>

      {/* Content Rendering based on sub-tab */}
      {activeTab === "ACTIVE" && (
        <DataTable
          columns={allocColumns}
          data={activeAllocations}
          emptyMessage="No active allocations found."
        />
      )}

      {activeTab === "RETURNED" && (
        <DataTable
          columns={allocColumns}
          data={returnedAllocations}
          emptyMessage="No returns history available."
        />
      )}

      {activeTab === "TRANSFERS" && isManager && (
        <div className="grid gap-4 md:grid-cols-2">
          {pendingTransfers.length > 0 ? (
            pendingTransfers.map((req) => {
              // Handoff details
              const canApprove = 
                userRole === "ADMIN" || 
                userRole === "ASSET_MANAGER" || 
                (userRole === "DEPARTMENT_HEAD" && 
                  ((currentUser.departmentId && currentUser.departmentId === req.toUser?.departmentId) || 
                   (currentUser.departmentId && currentUser.departmentId === req.fromUser?.departmentId)));

              return (
                <div key={req.id} className="bg-card border border-border rounded-xl p-5 shadow-3xs space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="font-mono text-3xs font-bold uppercase tracking-wider">
                      {req.asset.assetTag}
                    </Badge>
                    <span className="text-3xs text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending Approval
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground">{req.asset.name}</h4>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <div className="bg-muted px-2.5 py-1 rounded border border-border">
                        <span className="block text-4xs font-bold uppercase text-muted-foreground">From</span>
                        <span className="font-semibold text-foreground">{req.fromUser.name}</span>
                      </div>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="bg-muted px-2.5 py-1 rounded border border-border">
                        <span className="block text-4xs font-bold uppercase text-muted-foreground">To</span>
                        <span className="font-semibold text-foreground">{req.toUser.name}</span>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border border-border/60 italic flex gap-1.5">
                        <FileText className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span>"{req.notes}"</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    {canApprove ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApproveTransfer(req.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectTransfer(req.id)}
                          disabled={isPending}
                          className="text-red-500 hover:bg-red-50 border-red-100 hover:border-red-200 cursor-pointer"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </Button>
                      </>
                    ) : (
                      <span className="text-3xs text-muted-foreground italic">
                        Department Head approval required
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl bg-muted/10">
              No pending transfer request logs found.
            </div>
          )}
        </div>
      )}

      {/* Allocate Modal (with double allocation check) */}
      <Modal open={allocateOpen} onClose={() => setAllocateOpen(false)} title="Allocate Asset" description="Assign asset custody to employee or department.">
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          <Select
            label="Select Asset"
            value={selectedAssetId}
            onChange={(e) => handleAssetSelect(e.target.value)}
            options={[
              { value: "", label: "Choose Asset..." },
              ...assets.map((a) => ({
                value: a.id,
                label: `${a.assetTag} - ${a.name} (${a.status})`,
              })),
            ]}
            required
          />

          {conflictHolder && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-700 flex flex-col gap-2">
              <span className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4.5 w-4.5" />
                Asset is Currently Held by: {conflictHolder}
              </span>
              <span>
                Double-allocations are blocked. You must return this asset first or request a transfer to redirect custody.
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Assign to Employee"
              value={allocUserId}
              onChange={(e) => {
                setAllocUserId(e.target.value);
                if (e.target.value) setAllocDeptId("");
              }}
              options={[{ value: "", label: "Choose Employee..." }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
              disabled={!!conflictHolder}
            />
            <Select
              label="Assign to Department"
              value={allocDeptId}
              onChange={(e) => {
                setAllocDeptId(e.target.value);
                if (e.target.value) setAllocUserId("");
              }}
              options={[{ value: "", label: "Choose Department..." }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
              disabled={!!conflictHolder}
            />
          </div>

          <Input
            label="Expected Return Date"
            type="date"
            value={allocExpectedReturn}
            onChange={(e) => setAllocExpectedReturn(e.target.value)}
            disabled={!!conflictHolder}
          />

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setAllocateOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !!conflictHolder}>
              {isPending ? "Allocating..." : "Confirm Allocation"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Return Notes Check-in Modal */}
      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Process Return Check-In" description="Confirm return of physical asset.">
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <Input
            label="Condition Check-In Notes"
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="e.g. Returned good condition, with power adapter."
            required
          />
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setReturnOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Processing..." : "Confirm Return Check-In"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
