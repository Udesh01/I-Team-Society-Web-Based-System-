import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import FileUpload from '@/components/ui/file-upload';
import { supabase } from '@/integrations/supabase/client';
import { StorageService } from '@/services/supabase/storage.service';

interface EventFormProps {
  onEventCreated?: () => void;
  editEvent?: any;
}

const EventForm: React.FC<EventFormProps> = ({ onEventCreated, editEvent }) => {
  const [formData, setFormData] = useState({
    title: editEvent?.title || '',
    description: editEvent?.description || '',
    event_date: editEvent?.event_date || '',
    event_time: editEvent?.event_time || '',
    location: editEvent?.location || '',
    location_type: editEvent?.location_type || 'offline',
    max_participants: editEvent?.max_participants || '',
    registration_deadline: editEvent?.registration_deadline || '',
    requirements: editEvent?.requirements || '',
    contact_info: editEvent?.contact_info || ''
  });
  
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let posterUrl = editEvent?.poster_url || null;

      // Upload poster if provided
      if (posterFile) {
        const eventId = editEvent?.id || crypto.randomUUID();
        posterUrl = await StorageService.uploadEventPoster(eventId, posterFile);
      }

      const eventData = {
        ...formData,
        max_participants: parseInt(formData.max_participants) || null,
        poster_url: posterUrl,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (editEvent) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editEvent.id);

        if (error) throw error;
        toast.success('Event updated successfully!');
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert(eventData);

        if (error) throw error;
        toast.success('Event created successfully!');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        location_type: 'offline',
        max_participants: '',
        registration_deadline: '',
        requirements: '',
        contact_info: ''
      });
      setPosterFile(null);

      if (onEventCreated) {
        onEventCreated();
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editEvent ? 'Edit Event' : 'Create New Event'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_type">Location Type *</Label>
              <Select
                value={formData.location_type}
                onValueChange={(value) => handleInputChange('location_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the event..."
              rows={4}
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => handleInputChange('event_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_time">Event Time *</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => handleInputChange('event_time', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input
                id="registration_deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
              />
            </div>
          </div>

          {/* Location and Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder={formData.location_type === 'online' ? 'Meeting link' : 'Venue address'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => handleInputChange('max_participants', e.target.value)}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="Any special requirements or prerequisites..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_info">Contact Information</Label>
              <Input
                id="contact_info"
                value={formData.contact_info}
                onChange={(e) => handleInputChange('contact_info', e.target.value)}
                placeholder="Contact person or email"
              />
            </div>
          </div>

          {/* Event Poster */}
          <FileUpload
            label="Event Poster"
            accept="image/*"
            maxSize={5}
            onFileSelect={setPosterFile}
            preview={true}
            currentFile={editEvent?.poster_url}
          />

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={loading} className="bg-iteam-primary hover:bg-iteam-primary/90">
              {loading ? 'Saving...' : editEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EventForm;
