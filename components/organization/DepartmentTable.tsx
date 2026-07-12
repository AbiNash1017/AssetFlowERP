"use client";

import React, { useState, useTransition } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Button, Input, Select, Badge, Modal, ModalFooter } from "@/components/ui";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2, ShieldAlert, Plus } from "lucide-react";
import { toast } from "sonner";
import { createDepartment, updateDepartment, deactivateDepartment } from "@/app/actions/organization";

interface DepartmentTableProps {
  departments: any[];
  employees: any[];
}

export default function DepartmentTable({ departments, employees }: DepartmentTableProps) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [filterText, setFilterText] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [headId, setHeadId] = useState("");
  const [parentDepartmentId, setParentDepartmentId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const openAddModal = () => {
    setEditingDept(null);
    setName("");
    setCode("");
    setHeadId("");
    setParentDepartmentId("");
    setStatus("ACTIVE");
    setModalOpen(true);
  };

  const openEditModal = (dept: any) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setHeadId(dept.headId || "");
    setParentDepartmentId(dept.parentDepartmentId || "");
    setStatus(dept.status);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("code", code);
    formData.append("headId", headId);
    formData.append("parentDepartmentId", parentDepartmentId);
    formData.append("status", status);

    startTransition(async () => {
      let res;
      if (editingDept) {
        res = await updateDepartment(editingDept.id, formData);
      } else {
        res = await createDepartment(formData);
      }

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(editingDept ? "Department updated successfully" : "Department created successfully");
        setModalOpen(false);
      }
    });
  };

  const handleDeactivate = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate department "${name}"?`)) return;

    startTransition(async () => {
      const res = await deactivateDepartment(id);
      if ((res as any)?.error) {
        toast.error((res as any).error);
      } else {
        toast.success("Department deactivated successfully");
      }
    });
  };

  // Filter departments based on search text
  const filteredData = departments.filter((dept) => {
    const term = filterText.toLowerCase();
    return (
      dept.name.toLowerCase().includes(term) ||
      dept.code.toLowerCase().includes(term) ||
      (dept.head?.name || "").toLowerCase().includes(term)
    );
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs bg-muted px-2 py-1 rounded border border-border">
          {row.getValue("code")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "head",
      header: "Head",
      cell: ({ row }) => {
        const head = row.original.head;
        return head ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{head.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">None Assigned</span>
        );
      },
    },
    {
      accessorKey: "parentDepartment",
      header: "Parent Dept",
      cell: ({ row }) => {
        const parent = row.original.parentDepartment;
        return parent ? (
          <span className="text-sm">{parent.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Top-Level</span>
        );
      },
    },
    {
      accessorKey: "employees",
      header: "Employees",
      cell: ({ row }) => {
        const count = row.original.employees?.length || 0;
        return <Badge variant={count > 0 ? "secondary" : "outline"}>{count} user{count !== 1 ? "s" : ""}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        return (
          <Badge variant={val === "ACTIVE" ? "success" : "destructive"}>
            {val}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const dept = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditModal(dept)}
              aria-label={`Edit ${dept.name}`}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            {dept.status === "ACTIVE" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeactivate(dept.id, dept.name)}
                aria-label={`Deactivate ${dept.name}`}
              >
                <ShieldAlert className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const employeeOptions = [
    { value: "", label: "No Head Selected" },
    ...employees.map((emp) => ({
      value: emp.id,
      label: `${emp.name} (${emp.email})`,
    })),
  ];

  const parentOptions = [
    { value: "", label: "No Parent (Top-Level)" },
    ...departments
      .filter((d) => !editingDept || d.id !== editingDept.id) // Avoid self-hierarchy loop
      .map((d) => ({
        value: d.id,
        label: d.name,
      })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-foreground">Departments</h3>
        <Button onClick={openAddModal} className="flex items-center gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Add Department</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        filterValue={filterText}
        onFilterChange={setFilterText}
        filterPlaceholder="Search departments..."
        emptyMessage="No departments found."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? "Edit Department" : "Add Department"}
        description={editingDept ? "Modify department details and heads." : "Create a new division or department in the organization."}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Department Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              required
            />
            <Input
              label="Department Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ENG"
              disabled={!!editingDept} // Code is unique and typically immutable
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Department Head"
              value={headId}
              onChange={(e) => setHeadId(e.target.value)}
              options={employeeOptions}
            />
            <Select
              label="Parent Department"
              value={parentDepartmentId}
              onChange={(e) => setParentDepartmentId(e.target.value)}
              options={parentOptions}
            />
          </div>

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
