import { Footprints, ListFilter, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { Input } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton, SkeletonCard } from '../../components/Skeleton'
import { formatMonthLabel } from '../../lib/dates'
import { humanizeError } from '../../lib/errors'
import { formatNumber } from '../../lib/format'
import type { ActivityFilters, ActivityRow } from '../../types/database'
import { HistoryCard } from './HistoryCard'
import {
  emptyHistoryFilters,
  FilterSheet,
  type HistoryFilterState,
} from './FilterSheet'
import { useActivities } from './queries'

const PAGE_SIZE = 30
const NO_ACTIVITIES: ActivityRow[] = []

interface MonthGroup {
  key: string
  label: string
  totalKm: number
  items: ActivityRow[]
}

export function HistoryPage() {
  const navigate = useNavigate()
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<HistoryFilterState>(emptyHistoryFilters)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchText.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchText])

  const queryFilters = useMemo<ActivityFilters>(
    () => ({
      type: filters.type === 'all' ? undefined : filters.type,
      from: filters.from || undefined,
      to: filters.to || undefined,
      runType: filters.runType === 'all' ? undefined : filters.runType,
      search: search || undefined,
    }),
    [filters, search],
  )

  const {
    data: activities,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useActivities(queryFilters)

  const items = activities ?? NO_ACTIVITIES

  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>()

    items.forEach((activity) => {
      const key = activity.activity_date.slice(0, 7)
      let group = map.get(key)
      if (!group) {
        group = {
          key,
          label: formatMonthLabel(key),
          totalKm: 0,
          items: [],
        }
        map.set(key, group)
      }
      group.totalKm += activity.distance_km ?? 0
      group.items.push(activity)
    })

    return Array.from(map.values())
  }, [items])

  const visibleGroups = useMemo(() => {
    let remaining = visibleCount
    return groups
      .map((group) => {
        const visible = group.items.slice(0, Math.max(0, remaining))
        remaining -= visible.length
        return { ...group, items: visible }
      })
      .filter((group) => group.items.length > 0)
  }, [groups, visibleCount])

  const displayedCount = visibleGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  )

  const activeFilterCount = [
    filters.type !== 'all',
    Boolean(filters.from),
    Boolean(filters.to),
    filters.runType !== 'all',
  ].filter(Boolean).length

  const hasAnyFilter = activeFilterCount > 0 || searchText.trim() !== ''

  const clearFilters = () => {
    setFilters(emptyHistoryFilters)
    setSearchText('')
    setSearch('')
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div>
      <PageHeader
        title="History"
        subtitle={
          isLoading
            ? 'Loading your log…'
            : `${items.length} ${items.length === 1 ? 'activity' : 'activities'}`
        }
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilterOpen(true)}
            aria-label={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
          >
            <ListFilter className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-600 px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <Input
          id="history-search"
          type="search"
          aria-label="Search notes"
          placeholder="Search notes"
          className="pl-10 pr-12"
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value)
            setVisibleCount(PAGE_SIZE)
          }}
        />
        {searchText ? (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:hover:text-zinc-200"
            onClick={() => {
              setSearchText('')
              setVisibleCount(PAGE_SIZE)
            }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-4" aria-label="Loading activities">
          <Skeleton className="h-4 w-32" />
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load history"
          message={humanizeError(error, 'Check your connection and try again.')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : groups.length === 0 ? (
        hasAnyFilter ? (
          <EmptyState
            icon={Search}
            title="No matches"
            description="Try a wider date range or clear the filters."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Footprints}
            title="No activities yet"
            description="Log your first run, trek or workout to start your history."
            action={<Button onClick={() => navigate('/log')}>Log an activity</Button>}
          />
        )
      ) : (
        <>
          <div className="space-y-5">
            {visibleGroups.map((group) => (
              <section key={group.key}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {group.label}
                  </h2>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {formatNumber(group.totalKm, 1)} km
                  </p>
                </div>
                <div className="space-y-2">
                  {group.items.map((activity) => (
                    <HistoryCard key={activity.id} activity={activity} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
              Showing {displayedCount} of {items.length}
              {isFetching ? ' · updating…' : ''}
            </p>
            {displayedCount < items.length ? (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load {Math.min(PAGE_SIZE, items.length - displayedCount)} more
              </Button>
            ) : null}
          </div>
        </>
      )}

      {filterOpen ? (
        <FilterSheet
          open
          filters={filters}
          onClose={() => setFilterOpen(false)}
          onApply={(next) => {
            setFilters(next)
            setVisibleCount(PAGE_SIZE)
          }}
        />
      ) : null}
    </div>
  )
}
