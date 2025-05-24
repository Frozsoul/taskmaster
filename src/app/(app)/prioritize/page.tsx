
"use client";
import { PageHeader } from "@/components/PageHeader";
import { PrioritizationTool } from "@/components/prioritize/PrioritizationTool";
import { ListTodo } from "lucide-react";

export default function PrioritizeTasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="AI Task Prioritization"
        description="Leverage AI to get suggestions on task priorities. Review and adjust as needed."
        icon={ListTodo}
      />
      <PrioritizationTool />
    </div>
  );
}
