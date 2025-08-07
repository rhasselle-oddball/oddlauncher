import { AppListItem } from '../AppListItem'
import type { AppConfig } from '../../types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableAppListItemProps {
  app: AppConfig
  selectedAppId: string | null
  onAppSelect: (app: AppConfig) => void
}

export function SortableAppListItem({ 
  app, 
  selectedAppId, 
  onAppSelect 
}: SortableAppListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <AppListItem
        app={app}
        isSelected={selectedAppId === app.id}
        onClick={() => onAppSelect(app)}
      />
    </div>
  )
}
