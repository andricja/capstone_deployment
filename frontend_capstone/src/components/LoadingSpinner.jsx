import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ 
  size = "default", 
  className = "",
  text = null 
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-green-600`} />
      {text && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}

// Full page loading spinner
export function FullPageSpinner({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

// Inline loading spinner for buttons
export function ButtonSpinner() {
  return <Loader2 className="w-4 h-4 animate-spin" />;
}
