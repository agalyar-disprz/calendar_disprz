import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

interface PrintButtonProps {
  className?: string;
  onClick?: () => void;
}

const PrintButton: React.FC<PrintButtonProps> = ({ className, onClick }) => {
  const handlePrint = () => {
    if (onClick) {
      // Use the provided onClick handler if available
      onClick();
    } else {
      // Default behavior: just print the current page
      window.print();
    }
  };

  return (
    <Tooltip title="Print Calendar">
      <IconButton 
        onClick={handlePrint} 
        className={className || 'print-button'}
        aria-label="Print calendar"
        size="small"
      >
        <PrintIcon />
      </IconButton>
    </Tooltip>
  );
};

export default PrintButton;
