import { Inbox, Search, FileX, Users, ClipboardList, Package } from 'lucide-react';

const ILLUSTRATIONS = {
  default:   Inbox,
  search:    Search,
  file:      FileX,
  users:     Users,
  clipboard: ClipboardList,
  equipment: Package,
};

/**
 * Friendly empty-state illustration + message.
 * @param {{ icon?: keyof ILLUSTRATIONS, title?: string, message?: string, action?: ReactNode }} props
 */
export default function EmptyState({
  icon = 'default',
  title = 'Nothing here yet',
  message = 'No data found.',
  action,
}) {
  const Icon = ILLUSTRATIONS[icon] || ILLUSTRATIONS.default;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-gray-300 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
