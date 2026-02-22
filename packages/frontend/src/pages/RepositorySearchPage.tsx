import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, FileText, GitCommit, Code } from 'lucide-react';
import { Input, Button } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface SearchResult {
  type: 'file' | 'commit' | 'code';
  title: string;
  path?: string;
  content?: string;
  sha?: string;
  author?: string;
  date?: string;
  url: string;
}

export const RepositorySearchPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'code' | 'commits' | 'files'>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/repositories/${owner}/${repo}/search?q=${encodeURIComponent(query)}&type=${searchType}`);
      setSearchResults(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'commit':
        return <GitCommit className="w-4 h-4 text-green-600" />;
      case 'code':
        return <Code className="w-4 h-4 text-purple-600" />;
      default:
        return <Search className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Repository</h1>
        <p className="text-gray-600">Search through files, commits, and code</p>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search for files, commits, or code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'code', label: 'Code' },
            { value: 'commits', label: 'Commits' },
            { value: 'files', label: 'Files' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setSearchType(type.value as any)}
              className={`px-3 py-1 rounded-md text-sm ${
                searchType === type.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && <LoadingSpinner message="Searching..." />}
      {error && <ErrorMessage message={error} />}
      
      {!loading && !error && searchResults.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {searchResults.map((result, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {getResultIcon(result.type)}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      <a href={result.url} className="hover:text-blue-600">
                        {result.title}
                      </a>
                    </h3>
                    {result.path && (
                      <p className="text-sm text-gray-600 mb-2">{result.path}</p>
                    )}
                    {result.content && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{result.content}</p>
                    )}
                    {result.author && (
                      <p className="text-sm text-gray-500">
                        {result.author} • {result.date && new Date(result.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && query && searchResults.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
};
