import React, { useState, useMemo } from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarSearch,
  TableToolbarContent,
  Pagination,
} from '@carbon/react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface SearchableTableProps<T> {
  title?: string;
  description?: string;
  rows: T[];
  columns: ColumnDef<T>[];
  toolbarActions?: React.ReactNode;
  emptyMessage?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  idField?: keyof T;
}

export function SearchableTable<T>({
  title,
  description,
  rows,
  columns,
  toolbarActions,
  emptyMessage = 'No records found',
  searchPlaceholder = 'Search records...',
  pageSize: initialPageSize = 10,
  idField,
}: SearchableTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter rows based on search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const lower = searchTerm.toLowerCase();
    return rows.filter((row) =>
      Object.entries(row as Record<string, unknown>).some(([_, value]) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(lower);
        }
        return String(value).toLowerCase().includes(lower);
      })
    );
  }, [rows, searchTerm]);

  // Paginate rows
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  // DataTable expects rows with string `id`
  const tableRows = useMemo(() => {
    return paginatedRows.map((row, index) => {
      let idVal = `row-${index}`;
      if (idField && (row as Record<string, unknown>)[idField as string] !== undefined) {
        idVal = String((row as Record<string, unknown>)[idField as string]);
      } else if ((row as Record<string, unknown>).id !== undefined) {
        idVal = String((row as Record<string, unknown>).id);
      }
      return {
        id: idVal,
        ...(row as Record<string, unknown>),
      };
    });
  }, [paginatedRows, idField]);

  const headers = useMemo(() => {
    return columns.map((col) => ({
      key: col.key,
      header: col.header,
    }));
  }, [columns]);

  return (
    <div>
      <DataTable rows={tableRows} headers={headers}>
        {({
          rows: renderedRows,
          headers: renderedHeaders,
          getHeaderProps,
          getRowProps,
          getTableProps,
          getTableContainerProps,
        }) => (
          <TableContainer
            title={title}
            description={description}
            {...getTableContainerProps()}
          >
            <TableToolbar>
              <TableToolbarSearch
                persistent
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  const val = typeof e === 'string' ? e : e?.target?.value || '';
                  setSearchTerm(val);
                  setPage(1);
                }}
              />
              {toolbarActions && (
                <TableToolbarContent>{toolbarActions}</TableToolbarContent>
              )}
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {renderedHeaders.map((header) => {
                    const colDef = columns.find((c) => c.key === header.key);
                    const { key: headerKey, ...headerProps } = getHeaderProps({
                      header,
                      isSortable: colDef?.sortable ?? false,
                    });
                    return (
                      <TableHeader key={headerKey} {...headerProps}>
                        {header.header}
                      </TableHeader>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  renderedRows.map((tableRow, rIdx) => {
                    const originalItem = paginatedRows[rIdx];
                    const { key: rowKey, ...rowProps } = getRowProps({ row: tableRow });
                    return (
                      <TableRow key={rowKey} {...rowProps}>
                        {tableRow.cells.map((cell) => {
                          const colDef = columns.find((c) => c.key === cell.info.header);
                          return (
                            <TableCell key={cell.id}>
                              {colDef?.render && originalItem
                                ? colDef.render(originalItem)
                                : (cell.value as React.ReactNode)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      {filteredRows.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          pageSizes={[5, 10, 20, 50]}
          totalItems={filteredRows.length}
          onChange={({ page: newPage, pageSize: newPageSize }) => {
            setPage(newPage);
            setPageSize(newPageSize);
          }}
        />
      )}
    </div>
  );
}
