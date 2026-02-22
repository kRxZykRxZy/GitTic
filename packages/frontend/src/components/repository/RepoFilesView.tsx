import React from "react";
import { Link, useParams } from "react-router-dom";
import { FileText, Edit } from "lucide-react";
import { Button } from "../ui";

interface RepoFilesViewProps {
  files: Array<{
    name: string;
    type: "file" | "dir";
    lastCommitDate: string;
    lastCommitHash: string;
    lastCommitMessage: string;
  }>;
  latestCommit: {
    author: string;
    message: string;
    date: string;
    hash: string;
  };
}

export const RepoFilesView: React.FC<RepoFilesViewProps> = ({ files, latestCommit }) => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();

  return (
    <div className="space-y-4">
      {/* Latest commit info */}
      <div className="bg-bg-light border border-border-light rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-blue text-white rounded-full flex items-center justify-center text-xs font-semibold">
            kR
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">
              <Link to={`/${owner}`} className="text-accent-blue hover:underline">
                {latestCommit.author}
              </Link>
              <span className="text-text-secondary mx-1">{latestCommit.message}</span>
            </div>
            <div className="text-xs text-text-secondary">{latestCommit.date}</div>
          </div>
        </div>
      </div>

      {/* Files table */}
      <div className="border border-border-light rounded-lg bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-light border-b border-border-light">
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary">Last Commit Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary">Last Commit</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.name} className="border-b border-border-light hover:bg-bg-light">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-text-secondary" />
                    <Link
                      to={`/${owner}/${repo}/blob/main/${file.name}`}
                      className="text-accent-blue hover:underline text-sm"
                    >
                      {file.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-2 text-xs text-text-secondary">{file.lastCommitDate}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary font-mono">{file.lastCommitHash}</span>
                    <span className="text-xs text-text-primary">{file.lastCommitMessage}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* README section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">README.md</h2>
          <Button variant="secondary" size="xs" className="flex items-center gap-1">
            <Edit className="w-3 h-3" />
            Edit
          </Button>
        </div>
        <div className="border border-border-light rounded-lg p-4 bg-white">
          <h1 className="text-2xl font-semibold mb-4">test</h1>
          <p className="text-text-primary">test</p>
        </div>
      </div>
    </div>
  );
};
