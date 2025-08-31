
import React, { useEffect, useState } from 'react';
import PaymentInstructions from './PaymentInstructions';
import PaymentUpload from './PaymentUpload';
import PaymentHistory from './PaymentHistory';
import { PaymentRecord } from '@/hooks/useMembershipData';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSectionProps {
  paymentHistory: PaymentRecord[];
}

const PaymentSection: React.FC<PaymentSectionProps> = ({ paymentHistory }) => {
  const [userHasPendingPayment, setUserHasPendingPayment] = useState(false);
  
  useEffect(() => {
    async function checkPendingMembership() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        const { data } = await supabase
          .from('memberships')
          .select('status')
          .eq('user_id', session.user.id)
          .eq('status', 'pending_approval')
          .maybeSingle();
        
        setUserHasPendingPayment(!!data);
      } catch (error) {
        console.error('Error checking membership status:', error);
      }
    }
    
    checkPendingMembership();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaymentInstructions />
        {!userHasPendingPayment && <PaymentUpload />}
        {userHasPendingPayment && (
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-medium text-yellow-800">Payment Under Review</h3>
            <p className="mt-2 text-sm text-yellow-700">
              Your payment is currently being reviewed by our team. You'll be notified once it's approved.
            </p>
          </div>
        )}
      </div>

      <PaymentHistory paymentHistory={paymentHistory} />
    </>
  );
};

export default PaymentSection;
