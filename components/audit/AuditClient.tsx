"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal } from "@/components/ui";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck, Plus, Play, Calendar, UserCheck, CheckCircle2 } from "lucide-react";
import AuditCycleForm from "./AuditCycleForm";
import { closeAuditCycle } from "@/app/actions/audit";
import { toast } from "sonner";

interface AuditClientProps {
  initialCycles: any[];
  departments: any[];
  users: any[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AuditClient({ initialCycles, departments, users, currentUser }: AuditClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isManager = ["ASSET_MANAGER", "ADMIN"].includes(currentUser.role);

  // Departments map for quick code resolution
  const deptMap = React.useMemo(() => {
    return new Map(departments.map((d) => [d.id, d]));
  }, [departments]);

  const handleCloseCycle = (cycleId: string) => {
    if (
      !confirm(
        "Are you sure you want to close this audit cycle? This will lock all audit entries and update any assets marked as MISSING to LOST status."
      )
    )
      return;

    startTransition(async () => {
      const res = await closeAuditCycle(cycleId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Audit cycle closed successfully. Missing assets updated to LOST.");
        window.location.reload();
      }
    });
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Asset",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-foreground">{row.getValue("name")}</span>
          <div className="text-3xs text-muted-foreground">
            Created on {new Date(row.original.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "scope",
      header: "Location",
      cell: ({ row }) => {
        const scopeType = row.getValue("scope") as string;
        const scopeId = row.original.scopeId;
        let label = scopeId;

        if (scopeType === "DEPARTMENT") {
          const dept = deptMap.get(scopeId);
          label = dept ? `${dept.name} (${dept.code})` : `Dept ID: ${scopeId.slice(0, 8)}...`;
        }

        return (
          <div>
            <Badge variant="outline" className="font-semibold uppercase text-3xs">
              {scopeType}
            </Badge>
            <div className="text-xs font-semibold text-foreground mt-0.5">{label}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "dates",
      header: "Timeline",
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
          <span>Start: {new Date(row.original.startDate).toLocaleDateString()}</span>
          <span>End: {new Date(row.original.endDate).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      accessorKey: "assignments",
      header: "Auditors",
      cell: ({ row }) => {
        const assigns = row.original.assignments || [];
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {assigns.map((a: any) => (
              <Badge key={a.id} variant="secondary" className="text-3xs">
                {a.auditor?.name}
              </Badge>
            ))}
            {assigns.length === 0 && <span className="text-3xs italic text-muted-foreground">None</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        return (
          <Badge variant={val === "ACTIVE" ? "success" : "default"}>
            {val}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const cycle = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/audit/${cycle.id}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 cursor-pointer">
                <Play className="h-3 w-3" /> Audit Dashboard
              </Button>
            </Link>
            {isManager && cycle.status === "ACTIVE" && (
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-1.5 cursor-pointer"
                disabled={isPending}
                onClick={(e) => {
                  e.preventDefault();
                  handleCloseCycle(cycle.id);
                }}
              >
                Close Audit Cycle
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Asset Audits</h1>
          <p className="text-muted-foreground">Create and manage physical inventory validation and audit cycles</p>
        </div>
        {isManager && (
          <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Start Audit Cycle
          </Button>
        )}
      </div>

      {/* Main Table Card */}
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={initialCycles} />
        </CardContent>
      </Card>

      {/* Create Cycle Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Start New Audit Cycle"
        size="lg"
      >
        <AuditCycleForm
          departments={departments}
          users={users}
          onSuccess={() => {
            setCreateOpen(false);
            window.location.reload(); // Quick refresh to update stats
          }}
        />
      </Modal>
    </div>
  );
}
