import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Search,
  Download,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Filter,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { EventService } from "@/services/supabase/event.service";

interface EventRegistration {
  id: string;
  user_id: string;
  event_id: string;
  registered_at: string;
  attended: boolean | null;
  attended_at: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    role: string;
    phone_number?: string;
  };
}

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  max_participants: number;
  event_type?: string;
  banner_image?: string;
  requirements?: string;
  contact_info?: string;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  event_registrations: EventRegistration[];
}

const EventManagement = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "past">("all");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [sendCancellationNotifications, setSendCancellationNotifications] = useState(true);
  const [sendUpdateNotifications, setSendUpdateNotifications] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    event_date: "",
    location: "",
    max_participants: "",
    event_type: "",
    requirements: "",
    contact_info: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_registrations(
            id,
            user_id,
            registered_at,
            attended,
            attended_at,
            profiles(
              first_name,
              last_name,
              role,
              phone_number
            )
          )
        `)
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (registrationId: string, attended: boolean) => {
    try {
      const { error } = await supabase
        .from("event_registrations")
        .update({
          attended,
          attended_at: attended ? new Date().toISOString() : null,
        })
        .eq("id", registrationId);

      if (error) throw error;
      
      toast.success(`Attendance ${attended ? "marked" : "unmarked"} successfully`);
      fetchEvents(); // Refresh data
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast.error("Failed to update attendance");
    }
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setEditFormData({
      name: event.name,
      description: event.description,
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      location: event.location,
      max_participants: event.max_participants.toString(),
      event_type: event.event_type || "",
      requirements: event.requirements || "",
      contact_info: event.contact_info || "",
    });
    setSendUpdateNotifications(false); // Reset notification setting
    setIsEditDialogOpen(true);
  };

  const handleEditEvent = async () => {
    if (!editingEvent) return;

    try {
      console.log("Attempting to update event:", editingEvent.name, "with notifications:", sendUpdateNotifications);

      // Validate required fields
      if (!editFormData.name || !editFormData.description || !editFormData.event_date || !editFormData.location) {
        toast.error("Please fill in all required fields");
        return;
      }

      const maxParticipants = parseInt(editFormData.max_participants);
      if (isNaN(maxParticipants) || maxParticipants < 1) {
        toast.error("Maximum participants must be a valid number greater than 0");
        return;
      }

      const updateData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        event_date: editFormData.event_date,
        location: editFormData.location.trim(),
        max_participants: maxParticipants,
        event_type: editFormData.event_type?.trim() || null,
        requirements: editFormData.requirements?.trim() || null,
        contact_info: editFormData.contact_info?.trim() || null,
      };

      console.log("Update data:", updateData);

      const result = await EventService.updateEvent(editingEvent.id, updateData, sendUpdateNotifications);

      console.log("Update result:", result);

      const message = sendUpdateNotifications
        ? "Event updated successfully. Registered users have been notified."
        : "Event updated successfully";

      toast.success(message);
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      setSendUpdateNotifications(false);
      fetchEvents(); // Refresh data
    } catch (error: any) {
      console.error("Error updating event:", error);
      const errorMessage = error.message || "Failed to update event";
      toast.error(`Failed to update event: ${errorMessage}`);
    }
  };

  const handleDeleteEvent = async (event: Event, sendNotifications: boolean = true) => {
    try {
      console.log("Attempting to delete event:", event.name, "with notifications:", sendNotifications);

      const result = await EventService.deleteEvent(event.id, sendNotifications);

      if (result.success) {
        const message = result.notificationsSent > 0
          ? `Event deleted successfully. ${result.notificationsSent} users notified about cancellation.`
          : "Event deleted successfully";

        toast.success(message);
        setIsDeleteDialogOpen(false);
        setEventToDelete(null);
        setSendCancellationNotifications(true); // Reset for next time
        fetchEvents(); // Refresh data
      }
    } catch (error: any) {
      console.error("Error deleting event:", error);
      const errorMessage = error.message || "Failed to delete event";
      toast.error(`Failed to delete event: ${errorMessage}`);
    }
  };

  const exportRegistrations = (event: Event) => {
    const csvContent = [
      ["Name", "Role", "Phone", "Registered At", "Attended", "Attended At"],
      ...event.event_registrations.map((reg) => [
        `${reg.profiles.first_name} ${reg.profiles.last_name}`,
        reg.profiles.role,
        reg.profiles.phone_number || "N/A",
        new Date(reg.registered_at).toLocaleDateString(),
        reg.attended ? "Yes" : "No",
        reg.attended_at ? new Date(reg.attended_at).toLocaleDateString() : "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.name}_registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const eventDate = new Date(event.event_date);
    const now = new Date();
    
    let matchesFilter = true;
    if (filterStatus === "upcoming") {
      matchesFilter = eventDate > now;
    } else if (filterStatus === "past") {
      matchesFilter = eventDate <= now;
    }
    
    return matchesSearch && matchesFilter;
  });

  const getEventStats = (event: Event) => {
    const totalRegistrations = event.event_registrations.length;
    const attendedCount = event.event_registrations.filter(reg => reg.attended).length;
    const attendanceRate = totalRegistrations > 0 ? (attendedCount / totalRegistrations) * 100 : 0;
    const capacityUsed = (totalRegistrations / event.max_participants) * 100;
    
    return {
      totalRegistrations,
      attendedCount,
      attendanceRate,
      capacityUsed,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Event Management 📊</h1>
            <p className="text-blue-100 text-sm lg:text-base">
              Track registrations, manage attendance, and analyze event performance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center lg:text-right">
              <div className="text-2xl font-bold">{events.length}</div>
              <div className="text-blue-100 text-sm">Total Events</div>
            </div>
            <Button
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => window.location.href = '/dashboard/events'}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            size="sm"
          >
            All Events
          </Button>
          <Button
            variant={filterStatus === "upcoming" ? "default" : "outline"}
            onClick={() => setFilterStatus("upcoming")}
            size="sm"
          >
            Upcoming
          </Button>
          <Button
            variant={filterStatus === "past" ? "default" : "outline"}
            onClick={() => setFilterStatus("past")}
            size="sm"
          >
            Past
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvents.map((event) => {
          const stats = getEventStats(event);
          const isUpcoming = new Date(event.event_date) > new Date();
          
          return (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.event_date).toLocaleDateString()} at{" "}
                        {new Date(event.event_date).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {stats.totalRegistrations}/{event.max_participants} registered
                      </div>
                    </div>
                  </div>
                  <Badge variant={isUpcoming ? "default" : "secondary"}>
                    {isUpcoming ? "Upcoming" : "Past"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Event Banner */}
                {event.banner_image && (
                  <img
                    src={event.banner_image}
                    alt={`${event.name} banner`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {stats.totalRegistrations}
                    </div>
                    <div className="text-sm text-blue-600">Registrations</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {stats.attendanceRate.toFixed(0)}%
                    </div>
                    <div className="text-sm text-green-600">Attendance Rate</div>
                  </div>
                </div>
                
                {/* Capacity Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Capacity Used</span>
                    <span>{stats.capacityUsed.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(stats.capacityUsed, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Actions */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <EventDetailsDialog event={event} onMarkAttendance={markAttendance} />
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportRegistrations(event)}
                      disabled={stats.totalRegistrations === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(event)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setEventToDelete(event)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>
                            <div className="space-y-3">
                              <p>Are you sure you want to delete "{event.name}"? This action cannot be undone.</p>

                              {stats.totalRegistrations > 0 && (
                                <div className="space-y-3">
                                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-orange-800 font-medium mb-1">
                                      <Users className="h-4 w-4" />
                                      {stats.totalRegistrations} Registered Users
                                    </div>
                                    <p className="text-sm text-orange-700">
                                      This event has active registrations. All registration data will be permanently deleted.
                                    </p>
                                  </div>

                                  <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <Checkbox
                                      id="send-notifications"
                                      checked={sendCancellationNotifications}
                                      onCheckedChange={(checked) => setSendCancellationNotifications(checked as boolean)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                      <Label
                                        htmlFor="send-notifications"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        Notify registered users about cancellation
                                      </Label>
                                      <p className="text-xs text-muted-foreground">
                                        Send cancellation notifications to all {stats.totalRegistrations} registered users
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => {
                            setSendCancellationNotifications(true);
                            setEventToDelete(null);
                          }}>
                            Cancel
                          </AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              // Close the dialog first to prevent multiple clicks
                              setIsDeleteDialogOpen(false);
                              // Then handle the deletion
                              handleDeleteEvent(event, sendCancellationNotifications);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {stats.totalRegistrations > 0
                              ? `Delete & ${sendCancellationNotifications ? 'Notify Users' : 'Skip Notifications'}`
                              : 'Delete Event'
                            }
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500">
            {searchTerm ? "Try adjusting your search terms" : "No events match the selected filter"}
          </p>
        </div>
      )}

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Event Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Enter event name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Event Type</Label>
                <Input
                  id="edit-type"
                  value={editFormData.event_type}
                  onChange={(e) => setEditFormData({ ...editFormData, event_type: e.target.value })}
                  placeholder="Workshop, Seminar, Conference, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Describe the event"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date & Time *</Label>
                <Input
                  id="edit-date"
                  type="datetime-local"
                  value={editFormData.event_date}
                  onChange={(e) => setEditFormData({ ...editFormData, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="Event venue or online link"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-participants">Maximum Participants *</Label>
              <Input
                id="edit-participants"
                type="number"
                value={editFormData.max_participants}
                onChange={(e) => setEditFormData({ ...editFormData, max_participants: e.target.value })}
                placeholder="50"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-requirements">Requirements</Label>
              <Textarea
                id="edit-requirements"
                value={editFormData.requirements}
                onChange={(e) => setEditFormData({ ...editFormData, requirements: e.target.value })}
                placeholder="Prerequisites, materials needed, etc."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact">Contact Information</Label>
              <Input
                id="edit-contact"
                value={editFormData.contact_info}
                onChange={(e) => setEditFormData({ ...editFormData, contact_info: e.target.value })}
                placeholder="Contact person, email, or phone"
              />
            </div>

            {/* Notification Option */}
            {editingEvent && editingEvent.event_registrations.length > 0 && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Checkbox
                  id="send-update-notifications"
                  checked={sendUpdateNotifications}
                  onCheckedChange={(checked) => setSendUpdateNotifications(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="send-update-notifications"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Notify registered users about changes
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Send update notifications to all {editingEvent.event_registrations.length} registered users
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditEvent}
              disabled={!editFormData.name || !editFormData.description || !editFormData.event_date || !editFormData.location}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Event Details Dialog Component
const EventDetailsDialog = ({ 
  event, 
  onMarkAttendance 
}: { 
  event: Event; 
  onMarkAttendance: (id: string, attended: boolean) => void;
}) => {
  const [searchReg, setSearchReg] = useState("");
  
  const filteredRegistrations = event.event_registrations.filter((reg) =>
    `${reg.profiles.first_name} ${reg.profiles.last_name}`
      .toLowerCase()
      .includes(searchReg.toLowerCase())
  );

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{event.name} - Registration Details</DialogTitle>
        <DialogDescription>
          Manage registrations and track attendance for this event
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Event Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-500">Date & Time</div>
            <div className="font-medium">
              {new Date(event.event_date).toLocaleDateString()} at{" "}
              {new Date(event.event_date).toLocaleTimeString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Location</div>
            <div className="font-medium">{event.location}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Capacity</div>
            <div className="font-medium">
              {event.event_registrations.length}/{event.max_participants}
            </div>
          </div>
        </div>
        
        {/* Search Registrations */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search registrations..."
            value={searchReg}
            onChange={(e) => setSearchReg(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Registrations Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {registration.profiles.first_name[0]}
                          {registration.profiles.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {registration.profiles.first_name} {registration.profiles.last_name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {registration.profiles.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {registration.profiles.phone_number && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {registration.profiles.phone_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(registration.registered_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {registration.attended === null ? (
                      <Badge variant="secondary">Pending</Badge>
                    ) : registration.attended ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Attended
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Absent
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkAttendance(registration.id, true)}
                        disabled={registration.attended === true}
                      >
                        <UserCheck className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkAttendance(registration.id, false)}
                        disabled={registration.attended === false}
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredRegistrations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchReg ? "No registrations match your search" : "No registrations yet"}
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
};

export default EventManagement;
