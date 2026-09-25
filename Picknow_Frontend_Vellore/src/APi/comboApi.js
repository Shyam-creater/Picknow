import axios from 'axios';
import axiosInstance from './axiosInstance';

export const getAllCombos = async () => {
    try {
        const response = await axiosInstance.get('/combo/all');
        console.log('Raw API Response:', response);
        console.log('Combo Images:', response.data.map(combo => ({
            id: combo._id,
            image: combo.ccImage
        })));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch combos' };
    }
};

export const getComboById = async (id) => {
    try {
        console.log('Fetching combo with ID:', id);
        const response = await axiosInstance.get(`/combo/${id}`);
        console.log('Raw combo response:', response);
        console.log('Combo Image:', response.data.combo?.ccImage);

        if (response.data && response.data.success) {
            const combo = response.data.combo;
            if (combo.ccProducts) {
                combo.ccProducts = combo.ccProducts.map(product => {
                    console.log('Product Image:', product.pImage);
                    let productImage = 'default-image-path.jpg';
                    if (product.pImage) {
                        if (typeof product.pImage === 'string') {
                            productImage = product.pImage.startsWith('http')
                                ? product.pImage
                                : `https://backmern.picknow.in${product.pImage}`;
                        } else if (Array.isArray(product.pImage) && product.pImage.length > 0) {
                            productImage = product.pImage[0].startsWith('http')
                                ? product.pImage[0]
                                : `https://backmern.picknow.in${product.pImage[0]}`;
                        }
                    }
                    console.log('Processed Product Image:', productImage);
                    return {
                        ...product,
                        pImage: productImage
                    };
                });
            }
            return combo;
        }
        return null;
    } catch (error) {
        console.error('Error in getComboById:', error.response || error);
        if (error.response?.status === 404) {
            return null;
        }
        throw error.response?.data || error;
    }
};

export const getComboProducts = async (id) => {
    try {
        console.log('Fetching products for combo:', id);
        const response = await axiosInstance.get(`/combo/${id}/products`);

        if (response.data && response.data.success) {
            return response.data;
        }
        throw new Error('Failed to fetch combo products');
    } catch (error) {
        console.error('Error fetching combo products:', error);
        throw error.response?.data || error;
    }
};
