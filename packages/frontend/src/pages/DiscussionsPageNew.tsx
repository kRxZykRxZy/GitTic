import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageSquare, Plus, Search, Filter, User, Calendar, Tag, Heart, MessageCircle } from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../hooks/useToast';

interface Discussion {
  id: string;
  title: string;
  body: string;
  author: {
    login: string;
    avatar_url?: string;
  };
  category: {
    name: string;
    emoji: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  answer_chosen: boolean;
  answer_chosen_by?: {
    login: string;
  };
  answer_chosen_at?: string;
  comments: number;
  reactions: {
    total_count: number;
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
  created_at: string;
  updated_at: string;
  upvotes: number;
}

interface CreateDiscussionData {
  title: string;
  body: string;
  category: string;
  labels: string[];
}

export const DiscussionsPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const toast = useToast();
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newDiscussion, setNewDiscussion] = useState<CreateDiscussionData>({
    title: '',
    body: '',
    category: 'general',
    labels: [],
  });

  const { data: discussions, loading, error, refetch } = useApi<Discussion[]>(
    () => api.get(`/repositories/${owner}/${repo}/discussions?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}`),
    [owner, repo, selectedCategory, searchQuery],
  );

  const { data: categories } = useApi<Array<{ name: string; emoji: string }>>(
    () => api.get(`/repositories/${owner}/${repo}/discussions/categories`),
    [owner, repo],
  );

  const { data: labels } = useApi<Array<{ name: string; color: string }>>(
    () => api.get(`/repositories/${owner}/${repo}/labels`),
    [owner, repo],
  );

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title.trim()) {
      toast.error('Discussion title is required');
      return;
    }

    if (!newDiscussion.body.trim()) {
      toast.error('Discussion body is required');
      return;
    }

    try {
      await api.post(`/repositories/${owner}/${repo}/discussions`, newDiscussion);
      toast.success('Discussion created successfully');
      setShowCreateDiscussion(false);
      setNewDiscussion({ title: '', body: '', category: 'general', labels: [] });
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create discussion');
    }
  };

  const handleToggleUpvote = async (discussionId: string) => {
    try {
      await api.post(`/repositories/${owner}/${repo}/discussions/${discussionId}/upvote`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upvote discussion');
    }
  };

  const getCategoryEmoji = (categoryName: string) => {
    const category = categories?.find(c => c.name === categoryName);
    return category?.emoji || '💬';
  };

  if (loading) return <LoadingSpinner message="Loading discussions..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Discussions</h1>
          <p className="text-gray-600">Community conversations and Q&A</p>
        </div>
        <Button onClick={() => setShowCreateDiscussion(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New discussion
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              {categories?.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Discussion Modal */}
      {showCreateDiscussion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Create new discussion</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                    placeholder="What's this discussion about?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newDiscussion.category}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {categories?.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.emoji} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body
                  </label>
                  <textarea
                    value={newDiscussion.body}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, body: e.target.value })}
                    placeholder="Write your discussion content here..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-48 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labels
                  </label>
                  <select
                    multiple
                    value={newDiscussion.labels}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setNewDiscussion({ ...newDiscussion, labels: selected });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  >
                    {labels?.map((label) => (
                      <option key={label.name} value={label.name}>
                        {label.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDiscussion(false);
                    setNewDiscussion({ title: '', body: '', category: 'general', labels: [] });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDiscussion}
                  disabled={!newDiscussion.title.trim() || !newDiscussion.body.trim()}
                >
                  Create discussion
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discussions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {discussions && discussions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {discussions.map((discussion) => (
              <div key={discussion.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getCategoryEmoji(discussion.category.name)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          to={`/${owner}/${repo}/discussions/${discussion.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {discussion.title}
                        </Link>
                        {discussion.answer_chosen && (
                          <Badge variant="default" className="text-xs">
                            ✓ Answered
                          </Badge>
                        )}
                      </div>
                      
                      {discussion.body && (
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {discussion.body}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{discussion.author.login}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{discussion.comments}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{discussion.upvotes}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{discussion.reactions.total_count}</span>
                        </div>
                      </div>
                      
                      {discussion.labels.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {discussion.labels.map((label) => (
                            <Badge
                              key={label.name}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUpvote(discussion.id)}
                      className="flex items-center gap-1"
                    >
                      <Heart className="w-4 h-4" />
                      {discussion.upvotes}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No discussions found</p>
            <p className="text-sm mt-2">Be the first to start a conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};
