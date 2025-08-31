
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MembershipBenefits: React.FC = () => {
  const benefits = [
    "Access to all society events",
    "Participation in technical workshops",
    "Priority registration for special events",
    "Access to exclusive resources and materials",
    "Digital membership card (E-ID)",
    "Networking opportunities with industry partners",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Benefits</CardTitle>
        <CardDescription>Features included in your Silver membership</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-2">
          {benefits.map((benefit, index) => (
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
              <span className="text-sm">{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MembershipBenefits;
