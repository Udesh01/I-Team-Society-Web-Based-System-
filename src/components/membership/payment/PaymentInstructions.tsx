
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PaymentInstructions: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Instructions</CardTitle>
        <CardDescription>
          Follow these steps to complete your membership payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-medium">Bank Account Details:</p>
          <div className="text-sm space-y-1">
            <p>Account Name: I-Team Society</p>
            <p>Account Number: 1234567890</p>
            <p>Bank: Bank of Ceylon</p>
            <p>Branch: University Branch</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Steps to Complete Payment:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Transfer the membership fee to the account above.</li>
            <li>Take a screenshot or photo of the payment slip/receipt.</li>
            <li>Upload the payment evidence below.</li>
            <li>Wait for admin approval (usually within 24-48 hours).</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentInstructions;
