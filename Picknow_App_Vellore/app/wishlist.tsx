import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    View,
    ActivityIndicator,
    RefreshControl,
    Image,
    Alert,
    Text,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { authService, productService } from '@/Services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';
import PremiumLoader from '@/components/PremiumLoader';

const API_URL = 'https://backmern.picknow.in';

const getImageUrl = (img: string | any[] | undefined): any => {
    if (!img) return { uri: 'https://via.placeholder.com/150' };
    const imgStr = Array.isArray(img) ? img[0] : img;
    if (!imgStr) return { uri: 'https://via.placeholder.com/150' };

    if (imgStr.startsWith('http')) return { uri: imgStr };
    if (imgStr.startsWith('/')) return { uri: `${API_URL}${imgStr}` };
    return { uri: `${API_URL}/images/${imgStr}` };
};

export default function WishlistScreen() {
    const { token } = useAuth();
    const { addToCart } = useCart();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [wishlist, setWishlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [enrichedProducts, setEnrichedProducts] = useState<Record<string, any>>({});

    useEffect(() => {
        if (token) {
            fetchWishlist();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchWishlist = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const data = await authService.getWishlist(token);
            const products = data.products || [];
            setWishlist(products);

            // Start enriching products in the background
            enrichProducts(products);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const enrichProducts = async (items: any[]) => {
        const productIds = Array.from(new Set(items.map(item => item._id).filter(Boolean)));
        try {
            await Promise.all(productIds.map(async (id) => {
                if (!enrichedProducts[id as string]) {
                    try {
                        const data = await productService.getProductById(id as string);
                        if (data && data.product) {
                            setEnrichedProducts(prev => ({ ...prev, [id as string]: data.product }));
                        }
                    } catch (error) {
                        console.error('Error enriching wishlist product:', id, error);
                    }
                }
            }));
        } catch (err) {
            console.error('Enrichment batch error:', err);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWishlist();
        setRefreshing(false);
    };

    const handleRemove = async (productId: string, variantId?: string) => {
        try {
            await authService.removeFromWishlist({ productId, variantId }, token!);
            setWishlist(wishlist.filter((item) => {
                if (variantId) return item.variantId !== variantId;
                return item._id !== productId;
            }));
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to remove from wishlist');
        }
    };

    const handleAddToCart = async (item: any, originalIds: { productId: string; variantId?: string }) => {
        setAddingToCart(item._id);
        try {
            // Extract variant metadata from enriched data if available
            const enriched = enrichedProducts[item._id];
            let vType = null;
            let vVal = null;

            if (enriched && enriched.variants) {
                const variant = enriched.variants.find((v: any) => (v._id || v.id) === item.variantId) || enriched.variants[0];
                if (variant) {
                    vType = variant.attributes ? Object.keys(variant.attributes).find(k => variant.attributes[k]) : variant.type;
                    vVal = variant.attributes && vType ? variant.attributes[vType] : (variant.size || variant.weight || variant.color || variant.name);
                }
            }

            if (!vVal) {
                vVal = item.pSize || item.pWeight || item.pColor;
                vType = item.pSize ? 'size' : (item.pWeight ? 'weight' : (item.pColor ? 'color' : null));
            }

            await addToCart({
                productId: item._id,
                quantity: 1,
                price: item.pPrice,
                variantId: item.variantId,
                variantType: vType || 'product',
                variantValue: vVal || 'Standard'
            });

            // Remove from wishlist using the ORIGINAL identifiers that exist in the database
            await handleRemove(originalIds.productId, originalIds.variantId);

            Alert.alert('✅ Added!', `${item.pName} moved to cart`);
        } catch (error: any) {
            console.error('Failed to add to cart or remove from wishlist:', error);
            Alert.alert('Error', error.message || 'Failed to add item to cart');
        } finally {
            setAddingToCart(null);
        }
    };

    if (loading) {
        return <PremiumLoader />;
    }

    if (!token) {
        return (
            <View style={styles.container}>
                <CustomHeader title="My Wishlist" />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.guestContainer}
                >
                    <View style={styles.guestHero}>
                        <View style={styles.guestIconCircle}>
                            <Ionicons name="heart" size={rf(32)} color="#F38000" />
                        </View>
                        <Text allowFontScaling={false} style={styles.guestTitle}>Save Your Favorites</Text>
                        <Text allowFontScaling={false} style={styles.guestSubtitle}>
                            Log in to save items you love and find them easily across all your devices.
                        </Text>
                    </View>

                    <View style={styles.benefitCard}>
                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIconBox}>
                                <Ionicons name="sync-outline" size={rf(16)} color="#F38000" />
                            </View>
                            <View>
                                <Text allowFontScaling={false} style={styles.benefitLabel}>Multi-Device Sync</Text>
                                <Text allowFontScaling={false} style={styles.benefitSub}>Access favorites anywhere</Text>
                            </View>
                        </View>
                        <View style={styles.benefitDivider} />
                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIconBox}>
                                <Ionicons name="notifications-outline" size={rf(16)} color="#F38000" />
                            </View>
                            <View>
                                <Text allowFontScaling={false} style={styles.benefitLabel}>Price Drop Alerts</Text>
                                <Text allowFontScaling={false} style={styles.benefitSub}>Get notified when prices fall</Text>
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
    }

    if (wishlist.length === 0) {
        return (
            <View style={styles.container}>
                <CustomHeader title="My Wishlist" showBack />
                <View style={[styles.centerContainer, { backgroundColor: '#FFF' }]}>
                    <Image source={require('../assets/images/Kairaa4.png')} style={{ width: wp(40), height: wp(40), resizeMode: 'contain', marginBottom: hp(2.5) }} />
                    <Text allowFontScaling={false} style={styles.emptyTitle}>Your Wishlist is empty</Text>
                    <Text allowFontScaling={false} style={styles.emptySubtitle}>Tap the heart icon on any product to add it here and save for later.</Text>
                    <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
                        <Text allowFontScaling={false} style={styles.shopButtonText}>Explore Products</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CustomHeader title="My Wishlist" showBack />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F38000" />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {wishlist.map((item) => {
                        const enriched = enrichedProducts[item._id];
                        let displayPrice = item.pPrice;
                        let displayOldPrice = item.pPreviousPrice;
                        let displayInStock = item.inStock;
                        let variantIdToUse = item.variantId;

                        if (enriched) {
                            const variantsList = enriched.variants || [];
                            const firstVariant = variantsList.find((v: any) => v && (v.price !== undefined || v.stock !== undefined));
                            if (!displayPrice) displayPrice = firstVariant ? firstVariant.price : (enriched.pPrice || 0);
                            if (!displayOldPrice) displayOldPrice = firstVariant ? firstVariant.previousPrice : (enriched.pPreviousPrice || 0);
                            if (!displayInStock) displayInStock = firstVariant ? firstVariant.stock > 0 : (enriched.pStock > 0);
                            if (!variantIdToUse && firstVariant) variantIdToUse = firstVariant._id || firstVariant.id;
                        }

                        return (
                            <View key={item._id} style={styles.productCard}>
                                <View style={styles.imageContainer}>
                                    <Image source={getImageUrl(item.pImage)} style={styles.productImage} />
                                    <TouchableOpacity
                                        style={styles.removeIcon}
                                        onPress={() => handleRemove(item._id, item.variantId)}
                                    >
                                        <Ionicons name="close" size={rf(12)} color="#999" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.viewBadge}
                                        onPress={() => router.push(`/product/${item._id}`)}
                                    >
                                        <View style={styles.glassEffect}>
                                            <Ionicons name="eye" size={rf(14)} color="#FFF" />
                                            <Text allowFontScaling={false} style={styles.viewText}>Detail</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.productDetails}>
                                    <View style={styles.brandRow}>
                                        <Text allowFontScaling={false} style={styles.productBrand}>{item.pBrand || 'Generic'}</Text>
                                        {!displayInStock && <View style={styles.oosTag}><Text allowFontScaling={false} style={styles.oosText}>OOS</Text></View>}
                                    </View>
                                    <Text allowFontScaling={false} style={styles.productName} numberOfLines={1}>{item.pName}</Text>

                                    <View style={styles.priceRow}>
                                        <Text allowFontScaling={false} style={styles.productPrice}>₹{displayPrice?.toLocaleString()}</Text>
                                        {displayOldPrice > 0 && <Text allowFontScaling={false} style={styles.oldPrice}>₹{displayOldPrice?.toLocaleString()}</Text>}
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.addToCartBtn,
                                            addingToCart === item._id && styles.btnDisabled,
                                            !displayInStock && styles.outOfStockBtn
                                        ]}
                                        onPress={() => displayInStock && handleAddToCart(
                                            { ...item, pPrice: displayPrice, variantId: variantIdToUse },
                                            { productId: item._id, variantId: item.variantId }
                                        )}
                                        disabled={addingToCart === item._id || !displayInStock}
                                    >
                                        {addingToCart === item._id ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="bag-handle" size={rf(14)} color="#FFF" />
                                                <Text allowFontScaling={false} style={styles.addToCartText}>{displayInStock ? 'Move to Cart' : 'Out of Stock'}</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FBFCFE' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp(5) },
    scrollContent: { padding: wp(4) },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    productCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: wp(6),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.7) },
        shadowOpacity: 0.04,
        shadowRadius: wp(3),
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F8F9FB',
    },
    imageContainer: {
        width: '100%',
        height: hp(20),
        backgroundColor: '#F7F8FA',
        position: 'relative',
    },
    productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeIcon: {
        position: 'absolute',
        top: hp(1),
        right: wp(2),
        backgroundColor: '#FFFFFF',
        borderRadius: wp(2.5),
        width: wp(6),
        height: wp(6),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.2) },
        shadowOpacity: 0.1,
        shadowRadius: wp(1),
        elevation: 2,
    },
    viewBadge: {
        position: 'absolute',
        bottom: hp(1),
        left: wp(2),
        right: wp(2),
    },
    glassEffect: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingVertical: hp(0.6),
        borderRadius: wp(2.5),
    },
    viewText: { color: '#FFF', fontSize: rf(10), fontWeight: '800', marginLeft: wp(1), textTransform: 'uppercase' },
    productDetails: { padding: wp(3) },
    brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(0.2) },
    productBrand: { fontSize: rf(9), color: '#999', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    oosTag: { backgroundColor: '#FEE2E2', paddingHorizontal: wp(1.5), paddingVertical: hp(0.25), borderRadius: wp(1) },
    oosText: { fontSize: rf(8), color: '#EF4444', fontWeight: '900' },
    productName: { fontSize: rf(13), fontWeight: '800', color: '#111', marginTop: hp(0.2) },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: hp(0.7), marginBottom: hp(1.5) },
    productPrice: { fontSize: rf(16), fontWeight: '900', color: '#F38000' },
    oldPrice: { fontSize: rf(11), color: '#CCC', textDecorationLine: 'line-through', marginLeft: wp(1.5), fontWeight: '600' },
    addToCartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
        paddingVertical: hp(1.2),
        borderRadius: wp(3.5),
        gap: wp(1.5)
    },
    outOfStockBtn: { backgroundColor: '#E5E7EB' },
    btnDisabled: { opacity: 0.6 },
    addToCartText: { color: '#FFF', fontSize: rf(11), fontWeight: '800' },
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
    emptyTitle: { fontSize: rf(18), fontWeight: '900', color: '#1E293B', marginTop: hp(1) },
    emptySubtitle: { fontSize: rf(12), color: '#64748B', textAlign: 'center', marginVertical: hp(1), paddingHorizontal: wp(5) },
    shopButton: { backgroundColor: '#F38000', paddingVertical: hp(1.5), paddingHorizontal: wp(6), borderRadius: rf(10), marginTop: hp(2) },
    shopButtonText: { color: '#FFF', fontSize: rf(14), fontWeight: '800' },
});
