import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useApi } from "../../hooks/useApi";
import { api } from "../../services/api-client";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { useToast } from "../../hooks/useToast";

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: {
    maxCores: number;
    maxRam: number; // GB
    gpuAccess: boolean;
    parallelWorkflows: number;
    storageGB: number;
    support: string;
  };
}

interface PaymentMethod {
  id: string;
  type: "card" | "paypal" | "bank";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface UserSubscription {
  tier: "free" | "pro" | "team" | "enterprise";
  status: "active" | "cancelled" | "expired";
  currentPeriodEnd?: string;
  paymentMethods: PaymentMethod[];
}

/**
 * Subscription and Payment Management Component
 * Handles tier upgrades, payment methods, and billing
 */
export const SubscriptionSettings: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const { data: subscription, loading, error, refetch } = useApi<UserSubscription>(
    () => api.get<UserSubscription>("/user/subscription"),
    []
  );

  const { data: tiers } = useApi<SubscriptionTier[]>(
    () => api.get<SubscriptionTier[]>("/subscription/tiers"),
    []
  );

  const handleUpgrade = async (tierId: string) => {
    try {
      await api.post("/user/subscription/upgrade", { tierId });
      toast.success("Subscription upgraded successfully!");
      await refetch();
      setSelectedTier(null);
    } catch (err) {
      toast.error("Failed to upgrade subscription");
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features.")) {
      return;
    }

    try {
      await api.post("/user/subscription/cancel");
      toast.success("Subscription cancelled");
      await refetch();
    } catch (err) {
      toast.error("Failed to cancel subscription");
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await api.post("/user/payment-methods", {
        type: "card",
        cardNumber: formData.get("cardNumber"),
        expiryMonth: formData.get("expiryMonth"),
        expiryYear: formData.get("expiryYear"),
        cvv: formData.get("cvv"),
        cardholderName: formData.get("cardholderName"),
      });
      
      toast.success("Payment method added successfully!");
      setShowAddPayment(false);
      await refetch();
    } catch (err) {
      toast.error("Failed to add payment method");
    }
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    if (!confirm("Remove this payment method?")) return;

    try {
      await api.delete(`/user/payment-methods/${methodId}`);
      toast.success("Payment method removed");
      await refetch();
    } catch (err) {
      toast.error("Failed to remove payment method");
    }
  };

  if (loading) return <LoadingSpinner message="Loading subscription..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!subscription) return <ErrorMessage message="Subscription not found" />;

  const pageStyle: React.CSSProperties = {
    maxWidth: "900px",
    margin: "0 auto",
  };

  const sectionStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "24px",
    marginBottom: "24px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "16px",
  };

  const tierGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  };

  const tierCardStyle = (isActive: boolean, isSelected: boolean): React.CSSProperties => ({
    padding: "20px",
    border: `2px solid ${isActive ? "var(--accent-green)" : isSelected ? "var(--accent-blue)" : "var(--border-color)"}`,
    borderRadius: "var(--radius)",
    background: isActive ? "rgba(33, 186, 69, 0.05)" : "var(--bg-primary)",
    cursor: !isActive ? "pointer" : "default",
    transition: "all 0.15s",
  });

  const tierNameStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "8px",
  };

  const tierPriceStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: 700,
    marginBottom: "4px",
    color: "var(--accent-blue)",
  };

  const tierIntervalStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "16px",
  };

  const featureListStyle: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
    margin: "16px 0",
  };

  const featureItemStyle: React.CSSProperties = {
    fontSize: "13px",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const paymentMethodStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    marginBottom: "8px",
  };

  const currentTier = subscription.tier;

  const availableTiers: SubscriptionTier[] = tiers || [
    {
      id: "free",
      name: "Free",
      price: 0,
      currency: "USD",
      interval: "month",
      features: {
        maxCores: 4,
        maxRam: 8,
        gpuAccess: false,
        parallelWorkflows: 2,
        storageGB: 10,
        support: "Community",
      },
    },
    {
      id: "pro",
      name: "Pro",
      price: 19,
      currency: "USD",
      interval: "month",
      features: {
        maxCores: 16,
        maxRam: 16,
        gpuAccess: true,
        parallelWorkflows: 10,
        storageGB: 100,
        support: "Email",
      },
    },
    {
      id: "team",
      name: "Team",
      price: 49,
      currency: "USD",
      interval: "month",
      features: {
        maxCores: 32,
        maxRam: 32,
        gpuAccess: true,
        parallelWorkflows: 50,
        storageGB: 500,
        support: "Priority",
      },
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 199,
      currency: "USD",
      interval: "month",
      features: {
        maxCores: 64,
        maxRam: 64,
        gpuAccess: true,
        parallelWorkflows: 999,
        storageGB: 2000,
        support: "24/7 Dedicated",
      },
    },
  ];

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>
        Subscription & Billing
      </h1>

      {/* Current Plan */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Current Plan</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 700, textTransform: "capitalize" }}>
              {subscription.tier}
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Status: {subscription.status}
              {subscription.currentPeriodEnd && (
                <> • Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
              )}
            </div>
          </div>
        </div>

        {subscription.tier !== "free" && subscription.status === "active" && (
          <button
            className="btn btn-danger"
            onClick={handleCancelSubscription}
            style={{ marginTop: "16px" }}
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* Available Plans */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Available Plans</h2>
        <div style={tierGridStyle}>
          {availableTiers.map((tier) => {
            const isActive = tier.id === currentTier;
            const isSelected = tier.id === selectedTier;

            return (
              <div
                key={tier.id}
                style={tierCardStyle(isActive, isSelected)}
                onClick={() => !isActive && setSelectedTier(tier.id)}
              >
                <div style={tierNameStyle}>{tier.name}</div>
                <div style={tierPriceStyle}>
                  ${tier.price}
                  <span style={{ fontSize: "16px", color: "var(--text-secondary)" }}>
                    /{tier.interval}
                  </span>
                </div>
                
                <ul style={featureListStyle}>
                  <li style={featureItemStyle}>
                    ✓ {tier.features.maxCores} CPU cores max
                  </li>
                  <li style={featureItemStyle}>
                    ✓ {tier.features.maxRam}GB RAM max
                  </li>
                  <li style={featureItemStyle}>
                    {tier.features.gpuAccess ? "✓" : "✗"} GPU access
                  </li>
                  <li style={featureItemStyle}>
                    ✓ {tier.features.parallelWorkflows} parallel workflows
                  </li>
                  <li style={featureItemStyle}>
                    ✓ {tier.features.storageGB}GB storage
                  </li>
                  <li style={featureItemStyle}>
                    ✓ {tier.features.support} support
                  </li>
                </ul>

                {isActive ? (
                  <div style={{
                    padding: "8px",
                    background: "var(--accent-green)",
                    color: "#fff",
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}>
                    Current Plan
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                    onClick={() => handleUpgrade(tier.id)}
                  >
                    Upgrade to {tier.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Methods */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Payment Methods</h2>
        
        {subscription.paymentMethods.length > 0 ? (
          <div>
            {subscription.paymentMethods.map((method) => (
              <div key={method.id} style={paymentMethodStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "24px" }}>💳</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>
                      {method.brand} ****{method.last4}
                      {method.isDefault && (
                        <span style={{
                          marginLeft: "8px",
                          padding: "2px 6px",
                          background: "var(--accent-blue)",
                          color: "#fff",
                          fontSize: "11px",
                          borderRadius: "3px",
                        }}>
                          Default
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: "4px 12px", fontSize: "12px" }}
                  onClick={() => handleRemovePaymentMethod(method.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
            No payment methods added
          </div>
        )}

        {!showAddPayment ? (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddPayment(true)}
            style={{ marginTop: "16px" }}
          >
            + Add Payment Method
          </button>
        ) : (
          <div style={{ marginTop: "16px", padding: "20px", background: "var(--bg-primary)", borderRadius: "var(--radius)" }}>
            <h3 style={{ marginBottom: "16px" }}>Add Credit/Debit Card</h3>
            <form onSubmit={handleAddPaymentMethod}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  name="cardholderName"
                  className="input"
                  placeholder="Cardholder Name"
                  required
                />
                <input
                  name="cardNumber"
                  className="input"
                  placeholder="Card Number"
                  maxLength={16}
                  required
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <input
                    name="expiryMonth"
                    className="input"
                    placeholder="MM"
                    maxLength={2}
                    required
                  />
                  <input
                    name="expiryYear"
                    className="input"
                    placeholder="YYYY"
                    maxLength={4}
                    required
                  />
                  <input
                    name="cvv"
                    className="input"
                    placeholder="CVV"
                    maxLength={4}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" className="btn btn-primary">
                    Add Card
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowAddPayment(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Resource Usage */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Resource Limits</h2>
        <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Based on your current {subscription.tier} plan
        </div>
        
        {(() => {
          const currentPlan = availableTiers.find(t => t.id === subscription.tier);
          if (!currentPlan) return null;

          return (
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--bg-primary)", borderRadius: "var(--radius)" }}>
                <span>Max CPU Cores</span>
                <strong>{currentPlan.features.maxCores} cores</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--bg-primary)", borderRadius: "var(--radius)" }}>
                <span>Max RAM</span>
                <strong>{currentPlan.features.maxRam}GB</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--bg-primary)", borderRadius: "var(--radius)" }}>
                <span>GPU Access</span>
                <strong style={{ color: currentPlan.features.gpuAccess ? "var(--accent-green)" : "var(--accent-red)" }}>
                  {currentPlan.features.gpuAccess ? "Enabled" : "Disabled (Upgrade required)"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--bg-primary)", borderRadius: "var(--radius)" }}>
                <span>Parallel Workflows</span>
                <strong>{currentPlan.features.parallelWorkflows}</strong>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
