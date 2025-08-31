import React from 'react';
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MembershipPlan } from '@/hooks/useMembershipData';

interface MembershipPlansProps {
  membershipPlans: MembershipPlan[];
}

const MembershipPlans: React.FC<MembershipPlansProps> = ({ membershipPlans }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {membershipPlans.map((plan) => (
        <Card key={plan.tier} className={`${plan.recommended ? 'border-iteam-primary' : ''} flex flex-col`}>
          <CardHeader>
            {plan.recommended && (
              <Badge className="w-fit mb-2 bg-iteam-primary">Recommended</Badge>
            )}
            <CardTitle className="flex items-center gap-2">
              {plan.tier}
            </CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold">Rs. {plan.price}</span>
              <span className="text-gray-500">/year</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-iteam-success"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              className={`w-full ${plan.recommended ? 'bg-iteam-primary' : ''}`}
            >
              Select {plan.tier}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default MembershipPlans;
