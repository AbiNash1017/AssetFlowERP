"use client";

import React, { useState, useTransition } from "react";
import { Button, Input, Select } from "@/components/ui";
import { toast } from "sonner";
import { createMaintenanceRequest } from "@/app/actions/maintenance";
import { Wrench, AlertTriangle } from "lucide-react";

interface MaintenanceRequestFormProps {
  assets: any[];
  onSuccess: () => void;
}

export default function MaintenanceRequestForm({ assets, onSuccess }: MaintenanceRequestFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form states
  const [assetId, setAssetId] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [photoUrl, setPhotoUrl] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!assetId) {
      toast.error("Please select an asset.");
      return;
    }

    if (issue.length < 10) {
      toast.error("Issue description must be at least 10 characters long.");
      return;
    }

    const formData = new FormData();
    formData.append("assetId", assetId);
    formData.append("issue", issue);
    formData.append("priority", priority);
    formData.append("photoUrl", photoUrl);

    startTransition(async () => {
      const res = await createMaintenanceRequest(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Maintenance request submitted successfully.");
        // Clear form
        setAssetId("");
        setIssue("");
        setPriority("MEDIUM");
        setPhotoUrl("");
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
          Select Asset <span className="text-destructive">*</span>
        </label>
        <Select
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          options={[
            { value: "", label: "Choose an asset to request maintenance..." },
            ...assets.map((a) => ({
              value: a.id,
              label: `${a.name} (${a.assetTag} - ${a.location})`,
            })),
          ]}
          required
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
          Description of Issue <span className="text-destructive">*</span>
        </label>
        <textarea
          placeholder="Please describe the issue in detail (at least 10 characters)..."
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          rows={4}
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:opacity-50"
          required
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Provide details about what is broken, error codes, or symptoms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Priority <span className="text-destructive">*</span>
          </label>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            options={[
              { value: "LOW", label: "Low (General maintenance/minor issue)" },
              { value: "MEDIUM", label: "Medium (Needs attention, not blocking)" },
              { value: "HIGH", label: "High (Partially blocks work/operations)" },
              { value: "CRITICAL", label: "Critical (Complete failure/blocks critical work)" },
            ]}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Photo URL (Optional)
          </label>
          <Input
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
        </div>
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
          <Wrench className="h-4 w-4" />
          {isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}
