const reactRouterDom = jest.createMockFromModule('react-router-dom');

// Mock the components
reactRouterDom.BrowserRouter = ({ children }) => children;
reactRouterDom.Routes = ({ children }) => children;
reactRouterDom.Route = ({ children }) => children;
reactRouterDom.Navigate = jest.fn();
reactRouterDom.useNavigate = () => jest.fn();
reactRouterDom.useLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
});
reactRouterDom.useParams = () => ({});
reactRouterDom.Link = ({ children, to }) => <a href={to}>{children}</a>;

module.exports = reactRouterDom;
