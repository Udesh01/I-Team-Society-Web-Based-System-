
import { useState } from 'react';
import { MembershipStatus } from "@/components/ui/MembershipBadge";

export interface MembershipPlan {
  tier: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: string;
  method: string;
  status: string;
  slip: string;
}

export function useMembershipData() {
  // This would typically come from a database query
  const [membershipStatus] = useState<MembershipStatus>("pending");
  
  // Mock membership plans based on user type (student in this case)
  const [membershipPlans] = useState<MembershipPlan[]>([
    {
      tier: "Bronze",
      price: 500,
      description: "1st Year Membership",
      features: [
        "Access to all events",
        "Basic member benefits",
        "Electronic ID card",
      ]
    },
    {
      tier: "Silver",
      price: 1000,
      description: "2nd Year Membership",
      features: [
        "All Bronze benefits",
        "Priority registration for workshops",
        "Access to exclusive resources",
      ],
      recommended: true
    },
    {
      tier: "Gold",
      price: 1500,
      description: "3rd Year Membership",
      features: [
        "All Silver benefits",
        "Mentorship opportunities",
        "Leadership program eligibility",
        "Networking with industry partners",
      ]
    }
  ]);

  // Mock payment history
  const [paymentHistory] = useState<PaymentRecord[]>([
    {
      id: "PAY123",
      date: "Jan 15, 2025",
      amount: "Rs. 1,000",
      method: "Bank Transfer",
      status: "Approved",
      slip: "slip-123.pdf"
    }
  ]);

  return {
    membershipStatus,
    membershipPlans,
    paymentHistory
  };
}
