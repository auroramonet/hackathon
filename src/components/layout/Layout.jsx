import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <main className="layout__main">
        {children}
      </main>
    </div>
  );
};

export default Layout;
