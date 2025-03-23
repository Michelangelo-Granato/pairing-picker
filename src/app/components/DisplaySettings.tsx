import React, { useRef, useEffect, useState } from 'react';

interface DisplaySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Set<string>;
  onToggleColumn: (column: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onToggleColumn,
  buttonRef
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    checkMobile();
    const debouncedResize = setTimeout(checkMobile, 100);
    window.addEventListener('resize', () => {
      clearTimeout(debouncedResize);
      setTimeout(checkMobile, 100);
    });
    return () => {
      clearTimeout(debouncedResize);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [buttonRef, onClose]);

  if (!isOpen) return null;

  const columns = [
    { key: "pairingNumber", label: "Pairing Number" },
    { key: "operatingDates", label: "Operating Dates" },
    { key: "blockTime", label: "Total Flight Credit" },
    { key: "tafb", label: "TAFB" },
    { key: "totalAllowance", label: "Total Allowance" },
  ];

  return (
    <>
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-200 ease-in-out z-40"
          onClick={onClose}
        />
      )}
      <div 
        ref={dropdownRef}
        className={`
          ${isMobile 
            ? 'fixed left-4 right-4 top-1/2 -translate-y-1/2 max-w-md mx-auto' 
            : 'absolute right-0 top-full mt-2'
          }
          bg-gray-700 p-4 rounded-lg shadow-xl z-50
          transition-all duration-200 ease-in-out
          opacity-0 scale-95
          animate-in data-[state=open]:opacity-100 data-[state=open]:scale-100
        `}
        data-state={isOpen ? 'open' : 'closed'}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Display Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <h3 className="font-medium">Visible Columns</h3>
          <div className="space-y-2">
            {columns.map((column) => (
              <label key={column.key} className="flex items-center gap-2 hover:bg-gray-600 p-2 rounded transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={visibleColumns.has(column.key)}
                  onChange={() => onToggleColumn(column.key)}
                  className="rounded"
                />
                {column.label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
          >
            OK
          </button>
        </div>
      </div>
    </>
  );
};

export default DisplaySettings; 