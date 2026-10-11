import { Package, Search, FileX, AlertCircle, Inbox, Calendar, Users } from 'lucide-react';

const icons = {
  package: Package,
  search: Search,
  file: FileX,
  alert: AlertCircle,
  inbox: Inbox,
  calendar: Calendar,
  users: Users,
};

export default function EmptyState({
  icon = 'inbox',
  title = "No items found",
  description = "There are no items to display at this time.",
  action = null,
  className = ""
}) {
  const Icon = icons[icon] || icons.inbox;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function NoEquipmentFound({ onAddNew }) {
  return (
    <EmptyState
      icon="package"
      title="No Equipment Found"
      description="You haven't listed any equipment yet. Add your first piece of equipment to start renting it out."
      action={
        onAddNew && (
          <button
            onClick={onAddNew}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg hover:from-green-700 hover:to-emerald-600 transition-colors"
          >
            Add Equipment
          </button>
        )
      }
    />
  );
}

export function NoSearchResults({ onClearSearch }) {
  return (
    <EmptyState
      icon="search"
      title="No Results Found"
      description="We couldn't find any equipment matching your search criteria. Try adjusting your filters or search terms."
      action={
        onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Clear Filters
          </button>
        )
      }
    />
  );
}

export function NoRentalsYet() {
  return (
    <EmptyState
      icon="calendar"
      title="No Rental Requests Yet"
      description="You don't have any rental requests at the moment. Check back later or browse available equipment."
    />
  );
}

export function NoUsersFound() {
  return (
    <EmptyState
      icon="users"
      title="No Users Found"
      description="There are no users matching your current filters."
    />
  );
}
