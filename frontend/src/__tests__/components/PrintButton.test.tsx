import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintButton from '../../components/PrintButton';

// Mock the window.print function
const originalPrint = window.print;
beforeEach(() => {
  window.print = jest.fn();
});
afterEach(() => {
  window.print = originalPrint;
});

describe('PrintButton', () => {
  it('renders the print button with tooltip', () => {
    render(<PrintButton />);
    
    // Find the button by its aria-label
    const button = screen.getByLabelText('Print calendar');
    expect(button).toBeInTheDocument();
  });
  
  it('calls window.print when clicked with no onClick prop', () => {
    render(<PrintButton />);
    
    // Find and click the button
    const button = screen.getByLabelText('Print calendar');
    fireEvent.click(button);
    
    // Check if window.print was called
    expect(window.print).toHaveBeenCalledTimes(1);
  });
  
  it('calls custom onClick handler when provided', () => {
    // Create a mock function
    const mockOnClick = jest.fn();
    
    render(<PrintButton onClick={mockOnClick} />);
    
    // Find and click the button
    const button = screen.getByLabelText('Print calendar');
    fireEvent.click(button);
    
    // Check if our custom handler was called instead of window.print
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(window.print).not.toHaveBeenCalled();
  });
  
  it('applies custom className when provided', () => {
    render(<PrintButton className="custom-class" />);
    
    const button = screen.getByLabelText('Print calendar');
    expect(button).toHaveClass('custom-class');
    expect(button).not.toHaveClass('print-button');
  });
});
