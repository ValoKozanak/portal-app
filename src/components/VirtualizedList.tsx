import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface VirtualizedListProps<T> {
  items: T[];
  height?: number;
  itemHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

function VirtualizedList<T>({
  items,
  height = 400,
  itemHeight = 60,
  renderItem,
  className = '',
  emptyMessage = 'Žiadne položky'
}: VirtualizedListProps<T>) {
  const Row = useMemo(() => {
    return ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style} className="px-4 py-2">
        {renderItem(items[index], index)}
      </div>
    );
  }, [items, renderItem]);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-${height} text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`h-${height} ${className}`}>
      <AutoSizer>
        {({ height: autoHeight, width }: { height: number; width: number }) => (
          <List
            height={autoHeight}
            itemCount={items.length}
            itemSize={itemHeight}
            width={width}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

export default VirtualizedList;
