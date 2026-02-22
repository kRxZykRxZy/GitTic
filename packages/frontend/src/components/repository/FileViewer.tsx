import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, File, Download, Copy, Edit, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api-client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useToast } from '../../hooks/useToast';

interface FileViewerProps {
  filePath: string;
  branch?: string;
  onClose?: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({ 
  filePath, 
  branch = 'main',
  onClose 
}) => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const toast = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: fileData, loading, error } = useApi<{
    path: string;
    branch: string;
    content: string;
    encoding: string;
    size: number;
  }>(
    () => api.get(`/repositories/${owner}/${repo}/blob/${branch}/${filePath}`),
    [owner, repo, branch, filePath],
  );

  const handleCopy = async () => {
    if (fileData?.content) {
      try {
        await navigator.clipboard.writeText(fileData.content);
        toast.success('Content copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy content');
      }
    }
  };

  const handleDownload = () => {
    if (fileData?.content) {
      const blob = new Blob([fileData.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getFileLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'dockerfile': 'dockerfile',
      'gitignore': 'gitignore',
      'env': 'env',
      'txt': 'text',
      'log': 'log',
    };
    return languageMap[ext || ''] || 'text';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) return <LoadingSpinner message="Loading file..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!fileData) return <ErrorMessage message="File not found" />;

  const content = isFullscreen ? (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{filePath}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
            <Minimize2 className="w-4 h-4 mr-2" />
            Exit Fullscreen
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-sm font-mono bg-gray-50">
          <code>{fileData.content}</code>
        </pre>
      </div>
    </div>
  ) : (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{filePath}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{formatFileSize(fileData.size)}</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
              {getFileLanguage(filePath)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
            <Maximize2 className="w-4 h-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      </div>
      <div className="p-4 max-h-96 overflow-auto">
        <pre className="text-sm font-mono bg-gray-50 p-4 rounded">
          <code>{fileData.content}</code>
        </pre>
      </div>
    </div>
  );

  return content;
};
