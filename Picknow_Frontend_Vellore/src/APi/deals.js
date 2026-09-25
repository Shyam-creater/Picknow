import axiosInstance from "./axiosInstance";

export const createDeals = async (dealsData) => {
    try {
        const response = await axiosInstance.post('/add/deals', dealsData);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getAllDeals = async () => {
    try {
        const response = await axiosInstance.get('/all/deals');
        return response.data;
    } catch (error) {
        throw error;
    }
}




