import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Award,
  Star,
  Target,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned: boolean;
  earnedDate?: string;
  progress: number;
  maxProgress: number;
}

const Achievements = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [earnedCount, setEarnedCount] = useState(0);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's event registrations and attendance
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("user_id", user.id);

      const { data: membership } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() to handle missing memberships gracefully

      // Calculate statistics
      const eventsRegistered = registrations?.length || 0;
      const eventsAttended =
        registrations?.filter((r) => r.attended).length || 0;
      const attendanceRate =
        eventsRegistered > 0 ? (eventsAttended / eventsRegistered) * 100 : 0;

      // Define achievements
      const achievementsList: Achievement[] = [
        {
          id: "first_event",
          title: "First Steps",
          description: "Register for your first event",
          icon: "🎯",
          category: "Events",
          points: 10,
          earned: eventsRegistered >= 1,
          earnedDate:
            eventsRegistered >= 1
              ? registrations?.[0]?.registered_at
              : undefined,
          progress: Math.min(eventsRegistered, 1),
          maxProgress: 1,
        },
        {
          id: "event_enthusiast",
          title: "Event Enthusiast",
          description: "Register for 5 events",
          icon: "📅",
          category: "Events",
          points: 25,
          earned: eventsRegistered >= 5,
          earnedDate:
            eventsRegistered >= 5
              ? registrations?.[4]?.registered_at
              : undefined,
          progress: Math.min(eventsRegistered, 5),
          maxProgress: 5,
        },
        {
          id: "active_participant",
          title: "Active Participant",
          description: "Attend 5 events",
          icon: "🏆",
          category: "Participation",
          points: 50,
          earned: eventsAttended >= 5,
          earnedDate:
            eventsAttended >= 5
              ? registrations?.filter((r) => r.attended)[4]?.attended_at
              : undefined,
          progress: Math.min(eventsAttended, 5),
          maxProgress: 5,
        },
        {
          id: "consistent_attendee",
          title: "Consistent Attendee",
          description: "Maintain 80% attendance rate (min 3 events)",
          icon: "⭐",
          category: "Participation",
          points: 75,
          earned: attendanceRate >= 80 && eventsRegistered >= 3,
          earnedDate:
            attendanceRate >= 80 && eventsRegistered >= 3
              ? new Date().toISOString()
              : undefined,
          progress: Math.min(attendanceRate, 100),
          maxProgress: 100,
        },
        {
          id: "event_champion",
          title: "Event Champion",
          description: "Attend 10 events",
          icon: "👑",
          category: "Participation",
          points: 100,
          earned: eventsAttended >= 10,
          earnedDate:
            eventsAttended >= 10
              ? registrations?.filter((r) => r.attended)[9]?.attended_at
              : undefined,
          progress: Math.min(eventsAttended, 10),
          maxProgress: 10,
        },
        {
          id: "active_member",
          title: "Active Member",
          description: "Maintain active membership",
          icon: "✅",
          category: "Membership",
          points: 30,
          earned: membership?.status === "active",
          earnedDate:
            membership?.status === "active" ? membership.start_date : undefined,
          progress: membership?.status === "active" ? 1 : 0,
          maxProgress: 1,
        },
        {
          id: "gold_member",
          title: "Gold Member",
          description: "Achieve Gold tier membership",
          icon: "🥇",
          category: "Membership",
          points: 150,
          earned: membership?.tier === "gold",
          earnedDate:
            membership?.tier === "gold" ? membership.start_date : undefined,
          progress:
            membership?.tier === "gold"
              ? 1
              : membership?.tier === "silver"
                ? 0.66
                : membership?.tier === "bronze"
                  ? 0.33
                  : 0,
          maxProgress: 1,
        },
      ];

      setAchievements(achievementsList);

      const earned = achievementsList.filter((a) => a.earned);
      setEarnedCount(earned.length);
      setTotalPoints(earned.reduce((sum, a) => sum + a.points, 0));

      toast.success("Achievements loaded successfully");
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast.error("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const categories = [...new Set(achievements.map((a) => a.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">My Achievements 🏆</h1>
            <p className="text-yellow-100 mb-4">
              Track your progress and unlock new milestones
            </p>
            <div className="flex items-center gap-4">
              <Badge className="bg-white/20 text-white border-white/30">
                {earnedCount}/{achievements.length} Earned
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30">
                {totalPoints} Points
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {Math.round((earnedCount / achievements.length) * 100)}%
            </div>
            <div className="text-yellow-100">Completion</div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Achievement Progress</span>
                <span>
                  {earnedCount}/{achievements.length}
                </span>
              </div>
              <Progress
                value={(earnedCount / achievements.length) * 100}
                className="h-3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Trophy className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">
                  {earnedCount}
                </div>
                <div className="text-sm text-blue-600">Achievements Earned</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-900">
                  {totalPoints}
                </div>
                <div className="text-sm text-yellow-600">Total Points</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">
                  {achievements.length - earnedCount}
                </div>
                <div className="text-sm text-green-600">Remaining Goals</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements by Category */}
      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category === "Events" && (
                <Calendar className="h-5 w-5 text-purple-600" />
              )}
              {category === "Participation" && (
                <Users className="h-5 w-5 text-green-600" />
              )}
              {category === "Membership" && (
                <Award className="h-5 w-5 text-blue-600" />
              )}
              {category} Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements
                .filter((achievement) => achievement.category === category)
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      achievement.earned
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg"
                        : "bg-gray-50 border-gray-200 opacity-75"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={achievement.earned ? "default" : "secondary"}
                          className={
                            achievement.earned ? "bg-yellow-500 text-white" : ""
                          }
                        >
                          {achievement.points} pts
                        </Badge>
                        {achievement.earned && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {achievement.description}
                    </p>

                    {!achievement.earned && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                        </div>
                        <Progress
                          value={
                            (achievement.progress / achievement.maxProgress) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    )}

                    {achievement.earned && achievement.earnedDate && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Clock className="h-3 w-3" />
                        <span>
                          Earned{" "}
                          {new Date(
                            achievement.earnedDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Achievements;
