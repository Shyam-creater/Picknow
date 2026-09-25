import React from 'react';
import PropTypes from 'prop-types';

const DashboardCard = ({ title, value, change, icon, type = 'default' }) => {
  // Function to determine change status class
  const getChangeStatusClass = () => {
    if (!change) return 'neutral';
    return change.includes('+') ? 'positive' : 'negative';
  };

  // Function to format large numbers
  const formatValue = (val) => {
    if (typeof val === 'number' && val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    return val;
  };

  return (
    <div className={`stat-card ${type}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{formatValue(value)}</div>
        {change && (
          <div className={`stat-change ${getChangeStatusClass()}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
};

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  icon: PropTypes.node,
  type: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger'])
};

export default DashboardCard; 