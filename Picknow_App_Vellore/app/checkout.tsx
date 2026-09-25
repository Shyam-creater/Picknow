import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, TouchableOpacity, ScrollView, View,
    ActivityIndicator, Alert, Text, Image, Platform,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { authService, productService } from '@/Services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout from '@/Services/RazorpayService';
import CustomHeader from '@/components/CustomHeader';

const RAZORPAY_KEY = 'rzp_live_MigiyKCfLulpBY';
const API_BASE = 'https://backmern.picknow.in';

const getImgUrl = (img: any): string | null => {
    if (!img) return null;
    const s = Array.isArray(img) ? img[0] : img;
    if (!s) return null;
    if (s.startsWith('http')) return s;
    if (s.startsWith('/')) return `${API_BASE}${s}`;
    return `${API_BASE}/images/${s}`;
};

export default function CheckoutScreen() {
    const { token, user } = useAuth();
    const { cart, fetchCart, clearCart, removeFromCart } = useCart();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    // Determine if we are checking out a single item or the whole cart
    const singleItemParam = React.useMemo(() => {
        try {
            return params.singleItem ? JSON.parse(params.singleItem as string) : null;
        } catch (e) {
            return null;
        }
    }, [params.singleItem]);

    const checkoutItems = singleItemParam ? [singleItemParam] : (cart?.items || []);
    const checkoutTotalAmount = singleItemParam
        ? (singleItemParam.price || 0) * (singleItemParam.quantity || 1)
        : (cart?.totalAmount || 0);

    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddr, setSelectedAddr] = useState<any>(null);
    const [enrichedProducts, setEnrichedProducts] = useState<Record<string, any>>({});
    const [deliveryData, setDeliveryData] = useState<any[]>([]);
    const [calculatedShippingFee, setCalculatedShippingFee] = useState(0);

    const [walletBalance, setWalletBalance] = useState(0);
    const [useWallet, setUseWallet] = useState(false);

    useEffect(() => {
        if (token) {
            loadInitialData();
        } else {
            setLoading(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            if (token) loadInitialData();
        }, [token])
    );

    const loadInitialData = async () => {
        try {
            const addrData = await authService.getAddresses(token!);
            const list = addrData.addresses || [];
            setAddresses(list);
            setSelectedAddr(list.find((a: any) => a.isDefault) || list[0] || null);
            await Promise.all([
                !cart ? fetchCart() : Promise.resolve(),
                fetchWalletBalance(),
                fetchDeliveryData(),
            ]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchWalletBalance = async () => {
        try {
            const res = await authService.checkBalance(token!);
            setWalletBalance(res.data?.walletBalance || res.walletBalance || 0);
        } catch { /* silent */ }
    };

    const fetchDeliveryData = async () => {
        try {
            const res = await authService.getDeliveryData();
            if (res.success) setDeliveryData(res.data || []);
        } catch (e) { console.error('Fetch delivery info error:', e); }
    };

    useEffect(() => {
        if (checkoutItems?.length) enrichCartItems();
    }, [checkoutItems]);

    const enrichCartItems = async () => {
        if (!checkoutItems) return;
        try {
            const enrichment: Record<string, any> = { ...enrichedProducts };
            let changed = false;
            await Promise.all(checkoutItems.map(async (item: any) => {
                const pId = item.product?._id || item.product;
                if (pId && !enrichment[pId]) {
                    try {
                        const pData = await productService.getProductById(pId);
                        if (pData?.success) { enrichment[pId] = pData.product; changed = true; }
                    } catch { /* silent */ }
                }
            }));
            if (changed) setEnrichedProducts(enrichment);
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (selectedAddr && deliveryData.length > 0 && checkoutItems?.length) {
            updateShippingFee();
        }
    }, [selectedAddr, deliveryData, checkoutItems]);

    const updateShippingFee = () => {
        if (!selectedAddr || !deliveryData.length || !checkoutItems?.length) return;

        const stateName = selectedAddr.state?.toLowerCase().trim().replace(/\s+/g, "");
        const info = deliveryData.find(d => d.state?.toLowerCase().trim().replace(/\s+/g, "") === stateName);

        if (!info) {
            setCalculatedShippingFee(cart?.shippingCharges || 0);
            return;
        }

        const allFree = checkoutItems.every((it: any) => it.product?.freeshipping === true);
        if (allFree) {
            setCalculatedShippingFee(0);
            return;
        }

        const productSubtotal = checkoutItems.reduce((sum: number, item: any) => {
            if ((item.product?.pType || item.variantType) !== "combo") {
                const price = item.price || 0;
                return sum + price * (item.quantity || 1);
            }
            return sum;
        }, 0);

        const hasCombos = checkoutItems.some((item: any) => (item.product?.pType || item.variantType) === "combo");
        const hasProducts = checkoutItems.some((item: any) => (item.product?.pType || item.variantType) !== "combo");

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
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddr) {
            Alert.alert('Select Address', 'Please select a delivery address', [
                { text: 'OK', onPress: () => router.push('/add-address') }
            ]);
            return;
        }
        setPlacing(true);
        try {
            if (useWallet && finalPayable === 0) {
                await completeOrder('WALLET_ONLY');
                return;
            }
            const r = await authService.createRazorpayOrder(finalPayable, token!);
            if (!r.success) throw new Error(r.message || 'Payment init failed');
            const opts = {
                description: 'Order Payment',
                currency: 'INR',
                key: RAZORPAY_KEY,
                amount: r.order.amount,
                name: 'Picknow',
                order_id: r.order.id,
                prefill: {
                    email: user?.email || '',
                    contact: selectedAddr.mobile || '',
                    name: selectedAddr.name || ''
                },
                theme: { color: '#F38000' },
            };
            RazorpayCheckout.open(opts)
                .then(async (data: any) => {
                    const v = await authService.verifyPayment({
                        razorpayOrderId: data.razorpay_order_id,
                        razorpayPaymentId: data.razorpay_payment_id,
                        razorpaySignature: data.razorpay_signature,
                    });
                    if (v.status) await completeOrder(data.razorpay_payment_id);
                    else { Alert.alert('Verification Failed', 'Contact support'); setPlacing(false); }
                })
                .catch((e: any) => {
                    if (e.code !== 2) Alert.alert('Payment Failed', 'Payment failed. Please try again.');
                    setPlacing(false);
                });
        } catch (e: any) {
            Alert.alert('Order Failed', e.message || 'Something went wrong');
            setPlacing(false);
        }
    };

    const completeOrder = async (paymentId: string) => {
        try {
            const orderData = {
                shippingAddress: {
                    name: selectedAddr.name, address: selectedAddr.street,
                    contact: selectedAddr.mobile, city: selectedAddr.city,
                    state: selectedAddr.state, pincode: selectedAddr.pincode,
                    country: selectedAddr.country || 'India',
                },
                PaymentId: paymentId,
                paymentMethod: 'ONLINE',
                total: (checkoutTotalAmount || 0) + 8 + calculatedShippingFee,
                shippingfee: calculatedShippingFee,
                useKaitCoins: useWallet,
                kaitCoinsUsed: useWallet ? walletDiscount : 0,
                cashPayment: finalPayable,
                items: checkoutItems,
                checkoutType: singleItemParam ? 'SINGLE' : 'CART'
            };
            const res = await authService.placeOrder(orderData, token!);
            if (res.success) {
                if (!singleItemParam) {
                    clearCart();
                } else {
                    // Optional: remove this specific item from cart if it was a single item checkout
                    await removeFromCart(singleItemParam.variantId, singleItemParam.product?._id);
                }
                await fetchCart();
                Alert.alert('🎉 Order Placed!', 'Your order has been placed successfully.', [
                    { text: 'View Orders', onPress: () => router.replace('/(tabs)/orders' as any) }
                ]);
            }
        } catch (e: any) { Alert.alert('Error', e.message || 'Failed to place order'); }
        finally { setPlacing(false); }
    };

    /* ── PRICE COMPUTATION ─────────────────────────────────── */
    const priceItems = (checkoutItems || []).map((item: any) => {
        const pId = item.product?._id || item.product?.id || (typeof item.product === 'string' ? item.product : null);
        const enriched = pId ? enrichedProducts[pId] : null;
        const vId = item.variantId || item.variantDetails?._id;

        let prevPrice = 0;
        if (enriched && vId && enriched.variants) {
            const v = enriched.variants.find((x: any) => (x._id || x.id) === vId);
            if (v?.previousPrice) prevPrice = v.previousPrice;
        }
        const offerPrice = item.price || 0;
        let originalPrice = prevPrice || enriched?.pPreviousPrice || item.variantDetails?.previousPrice || item.product?.pPreviousPrice || 0;

        if (originalPrice <= offerPrice && (enriched?.pOffer || item.product?.pOffer)) {
            const disc = enriched?.pOffer || item.product?.pOffer || 0;
            if (disc > 0 && disc < 100) {
                const inferred = Math.round(offerPrice / (1 - disc / 100));
                if (inferred > offerPrice) originalPrice = inferred;
            }
        }
        if (originalPrice < offerPrice) originalPrice = offerPrice;

        const saving = Math.max(0, originalPrice - offerPrice);
        return { ...item, originalPrice, offerPrice, saving };
    });

    const totalOriginalPrice = priceItems.reduce((s: number, i: any) => s + i.originalPrice * i.quantity, 0);
    const totalYouSave = priceItems.reduce((s: number, i: any) => s + i.saving * i.quantity, 0);
    const platformFee = 8;
    const baseFinalAmount = (checkoutTotalAmount || 0) + platformFee + calculatedShippingFee;
    const offeredItemsTotal = priceItems.filter((i: any) => i.saving > 0).reduce((s: number, i: any) => s + i.offerPrice * i.quantity, 0);
    const maxWalletUsage = offeredItemsTotal * 0.5;
    const walletDiscount = useWallet ? Math.min(walletBalance, maxWalletUsage) : 0;
    const finalPayable = Math.max(0, baseFinalAmount - walletDiscount);

    if (loading) return (
        <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
            <ActivityIndicator size="large" color="#F38000" />
            <Text allowFontScaling={false} style={styles.loadingText}>Loading checkout...</Text>
        </View>
    );

    if (!token) return (
        <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
            <View style={styles.emptyIconWrap}>
                <Ionicons name="lock-closed-outline" size={rf(40)} color="#F38000" />
            </View>
            <Text allowFontScaling={false} style={styles.emptyTitle}>Login Required</Text>
            <Text allowFontScaling={false} style={styles.emptySub}>Please sign in to proceed with your checkout.</Text>
            <TouchableOpacity style={styles.goBackBtn} onPress={() => router.push('/(auth)/login')}>
                <Ionicons name="log-in-outline" size={rf(16)} color="#FFF" />
                <Text allowFontScaling={false} style={styles.goBackText}>Sign In Now</Text>
            </TouchableOpacity>
        </View>
    );

    if (!checkoutItems || checkoutItems.length === 0) return (
        <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
            <View style={styles.emptyIconWrap}>
                <Ionicons name="bag-remove-outline" size={rf(40)} color="#F38000" />
            </View>
            <Text allowFontScaling={false} style={styles.emptyTitle}>Nothing to checkout</Text>
            <Text allowFontScaling={false} style={styles.emptySub}>Your cart is empty. Add items to proceed.</Text>
            <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={rf(16)} color="#FFF" />
                <Text allowFontScaling={false} style={styles.goBackText}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );

    /* ── MAIN ─────────────────────────────────────────────── */
    return (
        <View style={styles.container}>
            {/* ── HEADER ──────────────────────────────────── */}
            <CustomHeader
                title="Review & Order"
                subtitle={`${checkoutItems.length} ${checkoutItems.length === 1 ? 'item' : 'items'}`}
                showBack
                rightElement={
                    <View style={styles.headerSecureBadge}>
                        <Ionicons name="lock-closed" size={rf(12)} color="#22C55E" />
                        <Text allowFontScaling={false} style={styles.headerSecureText}>Secure</Text>
                    </View>
                }
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + hp(14) }]}
            >
                {/* ── STEP INDICATOR ─────────────────────── */}
                <View style={styles.stepRow}>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepDot, { backgroundColor: '#22C55E' }]}>
                            <Ionicons name="checkmark" size={rf(12)} color="#FFF" />
                        </View>
                        <Text allowFontScaling={false} style={[styles.stepLabel, { color: '#22C55E' }]}>Cart</Text>
                    </View>
                    <View style={[styles.stepLine, { backgroundColor: '#F38000' }]} />
                    <View style={styles.stepItem}>
                        <View style={[styles.stepDot, { backgroundColor: '#F38000' }]}>
                            <Text allowFontScaling={false} style={styles.stepNum}>2</Text>
                        </View>
                        <Text allowFontScaling={false} style={[styles.stepLabel, { color: '#F38000' }]}>Review</Text>
                    </View>
                    <View style={[styles.stepLine, { backgroundColor: '#E2E8F0' }]} />
                    <View style={styles.stepItem}>
                        <View style={[styles.stepDot, { backgroundColor: '#E2E8F0' }]}>
                            <Text allowFontScaling={false} style={[styles.stepNum, { color: '#94A3B8' }]}>3</Text>
                        </View>
                        <Text allowFontScaling={false} style={[styles.stepLabel, { color: '#94A3B8' }]}>Done</Text>
                    </View>
                </View>

                {/* ── DELIVERY ADDRESS ───────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="location" size={rf(16)} color="#F38000" />
                            </View>
                            <Text allowFontScaling={false} style={styles.sectionTitle}>Delivery Address</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/addresses')} style={styles.changeBtn}>
                            <Text allowFontScaling={false} style={styles.changeLink}>Change</Text>
                            <Ionicons name="chevron-forward" size={rf(14)} color="#F38000" />
                        </TouchableOpacity>
                    </View>

                    {selectedAddr ? (
                        <View style={styles.addrCard}>
                            <View style={styles.addrTopRow}>
                                <View style={styles.addrTypeTag}>
                                    <Ionicons
                                        name={selectedAddr.type?.toLowerCase() === 'work' ? 'briefcase-outline' : 'home-outline'}
                                        size={rf(12)}
                                        color="#F38000"
                                    />
                                    <Text allowFontScaling={false} style={styles.addrTypeText}>{selectedAddr.type || 'Home'}</Text>
                                </View>
                                <View style={styles.addrSelectedBadge}>
                                    <Ionicons name="checkmark-circle" size={rf(14)} color="#22C55E" />
                                    <Text allowFontScaling={false} style={styles.addrSelectedText}>Selected</Text>
                                </View>
                            </View>
                            <Text allowFontScaling={false} style={styles.addrName}>{selectedAddr.name}</Text>
                            <View style={styles.addrPhoneRow}>
                                <Ionicons name="call-outline" size={rf(13)} color="#94A3B8" />
                                <Text allowFontScaling={false} style={styles.addrPhone}>{selectedAddr.mobile}</Text>
                            </View>
                            <View style={styles.addrLineRow}>
                                <Ionicons name="map-outline" size={rf(13)} color="#94A3B8" style={{ marginTop: hp(0.2) }} />
                                <Text allowFontScaling={false} style={styles.addrLine}>
                                    {selectedAddr.street}, {selectedAddr.city}, {selectedAddr.state} – {selectedAddr.pincode}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.addAddrBtn} onPress={() => router.push('/add-address')}>
                            <View style={styles.addAddrIconWrap}>
                                <Ionicons name="add" size={rf(22)} color="#F38000" />
                            </View>
                            <View>
                                <Text allowFontScaling={false} style={styles.addAddrTitle}>Add Delivery Address</Text>
                                <Text allowFontScaling={false} style={styles.addAddrSub}>Required to place your order</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── ORDER ITEMS ────────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <View style={styles.sectionIcon}>
                            <Ionicons name="bag-handle" size={rf(16)} color="#F38000" />
                        </View>
                        <Text allowFontScaling={false} style={styles.sectionTitle}>Order Summary</Text>
                        <View style={styles.itemCountPill}>
                            <Text allowFontScaling={false} style={styles.itemCountText}>{checkoutItems.length}</Text>
                        </View>
                    </View>

                    <View style={styles.itemsCard}>
                        {priceItems.map((item: any, i: number) => {
                            const imgUrl = getImgUrl(item.product?.pImage);
                            const hasSave = item.saving > 0;
                            return (
                                <View key={i} style={[styles.itemRow, i < priceItems.length - 1 && styles.itemRowBorder]}>
                                    {/* Image */}
                                    <View style={styles.itemImgWrap}>
                                        {imgUrl ? (
                                            <Image source={{ uri: imgUrl }} style={styles.itemImg} resizeMode="cover" />
                                        ) : (
                                            <View style={[styles.itemImg, styles.itemImgPlaceholder]}>
                                                <Ionicons name="cube-outline" size={22} color="#CBD5E1" />
                                            </View>
                                        )}
                                        <View style={styles.itemQtyBubble}>
                                            <Text style={styles.itemQtyText}>{item.quantity}</Text>
                                        </View>
                                    </View>

                                    {/* Info */}
                                    <View style={styles.itemInfo}>
                                        {item.product?.pBrand && (
                                            <Text allowFontScaling={false} style={styles.itemBrand}>{item.product.pBrand}</Text>
                                        )}
                                        <Text allowFontScaling={false} style={styles.itemName} numberOfLines={2}>{item.product?.pName || 'Product'}</Text>

                                        {item.variantValue && (
                                            <View style={styles.variantChip}>
                                                <Text allowFontScaling={false} style={styles.variantChipText}>{item.variantValue}</Text>
                                            </View>
                                        )}

                                        <View style={styles.itemPriceRow}>
                                            <Text allowFontScaling={false} style={styles.itemOfferPrice}>₹{(item.offerPrice * item.quantity).toLocaleString()}</Text>
                                            {hasSave && (
                                                <Text allowFontScaling={false} style={styles.itemOriginalPrice}>₹{(item.originalPrice * item.quantity).toLocaleString()}</Text>
                                            )}
                                            {hasSave && (
                                                <View style={styles.itemSavingBadge}>
                                                    <Text allowFontScaling={false} style={styles.itemSavingText}>
                                                        Save ₹{(item.saving * item.quantity).toLocaleString()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>



                {/* ── PAYMENT METHOD ─────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <View style={styles.sectionIcon}>
                            <Ionicons name="card" size={rf(16)} color="#F38000" />
                        </View>
                        <Text allowFontScaling={false} style={styles.sectionTitle}>Payment Method</Text>
                    </View>

                    <View style={styles.paymentCard}>
                        <View style={styles.payIconWrap}>
                            <Ionicons name="shield-checkmark" size={rf(26)} color="#F38000" />
                        </View>
                        <View style={styles.payInfo}>
                            <Text allowFontScaling={false} style={styles.payLabel}>Online Payment via Razorpay</Text>
                            <Text allowFontScaling={false} style={styles.paySub}>UPI • Cards • Netbanking • Wallets</Text>
                        </View>
                        <View style={styles.paySelectedDot} />
                    </View>
                </View>

                {/* ── PRICE DETAILS ──────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <View style={styles.sectionIcon}>
                            <Ionicons name="receipt" size={rf(16)} color="#F38000" />
                        </View>
                        <Text allowFontScaling={false} style={styles.sectionTitle}>Price Details</Text>
                    </View>

                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text allowFontScaling={false} style={styles.priceLabel}>Original Price</Text>
                            <Text allowFontScaling={false} style={styles.priceVal}>₹{totalOriginalPrice.toLocaleString()}</Text>
                        </View>
                        {totalYouSave > 0 && (
                            <View style={styles.priceRow}>
                                <Text allowFontScaling={false} style={[styles.priceLabel, { color: '#16A34A' }]}>Product Discount</Text>
                                <Text allowFontScaling={false} style={[styles.priceVal, { color: '#16A34A', fontWeight: '800' }]}>-₹{totalYouSave.toLocaleString()}</Text>
                            </View>
                        )}
                        <View style={styles.priceRow}>
                            <Text allowFontScaling={false} style={styles.priceLabel}>Platform Fee</Text>
                            <Text allowFontScaling={false} style={styles.priceVal}>₹8</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text allowFontScaling={false} style={styles.priceLabel}>Delivery Charges</Text>
                            <Text allowFontScaling={false} style={[styles.priceVal, { color: calculatedShippingFee === 0 ? '#16A34A' : '#1E293B', fontWeight: '800' }]}>
                                {calculatedShippingFee === 0 ? '🎁 FREE' : `₹${calculatedShippingFee}`}
                            </Text>
                        </View>
                        {walletBalance > 0 && offeredItemsTotal > 0 && (
                            <TouchableOpacity
                                style={[styles.compactWalletRow, useWallet && styles.compactWalletRowActive]}
                                onPress={() => setUseWallet(!useWallet)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.compactWalletLeft}>
                                    <View style={[styles.compactCheckbox, useWallet && styles.compactCheckboxActive]}>
                                        {useWallet && <Ionicons name="checkmark" size={rf(11)} color="#FFF" />}
                                    </View>
                                    <View>
                                        <Text allowFontScaling={false} style={styles.compactWalletLabel}>Use Wallet Balance</Text>
                                        <Text allowFontScaling={false} style={styles.compactWalletSub}>Available: ₹{walletBalance.toLocaleString()}</Text>
                                    </View>
                                </View>
                                {useWallet && walletDiscount > 0 && (
                                    <Text allowFontScaling={false} style={styles.compactWalletDiscount}>-₹{walletDiscount.toLocaleString()}</Text>
                                )}
                            </TouchableOpacity>
                        )}
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                            <Text allowFontScaling={false} style={styles.priceTotalLabel}>Final Amount</Text>
                            <Text allowFontScaling={false} style={styles.priceTotalVal}>₹{finalPayable.toLocaleString()}</Text>
                        </View>

                        {(totalYouSave > 0 || (useWallet && walletDiscount > 0)) && (
                            <View style={styles.totalSavingRow}>
                                <Ionicons name="checkmark-circle" size={rf(14)} color="#16A34A" />
                                <Text allowFontScaling={false} style={styles.totalSavingText}>
                                    You save ₹{(totalYouSave + walletDiscount).toLocaleString()} on this order
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── TRUST BADGES ───────────────────────── */}
                <View style={styles.trustRow}>
                    {[
                        { icon: 'shield-checkmark', label: '100% Secure', color: '#3B82F6' },
                        { icon: 'refresh-circle', label: 'Easy Return', color: '#22C55E' },
                        { icon: 'flash', label: 'Fast Delivery', color: '#F38000' },
                        { icon: 'lock-closed', label: 'Encrypted', color: '#8B5CF6' },
                    ].map((b, i, arr) => (
                        <React.Fragment key={i}>
                            <View style={styles.trustItem}>
                                <Ionicons name={b.icon as any} size={rf(20)} color={b.color} />
                                <Text allowFontScaling={false} style={styles.trustText}>{b.label}</Text>
                            </View>
                            {i < arr.length - 1 && <View style={styles.trustDivider} />}
                        </React.Fragment>
                    ))}
                </View>
            </ScrollView>

            {/* ── PLACE ORDER BAR ─────────────────────────── */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, hp(4.7)) }]}>
                <View>
                    <Text allowFontScaling={false} style={styles.barLabel}>FINAL AMOUNT</Text>
                    <Text allowFontScaling={false} style={styles.barAmt}>₹{finalPayable.toLocaleString()}</Text>
                    {(totalYouSave > 0 || walletDiscount > 0) && (
                        <Text allowFontScaling={false} style={styles.barSaving}>Savings: ₹{(totalYouSave + walletDiscount).toLocaleString()}</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.orderBtn, placing && { opacity: 0.65 }]}
                    onPress={handlePlaceOrder}
                    disabled={placing}
                    activeOpacity={0.85}
                >
                    {placing ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="bag-check-outline" size={rf(18)} color="#FFF" />
                            <Text allowFontScaling={false} style={styles.orderBtnText}>Place Order</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F8FB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp(6), gap: hp(1.5) },
    loadingText: { fontSize: rf(14), fontWeight: '600', color: '#94A3B8', marginTop: hp(1) },

    // Empty state
    emptyIconWrap: {
        width: wp(25), height: wp(25), borderRadius: wp(7),
        backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center',
        marginBottom: hp(2),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: hp(0.6) },
        shadowOpacity: 0.15, shadowRadius: wp(3.5), elevation: 6,
    },
    emptyTitle: { fontSize: rf(20), fontWeight: '900', color: '#1E293B', textAlign: 'center' },
    emptySub: { fontSize: rf(14), color: '#94A3B8', fontWeight: '500', textAlign: 'center' },
    goBackBtn: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1.5),
        backgroundColor: '#F38000', paddingHorizontal: wp(6), paddingVertical: hp(1.5),
        borderRadius: wp(4), marginTop: hp(1),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.3, shadowRadius: wp(2), elevation: 6,
    },
    goBackText: { color: '#FFF', fontWeight: '800', fontSize: rf(15) },

    // Secure Badge (used in CustomHeader rightElement)
    headerSecureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        backgroundColor: '#F0FDF4',
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.6),
        borderRadius: wp(3),
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    headerSecureText: {
        fontSize: rf(11),
        fontWeight: '800',
        color: '#16A34A',
    },

    // Step indicator
    stepRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', marginBottom: hp(2.5),
        padding: wp(4.5), borderRadius: wp(5),
        shadowColor: '#000', shadowOffset: { width: 0, height: hp(0.2) },
        shadowOpacity: 0.03, shadowRadius: wp(2), elevation: 2,
    },
    stepItem: { alignItems: 'center', gap: hp(0.5) },
    stepDot: {
        width: wp(7), height: wp(7), borderRadius: wp(3.5),
        justifyContent: 'center', alignItems: 'center',
    },
    stepNum: { fontSize: rf(13), fontWeight: '900', color: '#FFF' },
    stepLabel: { fontSize: rf(11), fontWeight: '700' },
    stepLine: { flex: 1, height: hp(0.2), borderRadius: 1, marginHorizontal: wp(2), marginBottom: hp(1.5) },

    // Content
    content: { padding: wp(4) },
    section: { marginBottom: hp(2.5) },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1.5) },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2.5), marginBottom: hp(1.5) },
    sectionIcon: {
        width: wp(8), height: wp(8), borderRadius: wp(2.5),
        backgroundColor: '#FFF7ED',
        justifyContent: 'center', alignItems: 'center',
    },
    sectionTitle: { fontSize: rf(15), fontWeight: '900', color: '#1E293B', letterSpacing: -0.2 },
    itemCountPill: {
        backgroundColor: '#F38000', paddingHorizontal: wp(2), paddingVertical: hp(0.2),
        borderRadius: wp(2.5), marginLeft: wp(1.5),
    },
    itemCountText: { fontSize: rf(11), fontWeight: '900', color: '#FFF' },
    changeBtn: { flexDirection: 'row', alignItems: 'center', gap: wp(0.5) },
    changeLink: { fontSize: rf(13), fontWeight: '800', color: '#F38000' },

    // Address
    addrCard: {
        backgroundColor: '#FFF', borderRadius: wp(5), padding: wp(4.5),
        shadowColor: '#000', shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.05, shadowRadius: wp(3), elevation: 3,
        borderWidth: 1, borderColor: '#EDF2F7',
    },
    addrTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1.5) },
    addrTypeTag: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1.2),
        backgroundColor: '#FFF7ED', paddingHorizontal: wp(2.5), paddingVertical: hp(0.5),
        borderRadius: wp(2.5), borderWidth: 1, borderColor: '#FED7AA',
    },
    addrTypeText: { fontSize: rf(11), fontWeight: '900', color: '#F38000', textTransform: 'uppercase' },
    addrSelectedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1),
        backgroundColor: '#F0FDF4', paddingHorizontal: wp(2.5), paddingVertical: hp(0.5),
        borderRadius: wp(2.5), borderWidth: 1, borderColor: '#DCFCE7',
    },
    addrSelectedText: { fontSize: rf(11), fontWeight: '800', color: '#16A34A' },
    addrName: { fontSize: rf(16), fontWeight: '900', color: '#1E293B', marginBottom: hp(1) },
    addrPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: wp(1.5), marginBottom: hp(0.7) },
    addrPhone: { fontSize: rf(13), color: '#64748B', fontWeight: '600' },
    addrLineRow: { flexDirection: 'row', gap: wp(1.5) },
    addrLine: { flex: 1, fontSize: rf(13), color: '#64748B', lineHeight: rf(20), fontWeight: '500' },
    addAddrBtn: {
        flexDirection: 'row', alignItems: 'center', gap: wp(3.5),
        backgroundColor: '#FFF',
        borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#FED7AA',
        borderRadius: wp(5), padding: wp(4.5),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: hp(0.2) },
        shadowOpacity: 0.06, shadowRadius: wp(2), elevation: 2,
    },
    addAddrIconWrap: {
        width: wp(11), height: wp(11), borderRadius: wp(3.5), backgroundColor: '#FFF7ED',
        justifyContent: 'center', alignItems: 'center',
    },
    addAddrTitle: { fontSize: rf(15), fontWeight: '800', color: '#1E293B' },
    addAddrSub: { fontSize: rf(12), color: '#94A3B8', fontWeight: '500', marginTop: hp(0.2) },

    // Order items
    itemsCard: {
        backgroundColor: '#FFF', borderRadius: wp(5), overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.05, shadowRadius: wp(3), elevation: 3,
        borderWidth: 1, borderColor: '#EDF2F7',
    },
    itemRow: { flexDirection: 'row', padding: wp(4), gap: wp(3.5) },
    itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    itemImgWrap: { position: 'relative' },
    itemImg: { width: wp(20), height: hp(11), borderRadius: wp(3.5), backgroundColor: '#F1F5F9' },
    itemImgPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    itemQtyBubble: {
        position: 'absolute', bottom: hp(0.7), right: wp(1.5),
        width: wp(5.5), height: wp(5.5), borderRadius: wp(2.75),
        backgroundColor: '#F38000', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#FFF',
    },
    itemQtyText: { fontSize: rf(10), fontWeight: '900', color: '#FFF' },
    itemInfo: { flex: 1 },
    itemBrand: { fontSize: rf(10), fontWeight: '900', color: '#F38000', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: hp(0.4) },
    itemName: { fontSize: rf(13), fontWeight: '800', color: '#1E293B', lineHeight: rf(18), marginBottom: hp(0.7) },
    variantChip: {
        alignSelf: 'flex-start', backgroundColor: '#F8FAFC',
        borderRadius: wp(2), paddingHorizontal: wp(2), paddingVertical: hp(0.4),
        borderWidth: 1, borderColor: '#E2E8F0', marginBottom: hp(1),
    },
    variantChipText: { fontSize: rf(11), color: '#64748B', fontWeight: '700' },
    itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: wp(1.5), flexWrap: 'wrap' },
    itemOfferPrice: { fontSize: rf(16), fontWeight: '900', color: '#1E293B' },
    itemOriginalPrice: { fontSize: rf(11), color: '#CBD5E1', textDecorationLine: 'line-through', fontWeight: '600' },
    itemSavingBadge: {
        backgroundColor: '#F0FDF4', paddingHorizontal: wp(1.5), paddingVertical: hp(0.25), borderRadius: wp(1.5),
    },
    itemSavingText: { fontSize: rf(10), fontWeight: '800', color: '#16A34A' },

    // Compact Wallet Row (Integrated in Price Details)
    compactWalletRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#F8FAFC', borderRadius: wp(3), padding: wp(3),
        marginBottom: hp(1.5), borderWidth: 1, borderColor: '#E2E8F0',
    },
    compactWalletRowActive: {
        backgroundColor: '#F0FDF4', borderColor: '#86EFAC',
    },
    compactWalletLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
    compactCheckbox: {
        width: wp(5.5), height: wp(5.5), borderRadius: wp(1.5),
        borderWidth: 1.5, borderColor: '#CBD5E1',
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF',
    },
    compactCheckboxActive: {
        backgroundColor: '#16A34A', borderColor: '#16A34A',
    },
    compactWalletLabel: { fontSize: rf(13), fontWeight: '800', color: '#1E293B' },
    compactWalletSub: { fontSize: rf(11), color: '#64748B', fontWeight: '600' },
    compactWalletDiscount: { fontSize: rf(14), fontWeight: '900', color: '#16A34A' },

    // Payment
    paymentCard: {
        flexDirection: 'row', alignItems: 'center', gap: wp(4),
        backgroundColor: '#FFF', borderRadius: wp(5), padding: wp(4.5),
        borderWidth: 1.5, borderColor: '#FED7AA',
        shadowColor: '#F38000', shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.06, shadowRadius: wp(3), elevation: 3,
    },
    payIconWrap: {
        width: wp(13), height: wp(13), borderRadius: wp(4),
        backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center',
    },
    payInfo: { flex: 1 },
    payLabel: { fontSize: rf(14), fontWeight: '800', color: '#1E293B', letterSpacing: -0.2 },
    paySub: { fontSize: rf(12), color: '#94A3B8', marginTop: hp(0.4), fontWeight: '500' },
    paySelectedDot: {
        width: wp(3), height: wp(3), borderRadius: wp(1.5),
        backgroundColor: '#F38000',
        shadowColor: '#F38000', shadowOffset: { width: 0, height: hp(0.25) },
        shadowOpacity: 0.4, shadowRadius: wp(1), elevation: 3,
    },

    // Price details
    priceCard: {
        backgroundColor: '#FFF', borderRadius: wp(5), padding: wp(5),
        shadowColor: '#000', shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.05, shadowRadius: wp(3), elevation: 3,
        borderWidth: 1, borderColor: '#EDF2F7',
    },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(1.7) },
    priceLabel: { fontSize: rf(14), color: '#64748B', fontWeight: '500' },
    priceVal: { fontSize: rf(14), fontWeight: '700', color: '#1E293B' },
    priceDivider: { height: hp(0.2), backgroundColor: '#F1F5F9', marginVertical: hp(1.7), borderRadius: 1 },
    priceTotalLabel: { fontSize: rf(17), fontWeight: '900', color: '#1E293B' },
    priceTotalVal: { fontSize: rf(22), fontWeight: '900', color: '#F38000', letterSpacing: -0.5 },
    totalSavingRow: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1.5),
        backgroundColor: '#F0FDF4', borderRadius: wp(3), padding: wp(2.5), marginTop: hp(0.7),
    },
    totalSavingText: { fontSize: rf(12), color: '#16A34A', fontWeight: '700' },

    // Trust badges
    trustRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: wp(5), padding: wp(4),
        marginBottom: hp(1.2),
        shadowColor: '#000', shadowOffset: { width: 0, height: hp(0.2) },
        shadowOpacity: 0.03, shadowRadius: wp(2), elevation: 2,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    trustItem: { flex: 1, alignItems: 'center', gap: hp(0.6) },
    trustText: { fontSize: rf(10), fontWeight: '700', color: '#64748B', textAlign: 'center', lineHeight: rf(14) },
    trustDivider: { width: 1, height: hp(4.5), backgroundColor: '#F1F5F9' },

    // Bottom bar
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: wp(5), paddingTop: hp(1.7),
        borderTopWidth: 1, borderTopColor: '#EDF2F7',
        shadowColor: '#000', shadowOffset: { width: 0, height: hp(-1) },
        shadowOpacity: 0.07, shadowRadius: wp(4), elevation: 20, zIndex: 999,
    },
    barLabel: { fontSize: rf(10), color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: hp(0.2) },
    barAmt: { fontSize: rf(22), fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    barSaving: { fontSize: rf(11), fontWeight: '700', color: '#16A34A', marginTop: hp(0.1) },
    orderBtn: {
        flexDirection: 'row', alignItems: 'center', gap: wp(2),
        backgroundColor: '#F38000',
        paddingHorizontal: wp(5), paddingVertical: hp(1.7),
        borderRadius: wp(4.5),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: hp(0.7) },
        shadowOpacity: 0.35, shadowRadius: wp(3), elevation: 8,
    },
    orderBtnText: { color: '#FFF', fontWeight: '900', fontSize: rf(15), letterSpacing: -0.2 },
});
