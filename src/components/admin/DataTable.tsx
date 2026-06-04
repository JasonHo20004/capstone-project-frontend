import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReactNode, useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  /**
   * Provide to make the column header clickable for sorting. Return primitives
   * (string/number/Date). Columns without sortValue stay un-sortable.
   */
  sortValue?: (item: T) => string | number | Date | null | undefined;
}

interface DataTableProps<T> {
  title?: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  className?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  enablePagination?: boolean;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  /**
   * Enable row selection with checkboxes. Caller must also provide getRowId,
   * selectedIds, and onSelectionChange to wire it up.
   */
  selectable?: boolean;
  getRowId?: (item: T) => string;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Optional toolbar shown above the table when at least one row is selected. */
  bulkActions?: (selectedIds: string[]) => ReactNode;
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null;

export default function DataTable<T extends object>({
  title,
  description,
  data,
  columns,
  emptyMessage = "Không có dữ liệu",
  className = "",
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  enablePagination = true,
  defaultSort,
  selectable = false,
  getRowId,
  selectedIds,
  onSelectionChange,
  bulkActions,
}: DataTableProps<T>) {
  const selectionEnabled = selectable && Boolean(getRowId) && Boolean(onSelectionChange);
  const selectedSet = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);
  const [sort, setSort] = useState<SortState>(defaultSort ?? null);

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const column = columns.find((c) => String(c.key) === sort.key);
    if (!column?.sortValue) return data;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (av instanceof Date && bv instanceof Date) return (av.getTime() - bv.getTime()) * dir;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'vi') * dir;
    });
  }, [data, sort, columns]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Reset page when data changes and current page exceeds total
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(1, Math.ceil(sortedData.length / itemsPerPage))));
  }, [sortedData.length, itemsPerPage]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, safeCurrentPage, itemsPerPage, enablePagination]);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value, 10);
    setItemsPerPage(newSize);
    setCurrentPage(1);
    // Clear selection — the previous selection may not all appear in the new
    // page window, and a "ghost" selection misleads bulk actions.
    if (selectionEnabled && (selectedIds?.length ?? 0) > 0) {
      onSelectionChange?.([]);
    }
  };

  const visibleIds = useMemo(
    () => (selectionEnabled && getRowId ? paginatedData.map((item) => getRowId(item)) : []),
    [paginatedData, selectionEnabled, getRowId]
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((id) => selectedSet.has(id));

  const toggleAllVisible = (checked: boolean) => {
    if (!onSelectionChange) return;
    const current = new Set(selectedIds ?? []);
    if (checked) visibleIds.forEach((id) => current.add(id));
    else visibleIds.forEach((id) => current.delete(id));
    onSelectionChange(Array.from(current));
  };

  const toggleRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const current = new Set(selectedIds ?? []);
    if (checked) current.add(id);
    else current.delete(id);
    onSelectionChange(Array.from(current));
  };

  const handleSort = (columnKey: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== columnKey) return { key: columnKey, direction: 'asc' };
      if (prev.direction === 'asc') return { key: columnKey, direction: 'desc' };
      return null; // third click clears sort
    });
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {selectionEnabled && (selectedIds?.length ?? 0) > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 mb-3">
            <div className="text-sm">
              Đã chọn <span className="font-semibold">{selectedIds?.length}</span> mục
              <button
                type="button"
                onClick={() => onSelectionChange?.([])}
                className="ml-3 text-xs text-muted-foreground hover:text-foreground underline"
              >
                Bỏ chọn tất cả
              </button>
            </div>
            {bulkActions && <div className="flex items-center gap-2">{bulkActions(selectedIds ?? [])}</div>}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {selectionEnabled && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false
                    }
                    onCheckedChange={(v) => toggleAllVisible(Boolean(v))}
                    aria-label="Chọn tất cả mục đang hiển thị"
                  />
                </TableHead>
              )}
              {columns.map((column, index) => {
                const colKey = String(column.key);
                const sortable = Boolean(column.sortValue);
                const isActive = sortable && sort?.key === colKey;
                return (
                  <TableHead key={index} className={column.className}>
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(colKey)}
                        className={cn(
                          'inline-flex items-center gap-1 select-none hover:text-foreground transition-colors',
                          isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                        )}
                      >
                        {column.header}
                        {!isActive && <ChevronsUpDown className="h-3 w-3 opacity-50" />}
                        {isActive && sort?.direction === 'asc' && <ChevronUp className="h-3 w-3" />}
                        {isActive && sort?.direction === 'desc' && <ChevronDown className="h-3 w-3" />}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectionEnabled ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, rowIndex) => {
                const rowId = selectionEnabled && getRowId ? getRowId(item) : undefined;
                const isSelected = rowId !== undefined && selectedSet.has(rowId);
                return (
                  <TableRow key={rowId ?? rowIndex} data-state={isSelected ? 'selected' : undefined}>
                    {selectionEnabled && rowId !== undefined && (
                      <TableCell className="w-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(v) => toggleRow(rowId, Boolean(v))}
                          aria-label="Chọn mục này"
                        />
                      </TableCell>
                    )}
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex} className={column.className}>
                        {column.render
                          ? column.render(item)
                          : String(item[column.key as keyof T] || '')
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {enablePagination && totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
            {/* Left: Items per page */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Hiển thị</span>
              <Select value={String(itemsPerPage)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>/ trang</span>
            </div>

            {/* Center: Page info */}
            <div className="text-sm text-muted-foreground">
              {startItem}–{endItem} trong tổng số {totalItems} mục
            </div>

            {/* Right: Page navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(1)}
                disabled={safeCurrentPage === 1}
                title="Trang đầu"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                title="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers().map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground text-sm">
                    …
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === safeCurrentPage ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                title="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Trang cuối"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}