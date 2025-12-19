'use client';

import { useState } from 'react';
import { ReadingItem } from '@/app/page';

interface ContentCardProps {
  item: ReadingItem;
  onDelete: () => void;
  onMarkAsRead: (isRead: boolean) => void;
  onUpdate: () => void;
}

export default function ContentCard({ item, onDelete, onMarkAsRead, onUpdate }: ContentCardProps) {
  const [showDigest, setShowDigest] = useState(false);
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
  const [showPromptEdit, setShowPromptEdit] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleGenerateDigest = async (prompt?: string) => {
    setIsGeneratingDigest(true);
    try {
      const response = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          customPrompt: prompt
        })
      });

      if (response.ok) {
        onUpdate();
        setShowDigest(true);
        setShowPromptEdit(false);
      }
    } catch (error) {
      console.error('Error generating digest:', error);
      alert('Failed to generate digest');
    } finally {
      setIsGeneratingDigest(false);
    }
  };


  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${item.is_read ? 'opacity-90' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
              {item.type.toUpperCase()}
            </span>
            {item.is_read && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                ARCHIVED
              </span>
            )}
            <span className="text-sm text-gray-500">{formatDate(item.date_added)}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 truncate block"
            >
              {item.url}
            </a>
          )}
          {item.file_name && (
            <p className="text-sm text-gray-500">{item.file_name}</p>
          )}
        </div>
      </div>

      {/* Digest Section */}
      <div className="mb-4">
        <button
          onClick={() => setShowDigest(!showDigest)}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          DIGEST
          <svg
            className={`w-4 h-4 transition-transform ${showDigest ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDigest && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            {item.digest ? (
              <div>
                {!showPromptEdit ? (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">{item.digest}</p>
                      <button
                        onClick={() => setShowPromptEdit(true)}
                        className="flex-shrink-0 text-gray-400 hover:text-indigo-600 ml-2 p-1 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit prompt and regenerate"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Prompt (optional)
                    </label>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Enter custom prompt for digest... (leave empty to use default prompt)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={4}
                      />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleGenerateDigest(customPrompt)}
                        disabled={isGeneratingDigest}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {isGeneratingDigest ? 'Regenerating...' : 'Regenerate Digest'}
                      </button>
                      <button
                        onClick={() => {
                          setShowPromptEdit(false);
                          setCustomPrompt('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {!showPromptEdit ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateDigest()}
                      disabled={isGeneratingDigest}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isGeneratingDigest ? 'Generating...' : 'Generate Digest'}
                    </button>
                    <button
                      onClick={() => setShowPromptEdit(true)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                    >
                      Custom Prompt
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Enter custom prompt for digest..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none text-gray-900 mb-2"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateDigest(customPrompt)}
                        disabled={isGeneratingDigest}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isGeneratingDigest ? 'Generating...' : 'Generate'}
                      </button>
                      <button
                        onClick={() => setShowPromptEdit(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={() => onMarkAsRead(!item.is_read)}
          className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-50 rounded-lg transition-colors"
        >
          {item.is_read ? 'Unarchive' : 'Archive'}
        </button>

        <button
          onClick={onDelete}
          className="ml-auto text-gray-400 hover:text-red-600"
          title="Delete"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
