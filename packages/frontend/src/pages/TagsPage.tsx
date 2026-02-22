import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tag, Plus, Trash2, GitCommit, Calendar, User } from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';

interface GitTag {
  name: string;
  commit: {
    sha: string;
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  tagger?: {
    name: string;
    date: string;
    message: string;
  };
  message?: string;
}

export const TagsPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const toast = useToast();
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTag, setNewTag] = useState({
    name: '',
    message: '',
    target: 'main',
    type: 'lightweight' as 'lightweight' | 'annotated',
  });

  const { data: tags, loading, error, refetch } = useApi<GitTag[]>(
    () => api.get(`/repositories/${owner}/${repo}/tags`),
    [owner, repo],
  );

  const { data: branches } = useApi<string[]>(
    () => api.get(`/repositories/${owner}/${repo}/branches`),
    [owner, repo],
  );

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      await api.post(`/repositories/${owner}/${repo}/tags`, {
        name: newTag.name.trim(),
        message: newTag.type === 'annotated' ? newTag.message.trim() : undefined,
        target: newTag.target,
        type: newTag.type,
      });

      toast.success('Tag created successfully');
      setShowCreateTag(false);
      setNewTag({ name: '', message: '', target: 'main', type: 'lightweight' });
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create tag');
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    if (!confirm(`Are you sure you want to delete tag "${tagName}"?`)) {
      return;
    }

    try {
      await api.delete(`/repositories/${owner}/${repo}/tags/${tagName}`);
      toast.success('Tag deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tag');
    }
  };

  if (loading) return <LoadingSpinner message="Loading tags..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tags</h1>
          <p className="text-gray-600">Manage repository tags and releases</p>
        </div>
        <Button onClick={() => setShowCreateTag(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create tag
        </Button>
      </div>

      {/* Create Tag Modal */}
      {showCreateTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Create new tag</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag name
                  </label>
                  <Input
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    placeholder="v1.0.0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag type
                  </label>
                  <select
                    value={newTag.type}
                    onChange={(e) => setNewTag({ ...newTag, type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="lightweight">Lightweight</option>
                    <option value="annotated">Annotated</option>
                  </select>
                </div>
                
                {newTag.type === 'annotated' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newTag.message}
                      onChange={(e) => setNewTag({ ...newTag, message: e.target.value })}
                      placeholder="Tag message..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 resize-none"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target
                  </label>
                  <select
                    value={newTag.target}
                    onChange={(e) => setNewTag({ ...newTag, target: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {branches?.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    )) || <option value="main">main</option>}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateTag(false);
                    setNewTag({ name: '', message: '', target: 'main', type: 'lightweight' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTag}
                  disabled={!newTag.name.trim()}
                >
                  Create tag
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tags List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {tags && tags.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {tags.map((tag) => (
              <div key={tag.name} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Tag className="w-5 h-5 text-gray-500" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{tag.name}</span>
                        {tag.tagger && (
                          <Badge variant="secondary">Annotated</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-2">
                          <GitCommit className="w-4 h-4" />
                          <span className="font-mono">{tag.commit.sha.substring(0, 7)}</span>
                          <span>{tag.commit.message}</span>
                        </div>
                      </div>
                      
                      {tag.tagger && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{tag.tagger.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(tag.tagger.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {tag.message && (
                        <p className="text-sm text-gray-700 mt-2">{tag.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTag(tag.name)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No tags found</p>
          </div>
        )}
      </div>
    </div>
  );
};
