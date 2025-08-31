import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import QRCodeComponent from '@/components/ui/qr-code';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface EIDCardProps {
  memberData: {
    eid: string;
    firstName: string;
    lastName: string;
    role: string;
    photoUrl?: string;
    validFrom: string;
    validTo: string;
    qrCodeData: string;
  };
  showDownload?: boolean;
}

const EIDCard: React.FC<EIDCardProps> = ({ memberData, showDownload = true }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          width: 400,
          height: 250
        });
        
        const link = document.createElement('a');
        link.download = `eid-${memberData.eid}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Error downloading E-ID:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* E-ID Card */}
      <div 
        ref={cardRef}
        className="w-96 h-60 bg-white border-2 border-iteam-primary rounded-lg shadow-lg p-4 relative"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <img 
            src="/iteam-logo.svg" 
            alt="I-Team Logo" 
            className="h-8 w-8"
          />
          <div className="text-center flex-1">
            <h2 className="text-lg font-bold text-iteam-primary">I-Team Society</h2>
            <p className="text-xs text-gray-600">MEMBER ID CARD</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center space-x-4">
          {/* Photo */}
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {memberData.photoUrl ? (
              <img 
                src={memberData.photoUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-xs">No Photo</span>
              </div>
            )}
          </div>

          {/* Member Info */}
          <div className="flex-1">
            <h3 className="font-bold text-iteam-primary text-sm">
              {memberData.firstName} {memberData.lastName}
            </h3>
            <p className="text-xs text-gray-600 capitalize">{memberData.role}</p>
            <p className="text-xs font-medium text-iteam-primary mt-1">
              {memberData.eid}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Valid: {new Date(memberData.validFrom).toLocaleDateString()} - {new Date(memberData.validTo).toLocaleDateString()}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex-shrink-0">
            <QRCodeComponent 
              value={memberData.qrCodeData} 
              size={60}
              className="border border-gray-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-2 left-4 right-4">
          <div className="text-xs text-gray-500 text-center">
            The Open University of Sri Lanka
          </div>
        </div>
      </div>

      {/* Download Button */}
      {showDownload && (
        <Button 
          onClick={handleDownload}
          className="w-full bg-iteam-primary hover:bg-iteam-primary/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Download E-ID Card
        </Button>
      )}
    </div>
  );
};

export default EIDCard;
