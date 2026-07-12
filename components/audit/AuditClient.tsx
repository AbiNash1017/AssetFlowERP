"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal } from "@/components/ui";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck, Plus, Play, Calendar, UserCheck, CheckCircle2 } from "lucide-react";
import AuditCycleForm from "./AuditCycleForm";

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
  const isManager = ["ASSET_MANAGER", "ADMIN"].includes(currentUser.role);

  // Departments map for quick code resolution
  const deptMap = React.useMemo(() => {
    return new Map(departments.map((d) => [d.id, d]));
  }, [departments]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Cycle Name",
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
      header: "Audit Scope",
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
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const total = row.original.totalAssets || 0;
        const audited = row.original.auditedCount || 0;
        const pct = total > 0 ? Math.round((audited / total) * 100) : 0;

        return (
          <div className="w-[140px] space-y-1">
            <div className="flex justify-between text-3xs font-semibold">
              <span className="text-muted-foreground">
                {audited} / {total} Assets
              </span>
              <span className="text-foreground">{pct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
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
          <Link href={`/audit/${cycle.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Play className="h-3 w-3" /> Audit Dashboard
            </Button>
          </Link>
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
