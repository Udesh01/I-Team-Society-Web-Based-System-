
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PaymentRecord {
  id: string;
  date: string;
  amount: string;
  method: string;
  status: string;
  slip: string;
}

interface PaymentHistoryProps {
  paymentHistory: PaymentRecord[];
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ paymentHistory: initialPaymentHistory }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPaymentHistory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('payments')
          .select('id, payment_date, amount, status, bank_slip_url')
          .eq('user_id', session.user.id)
          .order('payment_date', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedPayments = data.map(payment => ({
            id: payment.id,
            date: new Date(payment.payment_date).toLocaleDateString(),
            amount: `Rs. ${payment.amount}`,
            method: 'Bank Transfer',
            status: payment.status,
            slip: payment.bank_slip_url
          }));
          
          setPayments(formattedPayments);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  const handleViewSlip = (slipUrl: string) => {
    window.open(slipUrl, '_blank');
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Payment History</h2>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-iteam-primary"></div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4 text-left">Payment ID</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Method</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{payment.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4">{payment.date}</td>
                    <td className="py-3 px-4">{payment.amount}</td>
                    <td className="py-3 px-4">{payment.method}</td>
                    <td className="py-3 px-4">
                      <Badge className={payment.status === 'approved' ? 'bg-iteam-success' : 
                        payment.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewSlip(payment.slip)}
                      >
                        View Slip
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b">
                  <td colSpan={6} className="py-3 px-4 text-center text-gray-500">
                    No payment history available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
