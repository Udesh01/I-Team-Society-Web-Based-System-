import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  CreditCard, 
  Check, 
  Star, 
  Clock, 
  AlertCircle,
  Banknote,
  Building2
} from 'lucide-react';
import { MembershipService } from '@/services/supabase/membership.service';
import { toast } from '@/components/ui/sonner';

interface MembershipRenewalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMembership: any;
  onRenewalSuccess: () => void;
}

const MembershipRenewal: React.FC<MembershipRenewalProps> = ({
  isOpen,
  onClose,
  currentMembership,
  onRenewalSuccess
}) => {
  const [selectedTier, setSelectedTier] = useState(currentMembership?.tier || 'bronze');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [processing, setProcessing] = useState(false);

  const renewalOptions = MembershipService.getRenewalOptions(currentMembership?.tier);
  const isEligible = MembershipService.isEligibleForRenewal(currentMembership);
  const statusMessage = MembershipService.getRenewalStatusMessage(currentMembership);

  const handleRenewal = async () => {
    if (!selectedTier || !paymentMethod) {
      toast.error('Please select a membership tier and payment method');
      return;
    }

    setProcessing(true);
    try {
      await MembershipService.renewMembership(
        currentMembership.user_id,
        selectedTier,
        paymentMethod
      );

      toast.success('Membership renewal initiated successfully!');
      onRenewalSuccess();
      onClose();
    } catch (error: any) {
      console.error('Renewal error:', error);
      toast.error(error.message || 'Failed to process renewal');
    } finally {
      setProcessing(false);
    }
  };

  const selectedOption = renewalOptions.find(option => option.id === selectedTier);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Renew Your Membership
          </DialogTitle>
          <DialogDescription>
            {statusMessage}
          </DialogDescription>
        </DialogHeader>

        {!isEligible ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800">Renewal Not Available</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Membership renewal is available 60 days before expiry. Your membership is still active.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Current Membership Info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Current Membership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">Tier:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {currentMembership?.tier?.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">E-ID:</span>
                  <span className="font-mono text-blue-800">{currentMembership?.eid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Expires:</span>
                  <span className="text-blue-800">
                    {new Date(currentMembership?.end_date).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tier Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Renewal Tier</h3>
              <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renewalOptions.map((tier) => (
                    <div key={tier.id} className="relative">
                      <RadioGroupItem
                        value={tier.id}
                        id={tier.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={tier.id}
                        className="flex cursor-pointer flex-col rounded-lg border-2 border-gray-200 p-4 hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`inline-flex items-center rounded-full bg-gradient-to-r ${tier.color} px-3 py-1 text-sm font-medium text-white`}>
                            {tier.name}
                          </div>
                          {tier.popular && (
                            <Badge className="bg-green-100 text-green-800">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-2xl font-bold">LKR {tier.price.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">{tier.duration}</div>
                        </div>

                        <ul className="space-y-2 text-sm">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {tier.id === currentMembership?.tier && (
                          <Badge className="mt-3 bg-blue-100 text-blue-800">
                            Current Tier
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Bank Transfer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                      <Banknote className="h-4 w-4 text-green-600" />
                      Cash Payment
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Renewal Summary */}
            {selectedOption && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Renewal Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">Selected Tier:</span>
                    <span className="font-medium text-green-800">{selectedOption.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Duration:</span>
                    <span className="text-green-800">{selectedOption.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Amount:</span>
                    <span className="font-bold text-green-800">
                      LKR {selectedOption.price.toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">New Expiry Date:</span>
                    <span className="text-green-800">
                      {(() => {
                        const currentEndDate = new Date(currentMembership.end_date);
                        const today = new Date();
                        const startDate = currentEndDate > today ? currentEndDate : today;
                        const newEndDate = new Date(startDate);
                        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                        return newEndDate.toLocaleDateString();
                      })()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenewal}
                disabled={processing || !selectedTier || !paymentMethod}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed with Renewal
                  </>
                )}
              </Button>
            </div>

            {/* Payment Instructions */}
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Next Steps:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Complete the renewal request</li>
                      <li>Make payment using your selected method</li>
                      <li>Upload payment proof if required</li>
                      <li>Wait for admin approval</li>
                      <li>Your membership will be extended automatically</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MembershipRenewal;
