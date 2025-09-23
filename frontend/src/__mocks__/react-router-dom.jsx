import React from 'react';

// Mock the components
const BrowserRouter = ({ children }) => <div>{children}</div>;
const Routes = ({ children }) => <div>{children}</div>;
const Route = ({ children }) => <div>{children}</div>;
const Navigate = () => <div>Navigate</div>;
const Link = ({ children, to }) => <a href={to}>{children}</a>;

// Mock the hooks
const useNavigate = () => jest.fn();
const useLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
});
const useParams = () => ({});

export {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
  useParams
};
