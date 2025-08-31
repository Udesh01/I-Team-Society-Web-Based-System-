import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, Award, AlertCircle } from 'lucide-react';

interface MembershipStatusProps {
  status: 'pending_payment' | 'pending_approval' | 'active' | 'expired' | 'rejected';
  tier?: 'bronze' | 'silver' | 'gold';
  startDate?: string;
  endDate?: string;
  amount?: number;
  onPayment?: () => void;
  onRenew?: () => void;
}

const MembershipStatus: React.FC<MembershipStatusProps> = ({
  status,
  tier,
  startDate,
  endDate,
  amount,
  onPayment,
  onRenew
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending_payment':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: CreditCard,
          title: 'Payment Required',
          description: 'Please complete your membership payment to activate your account.',
          action: 'Pay Now'
        };
      case 'pending_approval':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: AlertCircle,
          title: 'Pending Approval',
          description: 'Your payment is being verified. You will be notified once approved.',
          action: null
        };
      case 'active':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: Award,
          title: 'Active Member',
          description: 'Your membership is active and you have full access to all features.',
          action: null
        };
      case 'expired':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: Calendar,
          title: 'Membership Expired',
          description: 'Your membership has expired. Please renew to continue accessing features.',
          action: 'Renew Membership'
        };
      case 'rejected':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: AlertCircle,
          title: 'Application Rejected',
          description: 'Your membership application was rejected. Please contact support.',
          action: null
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: AlertCircle,
          title: 'Unknown Status',
          description: 'Please contact support for assistance.',
          action: null
        };
    }
  };

  const getTierConfig = () => {
    switch (tier) {
      case 'bronze':
        return { color: 'bg-amber-600', name: 'Bronze' };
      case 'silver':
        return { color: 'bg-gray-400', name: 'Silver' };
      case 'gold':
        return { color: 'bg-yellow-500', name: 'Gold' };
      default:
        return { color: 'bg-gray-400', name: 'Standard' };
    }
  };

  const config = getStatusConfig();
  const tierConfig = getTierConfig();
  const Icon = config.icon;

  const handleAction = () => {
    if (status === 'pending_payment' && onPayment) {
      onPayment();
    } else if (status === 'expired' && onRenew) {
      onRenew();
    }
  };

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center space-x-2 ${config.textColor}`}>
            <Icon className="w-5 h-5" />
            <span>{config.title}</span>
          </CardTitle>
          {tier && (
            <Badge className={`${tierConfig.color} text-white`}>
              {tierConfig.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={`text-sm ${config.textColor}`}>
          {config.description}
        </p>

        {/* Membership Details */}
        {(startDate || endDate || amount) && (
          <div className="space-y-2">
            {startDate && (
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  Start Date: {new Date(startDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {endDate && (
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  End Date: {new Date(endDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {amount && (
              <div className="flex items-center space-x-2 text-sm">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  Amount: Rs. {amount}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {config.action && (
          <Button 
            onClick={handleAction}
            className="w-full bg-iteam-primary hover:bg-iteam-primary/90"
          >
            {config.action}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MembershipStatus;
