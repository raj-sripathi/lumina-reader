'use client';

import { useState, useEffect } from 'react';
import EmptyState from '@/components/EmptyState';
import ContentCard from '@/components/ContentCard';
import AddModal from '@/components/AddModal';
import Header from '@/components/Header';

export interface ReadingItem {
  id: number;
  type: 'url' | 'pdf';
  title: string;
  url?: string;
  file_path?: string;
  file_name?: string;
  digest?: string;
  digest_prompt?: string;
  date_added: number;
  is_read: number;
  metadata?: string;
}

type FilterType = 'all' | 'unread' | 'archived';

export default function Home() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('unread');

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !item.is_read;
    if (filter === 'archived') return item.is_read;
    return true;
  });

  const unreadCount = items.filter(item => !item.is_read).length;
  const archivedCount = items.filter(item => item.is_read).length;

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddItem = () => {
    setIsAddModalOpen(false);
    fetchItems();
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await fetch(`/api/items/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleMarkAsRead = async (id: number, isRead: boolean) => {
    try {
      await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: isRead ? 1 : 0 })
      });
      fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAddClick={() => setIsAddModalOpen(true)} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        {items.length > 0 && (
          <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reading List {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'archived'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Archived {archivedCount > 0 && `(${archivedCount})`}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({items.length})
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <EmptyState onAddClick={() => setIsAddModalOpen(true)} />
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">
              {filter === 'archived' ? 'No archived items yet' : 'No items in this view'}
            </p>
            <p className="text-sm text-gray-400">
              {filter === 'archived' ? 'Mark items as read to archive them' : 'Try changing your filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onDelete={() => handleDeleteItem(item.id)}
                onMarkAsRead={(isRead) => handleMarkAsRead(item.id, isRead)}
                onUpdate={fetchItems}
              />
            ))}
          </div>
        )}
      </main>

      {isAddModalOpen && (
        <AddModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  );
}
