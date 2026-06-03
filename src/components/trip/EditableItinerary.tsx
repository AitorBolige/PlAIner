"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save, Loader2, Check } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import type { DayDTO, ActivityDTO } from "@/components/trip/DayAccordion";
import { useLocale } from "@/lib/i18n-client";
import { useDisplayMoney } from "@/lib/use-display-money";
import { type Locale, type Translations } from "@/lib/i18n";

function getLocalizedStartTime(val: string | null, targetLocale: string): string {
  if (!val) return "";
  const name = val.trim().toLowerCase();
  const timesMap: Record<string, Record<string, string>> = {
    "matí": { ca: "Matí", es: "Mañana", en: "Morning" },
    "morning": { ca: "Matí", es: "Mañana", en: "Morning" },
    "mañana": { ca: "Matí", es: "Mañana", en: "Morning" },

    "dinar": { ca: "Dinar", es: "Almuerzo", en: "Lunch" },
    "lunch": { ca: "Dinar", es: "Almuerzo", en: "Lunch" },
    "almuerzo": { ca: "Dinar", es: "Almuerzo", en: "Lunch" },

    "tarda": { ca: "Tarda", es: "Tarde", en: "Afternoon" },
    "afternoon": { ca: "Tarda", es: "Tarde", en: "Afternoon" },
    "tarde": { ca: "Tarda", es: "Tarde", en: "Afternoon" },

    "sopar": { ca: "Sopar", es: "Cena", en: "Dinner" },
    "dinner": { ca: "Sopar", es: "Cena", en: "Dinner" },
    "cena": { ca: "Sopar", es: "Cena", en: "Dinner" },
  };
  return timesMap[name]?.[targetLocale] ?? val;
}

// Helpers -------------------------------------------------------------------

function findContainerForActivity(
  days: DayDTO[],
  activityId: string,
): string | null {
  for (const d of days) {
    if (d.activities.some((a) => a.id === activityId)) return d.id;
  }
  return null;
}

function moveActivity(
  days: DayDTO[],
  activityId: string,
  fromDayId: string,
  toDayId: string,
  toIndex: number,
): DayDTO[] {
  const fromDay = days.find((d) => d.id === fromDayId)!;
  const activity = fromDay.activities.find((a) => a.id === activityId)!;

  return days.map((d) => {
    if (d.id === fromDayId && d.id === toDayId) {
      // Same-day reorder
      const oldIndex = d.activities.findIndex((a) => a.id === activityId);
      const newOrder = arrayMove(d.activities, oldIndex, toIndex);
      return { ...d, activities: reindex(newOrder) };
    }
    if (d.id === fromDayId) {
      return {
        ...d,
        activities: reindex(d.activities.filter((a) => a.id !== activityId)),
      };
    }
    if (d.id === toDayId) {
      const next = [...d.activities];
      const insertAt = Math.min(Math.max(toIndex, 0), next.length);
      next.splice(insertAt, 0, activity);
      return { ...d, activities: reindex(next) };
    }
    return d;
  });
}

function reindex(activities: ActivityDTO[]): ActivityDTO[] {
  return activities.map((a, i) => ({ ...a, order: i }));
}

function dayTotal(d: DayDTO) {
  return d.activities.reduce((sum, a) => sum + a.cost, 0);
}

function fingerprint(days: DayDTO[]) {
  return days
    .map((d) => `${d.id}:${d.activities.map((a) => a.id).join(",")}`)
    .join("|");
}

// Sortable item ------------------------------------------------------------

function SortableActivity({
  activity,
  dayId,
  locale,
  t,
  readonly,
}: {
  activity: ActivityDTO;
  dayId: string;
  locale: string;
  t: Translations;
  readonly?: boolean;
}) {
  const displayMoney = useDisplayMoney();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: activity.id, data: { dayId, type: "activity" } });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="rounded-[var(--r-md)] border border-border bg-surface p-3"
    >
      <div className="flex items-start gap-3">
        {!readonly && (
          <button
            type="button"
            aria-label={t.dragActivityAria}
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab touch-none rounded text-faint hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:cursor-grabbing"
          >
            <GripVertical size={16} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text">
            {activity.startTime ? `${getLocalizedStartTime(activity.startTime, locale)} · ` : ""}
            {activity.name}
          </div>
          {activity.description ? (
            <div className="mt-1 line-clamp-2 text-xs text-muted">
              {activity.description}
            </div>
          ) : null}
          <div className="mt-2 text-xs text-muted">
            {activity.duration ? `${activity.duration} min · ` : ""}
            {displayMoney(activity.cost)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Day column ---------------------------------------------------------------

function DayColumn({ day, locale, t, readonly }: { day: DayDTO; locale: string; t: Translations; readonly?: boolean; }) {
  const displayMoney = useDisplayMoney();
  const total = dayTotal(day);
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="display text-base font-extrabold tracking-[-0.02em]">
          {t.dayNTitle(day.dayNumber, day.title)}
        </div>
        <div className="text-xs text-muted">
          {t.activitiesCount(day.activities.length)} · {displayMoney(total)}
        </div>
      </div>

      {readonly ? (
        <div className="grid gap-2" data-day-id={day.id}>
          {day.activities.length === 0 ? (
            <div className="rounded-[var(--r-md)] border border-dashed border-border-md p-4 text-center text-xs text-faint">
              {t.dragActivitiesHere}
            </div>
          ) : (
            day.activities.map((a) => (
              <SortableActivity key={a.id} activity={a} dayId={day.id} locale={locale} t={t} readonly={true} />
            ))
          )}
        </div>
      ) : (
        <SortableContext
          items={day.activities.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-2" data-day-id={day.id}>
            {day.activities.length === 0 ? (
              <div className="rounded-[var(--r-md)] border border-dashed border-border-md p-4 text-center text-xs text-faint">
                {t.dragActivitiesHere}
              </div>
            ) : (
              day.activities.map((a) => (
                <SortableActivity key={a.id} activity={a} dayId={day.id} locale={locale} t={t} />
              ))
            )}
          </div>
        </SortableContext>
      )}
    </Card>
  );
}

// Main component ------------------------------------------------------------

export interface EditableItineraryProps {
  tripId: string;
  initialDays: DayDTO[];
  initialLocale?: Locale;
  readonly?: boolean;
}

export function EditableItinerary({
  tripId,
  initialDays,
  initialLocale,
  readonly,
}: EditableItineraryProps) {
  const { locale, t } = useLocale(initialLocale);
  const [days, setDays] = React.useState<DayDTO[]>(initialDays);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const initialFingerprint = React.useMemo(
    () => fingerprint(initialDays),
    [initialDays],
  );
  const dirty = fingerprint(days) !== initialFingerprint;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromDay = findContainerForActivity(days, activeId);
    const overIsDay = days.some((d) => d.id === overId);
    const toDay = overIsDay ? overId : findContainerForActivity(days, overId);
    if (!fromDay || !toDay || fromDay === toDay) return;

    setDays((current) => {
      const targetDay = current.find((d) => d.id === toDay)!;
      const toIndex = overIsDay
        ? targetDay.activities.length
        : targetDay.activities.findIndex((a) => a.id === overId);
      return moveActivity(current, activeId, fromDay, toDay, toIndex);
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromDay = findContainerForActivity(days, activeId);
    const overIsDay = days.some((d) => d.id === overId);
    const toDay = overIsDay ? overId : findContainerForActivity(days, overId);
    if (!fromDay || !toDay) return;

    setDays((current) => {
      const targetDay = current.find((d) => d.id === toDay)!;
      const toIndex = overIsDay
        ? targetDay.activities.length
        : targetDay.activities.findIndex((a) => a.id === overId);
      return moveActivity(current, activeId, fromDay, toDay, toIndex);
    });
  }

  async function onSave() {
    setSaving(true);
    const payload = {
      days: days.map((d) => ({
        id: d.id,
        activities: d.activities.map((a, i) => ({ id: a.id, order: i })),
      })),
    };
    try {
      const res = await fetch(`/api/trips/${tripId}/activities/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(t.itinerarySavedToast);
    } catch {
      toast.error(t.itinerarySaveFailedToast);
    } finally {
      setSaving(false);
    }
  }

  const activeActivity = activeId
    ? days.flatMap((d) => d.activities).find((a) => a.id === activeId)
    : null;

  return (
    <div className="grid gap-3">
      {!readonly && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted">
            {t.dragActivitiesHint}
          </div>
          {dirty ? (
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={saving}
              className={cn("normal-case tracking-normal")}
            >
              {saving ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 size={14} className="animate-spin" /> {t.savingText}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Save size={14} /> {t.saveText}
                </span>
              )}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Check size={12} /> {t.noChangesText}
            </span>
          )}
        </div>
      )}

      {readonly ? (
        <div className="grid gap-3">
          {days.map((d) => (
            <DayColumn key={d.id} day={d} locale={locale} t={t} readonly={true} />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-3">
            {days.map((d) => (
              <DayColumn key={d.id} day={d} locale={locale} t={t} />
            ))}
          </div>

          <DragOverlay>
            {activeActivity ? (
              <div className="rounded-[var(--r-md)] border border-brand bg-surface p-3 shadow-[var(--shadow-lg)]">
                <div className="text-sm font-semibold text-text">
                  {activeActivity.startTime ? `${activeActivity.startTime} · ` : ""}
                  {activeActivity.name}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
