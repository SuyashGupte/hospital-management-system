import React, { useState } from 'react';
import { Content } from '@carbon/react';
import { Outlet, useLocation } from 'react-router-dom';
import { HeaderNav } from './HeaderNav';
import { SideNav } from './SideNav';
import { NotificationContainer } from '../common/Notification';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

// Routes that should not show the sidebar navigation
const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.HOME];

export const AppLayout: React.FC = () => {
  const [isSideNavExpanded, setIsSideNavExpanded] = useState<boolean>(true);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Show sidebar only for authenticated users not on public/landing pages
  const isPublicRoute = (PUBLIC_ROUTES as string[]).includes(location.pathname);
  const showSidebar = isAuthenticated && !isPublicRoute;

  return (
    <div className="app-container">
      <HeaderNav
        isSideNavExpanded={isSideNavExpanded && showSidebar}
        onClickSideNavExpand={() => setIsSideNavExpanded((prev) => !prev)}
      />
      {showSidebar && <SideNav isExpanded={isSideNavExpanded} />}
      <Content
        className={showSidebar ? (isSideNavExpanded ? 'main-content main-content--with-sidenav' : 'main-content main-content--sidenav-collapsed') : 'main-content main-content--full'}
      >
        <NotificationContainer />
        <Outlet />
      </Content>
    </div>
  );
};
