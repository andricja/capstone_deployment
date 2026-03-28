export default function Pagination({ data, onPageChange }) {
  if (!data || !data.last_page || data.last_page <= 1) return null;

  const pages = [];
  for (let i = 1; i <= data.last_page; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 text-sm rounded ${
            page === data.current_page
              ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
