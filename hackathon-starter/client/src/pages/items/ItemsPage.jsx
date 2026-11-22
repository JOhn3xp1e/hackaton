import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MoreHorizontal, Pencil, Plus, RefreshCw, SearchX, Trash2 } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/components/ui/toast'
import { itemsService } from '@/services/itemsService'
import { config } from '@/lib/config'
import { ITEM_STATUSES } from '@/lib/schemas'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { SearchBar } from '@/components/shared/SearchBar'
import { Pagination } from '@/components/shared/Pagination'
import { StatusBadge, STATUS_MAP, PRIORITY_MAP } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ItemFormModal } from './ItemFormModal'

const PAGE_SIZE = 8

/**
 * ITEMS — a complete CRUD reference implementation:
 * list + search + filter + server-side pagination + create/edit modal + delete confirm + toasts.
 * Copy this page when you build the real resource.
 */
export default function ItemsPage() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null) // null = closed, {} = new, item = edit
  const [deleting, setDeleting] = useState(null)
  const debouncedSearch = useDebounce(search, 300)

  // Open "new" modal from ?new=1 (used by dashboard quick actions)
  useEffect(() => {
    if (searchParams.get('new')) {
      setEditing({})
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Reset to page 1 when filters change
  useEffect(() => setPage(1), [debouncedSearch, status])

  const { data, isLoading, error, refetch } = useAsync(
    () => itemsService.list({ page, pageSize: PAGE_SIZE, search: debouncedSearch, status }),
    [page, debouncedSearch, status],
  )
  const rows = data?.data ?? []
  const meta = data?.meta ?? { page: 1, totalPages: 1, total: 0 }

  // If the current page became empty (e.g. after deleting its last row), step back
  useEffect(() => {
    if (!isLoading && rows.length === 0 && page > 1) setPage((p) => p - 1)
  }, [isLoading, rows.length, page])

  const handleSave = async (values) => {
    if (editing?.id) {
      await itemsService.update(editing.id, values)
      toast.success('Item updated', { description: values.title })
    } else {
      await itemsService.create(values)
      toast.success('Item created', { description: values.title })
    }
    setEditing(null)
    refetch()
  }

  const handleDelete = async () => {
    try {
      await itemsService.remove(deleting.id)
      toast.success('Item deleted', { description: deleting.title })
      refetch()
    } catch (err) {
      toast.error('Could not delete', { description: err.message })
    }
  }

  const columns = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (r) => (
        <div className="grid max-w-md gap-0.5">
          <span className="truncate font-medium">{r.title}</span>
          {r.description && <span className="truncate text-[12.5px] text-muted-foreground">{r.description}</span>}
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, hideOnMobile: true, render: (r) => <Badge variant="outline">{r.category}</Badge> },
    { key: 'priority', header: 'Priority', sortable: true, hideOnMobile: true, render: (r) => <StatusBadge status={r.priority} map={PRIORITY_MAP} /> },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', header: 'Updated', sortable: true, hideOnMobile: true, align: 'right', render: (r) => <span className="text-muted-foreground tabular">{formatDate(r.updatedAt)}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-12',
      align: 'right',
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.title}`} onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          {/* React events bubble through portals — stop them reaching the row's onClick */}
          <DropdownMenuContent align="end" className="min-w-40" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => setEditing(r)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => setDeleting(r)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const hasFilters = Boolean(debouncedSearch || status)

  return (
    <>
      <PageHeader
        breadcrumbs
        title="Items"
        description={`Reference CRUD screen. Data source: ${config.useMocks ? 'in-memory mock store' : `REST API (${config.apiUrl}/items)`}.`}
        actions={
          <>
            <Tooltip content="Refresh">
              <Button variant="outline" size="icon" onClick={refetch} aria-label="Refresh">
                <RefreshCw />
              </Button>
            </Tooltip>
            <Button leftIcon={<Plus />} onClick={() => setEditing({})}>
              New item
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title or description…" className="sm:max-w-sm" />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="sm:w-44"
            options={[{ value: '', label: 'All statuses' }, ...ITEM_STATUSES.map((s) => ({ value: s, label: STATUS_MAP[s].label }))]}
            aria-label="Filter by status"
          />
          {hasFilters && (
            <Button variant="ghost" onClick={() => { setSearch(''); setStatus('') }}>
              Clear filters
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onRowClick={(r) => setEditing(r)}
          empty={
            hasFilters
              ? { icon: SearchX, title: 'No matching items', description: 'Try a different search or clear the filters.' }
              : {
                  title: 'No items yet',
                  description: 'Create your first item to see it here.',
                  action: <Button size="sm" leftIcon={<Plus />} onClick={() => setEditing({})}>New item</Button>,
                }
          }
        />

        {!error && rows.length > 0 && (
          <Pagination page={meta.page} pageCount={meta.totalPages} total={meta.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      <ItemFormModal
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        item={editing?.id ? editing : null}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this item?"
        description={deleting ? `“${deleting.title}” will be permanently removed. This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  )
}
