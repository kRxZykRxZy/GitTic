import React from 'react';
import { Edit, FileText } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api-client';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface ReadmePreviewProps {
  branch?: string;
  onEdit?: () => void;
}

export const ReadmePreview: React.FC<ReadmePreviewProps> = ({ 
  branch = 'main',
  onEdit 
}) => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();

  const { data: readmeData, loading, error } = useApi<{
    path: string;
    branch: string;
    content: string;
    size: number;
    encoding: string;
  }>(
    () => api.get(`/repositories/${owner}/${repo}/readme?branch=${branch}`),
    [owner, repo, branch],
  );

  if (loading) return <LoadingSpinner message="Loading README..." />;
  if (error) return null; // Don't show error for missing README
  if (!readmeData) return null;

  return (
    <div className="bg-white border border-border rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <h2 className="text-lg font-semibold text-text-primary">{readmeData.path}</h2>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap text-text-primary">
          {readmeData.content}
        </div>
      </div>
    </div>
  );
};
