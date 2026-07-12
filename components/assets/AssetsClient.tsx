"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { Button, Badge, Modal } from "@/components/ui";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye, Edit2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import AssetForm from "./AssetForm";
import { permissions } from "@/lib/rbac";
import { Role, AssetStatus } from "@prisma/client";

interface AssetsClientProps {
  assets: any[];
  categories: any[];
  userRole: Role;
}

const statusMap: Record<AssetStatus, { label: string; color: string }> = {
  AVAILABLE: { label: "Available", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  ALLOCATED: { label: "Allocated", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  RESERVED: { label: "Reserved", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  UNDER_MAINTENANCE: { label: "In Repair", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  LOST: { label: "Lost", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  RETIRED: { label: "Retired", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  DISPOSED: { label: "Disposed", color: "bg-slate-700/10 text-slate-700 border-slate-700/20" },
};

export default function AssetsClient({
  assets,
  categories,
  userRole,
}: AssetsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  
  // Search & Filter State
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const openAddModal = () => {
    setEditingAsset(null);
    setModalOpen(true);
  };

  const openEditModal = (asset: any) => {
    setEditingAsset(asset);
    setModalOpen(true);
  };

  // Filter logic
  const filteredAssets = assets.filter((asset) => {
    const term = searchText.toLowerCase();
    const matchesSearch =
      asset.name.toLowerCase().includes(term) ||
      asset.assetTag.toLowerCase().includes(term) ||
      asset.serialNumber.toLowerCase().includes(term) ||
      asset.location.toLowerCase().includes(term);

    const matchesStatus = selectedStatus === "ALL" || asset.status === selectedStatus;
    const matchesCategory = selectedCategory === "ALL" || asset.categoryId === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "assetTag",
      header: "Asset Tag",
      cell: ({ row }) => (
        <Link
          href={`/assets/${row.original.id}`}
          className="font-mono font-bold text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded border border-primary/25 transition-colors cursor-pointer"
        >
          {row.getValue("assetTag")}
        </Link>
      ),
    },
    {
      accessorKey: "name",
      header: "Asset Name",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-foreground">{row.getValue("name")}</span>
          {row.original.isBookable && (
            <span className="ml-1.5 inline-flex items-center rounded bg-teal-brand/10 px-1 py-0.5 text-3xs font-bold text-teal-brand uppercase tracking-wider border border-teal-brand/15">
              Bookable
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span>{row.original.category?.name || "N/A"}</span>,
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as AssetStatus;
        const config = statusMap[val] || { label: val, color: "" };
        return (
          <Badge className={`border font-semibold ${config.color}`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "holder",
      header: "Current Allocation",
      cell: ({ row }) => {
        const activeAllocation = row.original.allocations?.[0];
        if (!activeAllocation) {
          return <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> In Stock</span>;
        }
        
        const isOverdue = activeAllocation.status === "OVERDUE" || (activeAllocation.expectedReturnDate && new Date(activeAllocation.expectedReturnDate) < new Date());
        
        return (
          <div className="space-y-0.5">
            {activeAllocation.user ? (
              <span className="text-xs font-semibold text-foreground">User: {activeAllocation.user.name}</span>
            ) : activeAllocation.department ? (
              <span className="text-xs font-semibold text-foreground">Dept: {activeAllocation.department.name}</span>
            ) : (
              <span className="text-xs font-semibold text-foreground">Unassigned</span>
            )}
            
            {isOverdue ? (
              <div className="text-3xs text-destructive font-bold flex items-center gap-0.5 uppercase tracking-wider">
                <AlertTriangle className="h-3 w-3 shrink-0" /> Overdue Return
              </div>
            ) : (
              activeAllocation.expectedReturnDate && (
                <div className="text-3xs text-muted-foreground">Due: {new Date(activeAllocation.expectedReturnDate).toLocaleDateString()}</div>
              )
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Link href={`/assets/${asset.id}`} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-all hover:bg-muted" title="View Details">
              <Eye className="h-3.5 w-3.5" />
            </Link>
            {permissions.canRegisterAsset(userRole) && (
              <button
                onClick={() => openEditModal(asset)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary transition-all hover:bg-muted cursor-pointer"
                title="Edit Asset"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Asset Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and search all enterprise capital assets, devices, resources, and their checkout statuses.
          </p>
        </div>

        {permissions.canRegisterAsset(userRole) && (
          <Button onClick={openAddModal} className="flex items-center gap-1.5 shrink-0 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Register Asset</span>
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="grid gap-4 sm:grid-cols-3 bg-muted/30 p-4 rounded-xl border border-border/80">
        <div>
          <label className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Filter by Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full h-9 bg-card border border-input rounded-lg px-3 py-1 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNDER_MAINTENANCE">In Repair</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>

        <div>
          <label className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Filter by Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-9 bg-card border border-input rounded-lg px-3 py-1 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Quick Search</label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by tag, name, serial, location..."
            className="w-full h-9 bg-card border border-input rounded-lg px-3 py-1 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAssets}
        emptyMessage="No inventory assets found matching current criteria."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAsset ? "Edit Asset Catalog" : "Register New Asset"}
        description={editingAsset ? `Edit properties of asset tag ${editingAsset.assetTag}` : "Enter standard properties and custom specs for this capital asset."}
        size="lg"
      >
        <AssetForm
          categories={categories}
          initialAsset={editingAsset}
          onSubmitSuccess={() => {
            setModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
