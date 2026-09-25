import axios from './axiosInstance';

export const fetchNotifications = async (userId) => {
  try {
    const response = await axios.get(`/notifications?userId=${userId || ''}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const response = await axios.put(`/notifications/mark-read/${notificationId}`, { userId });
    return response.data;
  } catch (error) {
    throw error;
  }
};
