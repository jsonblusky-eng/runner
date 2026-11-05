import { useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { Field, Input } from '../../components/Field'
import {
  ACTIVITY_LABELS,
  ACTIVITY_TYPES,
  RUN_TYPE_LABELS,
  RUN_TYPES,
  type ActivityType,
  type RunType,
} from '../../types/database'

export interface HistoryFilterState {
  type: ActivityType | 'all'
  from: string
  to: string
  runType: RunType | 'all'
}

export const emptyHistoryFilters: HistoryFilterState = {
  type: 'all',
  from: '',
  to: '',
  runType: 'all',
}

interface FilterSheetProps {
  open: boolean
  filters: HistoryFilterState
  onClose: () => void
  onApply: (filters: HistoryFilterState) => void
}

export function FilterSheet({ open, filters, onClose, onApply }: FilterSheetProps) {
  const [draft, setDraft] = useState<HistoryFilterState>(filters)

  const invalidRange = Boolean(draft.from && draft.to && draft.from > draft.to)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filter history"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => setDraft(emptyHistoryFilters)}
          >
            Reset
          </Button>
          <Button
            disabled={invalidRange}
            onClick={() => {
              onApply(draft)
              onClose()
            }}
          >
            Apply filters
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Activity type
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={draft.type === 'all'}
              onClick={() => setDraft({ ...draft, type: 'all' })}
            >
              All types
            </Chip>
            {ACTIVITY_TYPES.map((type) => (
              <Chip
                key={type}
                active={draft.type === type}
                onClick={() => setDraft({ ...draft, type })}
              >
                {ACTIVITY_LABELS[type]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Run type
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={draft.runType === 'all'}
              onClick={() => setDraft({ ...draft, runType: 'all' })}
            >
              Any
            </Chip>
            {RUN_TYPES.map((runType) => (
              <Chip
                key={runType}
                active={draft.runType === runType}
                onClick={() => setDraft({ ...draft, runType })}
              >
                {RUN_TYPE_LABELS[runType]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="From" htmlFor="filter-from">
            <Input
              id="filter-from"
              type="date"
              value={draft.from}
              onChange={(event) => setDraft({ ...draft, from: event.target.value })}
            />
          </Field>
          <Field label="To" htmlFor="filter-to">
            <Input
              id="filter-to"
              type="date"
              value={draft.to}
              onChange={(event) => setDraft({ ...draft, to: event.target.value })}
            />
          </Field>
        </div>

        {invalidRange ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            The start date must be before the end date.
          </p>
        ) : null}
      </div>
    </BottomSheet>
  )
}
