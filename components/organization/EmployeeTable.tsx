"use client";

import React, { useState, useTransition } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui";
import { ColumnDef } from "@tanstack/react-table";
import { Shield, ToggleLeft, ToggleRight, UserCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { updateEmployeeRole, updateEmployeeStatus } from "@/app/actions/organization";
import { Role } from "@prisma/client";

interface EmployeeTableProps {
  employees: any[];
}

const roleMap: Record<Role, { label: string; color: string }> = {
  EMPLOYEE: { label: "Employee", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  DEPARTMENT_HEAD: { label: "Department Head", color: "bg-teal-brand/10 text-teal-brand border-teal-brand/20" },
  ASSET_MANAGER: { label: "Asset Manager", color: "bg-secondary/10 text-secondary border-secondary/20" },
  ADMIN: { label: "Administrator", color: "bg-primary/10 text-primary border-primary/20" },
};

export default function EmployeeTable({ employees }: EmployeeTableProps) {
  const [isPending, startTransition] = useTransition();
  const [filterText, setFilterText] = useState("");

  const handleRoleChange = (userId: string, newRole: Role) => {
    startTransition(async () => {
      const res = await updateEmployeeRole(userId, newRole);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Role updated successfully to ${roleMap[newRole].label}`);
      }
    });
  };

  const handleStatusToggle = (userId: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Are you sure you want to set status of "${name}" to ${newStatus}?`)) return;

    startTransition(async () => {
      const res = await updateEmployeeStatus(userId, newStatus);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`User status updated to ${newStatus}`);
      }
    });
  };

  // Filter employees based on search text
  const filteredData = employees.filter((emp) => {
    const term = filterText.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      (emp.department?.name || "").toLowerCase().includes(term) ||
      emp.role.toLowerCase().includes(term)
    );
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Employee Name",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-foreground">{row.original.name}</div>
          <div className="flex items-center gap-1 text-2xs text-muted-foreground mt-0.5">
            <Mail className="h-3 w-3" />
            <span>{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => {
        const dept = row.original.department;
        return dept ? (
          <span className="text-sm font-medium">{dept.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Not Assigned</span>
        );
      },
    },
    {
      accessorKey: "role",
      header: "System Role",
      cell: ({ row }) => {
        const currentRole = row.original.role as Role;
        return (
          <div className="flex items-center gap-2">
            <select
              value={currentRole}
              onChange={(e) => handleRoleChange(row.original.id, e.target.value as Role)}
              disabled={isPending}
              className={[
                "text-xs font-semibold rounded-md border border-input bg-card px-2 py-1 shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary",
                roleMap[currentRole]?.color || "",
              ].join(" ")}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="DEPARTMENT_HEAD">Department Head</option>
              <option value="ASSET_MANAGER">Asset Manager</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === "ACTIVE" ? "success" : "destructive"}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Toggle Account Status",
      cell: ({ row }) => {
        const emp = row.original;
        const isActive = emp.status === "ACTIVE";
        return (
          <button
            onClick={() => handleStatusToggle(emp.id, emp.status, emp.name)}
            disabled={isPending}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-3xs cursor-pointer",
              isActive 
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20" 
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
              "disabled:opacity-50 disabled:pointer-events-none"
            ].join(" ")}
            aria-label={isActive ? `Deactivate ${emp.name}` : `Activate ${emp.name}`}
          >
            {isActive ? (
              <>
                <ToggleRight className="h-4 w-4" />
                <span>Deactivate</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" />
                <span>Activate</span>
              </>
            )}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-foreground">Employee Directory</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>Role updates trigger direct system email alerts</span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        filterValue={filterText}
        onFilterChange={setFilterText}
        filterPlaceholder="Search by name, email, department, role..."
        emptyMessage="No employees found."
      />
    </div>
  );
}
