"use client";

import React, { useState, useTransition } from "react";
import { Button, Input, Select } from "@/components/ui";
import { toast } from "sonner";
import { createAuditCycle } from "@/app/actions/audit";
import { ClipboardCheck, Users, MapPin, Building } from "lucide-react";

interface AuditCycleFormProps {
  departments: any[];
  users: any[];
  onSuccess: () => void;
}

export default function AuditCycleForm({ departments, users, onSuccess }: AuditCycleFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"DEPARTMENT" | "LOCATION">("DEPARTMENT");
  const [departmentId, setDepartmentId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);

  const handleAuditorToggle = (userId: string) => {
    setSelectedAuditors((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a cycle name.");
      return;
    }

    const scopeId = scope === "DEPARTMENT" ? departmentId : locationName;
    if (!scopeId) {
      toast.error(
        scope === "DEPARTMENT" ? "Please select a department." : "Please enter a location."
      );
      return;
    }

    if (selectedAuditors.length === 0) {
      toast.error("Please assign at least one auditor.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("scope", scope);
    formData.append("scopeId", scopeId);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    selectedAuditors.forEach((auditorId) => {
      formData.append("auditorIds", auditorId);
    });

    startTransition(async () => {
      const res = await createAuditCycle(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Audit cycle created successfully.");
        setName("");
        setDepartmentId("");
        setLocationName("");
        setStartDate("");
        setEndDate("");
        setSelectedAuditors([]);
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
          Audit Cycle Name <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          placeholder="e.g. Q3 IT Hardware Audit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Scope Type <span className="text-destructive">*</span>
          </label>
          <Select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as any);
              setDepartmentId("");
              setLocationName("");
            }}
            options={[
              { value: "DEPARTMENT", label: "Department-wise" },
              { value: "LOCATION", label: "Location-wise" },
            ]}
            required
          />
        </div>

        <div>
          {scope === "DEPARTMENT" ? (
            <>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Select Department <span className="text-destructive">*</span>
              </label>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                options={[
                  { value: "", label: "Choose department..." },
                  ...departments.map((d) => ({
                    value: d.id,
                    label: `${d.name} (${d.code})`,
                  })),
                ]}
                required
              />
            </>
          ) : (
            <>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Location Name <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. New York Office, Warehouse B"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                required
              />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Start Date <span className="text-destructive">*</span>
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            End Date <span className="text-destructive">*</span>
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Auditor Assignment List */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
          Assign Auditors <span className="text-destructive">*</span>
        </label>
        <div className="border border-border rounded-lg bg-background max-h-[160px] overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {users.map((u) => {
            const isChecked = selectedAuditors.includes(u.id);
            return (
              <label
                key={u.id}
                className={`flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted/40 cursor-pointer transition-colors ${
                  isChecked ? "bg-primary/5" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAuditorToggle(u.id)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <div>
                  <div className="text-xs font-semibold text-foreground">{u.name}</div>
                  <div className="text-4xs text-muted-foreground">{u.email} · {u.role}</div>
                </div>
              </label>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Auditors will receive a notification and are authorized to record audit entries for this cycle.
        </p>
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6 bg-muted/20 -mx-6 -mb-5 px-6 py-4 rounded-b-2xl">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="flex items-center gap-1.5">
          <ClipboardCheck className="h-4 w-4" />
          {isPending ? "Creating..." : "Create Audit Cycle"}
        </Button>
      </div>
    </form>
  );
}
