"use client";

import React, { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import DepartmentTable from "./DepartmentTable";
import CategoryTable from "./CategoryTable";
import EmployeeTable from "./EmployeeTable";
import { Building2, Settings, Users2 } from "lucide-react";

interface OrganizationClientProps {
  departments: any[];
  categories: any[];
  employees: any[];
}

export default function OrganizationClient({
  departments,
  categories,
  employees,
}: OrganizationClientProps) {
  const [activeTab, setActiveTab] = useState("departments");

  const tabs = [
    {
      id: "departments",
      label: "Department Management",
      icon: <Building2 className="h-4 w-4" />,
      badge: departments.length,
    },
    {
      id: "categories",
      label: "Asset Categories",
      icon: <Settings className="h-4 w-4" />,
      badge: categories.length,
    },
    {
      id: "employees",
      label: "Employee Directory",
      icon: <Users2 className="h-4 w-4" />,
      badge: employees.length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-border">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Organization Setup</h1>
        <p className="text-sm text-muted-foreground">
          Manage system departments, dynamic asset category schemas, and employee authorization roles.
        </p>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />

      <Card className="p-6">
        {activeTab === "departments" && (
          <DepartmentTable departments={departments} employees={employees} />
        )}
        {activeTab === "categories" && (
          <CategoryTable categories={categories} />
        )}
        {activeTab === "employees" && (
          <EmployeeTable employees={employees} />
        )}
      </Card>
    </div>
  );
}
