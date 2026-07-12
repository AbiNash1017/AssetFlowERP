"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal, ModalFooter, Input, Tabs } from "@/components/ui";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck, ArrowLeft, ShieldAlert, CheckCircle, AlertTriangle, HelpCircle, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { recordAuditEntry, closeAuditCycle } from "@/app/actions/audit";

interface CycleDetailClientProps {
  cycle: any;
  assets: any[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  departmentScopeName?: string;
}

export default function CycleDetailClient({
  cycle,
  assets,
  currentUser,
  departmentScopeName,
}: CycleDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState("all");
  const [auditOpen, setAuditOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  // Form states for auditing an asset
  const [auditResultState, setAuditResultState] = useState<"VERIFIED" | "MISSING" | "DAMAGED">("VERIFIED");
  const [auditNotes, setAuditNotes] = useState("");

  const isManager = ["ASSET_MANAGER", "ADMIN"].includes(currentUser.role);
  const isActive = cycle.status === "ACTIVE";

  // Quick lookup maps
  const entriesMap = React.useMemo(() => {
    return new Map<string, any>(cycle.entries.map((e: any) => [e.assetId, e]));
  }, [cycle.entries]);

  // Handle closing cycle
  const handleCloseCycle = () => {
    if (
      !confirm(
        "Are you sure you want to close this audit cycle? This will lock all audit entries and update any assets marked as MISSING to LOST status."
      )
    )
      return;

    startTransition(async () => {
      const res = await closeAuditCycle(cycle.id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Audit cycle closed successfully. Missing assets updated to LOST.");
        router.refresh();
      }
    });
  };

  // Handle auditing asset
  const handleRecordAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const formData = new FormData();
    formData.append("cycleId", cycle.id);
    formData.append("assetId", selectedAsset.id);
    formData.append("result", auditResultState);
    formData.append("notes", auditNotes);

    startTransition(async () => {
      const res = await recordAuditEntry(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Asset "${selectedAsset.name}" marked as ${auditResultState.toLowerCase()}.`);
        setAuditOpen(false);
        setAuditNotes("");
        router.refresh();
      }
    });
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const entry = entriesMap.get(asset.id);
    if (activeTab === "discrepancy") {
      return entry && (entry.result === "MISSING" || entry.result === "DAMAGED");
    }
    if (activeTab === "pending") {
      return !entry;
    }
    return true;
  });

  const auditedCount = cycle.entries.length;
  const totalAssets = assets.length;
  const progressPct = totalAssets > 0 ? Math.round((auditedCount / totalAssets) * 100) : 0;

  // Columns for assets table
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "asset",
      header: "Asset",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-foreground">{row.original.name}</span>
          <div className="text-3xs text-muted-foreground font-mono">{row.original.assetTag}</div>
        </div>
      ),
    },
    {
      accessorKey: "holder",
      header: "Current Holder / Loc",
      cell: ({ row }) => {
        const activeAlloc = row.original.allocations?.[0];
        const holderName = activeAlloc?.user?.name || activeAlloc?.department?.name || "Unallocated";
        return (
          <div>
            <div className="text-sm font-medium">{holderName}</div>
            <div className="text-3xs text-muted-foreground">{row.original.location}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "auditResult",
      header: "Audit Status",
      cell: ({ row }) => {
        const entry = entriesMap.get(row.original.id);
        if (!entry) {
          return <Badge variant="secondary">Not Audited</Badge>;
        }

        const colorMap: Record<string, "success" | "secondary" | "destructive" | "default"> = {
          VERIFIED: "success",
          DAMAGED: "secondary",
          MISSING: "destructive",
        };

        return (
          <div className="space-y-0.5">
            <Badge variant={colorMap[entry.result] || "default"}>
              {entry.result}
            </Badge>
            {entry.notes && (
              <div className="text-3xs text-muted-foreground italic max-w-[150px] truncate" title={entry.notes}>
                "{entry.notes}"
              </div>
            )}
            <div className="text-4xs text-muted-foreground">
              by {entry.auditor?.name || "System"}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const asset = row.original;
        const entry = entriesMap.get(asset.id);
        const btnLabel = entry ? "Re-Audit" : "Audit Asset";

        return (
          <div className="flex gap-2">
            {isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAsset(asset);
                  setAuditResultState(entry?.result || "VERIFIED");
                  setAuditNotes(entry?.notes || "");
                  setAuditOpen(true);
                }}
              >
                {btnLabel}
              </Button>
            ) : (
              <span className="text-3xs italic text-muted-foreground">Locked (Closed)</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link and Header */}
      <div className="flex items-center gap-4">
        <Link href="/audit">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Audits
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{cycle.name}</h1>
          <p className="text-sm text-muted-foreground">
            Auditing {cycle.scope === "DEPARTMENT" ? `Department: ${departmentScopeName || cycle.scopeId}` : `Location: ${cycle.scopeId}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info & Close Action Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Cycle Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5 text-3xs">
                  Status
                </span>
                <Badge variant={isActive ? "success" : "default"}>
                  {cycle.status}
                </Badge>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5 text-3xs">
                  Scope
                </span>
                <span className="font-medium text-foreground">{cycle.scope}</span>
              </div>
              <div className="col-span-2 border-t border-border pt-3">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5 text-3xs">
                  Timeline
                </span>
                <span className="font-medium text-foreground">
                  {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="col-span-2 border-t border-border pt-3">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1 text-3xs">
                  Auditors Assigned
                </span>
                <div className="flex flex-wrap gap-1">
                  {cycle.assignments?.map((a: any) => (
                    <Badge key={a.id} variant="secondary" className="text-3xs">
                      {a.auditor?.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-3xs font-semibold mb-1">
                <span className="text-muted-foreground">Audit Progress</span>
                <span className="text-foreground">
                  {auditedCount} / {totalAssets} ({progressPct}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPct, 100)}%` }}
                />
              </div>
            </div>

            {/* Close Cycle button */}
            {isActive && isManager && (
              <div className="pt-4 border-t border-border flex justify-stretch">
                <Button
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-1.5"
                  onClick={handleCloseCycle}
                  disabled={isPending}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Close & Lock Audit Cycle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scoped Assets Table */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="pb-2 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Scoped Assets</CardTitle>
              <Tabs
                tabs={[
                  { id: "all", label: "All Scope Assets" },
                  { id: "pending", label: "Pending Audit" },
                  { id: "discrepancy", label: "Discrepancies Only" },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <DataTable columns={columns} data={filteredAssets} />
          </CardContent>
        </Card>
      </div>

      {/* Record Audit Entry Modal */}
      <Modal
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        title="Audit Asset Verification"
        size="md"
      >
        {selectedAsset && (
          <form onSubmit={handleRecordAudit} className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Auditing: {selectedAsset.name}
              </h3>
              <p className="text-2xs text-muted-foreground font-mono">
                Tag: {selectedAsset.assetTag} · Serial: {selectedAsset.serialNumber}
              </p>
            </div>

            <div className="space-y-4 border-y border-border py-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Audit Result <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuditResultState("VERIFIED")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                      auditResultState === "VERIFIED"
                        ? "border-success bg-success/5 text-success font-semibold"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <CheckCircle className="h-5 w-5 mb-1" />
                    <span className="text-2xs">Verified</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditResultState("DAMAGED")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                      auditResultState === "DAMAGED"
                        ? "border-warning bg-warning/5 text-warning font-semibold"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5 mb-1" />
                    <span className="text-2xs">Damaged</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditResultState("MISSING")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                      auditResultState === "MISSING"
                        ? "border-destructive bg-destructive/5 text-destructive font-semibold"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <ShieldAlert className="h-5 w-5 mb-1" />
                    <span className="text-2xs">Missing</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Condition Notes / Discrepancy details
                </label>
                <textarea
                  placeholder="Describe asset condition or last known location if missing..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:opacity-50"
                />
              </div>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setAuditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                {isPending ? "Recording..." : "Record Entry"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </div>
  );
}
