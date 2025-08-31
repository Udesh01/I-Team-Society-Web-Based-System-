
import React from 'react';
import MembershipBadge, { MembershipStatus } from "@/components/ui/MembershipBadge";

interface MembershipHeaderProps {
  membershipStatus: MembershipStatus;
}

const MembershipHeader: React.FC<MembershipHeaderProps> = ({ membershipStatus }) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Membership</h1>
      <MembershipBadge status={membershipStatus} />
    </div>
  );
};

export default MembershipHeader;
