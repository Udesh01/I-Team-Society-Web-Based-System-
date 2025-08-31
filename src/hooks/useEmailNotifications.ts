import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmailService } from '@/services/email/email.service';
import { useAuth } from "@/context/AuthContext";

export const useEmailNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen for membership approvals
    const membershipChannel = supabase
      .channel('membership-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'memberships',
          filter: 'status=eq.active'
        },
        async (payload) => {
          try {
            const membership = payload.new;
            console.log('Membership approved, sending welcome email:', membership);

            // Get user profile and email
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', membership.user_id)
              .single();

            if (profileError) {
              console.error('Error fetching profile for welcome email:', profileError);
              return;
            }

            // Get user email from auth
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(membership.user_id);
            
            if (authError || !authUser.user?.email) {
              console.error('Error fetching user email for welcome email:', authError);
              return;
            }

            // Send welcome email
            await EmailService.sendWelcomeEmail(
              authUser.user.email,
              `${profile.first_name} ${profile.last_name}`,
              membership.tier || 'bronze'
            );

            console.log('Welcome email sent successfully');
          } catch (error) {
            console.error('Error sending welcome email:', error);
          }
        }
      )
      .subscribe();

    // Listen for event registrations to send reminders
    const eventReminderChannel = supabase
      .channel('event-reminders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_registrations'
        },
        async (payload) => {
          try {
            const registration = payload.new;
            console.log('New event registration, scheduling reminder:', registration);

            // Get event details
            const { data: event, error: eventError } = await supabase
              .from('events')
              .select('name, event_date, location')
              .eq('id', registration.event_id)
              .single();

            if (eventError || !event) {
              console.error('Error fetching event for reminder:', eventError);
              return;
            }

            // Get user profile and email
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', registration.user_id)
              .single();

            if (profileError) {
              console.error('Error fetching profile for event reminder:', profileError);
              return;
            }

            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(registration.user_id);
            
            if (authError || !authUser.user?.email) {
              console.error('Error fetching user email for event reminder:', authError);
              return;
            }

            // Calculate reminder time (24 hours before event)
            const eventDate = new Date(event.event_date);
            const reminderTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
            const now = new Date();

            // If event is more than 24 hours away, schedule reminder
            if (reminderTime > now) {
              // For now, we'll send immediate confirmation instead of scheduling
              // In production, you'd want to use a job queue or cron job
              console.log('Event reminder would be scheduled for:', reminderTime);
              
              // Send immediate registration confirmation instead
              // You could implement a job scheduler here for actual reminders
            } else {
              // Event is soon, send immediate reminder
              await EmailService.sendEventReminder(
                authUser.user.email,
                `${profile.first_name} ${profile.last_name}`,
                event.name,
                event.event_date,
                event.location
              );
              console.log('Immediate event reminder sent');
            }
          } catch (error) {
            console.error('Error processing event reminder:', error);
          }
        }
      )
      .subscribe();

    // Listen for membership expiry warnings
    const membershipExpiryChannel = supabase
      .channel('membership-expiry')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'memberships'
        },
        async (payload) => {
          try {
            const membership = payload.new;
            const oldMembership = payload.old;

            // Check if this is a membership nearing expiry (you'd implement logic here)
            const expiryDate = new Date(membership.end_date);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Send reminder if membership expires in 30, 14, or 7 days
            if ([30, 14, 7].includes(daysUntilExpiry)) {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', membership.user_id)
                .single();

              if (profileError) {
                console.error('Error fetching profile for expiry reminder:', profileError);
                return;
              }

              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(membership.user_id);
              
              if (authError || !authUser.user?.email) {
                console.error('Error fetching user email for expiry reminder:', authError);
                return;
              }

              await EmailService.sendMembershipExpiryReminder(
                authUser.user.email,
                `${profile.first_name} ${profile.last_name}`,
                membership.end_date,
                membership.tier || 'bronze'
              );

              console.log(`Membership expiry reminder sent (${daysUntilExpiry} days)`);
            }
          } catch (error) {
            console.error('Error processing membership expiry reminder:', error);
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(membershipChannel);
      supabase.removeChannel(eventReminderChannel);
      supabase.removeChannel(membershipExpiryChannel);
    };
  }, [user]);

  // Manual email sending functions
  const sendWelcomeEmail = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('tier')
        .eq('user_id', userId)
        .single();

      if (membershipError) throw membershipError;

      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser.user?.email) throw new Error('Could not get user email');

      await EmailService.sendWelcomeEmail(
        authUser.user.email,
        `${profile.first_name} ${profile.last_name}`,
        membership.tier || 'bronze'
      );

      return { success: true };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }
  };

  const sendEventReminder = async (userId: string, eventId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('name, event_date, location')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser.user?.email) throw new Error('Could not get user email');

      await EmailService.sendEventReminder(
        authUser.user.email,
        `${profile.first_name} ${profile.last_name}`,
        event.name,
        event.event_date,
        event.location
      );

      return { success: true };
    } catch (error) {
      console.error('Error sending event reminder:', error);
      return { success: false, error };
    }
  };

  return {
    sendWelcomeEmail,
    sendEventReminder
  };
};
