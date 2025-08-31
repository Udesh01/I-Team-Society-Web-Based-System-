import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, Bell, FileText, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchService, SearchResult, SearchFilters } from '@/services/search/search.service';
import { useAuth } from "@/context/AuthContext";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all'
  });

  // Perform search when query or filters change
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await SearchService.searchAll(query, filters, user?.id);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, filters, user?.id]);

  // Update URL when query changes
  useEffect(() => {
    if (query.trim()) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'user':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'notification':
        return <Bell className="h-5 w-5 text-yellow-500" />;
      case 'membership':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <Search className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'event':
        return 'Event';
      case 'user':
        return 'User';
      case 'notification':
        return 'Notification';
      case 'membership':
        return 'Membership';
      default:
        return 'Unknown';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      case 'notification':
        return 'bg-yellow-100 text-yellow-800';
      case 'membership':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatResultMetadata = (result: SearchResult) => {
    if (result.type === 'event' && result.metadata?.date) {
      const date = new Date(result.metadata.date);
      return `${date.toLocaleDateString()} ${result.metadata.location ? `• ${result.metadata.location}` : ''}`;
    }
    if (result.type === 'membership' && result.metadata?.eid) {
      return `EID: ${result.metadata.eid} • ${result.metadata.tier?.toUpperCase()}`;
    }
    if (result.type === 'notification' && result.metadata?.created_at) {
      const date = new Date(result.metadata.created_at);
      return date.toLocaleDateString();
    }
    return null;
  };

  const clearFilters = () => {
    setFilters({ type: 'all' });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.status || filters.dateRange;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
        <p className="text-gray-600 mt-1">
          {query ? `Results for "${query}"` : 'Enter a search term to get started'}
        </p>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search events, users, notifications..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="notification">Notifications</SelectItem>
                  <SelectItem value="membership">Memberships</SelectItem>
                </SelectContent>
              </Select>
              
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching...</p>
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 mb-4">
              We couldn't find anything matching "{query}". Try different keywords or check your spelling.
            </p>
            <Button variant="outline" onClick={() => setQuery('')}>
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <Card
                key={result.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleResultClick(result)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {result.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                          {formatResultMetadata(result) && (
                            <p className="text-xs text-gray-500 mt-2">
                              {formatResultMetadata(result)}
                            </p>
                          )}
                        </div>
                        <Badge className={getTypeBadgeColor(result.type)}>
                          {getTypeLabel(result.type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!query && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What you can search for:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Event names and descriptions</li>
                  <li>• User names (admin/staff only)</li>
                  <li>• Your notifications</li>
                  <li>• Membership details (admin/staff only)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Search tips:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Use specific keywords</li>
                  <li>• Try different spellings</li>
                  <li>• Use filters to narrow results</li>
                  <li>• Search is case-insensitive</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchResults;
