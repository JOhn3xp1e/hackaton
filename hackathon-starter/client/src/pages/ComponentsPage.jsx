import { useState } from 'react'
import { Bell, Download, Heart, Inbox, Plus, Settings, Trash2, Users } from 'lucide-react'
import { useDisclosure } from '@/hooks/useDisclosure'
import { usePagination } from '@/hooks/usePagination'
import { useToast } from '@/components/ui/toast'
import { mockItems } from '@/data/mock/items'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { DataTable } from '@/components/shared/DataTable'
import { SearchBar } from '@/components/shared/SearchBar'
import { Pagination } from '@/components/shared/Pagination'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AnimatedCounter } from '@/components/shared/AnimatedCounter'
import { TextReveal } from '@/components/shared/Reveal'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Field } from '@/components/ui/field'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function Section({ id, title, file, children }) {
  return (
    <section id={id} className="grid grid-cols-1 gap-4 border-t border-border pt-8 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {file && <code className="min-w-0 break-all font-mono text-[11.5px] text-muted-foreground">{file}</code>}
      </div>
      {children}
    </section>
  )
}

function Demo({ className = '', children }) {
  return <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>{children}</div>
}

/**
 * COMPONENT GALLERY — every reusable component, live. Use it as a copy-paste reference.
 */
export default function ComponentsPage() {
  const toast = useToast()
  const modal = useDisclosure()
  const confirm = useDisclosure()
  const [checked, setChecked] = useState(true)
  const [query, setQuery] = useState('')
  const [counter, setCounter] = useState(1280)
  const [tableState, setTableState] = useState('data')
  const filtered = mockItems.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
  const pager = usePagination(filtered, 4)

  return (
    <>
      <PageHeader
        breadcrumbs
        eyebrow="Design system"
        title="Component library"
        description="Every reusable building block in one place. Open the file shown next to each section to see its usage notes."
      />

      <div className="grid grid-cols-1 gap-10">
        <Section title="Buttons" file="components/ui/button.jsx">
          <Demo className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="dark">Dark</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive" leftIcon={<Trash2 />}>Delete</Button>
            <Button variant="link">Link</Button>
            <Button loading>Saving</Button>
            <Button size="sm" leftIcon={<Plus />}>Small</Button>
            <Button size="lg">Large</Button>
            <Tooltip content="Icon button with tooltip">
              <Button size="icon" variant="outline" aria-label="Like"><Heart /></Button>
            </Tooltip>
          </Demo>
        </Section>

        <Section title="Form controls" file="components/ui/{input,textarea,select,checkbox,field}.jsx">
          <Demo className="grid gap-5 md:grid-cols-2">
            <Field label="Name" htmlFor="demo-name" hint="As it appears on your badge" required>
              <Input id="demo-name" placeholder="Jane Doe" />
            </Field>
            <Field label="Email" htmlFor="demo-email" error="Enter a valid email">
              <Input id="demo-email" defaultValue="jane@" aria-invalid />
            </Field>
            <Field label="Role" htmlFor="demo-role">
              <Select id="demo-role" defaultValue="" placeholder="Choose a role…" options={['Frontend', 'Backend', 'Database']} />
            </Field>
            <Field label="Search with icon" htmlFor="demo-search">
              <Input id="demo-search" leftIcon={<Users />} placeholder="Find people" />
            </Field>
            <Field label="Notes" htmlFor="demo-notes" className="md:col-span-2">
              <Textarea id="demo-notes" placeholder="Anything else?" rows={3} />
            </Field>
            <div className="grid gap-3 md:col-span-2">
              <Checkbox label="Email notifications" description="Get updates about your items." checked={checked} onCheckedChange={setChecked} />
              <Checkbox label="Indeterminate state" checked="indeterminate" />
              <Checkbox label="Disabled" disabled />
            </div>
          </Demo>
        </Section>

        <Section title="Badges & avatars" file="components/ui/badge.jsx">
          <Demo className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success" dot>Success</Badge>
            <Badge variant="warning" dot>Warning</Badge>
            <Badge variant="danger" dot>Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="solid">Solid</Badge>
            <StatusBadge status="in_progress" />
            <span className="mx-2 h-6 w-px bg-border" />
            <Avatar name="Jordan Lee" size="sm" />
            <Avatar name="Sam Patel" />
            <Avatar name="Alex Rivera" size="lg" />
          </Demo>
        </Section>

        <Section title="Cards & stat cards" file="components/ui/card.jsx · shared/StatCard.jsx">
          <div className="grid gap-4 md:grid-cols-3">
            <Card interactive>
              <CardHeader>
                <CardTitle>Interactive card</CardTitle>
                <CardDescription>Hover me — subtle lift.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Cards compose header, content and footer.</CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">Action</Button>
              </CardFooter>
            </Card>
            <StatCard label="Revenue" value={48290} format={formatCurrency} delta={8.1} hint="vs last week" icon={Download} spark={[3, 5, 4, 7, 6, 9]} />
            <StatCard label="Error rate" value={2.4} format={(n) => `${n}%`} delta={-0.8} invertTrend hint="lower is better" spark={[6, 5, 5, 4, 3, 2]} />
          </div>
        </Section>

        <Section title="Overlays: modal, confirm, dropdown, toast, tooltip" file="components/ui/{modal,confirm-dialog,dropdown-menu,toast,tooltip}.jsx">
          <Demo className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={modal.open}>Open modal</Button>
            <Button variant="outline" onClick={confirm.open}>Confirm dialog</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuItem shortcut="⌘N"><Plus /> New</DropdownMenuItem>
                <DropdownMenuItem><Settings /> Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive><Trash2 /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => toast.success('Saved successfully', { description: 'Your changes are live.' })}>Success toast</Button>
            <Button variant="outline" onClick={() => toast.error('Request failed', { description: 'The server returned 500.' })}>Error toast</Button>
            <Button
              variant="outline"
              onClick={() => toast({ title: 'Item archived', action: { label: 'Undo', onClick: () => toast.info('Restored') } })}
            >
              Toast with action
            </Button>
            <Tooltip content="Tooltips work on any focusable element">
              <Button variant="ghost" size="icon" aria-label="Notifications"><Bell /></Button>
            </Tooltip>
          </Demo>
        </Section>

        <Section title="Tabs" file="components/ui/tabs.jsx">
          <Demo className="grid gap-8">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="text-sm text-muted-foreground">Underline variant — the indicator animates between tabs.</TabsContent>
              <TabsContent value="activity" className="text-sm text-muted-foreground">Activity content.</TabsContent>
              <TabsContent value="settings" className="text-sm text-muted-foreground">Settings content.</TabsContent>
            </Tabs>
            <Tabs defaultValue="week" variant="pill">
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </Demo>
        </Section>

        <Section title="Data table, search & pagination" file="shared/{DataTable,SearchBar,Pagination}.jsx">
          <div className="flex flex-wrap items-center gap-3">
            <SearchBar value={query} onChange={setQuery} className="max-w-xs" />
            <Tabs value={tableState} onValueChange={setTableState} variant="pill">
              <TabsList>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
                <TabsTrigger value="empty">Empty</TabsTrigger>
                <TabsTrigger value="error">Error</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <DataTable
            columns={[
              { key: 'title', header: 'Title', sortable: true, render: (r) => <span className="font-medium">{r.title}</span> },
              { key: 'category', header: 'Category', sortable: true, hideOnMobile: true },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            data={tableState === 'empty' ? [] : tableState === 'loading' ? [] : pager.pageItems}
            isLoading={tableState === 'loading'}
            error={tableState === 'error' ? new Error('Failed to load items (demo error).') : null}
            onRetry={() => setTableState('data')}
            empty={{ icon: Inbox, title: 'No results', description: 'Nothing matches your search.' }}
          />
          {tableState === 'data' && (
            <Pagination page={pager.page} pageCount={pager.pageCount} total={pager.total} pageSize={pager.pageSize} onPageChange={pager.setPage} />
          )}
        </Section>

        <Section title="Feedback states" file="components/feedback/*">
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState title="No projects yet" description="Create one to get started." action={<Button size="sm" leftIcon={<Plus />}>New project</Button>} compact />
            <ErrorState error={{ message: 'Could not connect to the API.', status: 503, code: 'SERVICE_UNAVAILABLE' }} onRetry={() => toast('Retrying…')} compact />
            <Demo><LoadingSkeleton variant="list" rows={3} /></Demo>
            <Demo className="grid place-items-center gap-3">
              <Spinner className="text-primary" />
              <span className="eyebrow">Spinner</span>
            </Demo>
          </div>
        </Section>

        <Section title="Motion: counters & text reveal" file="shared/{AnimatedCounter,Reveal}.jsx · lib/motion.js">
          <Demo className="flex flex-wrap items-center justify-between gap-6">
            <div className="grid gap-1">
              <span className="eyebrow">Animated counter</span>
              <AnimatedCounter value={counter} className="font-display text-4xl font-semibold tabular" />
            </div>
            <Button variant="outline" onClick={() => setCounter(Math.round(Math.random() * 10000))}>Randomize</Button>
            <TextReveal key={counter} as="p" text="Subtle text reveals guide attention." className="font-display text-xl font-medium" />
          </Demo>
        </Section>

        <Section title="Breadcrumbs" file="shared/Breadcrumbs.jsx">
          <Demo>
            <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Projects', to: '/items' }, { label: 'Hackathon MVP' }]} />
          </Demo>
        </Section>
      </div>

      <Modal
        open={modal.isOpen}
        onOpenChange={modal.setIsOpen}
        title="Invite teammates"
        description="They'll get an email with a link to join."
        footer={
          <>
            <Button variant="outline" onClick={modal.close}>Cancel</Button>
            <Button onClick={() => { modal.close(); toast.success('Invites sent (demo)') }}>Send invites</Button>
          </>
        }
      >
        <Field label="Email addresses" htmlFor="invite" hint="Separate with commas">
          <Input id="invite" placeholder="sam@team.dev, jordan@team.dev" />
        </Field>
      </Modal>

      <ConfirmDialog
        open={confirm.isOpen}
        onOpenChange={confirm.setIsOpen}
        title="Delete project?"
        description="All items in this project will be removed permanently."
        confirmLabel="Delete project"
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 800))
          toast.success('Project deleted (demo)')
        }}
      />
    </>
  )
}
