import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  perPage, 
  onPageChange,
  className = '' 
}) => {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * perPage + 1;
  const endIndex = Math.min(currentPage * perPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);
    
    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Item count */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{startIndex}</span> to{' '}
        <span className="font-medium">{endIndex}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-0">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors border border-gray-300 border-r-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center">
          {getPageNumbers()[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1 text-sm hover:bg-gray-100 transition-colors border border-gray-300 border-r-0"
              >
                1
              </button>
              {getPageNumbers()[0] > 2 && (
                <span className="px-2 text-gray-400 border border-gray-300 border-r-0 py-1">...</span>
              )}
            </>
          )}

          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 text-sm transition-colors border border-gray-300 border-r-0 ${
                page === currentPage
                  ? 'bg-blue-600 text-white font-medium border-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {page}
            </button>
          ))}

          {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
            <>
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-400 border border-gray-300 border-r-0 py-1">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 text-sm hover:bg-gray-100 transition-colors border border-gray-300 border-r-0"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors border border-gray-300"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
