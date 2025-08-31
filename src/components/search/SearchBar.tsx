import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, FileText, Users, Calendar, Bell } from 'lucide-react';
import { SearchService, SearchResult } from '@/services/search/search.service';
import { useAuth } from "@/context/AuthContext";
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onResultClick?: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  className,
  placeholder = "Search...",
  onResultClick
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      const suggestions = await SearchService.getSearchSuggestions(user?.id);
      setSuggestions(suggestions);
    };
    loadSuggestions();
  }, [user?.id]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const searchResults = await SearchService.searchAll(query, {}, user?.id);
          setResults(searchResults);
          setIsOpen(true);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        if (query.trim().length === 0) {
          setIsOpen(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, user?.id]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = results.length + (query.length < 2 ? suggestions.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : -1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : totalItems - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (query.length < 2 && selectedIndex < suggestions.length) {
            // Select suggestion
            const suggestion = suggestions[selectedIndex];
            setQuery(suggestion);
            inputRef.current?.focus();
          } else if (results.length > 0) {
            // Select search result
            const adjustedIndex = query.length < 2 ? selectedIndex - suggestions.length : selectedIndex;
            if (adjustedIndex >= 0 && adjustedIndex < results.length) {
              handleResultClick(results[adjustedIndex]);
            }
          }
        } else if (query.trim()) {
          // Perform search with current query
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
    } else if (value.trim().length === 1) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (query.trim().length > 0 || suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    
    if (onResultClick) {
      onResultClick(result);
    } else {
      navigate(result.url);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleSearch = () => {
    if (query.trim()) {
      setIsOpen(false);
      // Navigate to a search results page or handle search differently
      navigate(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'user':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'notification':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'membership':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatResultDescription = (result: SearchResult) => {
    if (result.type === 'event' && result.metadata?.date) {
      const date = new Date(result.metadata.date);
      return `${result.description} • ${date.toLocaleDateString()}`;
    }
    return result.description;
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Searching...
            </div>
          )}

          {!loading && query.length < 2 && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 flex items-center gap-3",
                    selectedIndex === index && "bg-blue-50 text-blue-700"
                  )}
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Results ({results.length})
              </div>
              {results.map((result, index) => {
                const adjustedIndex = query.length < 2 ? index + suggestions.length : index;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 flex items-start gap-3",
                      selectedIndex === adjustedIndex && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <div className="mt-0.5">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      <div className="text-gray-500 text-xs truncate">
                        {formatResultDescription(result)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try different keywords or check spelling</p>
            </div>
          )}

          {query.trim() && (
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={handleSearch}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
