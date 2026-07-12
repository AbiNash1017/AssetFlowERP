"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Input, Select, Button, ModalFooter } from "@/components/ui";
import { toast } from "sonner";
import { registerAsset, updateAsset } from "@/app/actions/assets";

interface AssetFormProps {
  categories: any[];
  departments?: any[];
  initialAsset?: any;
  onSubmitSuccess?: (id?: string) => void;
}

export default function AssetForm({
  categories,
  departments = [],
  initialAsset,
  onSubmitSuccess,
}: AssetFormProps) {
  const [isPending, startTransition] = useTransition();

  // Basic fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [condition, setCondition] = useState("NEW");
  const [location, setLocation] = useState("");
  const [isBookable, setIsBookable] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  // Custom fields state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [activeCategory, setActiveCategory] = useState<any>(null);

  // Populate form if editing
  useEffect(() => {
    if (initialAsset) {
      setName(initialAsset.name || "");
      setCategoryId(initialAsset.categoryId || "");
      setSerialNumber(initialAsset.serialNumber || "");
      
      // Format date for input: YYYY-MM-DD
      if (initialAsset.acquisitionDate) {
        const dateObj = new Date(initialAsset.acquisitionDate);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");
        setAcquisitionDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setAcquisitionDate("");
      }
      
      setAcquisitionCost(String(initialAsset.acquisitionCost || ""));
      setCondition(initialAsset.condition || "NEW");
      setLocation(initialAsset.location || "");
      setIsBookable(!!initialAsset.isBookable);
      setPhotoUrl(initialAsset.photoUrl || "");
      
      // Populate custom fields values from documents
      if (initialAsset.documents && typeof initialAsset.documents === "object") {
        setCustomFieldValues(initialAsset.documents);
      } else {
        setCustomFieldValues({});
      }
    } else {
      // Set defaults for creation
      setName("");
      setCategoryId("");
      setSerialNumber("");
      setAcquisitionDate(new Date().toISOString().split("T")[0]);
      setAcquisitionCost("");
      setCondition("NEW");
      setLocation("");
      setIsBookable(false);
      setPhotoUrl("");
      setDepartmentId("");
      setCustomFieldValues({});
    }
  }, [initialAsset, categories]);

  // Update active category dynamic custom fields
  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    setActiveCategory(cat || null);
    
    // Clear out custom field values if switching category,
    // except when initializing the edit form.
    if (initialAsset && initialAsset.categoryId === categoryId) {
      if (initialAsset.documents && typeof initialAsset.documents === "object") {
        setCustomFieldValues(initialAsset.documents);
      }
    } else {
      setCustomFieldValues({});
    }
  }, [categoryId, categories, initialAsset]);

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setCustomFieldValues({
      ...customFieldValues,
      [fieldName]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Verify custom fields constraints (required fields)
    if (activeCategory?.customFields) {
      for (const [name, spec] of Object.entries(activeCategory.customFields) as [string, any][]) {
        if (spec?.required && (customFieldValues[name] === undefined || customFieldValues[name] === "")) {
          toast.error(`Custom field "${name}" is required.`);
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("categoryId", categoryId);
    formData.append("serialNumber", serialNumber);
    formData.append("acquisitionDate", acquisitionDate);
    formData.append("acquisitionCost", acquisitionCost);
    formData.append("condition", condition);
    formData.append("location", location);
    formData.append("isBookable", isBookable ? "true" : "false");
    formData.append("photoUrl", photoUrl);
    formData.append("documents", JSON.stringify(customFieldValues));
    if (!initialAsset) {
      formData.append("departmentId", departmentId);
    }

    startTransition(async () => {
      let res;
      if (initialAsset) {
        res = await updateAsset(initialAsset.id, formData);
      } else {
        res = await registerAsset(formData);
      }

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(
          initialAsset
            ? "Asset specifications updated successfully."
            : `Asset registered successfully as tag: ${(res as any).assetTag}`
        );
        if (onSubmitSuccess) onSubmitSuccess((res as any)?.id);
      }
    });
  };

  const conditionOptions = [
    { value: "NEW", label: "New / Mint" },
    { value: "GOOD", label: "Good / Operational" },
    { value: "FAIR", label: "Fair / Worn" },
    { value: "POOR", label: "Poor / Needs Attention" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Asset Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. MacBook Pro M3"
          required
        />
        <Select
          label="Asset Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select category..."
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Serial Number / Service Tag"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          placeholder="e.g. C02XG123L5N6"
          required
        />
        <Input
          label="Location / Storage Rack"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. SF Office - Floor 2"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Acquisition Date"
          type="date"
          value={acquisitionDate}
          onChange={(e) => setAcquisitionDate(e.target.value)}
          required
        />
        <Input
          label="Acquisition Cost ($)"
          type="number"
          step="0.01"
          min="0"
          value={acquisitionCost}
          onChange={(e) => setAcquisitionCost(e.target.value)}
          placeholder="e.g. 2499.00"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Operational Condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          options={conditionOptions}
          required
        />
        <Input
          label="Hardware Photo URL"
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="e.g. https://images.unsplash.com/photo-..."
        />
      </div>

      {!initialAsset && (
        <Select
          label="Initial Department Assignment (Optional)"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          options={[{ value: "", label: "Keep in Inventory / Available" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
          hint="Directly allocate this asset to a department upon registration"
        />
      )}

      <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border/80">
        <input
          type="checkbox"
          id="isBookable"
          checked={isBookable}
          onChange={(e) => setIsBookable(e.target.checked)}
          className="rounded border-input text-primary focus:ring-primary cursor-pointer h-4 w-4"
        />
        <div className="grid gap-0.5">
          <label htmlFor="isBookable" className="text-sm font-semibold text-foreground cursor-pointer select-none">
            Is Bookable / Shareable Resource
          </label>
          <span className="text-xs text-muted-foreground">
            Allow employees to reserve this device or conference room via the calendar dashboard.
          </span>
        </div>
      </div>

      {/* Dynamic custom fields section */}
      {activeCategory?.customFields && Object.keys(activeCategory.customFields).length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <span className="block text-sm font-bold text-foreground">
            Category Specifications ({activeCategory.name})
          </span>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(activeCategory.customFields).map(([fieldName, spec]: [string, any]) => {
              const val = customFieldValues[fieldName] ?? "";
              const label = `${fieldName}${spec?.required ? " *" : ""}`;
              
              if (spec?.type === "boolean") {
                return (
                  <Select
                    key={fieldName}
                    label={label}
                    value={String(val)}
                    onChange={(e) => handleCustomFieldChange(fieldName, e.target.value === "true")}
                    options={[
                      { value: "", label: "Select Yes/No" },
                      { value: "true", label: "Yes" },
                      { value: "false", label: "No" },
                    ]}
                    required={spec?.required}
                  />
                );
              }
              
              return (
                <Input
                  key={fieldName}
                  label={label}
                  type={spec?.type === "number" ? "number" : spec?.type === "date" ? "date" : "text"}
                  value={val}
                  onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                  placeholder={`Enter ${fieldName.toLowerCase()}`}
                  required={spec?.required}
                />
              );
            })}
          </div>
        </div>
      )}

      <ModalFooter>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Processing..." : initialAsset ? "Update Asset" : "Register Inventory"}
        </Button>
      </ModalFooter>
    </form>
  );
}
