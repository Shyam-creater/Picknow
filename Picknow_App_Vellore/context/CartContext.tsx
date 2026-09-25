import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '@/Services/api';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

interface CartContextType {
    cart: any;
    totalQuantity: number;
    isLoading: boolean;
    fetchCart: () => Promise<void>;
    addToCart: (data: any) => Promise<boolean>;
    updateQuantity: (variantId: string, productId: string, quantity: number) => Promise<void>;
    removeFromCart: (variantId: string, productId: string) => Promise<void>;
    clearCart: () => void;
    error: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { token, user } = useAuth();
    const [cart, setCart] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalQuantity = useMemo(() => {
        if (!cart || !cart.items) return 0;
        return cart.items.length;
    }, [cart]);

    const fetchCart = useCallback(async () => {
        if (!token) {
            setCart(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await authService.getCart(token);
            if (data.success) {
                setCart(data.cart);
            } else {
                setError(data.message || 'Failed to fetch cart');
            }
        } catch (error: any) {
            console.error('Error fetching cart:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = async (data: any) => {
        if (!token) {
            Alert.alert('Login Required', 'Please login to add items to cart');
            return false;
        }

        try {
            const result = await authService.addToCart(data, token);
            if (result.success) {
                setCart(result.cart);
                return true;
            }
            return false;
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add item to cart');
            return false;
        }
    };

    const updateQuantity = async (variantId: string, productId: string, quantity: number) => {
        if (!token || !cart) return;

        // Optimistic update
        const previousCart = { ...cart };
        const updatedItems = cart.items.map((item: any) => {
            if ((variantId && item.variantId === variantId) || (!variantId && item.product?._id === productId)) {
                return { ...item, quantity };
            }
            return item;
        });

        // Recalculate totals locally for immediate feedback
        let newTotalAmount = updatedItems.reduce((sum: number, item: any) => {
            const price = item.price || item.product?.pPrice || 0;
            return sum + (price * item.quantity);
        }, 0);

        const newCart = {
            ...cart,
            items: updatedItems,
            totalAmount: newTotalAmount,
            finalAmount: newTotalAmount + (cart.platformFee || 8) + (cart.shippingCharges || 0)
        };

        setCart(newCart);

        try {
            const result = await authService.updateCartItem({ variantId, productId, quantity }, token);
            if (result.success) {
                setCart(result.cart);
            } else {
                // Rollback if unsuccessful
                setCart(previousCart);
            }
        } catch (error: any) {
            setCart(previousCart);
            Alert.alert('Error', error.message || 'Failed to update quantity');
        }
    };

    const removeFromCart = async (variantId: string, productId: string) => {
        if (!token || !cart) return;

        // Optimistic update
        const previousCart = { ...cart };
        const updatedItems = cart.items.filter((item: any) => {
            if (variantId) return item.variantId !== variantId;
            return item.product?._id !== productId;
        });

        // Recalculate totals locally
        let newTotalAmount = updatedItems.reduce((sum: number, item: any) => {
            const price = item.price || item.product?.pPrice || 0;
            return sum + (price * item.quantity);
        }, 0);

        const newCart = {
            ...cart,
            items: updatedItems,
            totalAmount: newTotalAmount,
            finalAmount: newTotalAmount + (cart.platformFee || 8) + (cart.shippingCharges || 0)
        };

        setCart(newCart);

        try {
            const result = await authService.removeFromCart({ variantId, productId }, token);
            if (result.success) {
                setCart(result.cart);
            } else {
                // Rollback
                setCart(previousCart);
            }
        } catch (error: any) {
            setCart(previousCart);
            Alert.alert('Error', error.message || 'Failed to remove item');
        }
    };

    const clearCart = () => {
        setCart({ items: [], totalAmount: 0, finalAmount: 0, platformFee: 0, shippingCharges: 0 });
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                totalQuantity,
                isLoading,
                fetchCart,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                error,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
