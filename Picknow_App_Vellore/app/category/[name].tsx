import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Alert,
    TextInput
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { authService, categoryService, productService } from '@/Services/api';
import CustomHeader from '@/components/CustomHeader';

// Remove Dimensions import if not needed
// const { width } = Dimensions.get('window');
const API_URL = 'https://backmern.picknow.in';

const getImageUrl = (img: string | any[] | undefined) => {
    if (!img) return require('../../assets/images/Kairaa4.png');
    const imgStr = Array.isArray(img) ? img[0] : img;
    if (!imgStr) return require('../../assets/images/Kairaa4.png');

    if (imgStr.startsWith('http')) return { uri: imgStr };
    if (imgStr.startsWith('/')) return { uri: `${API_URL}${imgStr}` };
    return { uri: `${API_URL}/images/${imgStr}` };
};

export default function CategoryDetailsScreen() {
    const { name } = useLocalSearchParams();
    const router = useRouter();

    const { user, token } = useAuth();

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [wishlistItems, setWishlistItems] = useState(new Set<string>());
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [activeSubCategory, setActiveSubCategory] = useState<string>('All');

    const categoryName = typeof name === 'string' ? name : '';

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const res = await categoryService.getProductsByCategory(categoryName).catch(() => null);

            let fetchedProducts = [];
            if (res && res.success && res.data) {
                fetchedProducts = res.data;
            } else if (res && res.products) {
                fetchedProducts = res.products;
            } else {
                // Fallback fetch all latest and filter locally
                const latestRes = await productService.getLatestProducts().catch(() => ({ products: [] }));
                if (latestRes?.products) {
                    fetchedProducts = latestRes.products.filter((p: any) => p.pCategory === categoryName);
                }
            }
            setProducts(fetchedProducts);

            // Extract unique sub-categories from products
            const subsSet = new Set<string>();
            fetchedProducts.forEach((p: any) => {
                if (p.pSubCategory) subsSet.add(p.pSubCategory);
                else if (p.subCategory) subsSet.add(p.subCategory);
            });
            setSubCategories(['All', ...Array.from(subsSet)]);
        } catch (error) {
            console.log('Error fetching category products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (categoryName) {
            fetchProducts();
        }
    }, [categoryName]);

    useEffect(() => {
        if (user && token) {
            authService.getWishlist(token).then((res: any) => {
                if (res.success && res.wishlist) {
                    const wSet = new Set<string>();
                    res.wishlist.forEach((w: any) => wSet.add(w.product?._id || w.productId));
                    setWishlistItems(wSet);
                } else if (res.products) {
                    const wSet = new Set<string>();
                    res.products.forEach((p: any) => wSet.add(p._id || p.productId));
                    setWishlistItems(wSet);
                }
            }).catch(() => { });
        }
    }, [user, token]);

    const handleToggleWishlist = async (productId: string) => {
        if (!user || !token) {
            Alert.alert('Login Required', 'Please login to save your favorite items to your wishlist!');
            router.push('/(auth)/login');
            return;
        }
        const isWishlisted = wishlistItems.has(productId);

        const newWishlist = new Set(wishlistItems);
        if (isWishlisted) {
            newWishlist.delete(productId);
        } else {
            newWishlist.add(productId);
        }
        setWishlistItems(newWishlist);

        try {
            if (isWishlisted) {
                await authService.removeFromWishlist({ productId }, token);
            } else {
                await authService.addToWishlist(productId, token);
            }
        } catch {
            setWishlistItems(wishlistItems);
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch = !searchQuery ||
            (p.pName && p.pName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.pDescription && p.pDescription.toLowerCase().includes(searchQuery.toLowerCase()));

        const currentPSub = p.pSubCategory || p.subCategory;
        const matchesSub = activeSubCategory === 'All' || currentPSub === activeSubCategory;

        return matchesSearch && matchesSub;
    });

    const renderProductItem = ({ item }: { item: any }) => {
        const variantsList = item.variants || [];
        const firstVariant = variantsList.find((v: any) => typeof v === 'object' && v.price !== undefined);

        // Calculate stock: if product has populated variants, use total variant stock
        // Otherwise fall back to pStock. This prevents products with variant-managed
        // stock from showing "Out of Stock" when pStock is 0 but variants have stock.
        const populatedVariants = variantsList.filter((v: any) => typeof v === 'object' && v.stock !== undefined);
        let effectiveStock: number;
        if (populatedVariants.length > 0) {
            effectiveStock = populatedVariants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
        } else {
            effectiveStock = item.pStock !== undefined ? item.pStock : 10;
        }
        const isOutOfStock = effectiveStock <= 0;

        const displayPrice = (firstVariant && firstVariant.price) ? firstVariant.price : (item.price || item.pPrice || 0);
        const oldPrice = (firstVariant && firstVariant.previousPrice) ? firstVariant.previousPrice : (item.previousPrice || item.pPreviousPrice);
        const displayOffer = (firstVariant && firstVariant.offer) ? firstVariant.offer : (item.offer || item.pOffer || 0);

        const productId = item._id || item.productId;
        const isWishlisted = wishlistItems.has(productId);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/product/${productId}`)}
            >
                <Image style={styles.cardImage} source={getImageUrl(item.pImage)} resizeMode="cover" />

                {displayOffer > 0 ? (
                    <View style={styles.offerBadge}>
                        <Text allowFontScaling={false} style={styles.offerText}>{displayOffer}% OFF</Text>
                    </View>
                ) : null}

                <View style={styles.cardContent}>
                    {item.pBrand ? (
                        <Text allowFontScaling={false} style={styles.cardBrand} numberOfLines={1}>{item.pBrand}</Text>
                    ) : null}
                    <Text allowFontScaling={false} style={styles.cardTitle} numberOfLines={2}>{item.pName}</Text>
                    <Text allowFontScaling={false} style={styles.cardDesc} numberOfLines={2}>
                        {item.pShortDescription || item.pDescription || "Delicious organic pick for you"}
                    </Text>

                    <View style={styles.priceRow}>
                        <View>
                            {Number(oldPrice) > Number(displayPrice) ? <Text allowFontScaling={false} style={styles.strikePrice}>₹{oldPrice}/-</Text> : null}
                            <Text allowFontScaling={false} style={styles.activePrice}>₹{displayPrice}/-</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.addButton, isWishlisted && styles.wishlistedBtn]}
                            onPress={(e) => { e.stopPropagation(); handleToggleWishlist(productId); }}
                        >
                            <Text allowFontScaling={false} style={[styles.addButtonText, isWishlisted && styles.wishlistedText]}>
                                {isWishlisted ? "Saved" : "+ Add"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {isOutOfStock ? (
                    <View style={styles.outOfStockBadge}>
                        <Text allowFontScaling={false} style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                ) : null}
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.fullCenter}>
                <ActivityIndicator size="large" color="#F38000" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>

            <CustomHeader title={categoryName} showBack />

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => (item._id || item.productId || Math.random()).toString()}
                renderItem={renderProductItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listPadding}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                windowSize={5}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        <View style={styles.searchWrap}>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={rf(20)} color="#999" style={styles.searchIcon} />
                                <TextInput
                                    allowFontScaling={false}
                                    style={styles.searchInput}
                                    placeholder={`Search ${categoryName}...`}
                                    placeholderTextColor="#94A3B8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                        </View>

                        {subCategories.length > 1 && (
                            <View style={styles.subFilterWrap}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
                                    {subCategories.map((sub, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.subFilterItem,
                                                activeSubCategory === sub && styles.subFilterItemActive
                                            ]}
                                            onPress={() => setActiveSubCategory(sub)}
                                        >
                                            <Text allowFontScaling={false} style={[
                                                styles.subFilterText,
                                                activeSubCategory === sub && styles.subFilterTextActive
                                            ]}>
                                                {sub}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyWrap}>
                        <Ionicons name="leaf-outline" size={rf(60)} color="#E0E0E0" />
                        <Text allowFontScaling={false} style={styles.emptyText}>No products found in {categoryName}.</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    fullCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.8),
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.2) },
        shadowOpacity: 0.04,
        shadowRadius: wp(1.5),
        elevation: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: rf(18),
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',
        marginHorizontal: wp(2),
    },
    backBtn: {
        width: wp(11),
        height: wp(11),
        borderRadius: wp(5.5),
        backgroundColor: '#F8F8F8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    topContainer: {
        backgroundColor: '#FFFFFF',
        paddingBottom: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: wp(7.5),
        paddingHorizontal: wp(4),
        height: hp(7.5),
        borderWidth: 1.5,
        borderColor: '#F3800010',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(0.7) },
        shadowOpacity: 0.15,
        shadowRadius: wp(4),
        elevation: 10,
    },
    searchIcon: {
        marginRight: wp(2.5),
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: rf(15),
        color: '#111',
    },
    listPadding: {
        padding: wp(5),
        paddingBottom: hp(5),
    },
    searchWrap: {
        marginBottom: hp(2),
    },
    subFilterWrap: {
        marginBottom: hp(2.5),
    },
    subFilterScroll: {
        gap: wp(2.5),
        paddingBottom: hp(0.5),
    },
    subFilterItem: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: wp(3),
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    subFilterItemActive: {
        backgroundColor: '#F38000',
        borderColor: '#F38000',
    },
    subFilterText: {
        fontSize: rf(13),
        fontWeight: '700',
        color: '#666',
    },
    subFilterTextActive: {
        color: '#FFFFFF',
    },
    listHeader: {
        marginBottom: hp(1.2),
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: wp(6),
        padding: wp(3.5),
        marginBottom: hp(2.2),
        shadowColor: '#121212',
        shadowOffset: { width: 0, height: hp(1) },
        shadowOpacity: 0.06,
        shadowRadius: wp(4),
        elevation: 6,
        position: 'relative',
        minHeight: hp(20.5),
    },
    cardImage: {
        width: wp(30),
        height: hp(17.5),
        borderRadius: wp(3.5),
        backgroundColor: '#F8F9FA',
    },
    cardContent: {
        flex: 1,
        marginLeft: wp(4),
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: rf(16),
        fontWeight: '800',
        color: '#111',
        lineHeight: rf(22),
        marginBottom: hp(0.7),
    },
    cardBrand: {
        fontSize: rf(11),
        color: '#F38000',
        fontWeight: '800',
        marginBottom: hp(0.2),
        letterSpacing: 0.5,
    },
    cardDesc: {
        fontSize: rf(13),
        color: '#666',
        lineHeight: rf(18),
        marginBottom: hp(1.2),
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto'
    },
    strikePrice: {
        fontSize: rf(12),
        color: '#FF3B30',
        textDecorationLine: 'line-through',
        fontWeight: '600',
        marginBottom: hp(0.5),
    },
    activePrice: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#111',
    },
    offerBadge: {
        position: 'absolute',
        top: wp(4),
        left: wp(4),
        backgroundColor: '#FF3B30',
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.5),
        borderRadius: wp(2),
        zIndex: 1,
    },
    offerText: {
        color: '#FFF',
        fontSize: rf(10),
        fontWeight: '800',
    },
    outOfStockBadge: {
        position: 'absolute',
        bottom: wp(4),
        right: wp(4),
        backgroundColor: '#111',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.7),
        borderRadius: wp(2),
    },
    outOfStockText: {
        color: '#FFF',
        fontSize: rf(10),
        fontWeight: '800',
    },
    addButton: {
        backgroundColor: '#DA291C',
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: wp(2),
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: rf(14),
        fontWeight: '800',
    },
    wishlistedBtn: {
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    wishlistedText: {
        color: '#888',
    },
    emptyWrap: {
        alignItems: 'center',
        marginTop: hp(7.5)
    },
    emptyText: {
        fontSize: rf(16),
        color: '#999',
        marginTop: hp(2),
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: wp(10),
        lineHeight: rf(24),
    }
});
