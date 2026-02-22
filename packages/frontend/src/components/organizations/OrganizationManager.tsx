import React, { useState, useEffect } from "react";
import { Button, Input, Avatar, Badge } from "../ui";
import { 
  Building2, 
  Users, 
  Settings, 
  Plus, 
  Mail, 
  Shield, 
  Crown,
  UserCheck,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserX,
  Key
} from "lucide-react";
import { authServiceV2, Organization, User } from "../../services/auth-service-v2";

interface OrganizationMember {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  lastActiveAt: string;
}

export const OrganizationManager: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Create organization form state
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", description: "" });
  
  // Invite form state
  const [inviteData, setInviteData] = useState({ email: "", role: "member" as const });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const user = authServiceV2.getCurrentUser();
      if (user) {
        setOrganizations(user.organizations);
        setCurrentOrganization(user.currentOrganization || user.organizations[0] || null);
        if (user.currentOrganization) {
          loadMembers(user.currentOrganization.id);
        }
      }
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (organizationId: string) => {
    try {
      // Mock data for demonstration
      const mockMembers: OrganizationMember[] = [
        {
          id: "1",
          username: "kRxZy",
          email: "kRxZy@example.com",
          role: "owner",
          joinedAt: "2024-01-01T00:00:00Z",
          lastActiveAt: new Date().toISOString(),
        },
        {
          id: "2",
          username: "alice",
          email: "alice@example.com",
          role: "admin",
          joinedAt: "2024-01-15T00:00:00Z",
          lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: "3",
          username: "bob",
          email: "bob@example.com",
          role: "member",
          joinedAt: "2024-02-01T00:00:00Z",
          lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];
      setMembers(mockMembers);
    } catch (error) {
      console.error("Failed to load members:", error);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      const organization = await authServiceV2.createOrganization(newOrg);
      setOrganizations([...organizations, organization]);
      setCurrentOrganization(organization);
      setShowCreateModal(false);
      setNewOrg({ name: "", slug: "", description: "" });
    } catch (error) {
      console.error("Failed to create organization:", error);
    }
  };

  const handleInviteMember = async () => {
    if (!currentOrganization) return;
    
    try {
      await authServiceV2.inviteToOrganization(currentOrganization.id, inviteData);
      setShowInviteModal(false);
      setInviteData({ email: "", role: "member" });
      // Reload members
      loadMembers(currentOrganization.id);
    } catch (error) {
      console.error("Failed to invite member:", error);
    }
  };

  const handleSwitchOrganization = async (organization: Organization) => {
    try {
      await authServiceV2.switchOrganization(organization.id);
      setCurrentOrganization(organization);
      loadMembers(organization.id);
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentOrganization) return;
    
    try {
      await authServiceV2.removeFromOrganization(currentOrganization.id, memberId);
      setMembers(members.filter(member => member.id !== memberId));
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: "admin" | "member" | "viewer") => {
    if (!currentOrganization) return;
    
    try {
      await authServiceV2.updateMemberRole(currentOrganization.id, memberId, newRole);
      setMembers(members.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ));
    } catch (error) {
      console.error("Failed to update member role:", error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "member":
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case "viewer":
        return <Users className="w-4 h-4 text-gray-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "member":
        return "bg-green-50 text-green-700 border-green-200";
      case "viewer":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Organizations</h1>
          <p className="text-text-secondary">
            Manage your organizations, members, and settings.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Organization
        </Button>
      </div>

      {/* Organization Switcher */}
      {organizations.length > 0 && (
        <div className="bg-white border border-border-light rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Your Organizations</h2>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  currentOrganization?.id === org.id
                    ? "border-accent-blue bg-blue-50"
                    : "border-border-light hover:bg-bg-light"
                }`}
                onClick={() => handleSwitchOrganization(org)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Avatar size="md" name={org.name} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{org.name}</h3>
                    <p className="text-sm text-text-secondary">@{org.slug}</p>
                  </div>
                  {currentOrganization?.id === org.id && (
                    <Badge className="bg-accent-blue text-white">Current</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{org.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>{org.repositoryCount} repos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentOrganization && (
        <>
          {/* Organization Details */}
          <div className="bg-white border border-border-light rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar size="lg" name={currentOrganization.name} />
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{currentOrganization.name}</h2>
                  <p className="text-text-secondary">@{currentOrganization.slug}</p>
                  {currentOrganization.description && (
                    <p className="text-text-secondary mt-2">{currentOrganization.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Invite Members
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </div>
            </div>

            {/* Organization Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{currentOrganization.memberCount}</div>
                <div className="text-sm text-text-secondary">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{currentOrganization.repositoryCount}</div>
                <div className="text-sm text-text-secondary">Repositories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{currentOrganization.workflowCount}</div>
                <div className="text-sm text-text-secondary">Workflows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary capitalize">{currentOrganization.subscriptionTier}</div>
                <div className="text-sm text-text-secondary">Plan</div>
              </div>
            </div>
          </div>

          {/* Members Management */}
          <div className="bg-white border border-border-light rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">Members</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                  className="w-64"
                />
                <Button
                  variant="secondary"
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Invite
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm" name={member.username} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{member.username}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            <span className="capitalize">{member.role}</span>
                          </div>
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary">{member.email}</div>
                      <div className="text-xs text-text-secondary">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.role !== "owner" && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as "admin" | "member" | "viewer")}
                          className="text-sm border border-border-light rounded-md px-2 py-1"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Create Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Organization Name
                </label>
                <Input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Slug
                </label>
                <Input
                  type="text"
                  value={newOrg.slug}
                  onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                  placeholder="organization-slug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description (optional)
                </label>
                <textarea
                  className="flex h-20 w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  placeholder="Describe your organization"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCreateOrganization}>Create</Button>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && currentOrganization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Invite to {currentOrganization.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="member@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Role
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as "admin" | "member" | "viewer" })}
                  className="w-full flex h-10 rounded-md border border-border-light bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleInviteMember}>Send Invite</Button>
              <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
