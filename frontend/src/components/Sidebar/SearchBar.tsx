import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Search appointments..." 
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
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
    </Box>
  );
};

export default SearchBar;
