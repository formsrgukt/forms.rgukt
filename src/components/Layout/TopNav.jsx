import React from 'react';
import Icon from '../Icon/Icon';
import './Layout.css';

function TopNav() {
  return (
    <header className="app-topnav">
      <div className="topnav-left">
        <button className="btn-icon mobile-menu-btn hide-on-desktop">
          <Icon name="menu" size={24} />
        </button>
        <div className="search-bar hide-on-mobile">
          <Icon name="search" size={18} className="search-icon" />
          <input type="text" placeholder="Search forms, responses, templates..." className="search-input" />
        </div>
      </div>

      <div className="topnav-right">
        <button className="btn-icon">
          <Icon name="notifications" size={20} />
        </button>
        <button className="btn-icon hide-on-mobile">
          <Icon name="settings" size={20} />
        </button>
        <div className="profile-menu hide-on-desktop">
          <div className="avatar" style={{ width: '32px', height: '32px' }}>JD</div>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
