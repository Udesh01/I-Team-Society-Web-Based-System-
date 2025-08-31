import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'user' | 'notification' | 'membership';
  url: string;
  metadata?: any;
  relevance?: number;
}

export interface SearchFilters {
  type?: 'event' | 'user' | 'notification' | 'membership' | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string;
}

export const SearchService = {
  // Main search function that searches across all content types
  searchAll: async (query: string, filters: SearchFilters = {}, userId?: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase().trim();

    try {
      // Search events
      if (!filters.type || filters.type === 'all' || filters.type === 'event') {
        const eventResults = await SearchService.searchEvents(searchTerm, filters);
        results.push(...eventResults);
      }

      // Search users (admin only)
      if ((!filters.type || filters.type === 'all' || filters.type === 'user') && userId) {
        const userResults = await SearchService.searchUsers(searchTerm, filters, userId);
        results.push(...userResults);
      }

      // Search notifications
      if ((!filters.type || filters.type === 'all' || filters.type === 'notification') && userId) {
        const notificationResults = await SearchService.searchNotifications(searchTerm, filters, userId);
        results.push(...notificationResults);
      }

      // Search memberships (admin/staff only)
      if ((!filters.type || filters.type === 'all' || filters.type === 'membership') && userId) {
        const membershipResults = await SearchService.searchMemberships(searchTerm, filters, userId);
        results.push(...membershipResults);
      }

      // Sort by relevance (simple text matching score)
      return results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  // Search events
  searchEvents: async (query: string, filters: SearchFilters = {}): Promise<SearchResult[]> => {
    try {
      let queryBuilder = supabase
        .from('events')
        .select('id, name, description, event_date, location, status')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);

      // Apply date filters
      if (filters.dateRange) {
        queryBuilder = queryBuilder
          .gte('event_date', filters.dateRange.start.toISOString())
          .lte('event_date', filters.dateRange.end.toISOString());
      }

      // Apply status filter
      if (filters.status) {
        queryBuilder = queryBuilder.eq('status', filters.status);
      }

      const { data: events, error } = await queryBuilder.limit(20);

      if (error) throw error;

      return (events || []).map(event => ({
        id: event.id,
        title: event.name,
        description: event.description || 'No description available',
        type: 'event' as const,
        url: `/dashboard/events`,
        metadata: {
          date: event.event_date,
          location: event.location,
          status: event.status
        },
        relevance: SearchService.calculateRelevance(query, [event.name, event.description, event.location])
      }));
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  },

  // Search users (admin/staff only)
  searchUsers: async (query: string, filters: SearchFilters = {}, currentUserId: string): Promise<SearchResult[]> => {
    try {
      // Check if current user has permission to search users
      const { data: currentUser, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUserId)
        .single();

      if (userError || !currentUser || !['admin', 'staff'].includes(currentUser.role)) {
        return [];
      }

      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, created_at')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      return (users || []).map(user => ({
        id: user.id,
        title: `${user.first_name} ${user.last_name}`,
        description: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} • Member since ${new Date(user.created_at).getFullYear()}`,
        type: 'user' as const,
        url: `/dashboard/admin/users`,
        metadata: {
          role: user.role,
          created_at: user.created_at
        },
        relevance: SearchService.calculateRelevance(query, [user.first_name, user.last_name])
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  // Search notifications
  searchNotifications: async (query: string, filters: SearchFilters = {}, userId: string): Promise<SearchResult[]> => {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at, read')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,message.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (notifications || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        description: notification.message,
        type: 'notification' as const,
        url: `/dashboard/notifications`,
        metadata: {
          type: notification.type,
          created_at: notification.created_at,
          read: notification.read
        },
        relevance: SearchService.calculateRelevance(query, [notification.title, notification.message])
      }));
    } catch (error) {
      console.error('Error searching notifications:', error);
      return [];
    }
  },

  // Search memberships (admin/staff only)
  searchMemberships: async (query: string, filters: SearchFilters = {}, currentUserId: string): Promise<SearchResult[]> => {
    try {
      // Check if current user has permission to search memberships
      const { data: currentUser, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUserId)
        .single();

      if (userError || !currentUser || !['admin', 'staff'].includes(currentUser.role)) {
        return [];
      }

      const { data: memberships, error } = await supabase
        .from('memberships')
        .select(`
          id, eid, tier, status, created_at,
          profiles!memberships_user_id_fkey(first_name, last_name)
        `)
        .or(`eid.ilike.%${query}%,tier.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      return (memberships || []).map(membership => ({
        id: membership.id,
        title: `${membership.profiles?.first_name} ${membership.profiles?.last_name}`,
        description: `EID: ${membership.eid} • ${membership.tier?.toUpperCase()} • ${membership.status}`,
        type: 'membership' as const,
        url: `/dashboard/admin/memberships`,
        metadata: {
          eid: membership.eid,
          tier: membership.tier,
          status: membership.status,
          created_at: membership.created_at
        },
        relevance: SearchService.calculateRelevance(query, [
          membership.eid,
          membership.tier,
          membership.profiles?.first_name,
          membership.profiles?.last_name
        ])
      }));
    } catch (error) {
      console.error('Error searching memberships:', error);
      return [];
    }
  },

  // Calculate relevance score based on text matching
  calculateRelevance: (query: string, texts: (string | null | undefined)[]): number => {
    const searchTerm = query.toLowerCase();
    let score = 0;

    texts.forEach(text => {
      if (!text) return;
      
      const lowerText = text.toLowerCase();
      
      // Exact match gets highest score
      if (lowerText === searchTerm) {
        score += 100;
      }
      // Starts with query gets high score
      else if (lowerText.startsWith(searchTerm)) {
        score += 50;
      }
      // Contains query gets medium score
      else if (lowerText.includes(searchTerm)) {
        score += 25;
      }
      // Word boundary match gets bonus
      if (new RegExp(`\\b${searchTerm}\\b`).test(lowerText)) {
        score += 10;
      }
    });

    return score;
  },

  // Get search suggestions based on recent searches and popular content
  getSearchSuggestions: async (userId?: string): Promise<string[]> => {
    try {
      const suggestions: string[] = [];

      // Add popular event names
      const { data: events } = await supabase
        .from('events')
        .select('name')
        .gte('event_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (events) {
        suggestions.push(...events.map(e => e.name));
      }

      // Add common search terms
      suggestions.push(
        'upcoming events',
        'my registrations',
        'membership status',
        'notifications',
        'profile settings'
      );

      return suggestions.slice(0, 8);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
};
