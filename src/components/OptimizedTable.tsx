import React, { useMemo, useCallback } from 'react';
import VirtualizedList from './VirtualizedList';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: number;
}

interface OptimizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  height?: number;
  itemHeight?: number;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

function OptimizedTable<T>({
  data,
  columns,
  sortBy,
  sortDirection = 'asc',
  onSort,
  height = 400,
  itemHeight = 50,
  className = '',
  emptyMessage = 'Žiadne dáta',
  loading = false
}: OptimizedTableProps<T>) {
  // Memoizované zoradené dáta
  const sortedData = useMemo(() => {
    if (!sortBy) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortBy, sortDirection]);

  // Memoizovaný render riadku
  const renderRow = useCallback((item: T, index: number) => (
    <div className="flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {columns.map((column) => (
        <div
          key={column.key}
          className="px-4 py-3 text-sm text-gray-900"
          style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
        >
          {column.render(item)}
        </div>
      ))}
    </div>
  ), [columns]);

  // Memoizovaný header
  const tableHeader = useMemo(() => (
    <div className="flex items-center bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
      {columns.map((column) => (
        <div
          key={column.key}
          className={`px-4 py-3 text-sm ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
          style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
          onClick={() => column.sortable && onSort?.(column.key)}
        >
          <div className="flex items-center">
            {column.header}
            {column.sortable && sortBy === column.key && (
              <svg
                className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  ), [columns, sortBy, sortDirection, onSort]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Načítavam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {tableHeader}
      <VirtualizedList
        items={sortedData}
        height={height - 50} // Odpočítaj header výšku
        itemHeight={itemHeight}
        renderItem={renderRow}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}

export default React.memo(OptimizedTable) as <T>(props: OptimizedTableProps<T>) => React.ReactElement;
















