import axiosInstance from "./axiosInstance";

export const createBlog = async (blogData) => {
  try {
    const response = await axiosInstance.post('/blog/create', blogData, {   
        headers: {  
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  } 
};

export const updateBlog = async (id, blogData) => {
  try {
    const response = await axiosInstance.put(`/blog/update/${id}`, blogData, {  
        headers: {  
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }         
};

export const deleteBlog = async (id) => {
  try {
    const response = await axiosInstance.delete(`/blog/delete/${id}`);              
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  } 
};

export const getAllBlogs = async () => {
  try {
    const response = await axiosInstance.get('/blog/all');      
    return response.data;
  }
    catch (error) {     
    throw error.response ? error.response.data : error.message;
    }   
};

export const getBlogById = async (id) => {
  try {
    const response = await axiosInstance.get(`/blog/${id}`);    
    return response.data;
    } catch (error) {   
    throw error.response ? error.response.data : error.message;
  } 

};  