import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. */
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRetry?: () => void;
  /** Renders a highlighted row (e.g. overdue payments). */
  getRowClassName?: (row: T) => string | undefined;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  error = null,
  emptyMessage = 'Нет данных',
  onRetry,
  getRowClassName,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 px-4 py-16 text-sm text-gray-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        Загрузка данных…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-red-600">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Повторить
          </button>
        ) : null}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-sm text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={[
                  'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500',
                  column.headerClassName ?? '',
                ].join(' ')}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={[
                'border-b border-gray-100 last:border-b-0',
                getRowClassName?.(row) ?? '',
              ].join(' ')}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={['px-4 py-3 align-middle', column.className ?? ''].join(' ')}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
