import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import styles from './navigation.module.css';

interface NavigationProps {
  onHotkeys: () => void;
}

const adminNav = [
  { to: '/dashboard', icon: 'DB', key: 'navigation.dashboard' },
  { to: '/orders', icon: 'OR', key: 'navigation.orders' },
  { to: '/clients', icon: 'CL', key: 'navigation.clients' },
  { to: '/ceremonies', icon: 'CE', key: 'navigation.ceremonies' },
  { to: '/resources', icon: 'RS', key: 'navigation.resources' },
  { to: '/analytics', icon: 'AN', key: 'navigation.analytics' },
  { to: '/settings', icon: 'ST', key: 'navigation.settings' },
];

const managerNav = [
  { to: '/manager', icon: 'MG', key: 'navigation.manager' },
  { to: '/orders', icon: 'OR', key: 'navigation.orders' },
  { to: '/clients', icon: 'CL', key: 'navigation.clients' },
  { to: '/settings', icon: 'ST', key: 'navigation.settings' },
];

const clientNav = [
  { to: '/store', icon: 'ST', key: 'navigation.store' },
  { to: '/cart', icon: 'CR', key: 'navigation.cart' },
];

const guestNav = [{ to: '/catalog', icon: 'CT', key: 'navigation.catalog' }];

export function Navigation({ onHotkeys }: NavigationProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const storedRoles = useAuthStore((state) => state.roles);

  const activeRoles = user?.roles?.length ? user.roles : storedRoles;
  const isGuestOnly = activeRoles.includes('guest') && activeRoles.length === 1;
  const isClient = activeRoles.includes('client') && !activeRoles.includes('admin') && !activeRoles.includes('manager');
  const isManager = activeRoles.includes('manager') && !activeRoles.includes('admin');
  const isAdmin = activeRoles.includes('admin');
  
  let items = guestNav;
  if (isAdmin) {
    items = adminNav;
  } else if (isManager) {
    items = managerNav;
  } else if (isClient) {
    items = clientNav;
  } else if (isGuestOnly) {
    items = guestNav;
  }
  const roleLabel = activeRoles.length
    ? activeRoles.map((role) => t(`roles.${role}`, { defaultValue: role })).join(', ')
    : t('roles.guest');

  const handleUserClick = () => {
    navigate('/profile');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>*</div>
        <div className={styles.brandText}>
          <span className="brand-heading">{t('appName')}</span>
          <small>{t('tagline')}</small>
        </div>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span className={styles.icon}>{item.icon}</span>
            <span>{t(item.key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.meta}>
        <div className={styles.user} onClick={handleUserClick} style={{ cursor: 'pointer' }}>
          <div className={styles.avatar}>{user?.firstName?.[0] ?? '?'}</div>
          <div>
            <div className={styles.userName}>{user ? `${user.firstName} ${user.lastName}` : t('roles.guest')}</div>
            <div className={styles.userRole}>{roleLabel}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
