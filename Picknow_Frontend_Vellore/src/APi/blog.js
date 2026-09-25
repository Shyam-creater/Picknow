import axiosInstance from './axiosInstance';

export const blogApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get('/blog/all');
    return data.blogs || [];
  },

  getById: async (id) => {
    const { data } = await axiosInstance.get(`/blog/${id}`);
    return data.blog;
  },
  getByCanonicalUrl: async (canonicalUrl) => {
    const { data } = await axiosInstance.get(`/blog/blog/${canonicalUrl}`);
    return data.blog;
  }
};


