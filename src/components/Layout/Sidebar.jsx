import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../Icon/Icon';
import './Layout.css';

function Sidebar() {
  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/' },
    { icon: 'form', label: 'My Forms', path: '/forms' },
    { icon: 'templates', label: 'Templates', path: '/templates' },
    { icon: 'responses', label: 'Responses', path: '/responses' },
    { icon: 'analytics', label: 'Analytics', path: '/analytics' },
  ];

  return (
    <aside className="app-sidebar hide-on-mobile">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Icon name="form" size={20} color="white" />
        </div>
        <span className="brand-text">RGUKT Forms</span>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item, index) => {
            return (
              <li key={index}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive && item.path === '/' ? 'active' : ''}`}
                >
                  <Icon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-mini">
          <div className="avatar">JD</div>
          <div className="user-info">
            <span className="user-name">John Doe</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
