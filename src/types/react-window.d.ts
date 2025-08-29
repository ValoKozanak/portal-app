declare module 'react-window' {
  import React from 'react';

  export interface FixedSizeListProps {
    height: number;
    itemCount: number;
    itemSize: number;
    width: number;
    children: React.ComponentType<any>;
    className?: string;
    style?: React.CSSProperties;
    itemData?: any;
    itemKey?: (index: number, data: any) => string | number;
    overscanCount?: number;
    useIsScrolling?: boolean;
    onScroll?: (props: { scrollDirection: 'forward' | 'backward'; scrollOffset: number; scrollUpdateWasRequested: boolean }) => void;
    onItemsRendered?: (props: { visibleStartIndex: number; visibleStopIndex: number; overscanStartIndex: number; overscanStopIndex: number }) => void;
  }

  export const FixedSizeList: React.ComponentType<FixedSizeListProps>;
  export const VariableSizeList: React.ComponentType<any>;
  export const FixedSizeGrid: React.ComponentType<any>;
  export const VariableSizeGrid: React.ComponentType<any>;
}

declare module 'react-virtualized-auto-sizer' {
  import React from 'react';

  interface AutoSizerProps {
    children: (size: { width: number; height: number }) => React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    onResize?: (size: { width: number; height: number }) => void;
  }

  const AutoSizer: React.ComponentType<AutoSizerProps>;
  export default AutoSizer;
}
