
import React from 'react';
import CurrentMembership from './CurrentMembership';
import MembershipBenefits from './MembershipBenefits';
import { MembershipStatus } from "@/components/ui/MembershipBadge";

interface MembershipDetailsProps {
  membershipStatus: MembershipStatus;
}

const MembershipDetails: React.FC<MembershipDetailsProps> = ({ membershipStatus }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CurrentMembership membershipStatus={membershipStatus} />
      <MembershipBenefits />
    </div>
  );
};

export default MembershipDetails;
