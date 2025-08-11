import { AppListItemWithContext } from '../AppListItem/AppListItemWithContext'
import type { AppConfig } from '../../types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableAppListItemWithContextProps {
  app: AppConfig
  selectedAppId: string | null
  onAppSelect: (app: AppConfig) => void
  onEdit: (app: AppConfig) => void
  onDelete: (app: AppConfig) => void
  onDuplicate: (app: AppConfig) => void
}

export function SortableAppListItemWithContext({
  app,
  selectedAppId,
  onAppSelect,
  onEdit,
  onDelete,
  onDuplicate
}: SortableAppListItemWithContextProps) {
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
      <AppListItemWithContext
        app={app}
        isSelected={selectedAppId === app.id}
        onClick={() => onAppSelect(app)}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
      />
    </div>
  )
}
