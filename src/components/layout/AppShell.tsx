import { ParentComponent } from 'solid-js';
import BottomNav from '../nav/BottomNav';
import DesktopToolsBar from '../nav/DesktopToolsBar';

interface AppShellProps {
  mapSlot?: unknown;
}

const AppShell: ParentComponent<AppShellProps> = (props) => {
  return (
    <div
      style={{
        display: 'grid',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        'grid-template-rows': '1fr auto',
        'grid-template-columns': '1fr',
      }}
      class="app-shell"
    >
      <style>{`
        @media (min-width: 768px) {
          .app-shell {
            grid-template-columns: 1fr auto !important;
            grid-template-rows: 1fr !important;
          }
          .app-shell .bottom-nav { display: none !important; }
          .app-shell .main-pane { grid-column: 1; }
          .app-shell .side-pane {
            grid-column: 2;
            display: flex !important;
            flex-direction: row;
            overflow: hidden;
          }
        }
        @media (max-width: 767px) {
          .app-shell .bottom-nav { display: flex !important; }
          .app-shell .side-pane { display: none !important; }
        }
      `}</style>

      {/* Main content area — map + mobile nav panes */}
      <div
        class="main-pane"
        style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-bg)' }}
      >
        {props.children}
      </div>

      {/* Desktop: right sidebar — panel + vertical icon tabs */}
      <div class="side-pane" style={{ display: 'none', background: 'var(--color-bg)' }}>
        <DesktopToolsBar />
      </div>

      {/* Mobile: bottom nav */}
      <BottomNav />
    </div>
  );
};

export default AppShell;
