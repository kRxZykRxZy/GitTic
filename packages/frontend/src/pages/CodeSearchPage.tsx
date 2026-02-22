import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, FileText, Folder, GitCommit, Clock } from "lucide-react";
import { Input, Button } from "../components/ui";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";

interface SearchResult {
  path: string;
  repository: string;
  content: string;
  lineNumbers: number[];
  language: string;
  lastModified: string;
}

export const CodeSearchPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get search query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<{
        query: string;
        repository: string;
        results: SearchResult[];
        total: number;
      }>(`/repositories/${owner}/${repo}/search?q=${encodeURIComponent(searchQuery.trim())}`);
      
      setSearchResults(response.data.results);
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Update URL
      navigate(`/${owner}/${repo}/search?q=${encodeURIComponent(query.trim())}`, { replace: true });
      performSearch(query.trim());
    }
  };

  const highlightMatch = (content: string, query: string) => {
    if (!query.trim()) return content;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
    );
  };

  const getFileIcon = (language: string) => {
    const iconMap: { [key: string]: string } = {
      "TypeScript": "📘",
      "JavaScript": "📜",
      "Python": "🐍",
      "Markdown": "📝",
      "JSON": "📋",
      "CSS": "🎨",
      "HTML": "🌐"
    };
    return iconMap[language] || "📄";
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border-b border-border-light p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Code Search</h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <Input
                type="text"
                placeholder="Search code in this repository..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 text-base h-12"
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? <LoadingSpinner message="" /> : <Search className="w-5 h-5" />}
              Search
            </Button>
          </form>
          
          {query && (
            <div className="mt-3 text-sm text-text-secondary">
              Searching for <strong>"{query}"</strong> in <strong>{owner}/{repo}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-4xl mx-auto">
        {loading && <LoadingSpinner message="Searching code..." />}
        {error && <ErrorMessage message={error} />}
        
        {!loading && !error && searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-text-secondary">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </div>
            
            {searchResults.map((result, index) => (
              <div key={index} className="bg-white border border-border-light rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* File header */}
                <div className="bg-bg-light px-4 py-3 border-b border-border-light">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFileIcon(result.language)}</span>
                      <a 
                        href={`/${owner}/${repo}/blob/main/${result.path}`}
                        className="text-accent-blue hover:underline font-medium text-sm"
                      >
                        {result.path}
                      </a>
                      <span className="text-xs text-text-secondary bg-bg-secondary px-2 py-1 rounded">
                        {result.language}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Clock className="w-3 h-3" />
                      {result.lastModified}
                    </div>
                  </div>
                </div>
                
                {/* Code snippet */}
                <div className="p-4">
                  <div className="bg-bg-secondary rounded p-3 font-mono text-sm">
                    <div className="flex">
                      {/* Line numbers */}
                      <div className="text-text-secondary mr-4 select-none">
                        {result.lineNumbers.map(lineNum => (
                          <div key={lineNum} className="leading-6">
                            {lineNum}
                          </div>
                        ))}
                      </div>
                      
                      {/* Code content */}
                      <div className="flex-1 leading-6">
                        {highlightMatch(result.content, query)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && !error && query && searchResults.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No results found</h3>
            <p className="text-text-secondary">
              No code matches found for "<strong>{query}</strong>" in this repository.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
