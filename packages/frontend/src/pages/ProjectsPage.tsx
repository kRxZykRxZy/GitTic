import React, { useState } from "react";
import { ProjectList } from "../components/projects/ProjectList";
import { CreateProjectModal } from "../components/projects/CreateProjectModal";
import { Button } from "../components/ui";
import { Plus, FolderOpen, Search, Filter } from "lucide-react";
import { Input } from "../components/ui";
import "../styles/globals.css";

/**
 * Modern Projects listing page with search, filters, and project management.
 */
export const ProjectsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "owned" | "member" | "starred">("all");

  const handleCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Projects</h1>
          <p className="text-text-secondary">
            Browse and manage your projects. Create repositories, collaborate with your team, and track your work.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterType === "all" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            All
          </Button>
          <Button
            variant={filterType === "owned" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterType("owned")}
          >
            Owned
          </Button>
          <Button
            variant={filterType === "member" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterType("member")}
          >
            Member
          </Button>
          <Button
            variant={filterType === "starred" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterType("starred")}
          >
            Starred
          </Button>
        </div>
      </div>

      {/* Projects List */}
      <ProjectList 
        key={refreshKey} 
        searchQuery={searchQuery}
        filterType={filterType}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};
