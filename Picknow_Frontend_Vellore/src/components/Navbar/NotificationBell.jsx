import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCircle } from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { transformImageUrl } from '../../APi/utils';
import './NotificationBell.css';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await markAsRead('all');
  };

  return (
    <div className="pn-notif-wrapper" ref={dropdownRef}>
      <button className="pn-notif-bell-btn" onClick={toggleDropdown} aria-label="Notifications">
        <FaBell size={22} />
        {unreadCount > 0 && (
          <span className="pn-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="pn-notif-dropdown glassmorphism">
          <div className="pn-notif-header">
            <h3>Notifications {unreadCount > 0 && <span>({unreadCount})</span>}</h3>
            {notifications.length > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="pn-notif-clear-btn">
                Clear All
              </button>
            )}
          </div>

          <div className="pn-notif-list">
            {loading && notifications.length === 0 ? (
              <div className="pn-notif-loading">Loading...</div>
            ) : notifications.filter(n => !n.isRead).length === 0 ? (
              <div className="pn-notif-empty">
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.filter(n => !n.isRead).map((notif) => (
                <div
                  key={notif._id}
                  className={`pn-notif-item ${!notif.isRead ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notif-avatar">
                    {notif.metadata?.image ? (
                      <img
                        src={transformImageUrl(notif.metadata.image)}
                        alt="notif"
                        className="notif-img"
                      />
                    ) : (
                      <div className={`notif-icon-circle ${notif.type.toLowerCase()}`}>
                        <FaBell size={14} />
                      </div>
                    )}
                    {!notif.isRead && <span className="unread-dot"></span>}
                  </div>

                  <div className="pn-notif-content-info">
                    <div className="notif-header-row">
                      <span className="notif-type">{notif.type}</span>
                      <span className="notif-time">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <h4 className="notif-title">{notif.title || "Product Update"}</h4>
                    <p className="notif-message">{notif.message || "A product you were interested in has been updated."}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pn-notif-footer">
            <button type="button" onClick={() => { setIsOpen(false); navigate('/profile?tab=notifications'); }}>
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
