
import React from "react";
import { cn } from "@/lib/utils";

// Update this type to be a string union type so TypeScript knows these values can be compared
export type MembershipStatus = "active" | "pending" | "expired";

interface MembershipBadgeProps {
  status: MembershipStatus;
  className?: string;
}

const MembershipBadge: React.FC<MembershipBadgeProps> = ({ status, className }) => {
  const getBadgeStyles = () => {
    switch (status) {
      case "active":
        return "bg-iteam-success/20 text-iteam-success border-iteam-success";
      case "pending":
        return "bg-iteam-warning/20 text-iteam-warning border-iteam-warning";
      case "expired":
        return "bg-iteam-error/20 text-iteam-error border-iteam-error";
      default:
        return "bg-gray-100 text-gray-500 border-gray-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "active":
        return "Active";
      case "pending":
        return "Pending";
      case "expired":
        return "Expired";
      default:
        return "Unknown";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getBadgeStyles(),
        className
      )}
    >
      {getStatusText()}
    </span>
  );
};

export default MembershipBadge;
