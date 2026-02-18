import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{
      background: '#000000',
      minHeight: '100vh',
    }}>
      <Sidebar />
      <Header title="FINGUARD SENTINEL — AI GOVERNANCE TERMINAL" subtitle="BANKING COMPLIANCE MONITORING GRID" />
      <main style={{
        marginLeft: '220px',
        marginTop: '56px',
        padding: '8px',
      }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
