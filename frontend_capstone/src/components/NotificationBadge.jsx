import React from 'react';

/**
 * Notification Badge Component
 * Shows a count badge or a red dot indicator
 * 
 * @param {number} count - Number to display in badge
 * @param {boolean} dot - Show as a small dot instead of count
 * @param {string} variant - 'danger' (red), 'warning' (yellow), 'info' (blue)
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {boolean} pulse - Add pulse animation
 */
export default function NotificationBadge({ 
  count = 0, 
  dot = false, 
  variant = 'danger', 
  size = 'md',
  pulse = false,
  className = '' 
}) {
  if (count === 0 && !dot) return null;

  const variantClasses = {
    danger: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white',
  };

  const sizeClasses = {
    sm: dot ? 'w-1.5 h-1.5' : 'px-1.5 py-0.5 text-[10px]',
    md: dot ? 'w-2 h-2' : 'px-2 py-0.5 text-xs',
    lg: dot ? 'w-2.5 h-2.5' : 'px-2.5 py-1 text-sm',
  };

  const pulseClass = pulse ? 'animate-pulse' : '';

  if (dot) {
    return (
      <span 
        className={`
          ${sizeClasses[size]} 
          ${variantClasses[variant]} 
          ${pulseClass}
          rounded-full 
          inline-block
          ${className}
        `}
        aria-label="New item"
      />
    );
  }

  return (
    <span 
      className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        ${pulseClass}
        inline-flex 
        items-center 
        justify-center 
        font-bold 
        leading-none 
        rounded-full
        min-w-[16px]
        ${className}
      `}
      aria-label={`${count} new items`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Tab Badge Component
 * Specifically styled for use in tab navigation
 */
export function TabBadge({ count, active = false }) {
  if (count === 0) return null;

  return (
    <span 
      className={`
        ml-2 
        px-2 
        py-0.5 
        text-xs 
        font-bold 
        rounded-full
        ${active 
          ? 'bg-red-500 text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }
      `}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Row Badge Component  
 * Small dot indicator for table/list rows
 */
export function RowBadge({ isNew, pulse = true }) {
  if (!isNew) return null;

  return (
    <span className="flex-shrink-0 mr-3">
      <NotificationBadge 
        dot 
        size="md" 
        variant="danger" 
        pulse={pulse}
      />
    </span>
  );
}

/**
 * Card Badge Component
 * Positioned badge for cards
 */
export function CardBadge({ count, position = 'top-right' }) {
  if (count === 0) return null;

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  };

  return (
    <span className={`absolute ${positionClasses[position]} z-10`}>
      <NotificationBadge count={count} size="sm" pulse />
    </span>
  );
}
