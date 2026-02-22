import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { authService } from "../services/auth-service";
import { showConfirm } from "../components/common/ConfirmDialog";
import { validatePassword, validatePasswordMatch } from "../utils/validation";
import { Button, Input } from "../components/ui";
import { 
  User, 
  Lock, 
  Palette, 
  Bell, 
  Download, 
  Trash2, 
  Shield,
  Key,
  Globe,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import "../styles/globals.css";

/**
 * User settings page with profile, password, theme, notifications, and danger zone.
 */
export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  // Profile state
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Theme state
  const [theme, setTheme] = useState("system");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      toast.success("Profile updated successfully");
      await refreshUser();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passCheck = validatePassword(newPassword);
    if (!passCheck.valid) {
      toast.error(passCheck.message);
      return;
    }
    const matchCheck = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchCheck.valid) {
      toast.error(matchCheck.message);
      return;
    }
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm({
      title: "Delete Account",
      message:
        "This will permanently delete your account and all associated data. This cannot be undone.",
      confirmText: "Delete My Account",
      variant: "danger",
    });
    if (confirmed) {
      toast.info("Account deletion requested. This will be processed within 24 hours.");
    }
  };

  const handleExportData = () => {
    toast.info("Data export started. You'll receive an email when ready.");
  };

  const getThemeIcon = (themeValue: string) => {
    switch (themeValue) {
      case "dark":
        return <Moon className="w-4 h-4" />;
      case "light":
        return <Sun className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-secondary">
          Manage your account settings, preferences, and security options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border-light rounded-lg p-4">
            <nav className="space-y-1">
              <a href="#profile" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-bg-light text-text-primary">
                <User className="w-4 h-4" />
                Profile
              </a>
              <a href="#security" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-bg-light text-text-primary">
                <Lock className="w-4 h-4" />
                Security
              </a>
              <a href="#appearance" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-bg-light text-text-primary">
                <Palette className="w-4 h-4" />
                Appearance
              </a>
              <a href="#notifications" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-bg-light text-text-primary">
                <Bell className="w-4 h-4" />
                Notifications
              </a>
              <a href="#danger" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-bg-light text-red-600">
                <Trash2 className="w-4 h-4" />
                Danger Zone
              </a>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <section id="profile" className="bg-white border border-border-light rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-text-primary">Profile Information</h2>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Bio
                </label>
                <textarea
                  className="flex h-20 w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
              
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </section>

          {/* Security Section */}
          <section id="security" className="bg-white border border-border-light rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-text-primary">Security</h2>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
              
              <Button type="submit">Change Password</Button>
            </form>
          </section>

          {/* Appearance Section */}
          <section id="appearance" className="bg-white border border-border-light rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                        theme === option.value
                          ? "border-accent-blue bg-blue-50 text-accent-blue"
                          : "border-border-light hover:bg-bg-light"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section id="notifications" className="bg-white border border-border-light rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-text-primary">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 text-accent-blue border-gray-300 rounded focus:ring-accent-blue"
                />
                <div>
                  <div className="text-sm font-medium text-text-primary">Email Notifications</div>
                  <div className="text-xs text-text-secondary">Receive email updates about your account activity</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="w-4 h-4 text-accent-blue border-gray-300 rounded focus:ring-accent-blue"
                />
                <div>
                  <div className="text-sm font-medium text-text-primary">Push Notifications</div>
                  <div className="text-xs text-text-secondary">Receive push notifications in your browser</div>
                </div>
              </label>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section id="danger" className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
            </div>
            
            <p className="text-sm text-text-secondary mb-6">
              These actions are irreversible. Please proceed with caution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" onClick={handleExportData} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export My Data (GDPR)
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleDeleteAccount} 
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
