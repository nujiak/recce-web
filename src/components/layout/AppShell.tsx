import { ParentComponent, Show } from 'solid-js';
import BottomNav from '../nav/BottomNav';
import DesktopToolsBar from '../nav/DesktopToolsBar';
import { useUI } from '../../context/UIContext';

const AppShell: ParentComponent = (props) => {
  const { activeNav } = useUI();

  return (
    <div
      style={{
        display: 'grid',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        // Desktop: map pane + 320px sidebar
        // Mobile: single column, nav at bottom
        'grid-template-rows': '1fr auto',
        'grid-template-columns': '1fr',
      }}
      class="app-shell"
    >
      {/* Desktop sidebar layout via CSS */}
      <style>{`
        @media (min-width: 768px) {
          .app-shell {
            grid-template-columns: 1fr 320px !important;
            grid-template-rows: 1fr !important;
          }
          .app-shell .desktop-tools-bar { display: flex !important; }
          .app-shell .bottom-nav { display: none !important; }
          .app-shell .main-pane { grid-column: 1; }
          .app-shell .side-pane { grid-column: 2; display: flex !important; flex-direction: column; overflow-y: auto; border-left: 1px solid var(--color-border); }
        }
        @media (max-width: 767px) {
          .app-shell .desktop-tools-bar { display: none !important; }
          .app-shell .bottom-nav { display: flex !important; }
          .app-shell .side-pane { display: none !important; }
        }
      `}</style>

      {/* Main content area (map on mobile, map + side pane on desktop) */}
      <div class="main-pane" style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-bg)' }}>
        {props.children}
      </div>

      {/* Desktop: right sidebar */}
      <div class="side-pane" style={{ display: 'none', background: 'var(--color-bg)' }}>
        <DesktopToolsBar />
      </div>

      {/* Mobile: bottom nav */}
      <BottomNav />
    </div>
  );
};

export default AppShell;
