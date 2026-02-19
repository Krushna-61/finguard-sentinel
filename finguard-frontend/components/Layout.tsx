import Sidebar from './Sidebar';
import Header from './Header';
import styles from './Layout.module.css';

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
      <div className={styles.layoutWrapper}>
        <Header title="FINGUARD SENTINEL — AI GOVERNANCE TERMINAL" subtitle="BANKING COMPLIANCE MONITORING GRID" />
        <main
          style={{
            marginTop: '56px',
            padding: '8px',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
