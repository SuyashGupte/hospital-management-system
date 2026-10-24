import React, { useEffect, useState } from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderMenuButton,
  HeaderMenuItem,
} from '@carbon/react';
import {
  UserAvatar,
  Logout,
  Email,
} from '@carbon/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../common/ThemeToggle';
import { messageService } from '../../services/messageService';
import { ROUTES, formatRoleLabel } from '../../utils';

interface HeaderNavProps {
  isSideNavExpanded: boolean;
  onClickSideNavExpand: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  isSideNavExpanded,
  onClickSideNavExpand,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const count = await messageService.getUnreadCount();
        if (isMounted) setUnreadCount(count);
      } catch {
        // Ignore unread count failure in background
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000); // Polling every minute
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <Header aria-label="Hospital Management System">
      <HeaderMenuButton
        aria-label={isSideNavExpanded ? 'Close navigation' : 'Open navigation'}
        onClick={onClickSideNavExpand}
        isActive={isSideNavExpanded}
      />
      <HeaderName as={Link} to={ROUTES.HOME} prefix="">
        Hospital Management System
      </HeaderName>

      {isAuthenticated && (
        <HeaderNavigation aria-label="Quick Actions">
          <HeaderMenuItem as={Link} to={ROUTES.HOME}>
            Home
          </HeaderMenuItem>
          <HeaderMenuItem as={Link} to={ROUTES.MESSAGES_INBOX}>
            Messages {unreadCount > 0 ? `(${unreadCount})` : ''}
          </HeaderMenuItem>
        </HeaderNavigation>
      )}

      <HeaderGlobalBar>
        <ThemeToggle />

        {isAuthenticated ? (
          <>
            <HeaderGlobalAction
              aria-label={`Inbox (${unreadCount} unread)`}
              tooltipAlignment="end"
              onClick={() => navigate(ROUTES.MESSAGES_INBOX)}
            >
              <Email size={20} />
            </HeaderGlobalAction>

            <HeaderGlobalAction
              aria-label={`User Profile: ${user?.userName} (${formatRoleLabel(user?.type)})`}
              tooltipAlignment="end"
              onClick={() => navigate(ROUTES.PROFILE)}
            >
              <UserAvatar size={20} />
            </HeaderGlobalAction>

            <HeaderGlobalAction
              aria-label="Logout"
              tooltipAlignment="end"
              onClick={handleLogout}
            >
              <Logout size={20} />
            </HeaderGlobalAction>
          </>
        ) : (
          <HeaderGlobalAction
            aria-label="Login"
            tooltipAlignment="end"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            <UserAvatar size={20} />
          </HeaderGlobalAction>
        )}
      </HeaderGlobalBar>
    </Header>
  );
};
