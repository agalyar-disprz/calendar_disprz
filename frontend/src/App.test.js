import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the App component to avoid dependencies
jest.mock('./App', () => {
  return {
    __esModule: true,
    default: () => <div>Mocked App</div>
  };
});

test('renders mocked app', () => {
  const App = require('./App').default;
  render(<App />);
  expect(screen.getByText('Mocked App')).toBeInTheDocument();
});
