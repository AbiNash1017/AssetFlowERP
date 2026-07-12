"use client";

import React, { useState, useTransition } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Button, Input, Modal, ModalFooter, Badge } from "@/components/ui";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Plus, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/app/actions/organization";

interface CategoryTableProps {
  categories: any[];
}

interface CustomField {
  name: string;
  type: "text" | "number" | "boolean" | "date";
  required: boolean;
}

export default function CategoryTable({ categories }: CategoryTableProps) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [filterText, setFilterText] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const openAddModal = () => {
    setEditingCat(null);
    setName("");
    setDescription("");
    setCustomFields([]);
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    
    // Parse existing custom fields from JSON record to array
    const fieldsArr: CustomField[] = [];
    if (cat.customFields && typeof cat.customFields === "object") {
      Object.entries(cat.customFields).forEach(([fieldName, fieldSpec]: [string, any]) => {
        fieldsArr.push({
          name: fieldName,
          type: fieldSpec?.type || "text",
          required: !!fieldSpec?.required,
        });
      });
    }
    setCustomFields(fieldsArr);
    setModalOpen(true);
  };

  const handleAddField = () => {
    setCustomFields([
      ...customFields,
      { name: "", type: "text", required: false },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof CustomField, value: any) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [key]: value };
    setCustomFields(updated);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Map custom fields array to record
    const fieldsObj: Record<string, any> = {};
    let hasDuplicate = false;
    const namesSeen = new Set<string>();

    for (const field of customFields) {
      const trimmedName = field.name.trim();
      if (!trimmedName) continue;
      
      if (namesSeen.has(trimmedName.toLowerCase())) {
        hasDuplicate = true;
        break;
      }
      namesSeen.add(trimmedName.toLowerCase());
      fieldsObj[trimmedName] = {
        type: field.type,
        required: field.required,
      };
    }

    if (hasDuplicate) {
      toast.error("Custom field names must be unique.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("customFields", JSON.stringify(fieldsObj));

    startTransition(async () => {
      let res;
      if (editingCat) {
        res = await updateCategory(editingCat.id, formData);
      } else {
        res = await createCategory(formData);
      }

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(editingCat ? "Category updated successfully" : "Category created successfully");
        setModalOpen(false);
      }
    });
  };

  // Filter categories based on search text
  const filteredData = categories.filter((cat) => {
    const term = filterText.toLowerCase();
    return (
      cat.name.toLowerCase().includes(term) ||
      (cat.description || "").toLowerCase().includes(term)
    );
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs block">
          {row.getValue("description") || <span className="italic text-muted-foreground/50">No description</span>}
        </span>
      ),
    },
    {
      accessorKey: "customFields",
      header: "Custom Fields",
      cell: ({ row }) => {
        const fields = row.original.customFields;
        if (!fields || Object.keys(fields).length === 0) {
          return <span className="text-xs text-muted-foreground/50 italic">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {Object.keys(fields).map((k) => (
              <Badge key={k} variant="secondary" className="text-3xs uppercase font-semibold">
                {k}: {fields[k]?.type}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditModal(cat)}
              aria-label={`Edit ${cat.name}`}
            >
              <Edit2 className="h-3 w-3" />
              <span className="ml-1 text-2xs">Edit</span>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-foreground">Asset Categories</h3>
        <Button onClick={openAddModal} className="flex items-center gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        filterValue={filterText}
        onFilterChange={setFilterText}
        filterPlaceholder="Search categories..."
        emptyMessage="No asset categories found."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCat ? "Edit Category" : "Add Category"}
        description={editingCat ? "Update specifications and schema fields." : "Create asset specifications template with custom metadata fields."}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <Input
              label="Category Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laptops, Vehicles, Office Chairs"
              required
            />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of category purposes"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-primary" />
                Custom Fields Schema Builder
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddField}
                className="flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Custom Field</span>
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Define fields that must be entered when registering assets in this category (e.g. RAM, GPU, Model Year, Screen Size).
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {customFields.length > 0 ? (
                customFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-lg border border-border/60 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                        placeholder="Field Name (e.g. RAM)"
                        className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div className="w-32">
                      <select
                        value={field.type}
                        onChange={(e) => handleFieldChange(idx, "type", e.target.value as any)}
                        className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Yes / No</option>
                        <option value="date">Date</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 px-1">
                      <input
                        type="checkbox"
                        id={`req-${idx}`}
                        checked={field.required}
                        onChange={(e) => handleFieldChange(idx, "required", e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary cursor-pointer h-3.5 w-3.5"
                      />
                      <label htmlFor={`req-${idx}`} className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground select-none cursor-pointer">
                        Required
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer"
                      aria-label="Remove field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground bg-muted/10">
                  No custom fields defined. Registered assets will only require standard inventory columns.
                </div>
              )}
            </div>
          </div>

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
              {isPending ? "Saving..." : "Save Template"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
