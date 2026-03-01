import React, { useState } from "react";
import { Copy, X, Download, GitBranch } from "lucide-react";
import { Button, Input } from "../ui";

interface CloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryUrl: string;
  repositoryName: string;
}

export const CloneModal: React.FC<CloneModalProps> = ({
  isOpen,
  onClose,
  repositoryUrl,
  repositoryName,
}) => {
  const [cloneUrl, setCloneUrl] = useState(repositoryUrl);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cloneUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const httpsUrl = `https://github.com/${repositoryUrl}.git`;
  const sshUrl = `git@github.com:${repositoryUrl}.git`;
  const githubCliUrl = `gh repo clone ${repositoryUrl}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Clone {repositoryName}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* HTTPS */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <GitBranch className="w-4 h-4" />
                HTTPS
              </label>
              <div className="flex gap-2">
                <Input
                  value={httpsUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCloneUrl(httpsUrl);
                    handleCopy();
                  }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied && cloneUrl === httpsUrl ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* SSH */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <GitBranch className="w-4 h-4" />
                SSH
              </label>
              <div className="flex gap-2">
                <Input
                  value={sshUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCloneUrl(sshUrl);
                    handleCopy();
                  }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied && cloneUrl === sshUrl ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* GitHub CLI */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Download className="w-4 h-4" />
                GitHub CLI
              </label>
              <div className="flex gap-2">
                <Input
                  value={githubCliUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCloneUrl(githubCliUrl);
                    handleCopy();
                  }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied && cloneUrl === githubCliUrl ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">How to clone:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>HTTPS:</strong> <code className="bg-gray-200 px-1 rounded">git clone {httpsUrl}</code></p>
              <p><strong>SSH:</strong> <code className="bg-gray-200 px-1 rounded">git clone {sshUrl}</code></p>
              <p><strong>GitHub CLI:</strong> <code className="bg-gray-200 px-1 rounded">{githubCliUrl}</code></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
