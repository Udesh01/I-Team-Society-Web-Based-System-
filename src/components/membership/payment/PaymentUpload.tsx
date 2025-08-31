import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

const PaymentUpload: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("1000");
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPaymentSlip(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentSlip) {
      toast({
        title: "Error",
        description: "Please upload a payment slip or receipt",
        variant: "destructive",
      });
      return;
    }

    if (!paymentDate) {
      toast({
        title: "Error",
        description: "Please select a payment date",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a payment",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const userId = session.user.id;

      // First, create a membership record if one doesn't exist
      const { data: existingMembership, error: membershipCheckError } =
        await supabase
          .from("memberships")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "pending_payment")
          .maybeSingle();

      if (membershipCheckError) {
        throw membershipCheckError;
      }

      let membershipId;

      if (!existingMembership) {
        // Create a new membership
        const { data: newMembership, error: createMembershipError } =
          await supabase
            .from("memberships")
            .insert({
              user_id: userId,
              tier: "silver",
              amount: Number(paymentAmount),
              status: "pending_approval",
            })
            .select("id")
            .maybeSingle(); // Use maybeSingle() to handle edge cases gracefully

        if (createMembershipError) {
          throw createMembershipError;
        }

        membershipId = newMembership.id;
      } else {
        membershipId = existingMembership.id;

        // Update membership status
        await supabase
          .from("memberships")
          .update({ status: "pending_approval" })
          .eq("id", membershipId);
      }

      // Upload the payment slip to storage
      const fileExt = paymentSlip.name.split(".").pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;

      // First check if payments bucket exists, if not this will fail silently
      const { data: slipUpload, error: uploadError } = await supabase.storage
        .from("payment_slips")
        .upload(fileName, paymentSlip, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: publicUrl } = supabase.storage
        .from("payment_slips")
        .getPublicUrl(fileName);

      // Create a payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: userId,
        membership_id: membershipId,
        amount: Number(paymentAmount),
        payment_date: paymentDate,
        bank_slip_url: publicUrl.publicUrl,
        notes: notes,
        status: "pending",
      });

      if (paymentError) {
        throw paymentError;
      }

      toast({
        title: "Payment submitted",
        description: "Your payment has been submitted for review.",
      });

      // Reset form
      setPaymentDate("");
      setPaymentAmount("1000");
      setPaymentSlip(null);
      setNotes("");
    } catch (error: any) {
      console.error("Error submitting payment:", error);
      toast({
        title: "Submission failed",
        description:
          error.message || "There was an error submitting your payment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Payment Evidence</CardTitle>
        <CardDescription>
          Upload your bank slip or payment receipt
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tier">Selected Membership Tier</Label>
            <Input id="tier" value="Silver - Rs. 1,000" readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-date">Payment Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount (Rs.)</Label>
            <Input
              id="payment-amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-slip">Upload Bank Slip/Receipt</Label>
            <Input
              id="payment-slip"
              type="file"
              accept="image/*, application/pdf"
              onChange={handleFileChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: JPG, PNG, PDF (Max: 5MB)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-notes">Additional Notes (Optional)</Label>
            <Input
              id="payment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-iteam-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Payment"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PaymentUpload;
