"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Badge, Modal, ModalFooter, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Wrench, Plus, Filter, User, HelpCircle, CheckCircle, Clock, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { 
  approveMaintenanceRequest, 
  rejectMaintenanceRequest, 
  assignTechnician, 
  resolveMaintenanceRequest 
} from "@/app/actions/maintenance";
import MaintenanceRequestForm from "./MaintenanceRequestForm";

interface MaintenanceClientProps {
  initialRequests: any[];
  assets: any[];
  users: any[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function MaintenanceClient({ 
  initialRequests, 
  assets, 
  users, 
  currentUser 
}: MaintenanceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modals
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  // Selected request state
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [technicianId, setTechnicianId] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const isManager = ["ASSET_MANAGER", "ADMIN"].includes(currentUser.role);

  // Actions
  const handleApprove = (id: string) => {
    startTransition(async () => {
      const res = await approveMaintenanceRequest(id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Request approved and asset status set to Under Maintenance.");
        router.refresh();
      }
    });
  };

  const handleReject = (id: string) => {
    if (!confirm("Are you sure you want to reject this maintenance request?")) return;
    startTransition(async () => {
      const res = await rejectMaintenanceRequest(id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Request rejected.");
        router.refresh();
      }
    });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !technicianId) return;

    startTransition(async () => {
      const res = await assignTechnician(selectedRequest.id, technicianId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Technician assigned and request status set to In Progress.");
        setAssignOpen(false);
        setTechnicianId("");
        router.refresh();
      }
    });
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    startTransition(async () => {
      const res = await resolveMaintenanceRequest(selectedRequest.id, resolutionNotes);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Maintenance resolved and asset status restored to Available.");
        setResolveOpen(false);
        setResolutionNotes("");
        router.refresh();
      }
    });
  };

  // Filters logic
  const filteredRequests = initialRequests.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || r.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const usersMap = React.useMemo(() => {
    return new Map(users.map((u) => [u.id, u]));
  }, [users]);

  // Columns definition
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "asset",
      header: "Asset",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-foreground">{row.original.asset?.name}</span>
          <div className="text-3xs text-muted-foreground font-mono">{row.original.asset?.assetTag}</div>
        </div>
      ),
    },
    {
      accessorKey: "issue",
      header: "Issue Description",
      cell: ({ row }) => <span className="text-sm font-medium line-clamp-2 max-w-xs">{row.getValue("issue")}</span>,
    },
    {
      accessorKey: "raisedBy",
      header: "Raised By",
      cell: ({ row }) => (
        <div>
          <span className="text-sm font-semibold">{row.original.raisedBy?.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const val = row.getValue("priority") as string;
        const colorMap: Record<string, "success" | "secondary" | "destructive" | "default"> = {
          LOW: "secondary",
          MEDIUM: "default",
          HIGH: "secondary",
          CRITICAL: "destructive",
        };
        const priorityLabels: Record<string, string> = {
          LOW: "Low",
          MEDIUM: "Medium",
          HIGH: "High",
          CRITICAL: "Critical",
        };
        return <Badge variant={colorMap[val] || "default"}>{priorityLabels[val] || val}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        const colorMap: Record<string, "success" | "secondary" | "destructive" | "outline" | "default"> = {
          PENDING: "secondary",
          APPROVED: "outline",
          REJECTED: "destructive",
          IN_PROGRESS: "default",
          RESOLVED: "success",
        };
        return <Badge variant={colorMap[val] || "outline"}>{val.replace("_", " ")}</Badge>;
      },
    },
    {
      accessorKey: "technicianId",
      header: "Assigned Tech",
      cell: ({ row }) => {
        const techId = row.getValue("technicianId") as string;
        const tech = techId ? usersMap.get(techId) : null;
        return tech ? (
          <span className="text-sm font-medium">{tech.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Unassigned</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original;
        const isTech = r.technicianId === currentUser.id;
        const showApproveReject = r.status === "PENDING" && isManager;
        const showAssign = r.status === "APPROVED" && isManager;
        const showResolve = r.status === "IN_PROGRESS" && (isManager || isTech);

        return (
          <div className="flex gap-2">
            {showApproveReject && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleApprove(r.id)} className="text-success hover:text-success border-success/30">
                  Approve
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleReject(r.id)}>
                  Reject
                </Button>
              </>
            )}
            {showAssign && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRequest(r);
                  setAssignOpen(true);
                }}
              >
                Assign Tech
              </Button>
            )}
            {showResolve && (
              <Button
                variant="outline"
                size="sm"
                className="text-success hover:text-success border-success/30"
                onClick={() => {
                  setSelectedRequest(r);
                  setResolveOpen(true);
                }}
              >
                Resolve
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Maintenance Management</h1>
          <p className="text-muted-foreground">Raise, assign, and resolve maintenance requests for organization assets</p>
        </div>
        <Button onClick={() => setNewRequestOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Raise Maintenance Request
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Filter by Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "PENDING", label: "Pending" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "REJECTED", label: "Rejected" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "RESOLVED", label: "Resolved" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Filter by Priority
              </label>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Priorities" },
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "CRITICAL", label: "Critical" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={filteredRequests} />
        </CardContent>
      </Card>

      {/* Raise Maintenance Modal */}
      <Modal
        open={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
        title="Raise Maintenance Request"
        size="lg"
      >
        <MaintenanceRequestForm 
          assets={assets} 
          onSuccess={() => {
            setNewRequestOpen(false);
            router.refresh();
          }} 
        />
      </Modal>

      {/* Assign Technician Modal */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Technician"
        size="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Assign a qualified staff member or technician to resolve this maintenance issue.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Select Technician / Staff
            </label>
            <Select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              options={[
                { value: "", label: "Choose a technician..." },
                ...users.map((u) => ({
                  value: u.id,
                  label: `${u.name} (${u.email} - ${u.role})`,
                })),
              ]}
              required
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Assigning..." : "Assign & Start repair"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Resolve Request Modal */}
      <Modal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve Maintenance Request"
        size="md"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Confirm that the issue has been successfully resolved. Entering resolution notes will update the asset's condition log.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Resolution Notes / Condition Updates (Optional)
            </label>
            <textarea
              placeholder="e.g. Replaced display panel. Screen is now in excellent condition."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:opacity-50"
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-success text-success-foreground hover:bg-success/90">
              {isPending ? "Resolving..." : "Complete Repair"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
