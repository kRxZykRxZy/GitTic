import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, FileText } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api-client';
import { useToast } from '../hooks/useToast';

export const FileEditorPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  const { data: tree } = useApi<any>(
    () => api.get(`/repositories/${owner}/${repo}/tree/main?path=${encodeURIComponent(currentPath)}`),
    [owner, repo, currentPath],
  );

  const handleSave = async () => {
    if (!fileName.trim()) {
      toast.error('Please enter a file name');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter file content');
      return;
    }

    try {
      setIsSaving(true);
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      
      await api.post(`/repositories/${owner}/${repo}/files`, {
        branch: 'main',
        path: filePath,
        content: content,
        message: commitMessage || `Add ${fileName}`,
      });

      toast.success('File created successfully');
      navigate(`/${owner}/${repo}`);
    } catch (error: any) {
      toast.error('Failed to create file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/${owner}/${repo}`);
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleCommitMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommitMessage(e.target.value);
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPath(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to repository
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="font-medium">New file</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !fileName.trim() || !content.trim()}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Commit new file'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200">
          {/* File Path Section */}
          <div className="border-b border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name your file...
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{owner}/{repo}/</span>
                  <Input
                    value={currentPath}
                    onChange={handlePathChange}
                    placeholder="folder/subfolder"
                    className="flex-1 max-w-xs"
                  />
                  <span className="text-gray-500">/</span>
                  <Input
                    value={fileName}
                    onChange={handleFileNameChange}
                    placeholder="filename.ext"
                    className="flex-1 max-w-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Commit Message Section */}
          <div className="border-b border-gray-200 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commit message
              </label>
              <Input
                value={commitMessage}
                onChange={handleCommitMessageChange}
                placeholder="Add a descriptive commit message..."
                className="w-full"
              />
            </div>
          </div>

          {/* Code Editor Section */}
          <div className="p-6">
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">File content</span>
                  <span className="text-xs text-gray-500">
                    {fileName || 'untitled'}
                  </span>
                </div>
              </div>
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Enter your code here..."
                className="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ minHeight: '500px' }}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Quick tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use the file path input to organize your file in folders</li>
            <li>• Include a file extension (like .js, .py, .md) for proper syntax highlighting</li>
            <li>• Write a clear commit message to describe your changes</li>
            <li>• Use Tab for indentation and press Ctrl+S to save (keyboard shortcuts coming soon)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
