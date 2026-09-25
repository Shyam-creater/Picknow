import React, { useState, useEffect } from 'react';
import {
    StyleSheet, TouchableOpacity, ScrollView, View,
    Alert, ActivityIndicator, RefreshControl, Image, Text,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { authService, productService } from '@/Services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import CustomHeader from '@/components/CustomHeader';
import PremiumLoader from '@/components/PremiumLoader';

const API_BASE = 'https://backmern.picknow.in';

const getImgUrl = (img: any): string | null => {
    if (!img) return null;
    const s = Array.isArray(img) ? img[0] : img;
    if (!s) return null;
    if (s.startsWith('http')) return s;
    if (s.startsWith('/')) return `${API_BASE}${s}`;
    return `${API_BASE}/images/${s}`;
};

export default function CartScreen() {
    const { token } = useAuth();
    const { cart, isLoading, fetchCart, updateQuantity, removeFromCart, error } = useCart();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const scrollRef = React.useRef<any>(null);
    useScrollToTop(scrollRef);

    const [deliveryData, setDeliveryData] = useState<any[]>([]);
    const [calculatedShippingFee, setCalculatedShippingFee] = useState(0);
    const [defaultAddress, setDefaultAddress] = useState<any>(null);

    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [enrichedProducts, setEnrichedProducts] = useState<Record<string, any>>({});
    const [savedItems, setSavedItems] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    useEffect(() => {
        if (cart && cart.items && cart.items.length > 0) {
            enrichCartItems();
        }
    }, [cart?.items]);

    useFocusEffect(
        React.useCallback(() => {
            if (token) {
                loadShippingContext();
                fetchCart();
                fetchSavedItems();
            }
        }, [token])
    );

    useEffect(() => {
        if (token) {
            loadShippingContext();
        }
    }, [token]);

    const loadShippingContext = async () => {
        try {
            const [addrRes, delRes] = await Promise.all([
                authService.getAddresses(token!),
                authService.getDeliveryData()
            ]);

            if (addrRes.success) {
                const def = addrRes.addresses?.find((a: any) => a.isDefault) || addrRes.addresses?.[0] || null;
                setDefaultAddress(def);
            }

            if (delRes?.data) {
                setDeliveryData(delRes.data);
            }
        } catch (error) {
            console.error('Error loading shipping context:', error);
        }
    };

    const updateShippingFee = React.useCallback((data: any[], state: string) => {
        if (!state || !data || data.length === 0 || !cart?.items || cart.items.length === 0) {
            setCalculatedShippingFee(cart?.shippingCharges || 0);
            return;
        }

        const normalizedState = state.toLowerCase().trim().replace(/\s+/g, "");
        const info = data.find((d: any) => {
            const dState = d.state || d.Name || d.State;
            const normalizedDState = dState ? dState.toLowerCase().trim().replace(/\s+/g, "") : "";
            return normalizedDState === normalizedState;
        });

        if (!info) {
            setCalculatedShippingFee(cart?.shippingCharges || 40);
            return;
        }

        const allItemsFree = cart.items.every((item: any) => item?.product?.freeshipping === true);
        if (allItemsFree) {
            setCalculatedShippingFee(0);
            return;
        }

        const productSubtotal = cart.items.reduce((sum: number, item: any) => {
            if ((item.product?.pType || item.variantType) !== 'combo') {
                const price = item.price || 0;
                return sum + price * (item.quantity || 1);
            }
            return sum;
        }, 0);

        const hasProducts = cart.items.some((item: any) => (item.product?.pType || item.variantType) !== 'combo');
        const hasCombos = cart.items.some((item: any) => (item.product?.pType || item.variantType) === 'combo');

        let fee = 0;
        if (hasProducts && productSubtotal >= 500) {
            fee = info.above500_deliveryfee || 0;
        } else if (hasProducts && hasCombos) {
            fee = info.above500_deliveryfee || 0;
        } else if (hasCombos) {
            fee = info.combodeliveryfee || 0;
        } else if (hasProducts) {
            fee = info.productdeliveryfee || 0;
        }

        setCalculatedShippingFee(fee);
    }, [cart?.items, cart?.shippingCharges]);

    useEffect(() => {
        if (defaultAddress?.state && deliveryData.length > 0) {
            updateShippingFee(deliveryData, defaultAddress.state);
        } else {
            setCalculatedShippingFee(cart?.shippingCharges || 0);
        }
    }, [defaultAddress, deliveryData, updateShippingFee, cart?.shippingCharges]);

    const enrichCartItems = async () => {
        if (!cart?.items) return;
        try {
            const enrichment: Record<string, any> = { ...enrichedProducts };
            let changed = false;
            await Promise.all(cart.items.map(async (item: any) => {
                const pId = item.product?._id || item.product;
                if (pId && !enrichment[pId]) {
                    try {
                        const pData = await productService.getProductById(pId);
                        if (pData?.success) { enrichment[pId] = pData.product; changed = true; }
                    } catch (err) { /* silent */ }
                }
            }));
            if (changed) setEnrichedProducts(enrichment);
        } catch { /* silent */ }
    };

    const onRefresh = async () => { setRefreshing(true); await fetchCart(); setRefreshing(false); };

    const handleQty = async (variantId: string, productId: string, qty: number) => {
        if (qty < 1) return;
        setUpdatingId(variantId || productId);
        await updateQuantity(variantId, productId, qty);
        setUpdatingId(null);
    };

    const handleRemove = (variantId: string, productId: string) => {
        Alert.alert('Remove Item', 'Remove this item from your cart?', [
            { text: 'Keep', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(variantId, productId) },
        ]);
    };

    const handleSingleItemCheckout = (item: any) => {
        router.push({
            pathname: '/checkout',
            params: {
                singleItem: JSON.stringify(item)
            }
        });
    };

    const fetchSavedItems = async () => {
        if (!token) return;
        try {
            const res = await authService.getSaveForLater(token);
            if (res.success) {
                setSavedItems(res.products || []);
            }
        } catch (err: any) {
            // Silently handle auth/permission errors to prevent console spam
            if (err?.message?.includes('Admins only') || err?.message?.includes('Unauthorized')) {
                setSavedItems([]);
            } else {
                console.error('Error fetching saved items:', err);
            }
        }
    };

    const handleSaveForLater = async (item: any) => {
        if (!token) return;
        setIsSaving(item.product?._id);
        try {
            await authService.addToSaveForLater(item.product?._id, token, item.variantId);
            await removeFromCart(item.variantId, item.product?._id);
            await fetchSavedItems();
            await fetchCart();
            Alert.alert('Saved!', 'Item moved to Saved for Later.');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save item');
        } finally {
            setIsSaving(null);
        }
    };

    const handleMoveToCart = async (item: any) => {
        if (!token) return;
        setIsSaving(item._id);
        try {
            const cartData = {
                productId: item._id,
                quantity: 1,
                variantId: item.variantId || null
            };
            await authService.addToCart(cartData, token);
            await authService.removeFromSaveForLater(item._id, token, item.variantId);
            await fetchSavedItems();
            await fetchCart();
            Alert.alert('Success', 'Item moved back to cart.');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to move to cart');
        } finally {
            setIsSaving(null);
        }
    };

    const handleRemoveFromSaved = async (productId: string, variantId?: string) => {
        if (!token) return;
        Alert.alert('Remove Saved Item', 'Are you sure you want to remove this item?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        await authService.removeFromSaveForLater(productId, token, variantId);
                        await fetchSavedItems();
                    } catch (err: any) {
                        Alert.alert('Error', err.message || 'Failed to remove');
                    }
                }
            }
        ]);
    };

    if (isLoading) return <PremiumLoader />;

    if (error && !cart) {
        return (
            <View style={styles.container}>
                <CustomHeader title="My Cart" />
                <View style={styles.center}>
                    <Ionicons name="cloud-offline-outline" size={rf(48)} color="#94A3B8" />
                    <Text allowFontScaling={false} style={styles.errorTitle}>Connection Issue</Text>
                    <Text allowFontScaling={false} style={styles.errorSub}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchCart}>
                        <Text allowFontScaling={false} style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    /* ── EMPTY / NO TOKEN STATES ──────────────────────────── */
    if (!token) return (
        <View style={styles.container}>
            <CustomHeader title="My Cart" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.guestContainer}
            >
                <View style={styles.guestHero}>
                    <View style={styles.guestIconCircle}>
                        <Ionicons name="cart" size={rf(32)} color="#F38000" />
                    </View>
                    <Text allowFontScaling={false} style={styles.guestTitle}>Your Shopping Cart</Text>
                    <Text allowFontScaling={false} style={styles.guestSubtitle}>
                        Log in to view your items, sync across devices, and enjoy faster checkouts.
                    </Text>
                </View>

                <View style={styles.benefitCard}>
                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIconBox}>
                            <Ionicons name="lock-closed-outline" size={rf(16)} color="#F38000" />
                        </View>
                        <View>
                            <Text allowFontScaling={false} style={styles.benefitLabel}>Secure Checkout</Text>
                            <Text allowFontScaling={false} style={styles.benefitSub}>Safe & encrypted payments</Text>
                        </View>
                    </View>
                    <View style={styles.benefitDivider} />
                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIconBox}>
                            <Ionicons name="flash-outline" size={rf(16)} color="#F38000" />
                        </View>
                        <View>
                            <Text allowFontScaling={false} style={styles.benefitLabel}>Faster Ordering</Text>
                            <Text allowFontScaling={false} style={styles.benefitSub}>Save addresses for 1-click buy</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.guestCta}
                    onPress={() => router.push('/(auth)/register')}
                    activeOpacity={0.8}
                >
                    <Text allowFontScaling={false} style={styles.guestCtaText}>Create Account Now</Text>
                    <Ionicons name="arrow-forward" size={rf(16)} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.guestLoginLink}
                    onPress={() => router.push('/(auth)/login')}
                >
                    <Text allowFontScaling={false} style={styles.guestLoginText}>
                        Already have an account? <Text style={{ color: '#F38000', fontWeight: '900' }}>Login</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    // Only early return for loading, token
    // Cart empty check will be inline below

    /* ── PRICE COMPUTATION FOR CART ───────────────────────── */
    let totalSavings = 0;
    let totalOriginalPrice = 0;

    if (!cart || !cart.items) {
        return <PremiumLoader />;
    }

    const priceItems = cart.items.map((item: any) => {
        const pId = item.product?._id || item.product?.id || (typeof item.product === 'string' ? item.product : null);
        const enriched = pId ? enrichedProducts[pId] : null;
        const vId = item.variantId;

        let prevPrice = 0;
        if (enriched && vId && enriched.variants) {
            const variant = enriched.variants.find((v: any) => (v._id || v.id) === vId);
            if (variant?.previousPrice) prevPrice = variant.previousPrice;
        }
        const offerPrice = item.price || 0;
        let originalPrice = prevPrice || enriched?.pPreviousPrice || item.product?.pPreviousPrice || 0;

        if (originalPrice <= offerPrice && (enriched?.pOffer || item.product?.pOffer)) {
            const disc = enriched?.pOffer || item.product?.pOffer || 0;
            if (disc > 0 && disc < 100) {
                const inferred = Math.round(offerPrice / (1 - disc / 100));
                if (inferred > offerPrice) originalPrice = inferred;
            }
        }
        if (originalPrice < offerPrice) originalPrice = offerPrice;
        const saving = Math.max(0, originalPrice - offerPrice);
        totalSavings += saving * item.quantity;
        totalOriginalPrice += originalPrice * item.quantity;

        let availableStock = item.product?.pStock || 0;
        if (vId && enriched?.variants) {
            const variant = enriched.variants.find((v: any) => (v._id || v.id) === vId);
            if (variant) availableStock = variant.stock || 0;
        } else if (vId && item.product?.variants) {
            const variant = item.product.variants.find((v: any) => (v._id || v.id) === vId);
            if (variant) availableStock = variant.stock || 0;
        }

        return { ...item, originalPrice, offerPrice, saving, availableStock };
    });

    /* ── MAIN RENDER ──────────────────────────────────────── */
    return (
        <View style={styles.container}>
            <CustomHeader
                title="My Cart"
                showBack
                rightElement={
                    <View style={styles.cartBadge}>
                        <Text allowFontScaling={false} style={styles.cartBadgeText}>{cart.items.length}</Text>
                    </View>
                }
            />

            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(8) }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F38000" />}
                showsVerticalScrollIndicator={false}
            >
                {/* ── ACTIVE CART ITEMS ─────────────────── */}
                {cart.items.length === 0 ? (
                    <View style={styles.inlineEmptyCart}>
                        <View style={styles.emptyCartArt}>
                            <Image
                                source={require('../../assets/images/Kairaa4.png')}
                                style={{ width: wp(35), height: wp(35), resizeMode: 'contain', opacity: 0.7 }}
                            />
                        </View>
                        <Text allowFontScaling={false} style={styles.emptyTitle}>Your cart is empty</Text>
                        <Text allowFontScaling={false} style={styles.emptySub}>Add some items to get started!</Text>
                        <TouchableOpacity style={[styles.ctaBtn, { paddingVertical: hp(1.2), borderRadius: rf(14) }]} onPress={() => router.push('/(tabs)')}>
                            <Ionicons name="storefront-outline" size={rf(16)} color="#FFF" />
                            <Text allowFontScaling={false} style={[styles.ctaBtnText, { fontSize: rf(14) }]}>  Explore Store</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* ── SAVINGS BANNER ── */}
                        {totalSavings > 0 && (
                            <View style={styles.savingsBanner}>
                                <Ionicons name="pricetag" size={rf(16)} color="#16A34A" />
                                <Text allowFontScaling={false} style={styles.savingsBannerText}>
                                    You're saving <Text allowFontScaling={false} style={styles.savingsBannerAmt}>₹{totalSavings.toLocaleString()}</Text> on this order!
                                </Text>
                                <Ionicons name="happy-outline" size={rf(16)} color="#16A34A" />
                            </View>
                        )}

                        {/* ── SECTION HEADER ── */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionAccent} />
                            <Text allowFontScaling={false} style={styles.sectionTitle}>Your Items</Text>
                            <View style={styles.itemCountBadge}>
                                <Text allowFontScaling={false} style={styles.itemCountText}>{cart.items.length}</Text>
                            </View>
                        </View>

                        {/* ── CART ITEMS LOOP ── */}
                        {priceItems.map((item: any, index: number) => {
                            const itemKey = item.variantId || item.product?._id || index;
                            const isUpdating = updatingId === (item.variantId || item.product?._id);
                            const imgUrl = getImgUrl(item.product?.pImage);
                            const hasSaving = item.saving > 0;

                            return (
                                <View key={itemKey} style={styles.cartCard}>
                                    {hasSaving && (
                                        <View style={styles.savingsRibbon}>
                                            <Text allowFontScaling={false} style={styles.savingsRibbonText}>SAVE ₹{(item.saving * item.quantity).toLocaleString()}</Text>
                                        </View>
                                    )}

                                    <View style={styles.cardInner}>
                                        <TouchableOpacity
                                            onPress={() => item.product?._id && router.push(`/product/${item.product._id}`)}
                                            activeOpacity={0.9}
                                        >
                                            <View style={styles.imgBox}>
                                                {imgUrl ? (
                                                    <Image source={{ uri: imgUrl }} style={styles.itemImg} resizeMode="cover" />
                                                ) : (
                                                    <View style={[styles.itemImg, styles.imgPlaceholder]}>
                                                        <Ionicons name="cube-outline" size={rf(34)} color="#CBD5E1" />
                                                    </View>
                                                )}
                                                <View style={styles.qtyBubble}>
                                                    <Text allowFontScaling={false} style={styles.qtyBubbleText}>{item.quantity}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.absRemoveBtn}
                                            onPress={() => handleRemove(item.variantId, item.product?._id)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="close" size={rf(16)} color="#94A3B8" />
                                        </TouchableOpacity>

                                        <View style={styles.itemBody}>
                                            {item.product?.pBrand && (
                                                <Text allowFontScaling={false} style={styles.itemBrand} numberOfLines={1}>{item.product.pBrand}</Text>
                                            )}
                                            <Text allowFontScaling={false} style={styles.itemName} numberOfLines={2}>
                                                {item.product?.pName || 'Product'}
                                            </Text>
                                            {item.variantValue && item.variantValue !== "Standard" && item.variantValue !== "null" && (
                                                <View style={styles.variantChip}>
                                                    <Ionicons name="resize-outline" size={rf(11)} color="#64748B" />
                                                    <Text allowFontScaling={false} style={styles.variantChipText}>{item.variantValue}</Text>
                                                </View>
                                            )}
                                            <View style={styles.priceBlock}>
                                                <Text allowFontScaling={false} style={styles.offerPrice}>₹{(item.offerPrice * item.quantity).toLocaleString()}</Text>
                                                {hasSaving && (
                                                    <Text allowFontScaling={false} style={styles.originalPrice}>₹{(item.originalPrice * item.quantity).toLocaleString()}</Text>
                                                )}
                                            </View>
                                            <Text allowFontScaling={false} style={[styles.unitPrice, item.availableStock <= 5 ? { color: '#EF4444' } : { color: '#16A34A' }]}>
                                                {item.availableStock > 0 ? `${item.availableStock} in stock` : 'Out of stock'}
                                            </Text>
                                            <View style={styles.deliveryRow}>
                                                <Ionicons name="rocket-outline" size={rf(12)} color="#16A34A" />
                                                <Text allowFontScaling={false} style={styles.deliveryText}>Delivery by 3-5 business days</Text>
                                            </View>
                                            <View style={styles.actionRow}>
                                                <View style={styles.actionTopRow}>
                                                    <View style={styles.qtyStepper}>
                                                        <TouchableOpacity
                                                            style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}
                                                            onPress={() => item.quantity > 1 && handleQty(item.variantId, item.product?._id, item.quantity - 1)}
                                                            disabled={isUpdating || item.quantity <= 1}
                                                        >
                                                            <Ionicons name="remove" size={rf(16)} color={item.quantity <= 1 ? '#CBD5E1' : '#F38000'} />
                                                        </TouchableOpacity>
                                                        <View style={styles.qtyDisplay}>
                                                            {isUpdating ? <ActivityIndicator size="small" color="#F38000" /> : <Text allowFontScaling={false} style={styles.qtyText}>{item.quantity}</Text>}
                                                        </View>
                                                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQty(item.variantId, item.product?._id, item.quantity + 1)} disabled={isUpdating}>
                                                            <Ionicons name="add" size={rf(16)} color="#F38000" />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <TouchableOpacity style={styles.saveLaterBtn} onPress={() => handleSaveForLater(item)} disabled={isSaving === item.product?._id}>
                                                        {isSaving === item.product?._id ? <ActivityIndicator size="small" color="#64748B" /> : <Ionicons name="bookmark-outline" size={rf(16)} color="#64748B" />}
                                                        <Text allowFontScaling={false} style={styles.saveLaterText}>Save</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <TouchableOpacity style={styles.buyNowBtn} onPress={() => handleSingleItemCheckout(item)} activeOpacity={0.85}>
                                                    <Ionicons name="flash" size={rf(14)} color="#FFF" />
                                                    <Text allowFontScaling={false} style={styles.buyNowBtnText}>Buy Now</Text>
                                                    <Ionicons name="arrow-forward" size={rf(14)} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}

                {/* ── SAVED FOR LATER SECTION ──────────────── */}
                {savedItems.length > 0 && (
                    <View style={styles.savedSectionShelf}>
                        <View style={[styles.sectionHeader, { marginBottom: hp(2) }]}>
                            <View style={[styles.sectionAccent, { backgroundColor: '#8B5CF6' }]} />
                            <Text allowFontScaling={false} style={styles.sectionTitle}>Saved for Later</Text>
                            <View style={[styles.itemCountBadge, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
                                <Text allowFontScaling={false} style={[styles.itemCountText, { color: '#8B5CF6' }]}>{savedItems.length}</Text>
                            </View>
                        </View>

                        {savedItems.map((item: any) => {
                            const imgUrl = getImgUrl(item.pImage);
                            const hasPrevPrice = !!(item.pPreviousPrice && item.pPreviousPrice > item.pPrice);
                            const discPct = hasPrevPrice ? Math.round(((item.pPreviousPrice - item.pPrice) / item.pPreviousPrice) * 100) : (item.pOffer ? Number(item.pOffer) : 0);
                            return (
                                <View key={item._id} style={[styles.cartCard, { opacity: isSaving === item._id ? 0.6 : 1 }]}>
                                    <TouchableOpacity style={styles.absRemoveBtn} onPress={() => handleRemoveFromSaved(item._id, item.variantId)}>
                                        <Ionicons name="close" size={rf(16)} color="#94A3B8" />
                                    </TouchableOpacity>

                                    <View style={styles.cardInner}>
                                        <TouchableOpacity onPress={() => router.push(`/product/${item._id}`)}>
                                            <View style={styles.imgBox}>
                                                {imgUrl ? (
                                                    <Image source={{ uri: imgUrl }} style={styles.itemImg} resizeMode="cover" />
                                                ) : (
                                                    <View style={[styles.itemImg, styles.imgPlaceholder]}>
                                                        <Ionicons name="cube-outline" size={rf(34)} color="#CBD5E1" />
                                                    </View>
                                                )}
                                                <View style={[styles.qtyBubble, { backgroundColor: '#8B5CF6' }]}>
                                                    <Ionicons name="bookmark" size={rf(10)} color="#FFF" />
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        <View style={styles.itemBody}>
                                            <View style={{ flex: 1 }}>
                                                {item.pBrand ? <Text allowFontScaling={false} style={styles.itemBrand}>{item.pBrand}</Text> : null}
                                                <Text allowFontScaling={false} style={styles.itemName} numberOfLines={2}>{item.pName}</Text>
                                                <View style={[styles.priceBlock, { marginTop: hp(0.5) }]}>
                                                    <Text allowFontScaling={false} style={styles.offerPrice}>₹{item.pPrice?.toLocaleString()}</Text>
                                                    {hasPrevPrice && (
                                                        <Text allowFontScaling={false} style={styles.originalPrice}>₹{item.pPreviousPrice?.toLocaleString()}</Text>
                                                    )}
                                                    {discPct > 0 ? (
                                                        <View style={styles.savedDiscBadge}>
                                                            <Text allowFontScaling={false} style={styles.savedDiscText}>{discPct}% OFF</Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                                <View style={styles.stockRow}>
                                                    <View style={styles.stockDot} />
                                                    <Text allowFontScaling={false} style={styles.stockText}>In Stock</Text>
                                                </View>
                                            </View>

                                            <View style={[styles.actionRow, { borderTopColor: '#F3E8FF' }]}>
                                                <TouchableOpacity
                                                    style={[styles.moveToCartBtn, { flex: 1, marginRight: wp(2) }]}
                                                    onPress={() => handleMoveToCart(item)}
                                                >
                                                    <Ionicons name="cart-outline" size={rf(14)} color="#8B5CF6" />
                                                    <Text allowFontScaling={false} style={styles.moveToCartText}>Move to Cart</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.buyNowBtn, { backgroundColor: '#7C3AED', flex: 0.8 }]}
                                                    onPress={() => handleSingleItemCheckout({ product: item, price: item.pPrice, quantity: 1 })}
                                                >
                                                    <Text allowFontScaling={false} style={[styles.buyNowBtnText, { color: '#FFF' }]}>Buy Now</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* ── BILLING SECTION (Only if Cart not empty) ── */}
                {cart.items.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { marginTop: hp(2) }]}>
                            <View style={styles.sectionAccent} />
                            <Text allowFontScaling={false} style={styles.sectionTitle}>Price Details</Text>
                        </View>
                        <View style={styles.billCard}>
                            <View style={styles.billRow}>
                                <Text allowFontScaling={false} style={styles.billLabel}>Original Price ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})</Text>
                                <Text allowFontScaling={false} style={styles.billVal}>₹{totalOriginalPrice?.toLocaleString()}</Text>
                            </View>
                            {totalSavings > 0 && (
                                <View style={styles.billRow}>
                                    <Text allowFontScaling={false} style={[styles.billLabel, { color: '#16A34A' }]}>Product Discount</Text>
                                    <Text allowFontScaling={false} style={[styles.billVal, { color: '#16A34A', fontWeight: '800' }]}>-₹{totalSavings.toLocaleString()}</Text>
                                </View>
                            )}
                            <View style={styles.billDivider} />
                            <View style={styles.billRow}>
                                <Text allowFontScaling={false} style={styles.billTotalLabel}>Total Amount</Text>
                                <Text allowFontScaling={false} style={styles.billTotalVal}>₹{(cart.totalAmount || 0).toLocaleString()}</Text>
                            </View>
                            {totalSavings > 0 && (
                                <View style={styles.savingsSummaryRow}>
                                    <Ionicons name="checkmark-circle" size={rf(14)} color="#16A34A" />
                                    <Text allowFontScaling={false} style={styles.savingsSummaryText}>You save ₹{totalSavings.toLocaleString()} on this order</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {/* ── TRUST BADGES ── */}
                <View style={styles.trustRow}>
                    <View style={styles.trustItem}><Ionicons name="shield-checkmark" size={rf(18)} color="#3B82F6" /><Text allowFontScaling={false} style={styles.trustText}>Secure{'\n'}Checkout</Text></View>
                    <View style={styles.trustDivider} /><View style={styles.trustItem}><Ionicons name="flash" size={rf(18)} color="#F38000" /><Text allowFontScaling={false} style={styles.trustText}>Fast{'\n'}Delivery</Text></View>
                    <View style={styles.trustDivider} /><View style={styles.trustItem}><Ionicons name="return-up-back" size={rf(18)} color="#22C55E" /><Text allowFontScaling={false} style={styles.trustText}>Easy{'\n'}Returns</Text></View>
                    <View style={styles.trustDivider} /><View style={styles.trustItem}><Ionicons name="lock-closed" size={rf(18)} color="#8B5CF6" /><Text allowFontScaling={false} style={styles.trustText}>100%{'\n'}Encrypted</Text></View>
                </View>
            </ScrollView>

            {/* ── CHECKOUT BAR (Only if Cart not empty) ── */}
            {cart.items.length > 0 && (
                <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <View>
                        <Text allowFontScaling={false} style={styles.barLabel}>SUBTOTAL</Text>
                        <Text allowFontScaling={false} style={styles.barAmount}>₹{(cart.totalAmount || 0).toLocaleString()}</Text>
                        {totalSavings > 0 && <Text allowFontScaling={false} style={styles.barSaving}>Saving ₹{totalSavings.toLocaleString()}</Text>}
                    </View>
                    <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')} activeOpacity={0.85}>
                        <Text allowFontScaling={false} style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                        <Ionicons name="arrow-forward" size={rf(18)} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F8FB' },
    guestCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(6.4) },

    // Empty states
    guestContainer: { paddingBottom: hp(3.5), paddingHorizontal: wp(5.3) },
    guestHero: { alignItems: 'center', marginTop: hp(4.7), marginBottom: hp(2.3) },
    guestIconCircle: { width: wp(20), height: wp(20), borderRadius: rf(40), backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: hp(1.9), shadowColor: '#F38000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 4 },
    guestTitle: { fontSize: rf(22), fontWeight: '900', color: '#1E293B', marginBottom: hp(0.9), textAlign: 'center', letterSpacing: -0.5 },
    guestSubtitle: { fontSize: rf(13), color: '#64748B', textAlign: 'center', lineHeight: rf(20), paddingHorizontal: wp(5.3) },
    benefitCard: { backgroundColor: '#FFF', borderRadius: rf(24), padding: wp(4.2), marginBottom: hp(3.5), shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
    benefitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp(1.2) },
    benefitIconBox: { width: wp(9), height: wp(9), borderRadius: rf(10), backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: wp(3.5) },
    benefitLabel: { fontSize: rf(14), fontWeight: '700', color: '#1E293B' },
    benefitSub: { fontSize: rf(11), color: '#94A3B8', marginTop: hp(0.1) },
    benefitDivider: { height: 1, backgroundColor: '#F8FAFC', marginLeft: wp(12.5), marginVertical: hp(0.4) },
    guestCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F38000', paddingVertical: hp(1.9), borderRadius: rf(18), gap: wp(2.1), shadowColor: '#F38000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    guestCtaText: { color: '#FFF', fontSize: rf(15), fontWeight: '900', letterSpacing: -0.2 },
    guestLoginLink: { marginTop: hp(2.3), alignItems: 'center' },
    guestLoginText: { fontSize: rf(13), color: '#64748B', fontWeight: '500' },

    // Header badge
    cartBadge: { backgroundColor: '#F38000', paddingHorizontal: wp(2.6), paddingVertical: hp(0.5), borderRadius: rf(12) },
    cartBadgeText: { color: '#FFF', fontSize: rf(12), fontWeight: '900' },

    // Scroll
    scrollContent: { paddingHorizontal: wp(4.2), paddingTop: hp(1.9) },

    // Savings banner
    savingsBanner: {
        flexDirection: 'row', alignItems: 'center', gap: wp(2.1),
        backgroundColor: '#F0FDF4',
        borderRadius: rf(16), padding: wp(3.7),
        marginBottom: hp(1.9),
        borderWidth: 1, borderColor: '#DCFCE7',
    },
    savingsBannerText: { flex: 1, fontSize: rf(13), color: '#166534', fontWeight: '700' },
    savingsBannerAmt: { fontWeight: '900', color: '#15803D' },

    // Section header
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center',
        gap: wp(2.6), marginBottom: hp(1.6),
    },
    sectionAccent: { width: wp(1), height: hp(2.3), backgroundColor: '#F38000', borderRadius: rf(2) },
    sectionTitle: { fontSize: rf(16), fontWeight: '900', color: '#1E293B', letterSpacing: -0.3, flex: 1 },
    itemCountBadge: {
        backgroundColor: '#FFF7ED', paddingHorizontal: wp(2.6), paddingVertical: hp(0.3),
        borderRadius: rf(10), borderWidth: 1, borderColor: '#FED7AA',
    },
    itemCountText: { fontSize: rf(12), fontWeight: '900', color: '#F38000' },

    // Cart card
    cartCard: {
        backgroundColor: '#FFF',
        borderRadius: rf(24),
        marginBottom: hp(2),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    savingsRibbon: {
        backgroundColor: '#22C55E',
        paddingHorizontal: wp(3.7),
        paddingVertical: hp(0.6),
        alignSelf: 'flex-start',
        borderBottomRightRadius: rf(12),
    },
    savingsRibbonText: { color: '#FFF', fontSize: rf(10), fontWeight: '900', letterSpacing: 0.5 },
    cardInner: { flexDirection: 'row', padding: wp(3.7), gap: wp(3.7) },
    imgBox: { position: 'relative' },
    itemImg: {
        width: wp(25),
        height: hp(12.5),
        borderRadius: rf(16),
        backgroundColor: '#F1F5F9',
    },
    imgPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    qtyBubble: {
        position: 'absolute',
        bottom: hp(0.6), right: wp(1.5),
        width: wp(5.5), height: wp(5.5),
        borderRadius: wp(2.75),
        backgroundColor: '#F38000',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#FFF',
        shadowColor: '#F38000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 3, elevation: 2,
    },
    qtyBubbleText: { color: '#FFF', fontSize: rf(9), fontWeight: '900' },
    itemBody: { flex: 1, minHeight: hp(12.5), justifyContent: 'space-between' },
    itemBrand: {
        fontSize: rf(10), fontWeight: '900', color: '#64748B',
        textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: hp(0.2),
    },
    itemName: {
        fontSize: rf(13), fontWeight: '800', color: '#1E293B',
        lineHeight: rf(18), marginBottom: hp(0.5), letterSpacing: -0.2,
    },
    variantChip: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1),
        alignSelf: 'flex-start',
        backgroundColor: '#F8FAFC',
        borderRadius: rf(8), paddingHorizontal: wp(2.1), paddingVertical: hp(0.3),
        borderWidth: 1, borderColor: '#E2E8F0',
        marginBottom: hp(0.9),
    },
    variantChipText: { fontSize: rf(11), color: '#64748B', fontWeight: '700' },
    priceBlock: { flexDirection: 'row', alignItems: 'baseline', gap: wp(2.1), marginBottom: hp(0.2) },
    offerPrice: { fontSize: rf(18), fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    originalPrice: {
        fontSize: rf(12), color: '#CBD5E1',
        textDecorationLine: 'line-through', fontWeight: '600',
    },
    unitPrice: { fontSize: rf(11), color: '#94A3B8', fontWeight: '600', marginBottom: hp(1.2) },
    actionRow: {
        marginTop: hp(1),
        paddingTop: hp(1),
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: hp(1),
    },
    actionTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    qtyStepper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: rf(12),
        padding: hp(0.2),
        borderWidth: 1, borderColor: '#E2E8F0',
        height: hp(4.2),
    },
    qtyBtn: {
        width: wp(8), height: wp(8), borderRadius: rf(10),
        backgroundColor: '#FFF',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    qtyBtnDisabled: { opacity: 0.3 },
    qtyDisplay: { minWidth: wp(8), alignItems: 'center', justifyContent: 'center' },
    qtyText: { fontSize: rf(14), fontWeight: '800', color: '#1E293B' },
    absRemoveBtn: {
        position: 'absolute',
        top: hp(0.8),
        right: wp(1.5),
        zIndex: 50,
        backgroundColor: '#FFF',
        borderRadius: rf(15),
        padding: wp(1),
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    buyNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(1),
        backgroundColor: '#F38000',
        paddingVertical: hp(1.3),
        paddingHorizontal: wp(1),
        borderRadius: rf(12),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
    },
    buyNowBtnText: {
        fontSize: rf(13),
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    saveLaterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.5),
        paddingHorizontal: wp(4),
        height: hp(4.2),
        backgroundColor: '#F8FAFC',
        borderRadius: rf(12),
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    saveLaterText: {
        fontSize: rf(11), fontWeight: '700', color: '#64748B',
    },
    moveToCartBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(1.5),
        paddingHorizontal: wp(3), height: hp(3.8),
        backgroundColor: '#F5F3FF',
        borderRadius: rf(10),
        borderWidth: 1, borderColor: '#DDD6FE',
    },
    moveToCartText: { fontSize: rf(11), fontWeight: '900', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: 0.3 },
    billCard: {
        backgroundColor: '#FFF',
        borderRadius: rf(24), padding: wp(5.8),
        marginBottom: hp(1.9),
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06, shadowRadius: 16, elevation: 5,
        borderWidth: 1, borderColor: '#EDF2F7',
    },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(1.6) },
    billLabel: { fontSize: rf(14), color: '#64748B', fontWeight: '500' },
    billVal: { fontSize: rf(14), fontWeight: '700', color: '#1E293B' },
    billDivider: { height: 1.5, backgroundColor: '#F1F5F9', marginVertical: hp(1.9), borderRadius: 1 },
    billTotalLabel: { fontSize: rf(17), fontWeight: '900', color: '#1E293B' },
    billTotalVal: { fontSize: rf(22), fontWeight: '900', color: '#F38000', letterSpacing: -0.5 },
    savingsSummaryRow: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1.6),
        backgroundColor: '#F0FDF4', borderRadius: rf(12),
        padding: wp(2.6), marginTop: hp(0.5),
    },
    savingsSummaryText: { fontSize: rf(12), color: '#16A34A', fontWeight: '700' },
    trustRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: rf(20), padding: wp(4.8),
        marginBottom: hp(2),
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    trustItem: { flex: 1, alignItems: 'center', gap: wp(1.6) },
    trustText: { fontSize: rf(10), fontWeight: '700', color: '#64748B', textAlign: 'center', lineHeight: rf(14) },
    trustDivider: { width: 1, height: hp(4.3), backgroundColor: '#F1F5F9' },
    checkoutBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: wp(5.3), paddingTop: hp(1.6),
        borderTopWidth: 1, borderTopColor: '#EDF2F7',
        shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.07, shadowRadius: 16, elevation: 15, zIndex: 999,
    },
    barLabel: { fontSize: rf(10), color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: hp(0.2) },
    barAmount: { fontSize: rf(22), fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    barSaving: { fontSize: rf(11), fontWeight: '700', color: '#16A34A', marginTop: hp(0.1) },
    checkoutBtn: {
        flexDirection: 'row', alignItems: 'center', gap: wp(2.1),
        backgroundColor: '#F38000',
        paddingHorizontal: wp(5.3), paddingVertical: hp(1.6),
        borderRadius: rf(12),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    checkoutBtnText: { color: '#FFF', fontWeight: '900', fontSize: rf(14), letterSpacing: 0.1 },
    inlineEmptyCart: {
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: hp(4),
        backgroundColor: '#FFF',
        borderRadius: rf(24),
        marginBottom: hp(3),
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
    },
    savedSectionShelf: {
        backgroundColor: '#FAFAFE',
        borderRadius: rf(28),
        padding: wp(4.5),
        marginTop: hp(1),
        marginBottom: hp(3),
        borderWidth: 1, borderColor: '#EDE9FE',
        shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    },
    // Delivery row
    deliveryRow: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1.5),
        marginBottom: hp(0.5),
    },
    deliveryText: {
        fontSize: rf(11), fontWeight: '600', color: '#16A34A',
    },
    // Saved discount badge
    savedDiscBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: wp(2), paddingVertical: hp(0.15),
        borderRadius: rf(6),
        borderWidth: 1, borderColor: '#FECACA',
    },
    savedDiscText: {
        fontSize: rf(9), fontWeight: '900', color: '#EF4444',
        letterSpacing: 0.3,
    },
    // Stock indicator
    stockRow: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1.2),
        marginTop: hp(0.5),
    },
    stockDot: {
        width: wp(1.5), height: wp(1.5), borderRadius: wp(0.75),
        backgroundColor: '#22C55E',
    },
    stockText: {
        fontSize: rf(10), fontWeight: '700', color: '#16A34A',
    },
    // Error and Empty state styles
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp(6) },
    errorTitle: { fontSize: rf(18), fontWeight: '900', color: '#1E293B', marginTop: hp(2) },
    errorSub: { fontSize: rf(13), color: '#64748B', textAlign: 'center', marginTop: hp(1), paddingHorizontal: wp(5) },
    retryBtn: {
        backgroundColor: '#F38000', paddingHorizontal: wp(8), paddingVertical: hp(1.5),
        borderRadius: rf(12), marginTop: hp(3),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    retryText: { color: '#FFF', fontWeight: '800', fontSize: rf(14) },
    emptyCartArt: { marginBottom: hp(2), opacity: 0.8 },
    emptyTitle: { fontSize: rf(18), fontWeight: '900', color: '#1E293B', marginBottom: hp(1) },
    emptySub: { fontSize: rf(14), color: '#64748B', textAlign: 'center', marginBottom: hp(3), paddingHorizontal: wp(10) },
    ctaBtn: {
        flexDirection: 'row', alignItems: 'center', gap: wp(2),
        backgroundColor: '#F38000', paddingHorizontal: wp(8), paddingVertical: hp(1.5),
        borderRadius: rf(12), shadowColor: '#F38000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    ctaBtnText: { color: '#FFF', fontWeight: '800', fontSize: rf(14) },
});
