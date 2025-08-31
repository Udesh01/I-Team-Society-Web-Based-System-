import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Mail, Phone, MapPin, GraduationCap, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EIDService } from '@/services/supabase/eid.service';
import MainLayout from '@/components/layout/MainLayout';

interface MemberData {
  eid: string;
  status: string;
  tier: string;
  start_date: string;
  end_date: string;
  profiles: {
    first_name: string;
    last_name: string;
    role: string;
    photo_url?: string;
    phone_number?: string;
    address?: string;
    student_details?: {
      student_id: string;
      faculty: string;
      department: string;
      degree: string;
      level: number;
    };
    staff_details?: {
      staff_id: string;
      department: string;
      position: string;
    };
  };
}

const MemberProfile: React.FC = () => {
  const { eid } = useParams<{ eid: string }>();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eid) {
      fetchMemberData();
    }
  }, [eid]);

  const fetchMemberData = async () => {
    try {
      const data = await EIDService.getMembershipByEID(eid!);
      setMemberData(data);
    } catch (error) {
      console.error('Error fetching member data:', error);
      setError('Member not found or membership is not active');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-600';
      case 'silver':
        return 'bg-gray-400';
      case 'gold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iteam-primary mx-auto mb-4"></div>
            <p>Loading member profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !memberData) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2">Member Not Found</h2>
              <p className="text-gray-600">
                {error || 'The requested member profile could not be found or is not accessible.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const profile = memberData.profiles;
  const isStudent = profile.role === 'student';
  const details = isStudent ? profile.student_details : profile.staff_details;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-iteam-primary to-iteam-primary/80 text-white">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24 border-4 border-white">
                <AvatarImage src={profile.photo_url} />
                <AvatarFallback className="text-2xl bg-white text-iteam-primary">
                  {profile.first_name[0]}{profile.last_name[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {profile.first_name} {profile.last_name}
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <Badge className={`${getTierColor(memberData.tier)} text-white capitalize`}>
                    {memberData.tier} Member
                  </Badge>
                  <Badge className={`${getStatusColor(memberData.status)} text-white capitalize`}>
                    {memberData.status}
                  </Badge>
                  <Badge variant="outline" className="text-white border-white capitalize">
                    {profile.role}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm opacity-90">E-ID</div>
                <div className="font-mono text-lg">{memberData.eid}</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-iteam-primary border-b pb-2">
                  Personal Information
                </h3>
                
                {profile.phone_number && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{profile.phone_number}</span>
                  </div>
                )}

                {profile.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <span className="text-sm">{profile.address}</span>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600">Member Since</div>
                    <div>{new Date(memberData.start_date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600">Valid Until</div>
                    <div>{new Date(memberData.end_date).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Academic/Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-iteam-primary border-b pb-2">
                  {isStudent ? 'Academic Information' : 'Professional Information'}
                </h3>

                {isStudent && details && (
                  <>
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Student ID</div>
                        <div className="font-medium">{details.student_id}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Faculty</div>
                        <div>{details.faculty}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Department</div>
                        <div>{details.department}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Degree & Level</div>
                        <div>{details.degree} - Level {details.level}</div>
                      </div>
                    </div>
                  </>
                )}

                {!isStudent && details && (
                  <>
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Staff ID</div>
                        <div className="font-medium">{details.staff_id}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Department</div>
                        <div>{details.department}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Position</div>
                        <div>{details.position}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
              <p>I-Team Society - The Open University of Sri Lanka</p>
              <p>This profile is verified and authentic</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default MemberProfile;
