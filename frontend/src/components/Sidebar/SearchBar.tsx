// In your SearchBar.tsx component
import React from 'react';
import { Box, TextField, InputAdornment, Chip, Typography, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { APPOINTMENT_TYPES } from '../../types/appointment';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  selectedTypes?: string[];
  onTypeToggle?: (type: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Search appointments...",
  selectedTypes = [],
  onTypeToggle
}) => {
  return (
    <Box sx={{ mb: 2 }} className="search-bar-container">
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          sx: {
            borderRadius: '8px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#e0e0e0',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#147dce',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#147dce',
            },
          }
        }}
      />
      
      {onTypeToggle && (
        <Box className="type-filters-container">
          <Typography variant="caption" className="filter-heading">
            Filter by type:
          </Typography>
          <Stack direction="row" className="filter-chips-container" flexWrap="wrap" gap={0.5}>
            {APPOINTMENT_TYPES.map((type) => (
              <Chip
                key={type.id}
                label={type.label}
                className={`filter-chip ${selectedTypes.includes(type.id) ? 'active' : ''}`}
                onClick={() => onTypeToggle(type.id)}
                data-color={type.color}
                icon={
                  // Add the color dot as an icon
                  <span style={{ 
                    display: 'inline-block', 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: type.color,
                    marginRight: '4px'
                  }}></span>
                }
                sx={{
                  borderColor: selectedTypes.includes(type.id) ? type.color : 'transparent'
                }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default SearchBar;
