import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Animated,
    Alert
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import { authService, productService, brandService } from '@/Services/api';
import CustomHeader from '@/components/CustomHeader';
import PremiumLoader from '@/components/PremiumLoader';

// Remove Dimensions import if not needed
// const { width } = Dimensions.get('window');
const API_URL = 'https://backmern.picknow.in';

const getImageUrl = (img: string | any[] | undefined) => {
    if (!img) return require('../../assets/images/Kairaa4.png');
    const imgStr = Array.isArray(img) ? img[0] : img;
    if (!imgStr) return require('../../assets/images/Kairaa4.png');
    if (imgStr.startsWith('http')) return { uri: imgStr };
    if (imgStr.startsWith('/')) return { uri: `${API_URL}${imgStr}` };
    if (imgStr.includes('uploads')) return { uri: `${API_URL}/${imgStr}` };
    return { uri: `${API_URL}/images/${imgStr}` };
};

export default function BrandProductsScreen() {
    const { name } = useLocalSearchParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const insets = useSafeAreaInsets();

    const scrollY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [wishlistItems, setWishlistItems] = useState(new Set<string>());

    const brandName = typeof name === 'string' ? name : '';
    const stickyHeaderTranslateY = scrollY.interpolate({
        inputRange: [50, 100],
        outputRange: [-hp(12), 0],
        extrapolate: 'clamp',
    });
    const stickyHeaderOpacity = scrollY.interpolate({
        inputRange: [50, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const res = await brandService.getProductsByBrand(brandName).catch(() => null);

            if (res && res.success && res.data) {
                setProducts(res.data);
            } else if (res && res.products) {
                setProducts(res.products);
            } else {
                // Fallback to latest products filtering if brand-specific endpoint fails or returns nothing
                const latestRes = await productService.getLatestProducts().catch(() => ({ products: [] }));
                if (latestRes?.products) {
                    setProducts(latestRes.products.filter((p: any) =>
                        (p.pBrand && p.pBrand.toLowerCase() === brandName.toLowerCase()) ||
                        (p.brand && p.brand.toLowerCase() === brandName.toLowerCase())
                    ));
                }
            }
        } catch (error) {
            console.log('Error fetching brand products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (brandName) fetchProducts();
    }, [brandName]);

    useEffect(() => {
        if (user && token) {
            authService.getWishlist(token).then((res: any) => {
                if (res.success && res.products) {
                    const wSet = new Set<string>();
                    res.products.forEach((p: any) => wSet.add(p._id || p.productId));
                    setWishlistItems(wSet);
                }
            }).catch(() => { });
        }
    }, [user, token]);

    const handleToggleWishlist = async (productId: string) => {
        if (!user || !token) {
            Alert.alert('Login Required', 'Please login to save favorite items');
            router.push('/(auth)/login');
            return;
        }
        const isWishlisted = wishlistItems.has(productId);
        const newWishlist = new Set(wishlistItems);
        if (isWishlisted) newWishlist.delete(productId);
        else newWishlist.add(productId);
        setWishlistItems(newWishlist);

        try {
            if (isWishlisted) await authService.removeFromWishlist({ productId }, token);
            else await authService.addToWishlist(productId, token);
        } catch {
            setWishlistItems(wishlistItems);
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch = !searchQuery ||
            p.pName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.pDescription?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const renderProductItem = ({ item }: { item: any }) => {
        const variantsList = (item.variants && Array.isArray(item.variants)) ? item.variants : [];
        const firstVariant = variantsList.find((v: any) => typeof v === 'object' && v.price !== undefined);
        const displayPrice = firstVariant ? firstVariant.price : (item.pPrice || item.price || 0);
        const oldPrice = firstVariant ? firstVariant.previousPrice : (item.pPreviousPrice || item.previousPrice);
        const offer = firstVariant ? firstVariant.offer : (item.pOffer || item.offer || 0);

        const productId = item._id || item.productId;
        const isWishlisted = wishlistItems.has(productId);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => router.push(`/product/${productId}`)}
            >
                <View style={styles.cardImageContainer}>
                    <Image style={styles.cardImage} source={getImageUrl(item.pImage)} contentFit="cover" />
                    {offer > 0 && (
                        <View style={styles.offerBadge}>
                            <Text allowFontScaling={false} style={styles.offerText}>{offer}% OFF</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <View>
                        <Text allowFontScaling={false} style={styles.cardBrand}>{brandName}</Text>
                        <Text allowFontScaling={false} style={styles.cardTitle} numberOfLines={2}>{item.pName}</Text>

                        {/* Rating Logic */}
                        {(() => {
                            const reviews = item.pRatingsReviews || [];
                            const avgRating = reviews.length > 0
                                ? (reviews.reduce((acc: number, cur: any) => acc + (parseFloat(cur.rating) || 0), 0) / reviews.length).toFixed(1)
                                : null;

                            return avgRating ? (
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={rf(14)} color="#FFB800" />
                                    <Text allowFontScaling={false} style={styles.ratingValue}>{avgRating}</Text>
                                </View>
                            ) : (
                                <View style={styles.newBadge}>
                                    <Text allowFontScaling={false} style={styles.newText}>NEW</Text>
                                </View>
                            );
                        })()}

                        <Text allowFontScaling={false} style={styles.cardDesc} numberOfLines={2}>{item.pShortDescription || item.pDescription}</Text>
                    </View>

                    <View style={styles.priceRow}>
                        <View>
                            {oldPrice > displayPrice && <Text allowFontScaling={false} style={styles.strikePrice}>₹{oldPrice}</Text>}
                            <Text allowFontScaling={false} style={styles.activePrice}>₹{displayPrice}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.addButton, isWishlisted && styles.wishlistedBtn]}
                            onPress={(e: any) => { e.stopPropagation(); handleToggleWishlist(productId); }}
                        >
                            <Ionicons name={isWishlisted ? "heart" : "add"} size={rf(16)} color={isWishlisted ? "#FF3B30" : "#FFF"} />
                            <Text allowFontScaling={false} style={[styles.addButtonText, isWishlisted && styles.wishlistedText]}>
                                {isWishlisted ? "Saved" : "Add"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.safeArea}>
            {/* Sticky Search Header */}
            <Animated.View
                style={[
                    styles.stickyHeader,
                    {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 999,
                        paddingTop: insets.top,
                        transform: [{ translateY: stickyHeaderTranslateY }],
                        opacity: stickyHeaderOpacity,
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.stickySearchContainer}
                    activeOpacity={0.9}
                    onPress={() => router.push('/search')}
                >
                    <Ionicons name="search" size={rf(18)} color="#94A3B8" />
                    <Text allowFontScaling={false} style={styles.stickySearchPlaceholder}>Search in {brandName}...</Text>
                </TouchableOpacity>
            </Animated.View>

            <CustomHeader title={brandName} showBack />

            {isLoading ? (
                <PremiumLoader />
            ) : (
                <Animated.FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => (item._id || item.productId || Math.random()).toString()}
                    renderItem={renderProductItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listPadding}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    ListHeaderComponent={
                        <View style={styles.searchWrap}>
                            <View style={styles.searchContainerPremium}>
                                <Ionicons name="search" size={rf(20)} color="#94A3B8" />
                                <TextInput
                                    allowFontScaling={false}
                                    style={styles.searchInputPremium}
                                    placeholder={`Search in ${brandName}...`}
                                    placeholderTextColor="#94A3B8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setSearchQuery('')}
                                        style={styles.clearBtn}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="close-circle" size={rf(18)} color="#CBD5E1" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyWrap}>
                            <Ionicons name="bag-outline" size={rf(60)} color="#E2E8F0" />
                            <Text allowFontScaling={false} style={styles.emptyText}>No products found for this brand.</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    stickyHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: wp(4),
        paddingBottom: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.05,
        shadowRadius: wp(2),
        elevation: 5,
    },
    stickySearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        height: hp(5.5),
        borderRadius: wp(3),
        paddingHorizontal: wp(3),
    },
    stickySearchPlaceholder: {
        marginLeft: wp(2.5),
        fontSize: rf(14),
        color: '#94A3B8',
        fontWeight: '500',
    },
    listPadding: {
        padding: wp(5),
        paddingBottom: hp(5),
    },
    searchWrap: {
        marginBottom: hp(2.5),
    },
    searchContainerPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: wp(7.5),
        height: hp(7.5),
        paddingHorizontal: wp(4),
        borderWidth: 1.5,
        borderColor: '#F3800010',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(0.7) },
        shadowOpacity: 0.15,
        shadowRadius: wp(4),
        elevation: 10,
    },
    searchInputPremium: {
        flex: 1,
        marginLeft: wp(2.5),
        fontSize: rf(15),
        fontWeight: '500',
        color: '#1E293B',
    },
    clearBtn: {
        padding: 4,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: wp(6),
        padding: wp(3.5),
        marginBottom: hp(2),
        borderWidth: 1.5,
        borderColor: '#F8FBFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(1) },
        shadowOpacity: 0.04,
        shadowRadius: wp(4),
        elevation: 4,
    },
    cardImageContainer: {
        position: 'relative',
    },
    cardImage: {
        width: wp(28),
        height: hp(16),
        borderRadius: wp(4.5),
        backgroundColor: '#F8F9FB',
    },
    offerBadge: {
        position: 'absolute',
        top: wp(2),
        left: wp(2),
        backgroundColor: '#FF3B30',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: wp(2.5),
        zIndex: 1,
    },
    offerText: {
        color: '#FFF',
        fontSize: rf(9),
        fontWeight: '900',
    },
    cardContent: {
        flex: 1,
        marginLeft: wp(4),
        justifyContent: 'space-between',
        paddingVertical: hp(0.5),
    },
    cardBrand: {
        fontSize: rf(10),
        color: '#F38000',
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: hp(0.5),
    },
    cardTitle: {
        fontSize: rf(16),
        fontWeight: '800',
        color: '#111',
        lineHeight: rf(22),
        marginBottom: hp(0.7),
    },
    cardDesc: {
        fontSize: rf(12),
        color: '#8E949A',
        lineHeight: rf(18),
        marginBottom: hp(1),
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    strikePrice: {
        fontSize: rf(12),
        color: '#AAA',
        textDecorationLine: 'line-through',
        fontWeight: '600',
    },
    activePrice: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#111',
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: '#F38000',
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: wp(3),
        alignItems: 'center',
        gap: wp(1.5),
    },
    addButtonText: {
        color: '#FFF',
        fontSize: rf(12),
        fontWeight: '900',
    },
    wishlistedBtn: {
        backgroundColor: '#FFF5F5',
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    wishlistedText: {
        color: '#FF3B30',
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: hp(12),
    },
    emptyText: {
        fontSize: rf(15),
        color: '#94A3B8',
        marginTop: hp(2),
        fontWeight: '600',
        textAlign: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        marginBottom: hp(0.7),
    },
    ratingValue: {
        fontSize: rf(13),
        fontWeight: '900',
        color: '#FFB800',
    },
    newBadge: {
        backgroundColor: '#F0F9FF',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: wp(2),
        alignSelf: 'flex-start',
        marginBottom: hp(0.7),
    },
    newText: {
        fontSize: rf(10),
        fontWeight: '900',
        color: '#0EA5E9',
        letterSpacing: 0.5,
    },
});
