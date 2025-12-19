interface EmptyStateProps {
  onAddClick: () => void;
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="max-w-md w-full border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
        <p className="text-gray-500 mb-4">Library is empty.</p>
        <button
          onClick={onAddClick}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Add something to read
        </button>
      </div>
    </div>
  );
}
