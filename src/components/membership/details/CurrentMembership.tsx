
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MembershipBadge, { MembershipStatus } from "@/components/ui/MembershipBadge";

interface CurrentMembershipProps {
  membershipStatus: MembershipStatus;
}

const CurrentMembership: React.FC<CurrentMembershipProps> = ({ membershipStatus }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Membership</CardTitle>
        <CardDescription>Details of your active membership</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between border-b pb-2">
          <span className="text-sm font-medium text-gray-500">Membership Status</span>
          <MembershipBadge status={membershipStatus} />
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-sm font-medium text-gray-500">Membership Tier</span>
          <span className="text-sm">Silver</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-sm font-medium text-gray-500">Start Date</span>
          <span className="text-sm">Jan 01, 2025</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-sm font-medium text-gray-500">Expiry Date</span>
          <span className="text-sm">Dec 31, 2025</span>
        </div>
        <div className="flex justify-between pb-2">
          <span className="text-sm font-medium text-gray-500">E-ID Number</span>
          <span className="text-sm">ABC/2025/STU/0012</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">Renew Membership</Button>
      </CardFooter>
    </Card>
  );
};

export default CurrentMembership;
