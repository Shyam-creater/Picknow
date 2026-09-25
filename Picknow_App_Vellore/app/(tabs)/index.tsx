import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Dimensions, Platform, RefreshControl, Linking, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Animated } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import CustomHeader from '@/components/CustomHeader';
import { categoryService, productService, dealService, brandService, blogService, authService, BASE_URL } from '@/Services/api';
import PremiumLoader from '@/components/PremiumLoader';
import { useCart } from '@/context/CartContext';

import { wp, hp, rf } from '@/constants/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = BASE_URL;
const SCREEN_W = Dimensions.get('window').width;
const CARD_GAP = wp(2.5);
const GRID_PAD = wp(4);
const CARD_WIDTH = (SCREEN_W - GRID_PAD * 2 - CARD_GAP) / 2;

const FALLBACK = require('../../assets/images/Kairaa4.png');

const imgUrl = (img: any) => {
    if (!img) return FALLBACK;
    const s = Array.isArray(img) ? img[0] : img;
    if (!s) return FALLBACK;
    if (typeof s !== 'string') {
        if (typeof s === 'number') return s;
        if (s.uri) return s;
        return FALLBACK;
    }
    if (s.startsWith('http')) return { uri: s };
    if (s.startsWith('/')) return { uri: `${API_URL}${s}` };
    if (s.includes('uploads')) return { uri: `${API_URL}/${s}` };
    return { uri: `${API_URL}/images/${s}` };
};

const BANNERS = [
    { id: 'b1', title: 'Featured Picks\nFor You', sub: 'Discover premium lifestyle finds.', badge: 'FEATURED', btn: 'Shop Now', isVideo: true, src: require('../../assets/images/alver.mp4'), bg: '#111' },
    { id: 'b2', title: 'Fresh Herbal\nArrivals', sub: ' organic & natural.', badge: 'NEW', btn: 'Explore', isVideo: false, src: FALLBACK, bg: '#0B3B24' },
    { id: 'b3', title: 'Exclusive Deals\nThis Week', sub: 'Save up to 40% on wellness.', badge: 'SALE', btn: 'View Deals', isVideo: false, src: FALLBACK, bg: '#B45309' },
];

const FEATURES = [
    { icon: 'flash-outline', label: 'Fast Delivery', color: '#F38000' },
    { icon: 'shield-checkmark-outline', label: 'Secure Pay', color: '#3B82F6' },
    { icon: 'leaf-outline', label: ' Organic', color: '#22C55E' },
    { icon: 'return-up-back-outline', label: 'Easy Returns', color: '#8B5CF6' },
    { icon: 'wallet-outline', label: 'Cashback', color: '#EC4899' },
];

export default function HomeScreen() {
    const { user, token } = useAuth();
    const { cart, addToCart } = useCart();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<any>(null);

    // Provide scroll-to-top behavior whenever Home tab is pressed again
    useScrollToTop(scrollRef);

    const [categories, setCategories] = useState<any[]>([]);
    const [deals, setDeals] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [herbalProducts, setHerbalProducts] = useState<any[]>([]);
    const [latestProducts, setLatestProducts] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [offerProducts, setOfferProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [favoritedIds, setFavoritedIds] = useState<Record<string, boolean>>({});
    const [cartAddingIds, setCartAddingIds] = useState<Record<string, boolean>>({});
    const [cartAddedIds, setCartAddedIds] = useState<Record<string, boolean>>({});

    const bannerScrollX = useRef(new Animated.Value(0)).current;
    const catScrollX = useRef(new Animated.Value(0)).current;
    const offerScrollX = useRef(new Animated.Value(0)).current;

    const [bannerIndex, setBannerIndex] = useState(0);
    const [offerIndex, setOfferIndex] = useState(0);
    const bannerRef = useRef<any>(null);
    const offerRef = useRef<any>(null);

    const player = useVideoPlayer(require('../../assets/images/alver.mp4'), (p) => { p.loop = true; p.muted = true; p.play(); });

    // Sync cartAddedIds with cart context
    useEffect(() => {
        if (cart && cart.items) {
            const added: Record<string, boolean> = {};
            cart.items.forEach((item: any) => {
                const pid = item.product?._id || item.product?.id || item.productId;
                if (pid) added[pid] = true;
            });
            setCartAddedIds(added);
        } else {
            setCartAddedIds({});
        }
    }, [cart]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [cRes, dRes, bRes, hRes, lRes, aRes, wRes, oRes] = await Promise.all([
                categoryService.getAllCategories().catch(() => ({ CategoryList: [] })),
                dealService.getAllDeals().catch(() => ({ deals: [] })),
                brandService.getAllBrands().catch(() => ({ brands: [] })),
                categoryService.getProductsByCategory('Herbal Care').catch(() => ({ products: [] })),
                productService.getLatestProducts().catch(() => ({ products: [] })),
                productService.getAllProducts(1, 40).catch(() => ({ products: [] })),
                token ? authService.getWishlist(token).catch(() => []) : [],
                productService.getOffers().catch(() => ({ products: [] })),
            ]);
            setCategories(Array.isArray(cRes) ? cRes : (cRes?.CategoryList || cRes?.categories || cRes?.data || []));
            setDeals(Array.isArray(dRes) ? dRes : (dRes?.deals || dRes?.data || []));
            setBrands(Array.isArray(bRes) ? bRes : (bRes?.brands || bRes?.data || []));
            setHerbalProducts(Array.isArray(hRes) ? hRes : (hRes?.data || hRes?.products || []));
            setLatestProducts(Array.isArray(lRes) ? lRes : (lRes?.products || lRes?.data || []));
            setAllProducts(Array.isArray(aRes) ? aRes : (aRes?.products || aRes?.data || []));
            setOfferProducts(Array.isArray(oRes) ? oRes : (oRes?.products || oRes?.data || []));

            if (Array.isArray(wRes)) {
                const favs: Record<string, boolean> = {};
                wRes.forEach((item: any) => {
                    const pid = item.product?._id || item.product?.id || item._id;
                    if (pid) favs[pid] = true;
                });
                setFavoritedIds(favs);
            }
        } catch (e) { console.log(e); }
        finally { setIsLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchData(); }, [token]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    // Derive products for sections
    const dealProducts = deals.reduce((acc: any[], d: any) => {
        const prods = d.products || d.ccProducts || d.productItems || [];
        return acc.concat(prods.filter((dp: any) => dp && (dp.product || dp.productId)));
    }, []).slice(0, 20);

    const combinedOffers = [
        ...(Array.isArray(offerProducts) ? offerProducts : []),
        ...(Array.isArray(dealProducts) ? dealProducts.map((dp: any) => dp.product || dp.productId).filter(p => p && typeof p === 'object') : []),
        ...(Array.isArray(allProducts) ? allProducts.filter((p: any) => {
            if (!p) return false;
            const disc = p.pOffer || p.offer || p.discount || 0;
            const hasPriceDiff = p.pPreviousPrice > p.pPrice;
            return disc > 0 || hasPriceDiff;
        }) : [])
    ].filter((p, i, self) => {
        if (!p || typeof p !== 'object') return false;
        const pid = p._id || p.id || p.productId || p.p_id;
        const disc = p.pOffer || p.offer || p.discount || 0;
        const hasPriceDiff = p.pPreviousPrice > p.pPrice;
        // Strict filter: only items with actual discounts
        if (disc <= 0 && !hasPriceDiff) return false;
        return pid && self.findIndex(t => (t?._id || t?.id || t?.productId || t?.p_id) === pid) === i;
    }).slice(0, 15);

    // Auto-advance banner (now controls Category Slider)
    useEffect(() => {
        const catCount = Math.min(categories.length, 10);
        if (catCount <= 1) return;
        const t = setInterval(() => {
            if (!bannerRef.current) return;
            const next = (bannerIndex + 1) % catCount;
            try {
                bannerRef.current?.scrollToOffset({
                    offset: next * wp(92),
                    animated: true,
                });
                setBannerIndex(next);
            } catch (e) {
                console.warn('Banner scroll error:', e);
            }
        }, 3500);
        return () => clearInterval(t);
    }, [bannerIndex, categories]);

    useEffect(() => {
        if (combinedOffers.length > 1) {
            const interval = setInterval(() => {
                const next = (offerIndex + 1) % combinedOffers.length;
                offerRef.current?.scrollToOffset({ offset: next * wp(89), animated: true });
                setOfferIndex(next);
            }, 3500);
            return () => clearInterval(interval);
        }
    }, [offerIndex, combinedOffers.length]);

    const handleBannerScroll = (e: any) => {
        const catCount = Math.min(categories.length, 10);
        const idx = Math.round(e.nativeEvent.contentOffset.x / wp(92));
        if (idx !== bannerIndex && idx >= 0 && idx < catCount) setBannerIndex(idx);
    };

    const handleWishlist = async (productId: string) => {
        if (!token) {
            router.push('/(auth)/login');
            return;
        }
        const isFav = !!favoritedIds[productId];
        // Optimistic update
        setFavoritedIds(prev => ({ ...prev, [productId]: !isFav }));

        try {
            if (isFav) {
                await authService.removeFromWishlist({ productId }, token);
            } else {
                await authService.addToWishlist(productId, token);
            }
        } catch (error: any) {
            // Revert on error
            setFavoritedIds(prev => ({ ...prev, [productId]: isFav }));
            Alert.alert("Note", error.message || "Could not update wishlist");
        }
    };

    // Sticky header opacity
    const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: 'clamp' });

    if (isLoading) return <PremiumLoader />;

    // ── Unified Product Card Renderer ──
    const renderProductCard = ({ p, pid, price, oldPrice, offer, rating, badge, i, keyPrefix }: {
        p: any; pid: string; price: number; oldPrice?: number; offer?: number;
        rating?: string | null; badge?: string | null; i: number; keyPrefix?: string;
    }) => {
        const key = keyPrefix ? `${keyPrefix}-${pid}-${i}` : (pid || `card-${i}`);

        if (!p) return null;
        // Find the first variant with stock if possible, otherwise first with price
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const activeV = variants.find((v: any) => v && (v.stock > 0)) || variants[0];
        const vid = activeV?._id || activeV?.id;

        // Derive variant metadata for cart and display
        let vType: any = null;
        let vVal: any = null;
        if (activeV) {
            vType = activeV.attributes ? Object.keys(activeV.attributes).find(k => activeV.attributes[k]) : activeV.type;
            if (activeV.attributes && vType) {
                vVal = activeV.attributes[vType];
            } else {
                vVal = activeV.size || activeV.weight || activeV.color || activeV.flavor || vType;
            }
        }

        return (
            <TouchableOpacity
                key={key}
                style={styles.productCard}
                onPress={() => router.push(`/product/${pid}`)}
                activeOpacity={0.88}
            >
                {/* ── Image Section ── */}
                <View style={styles.productImgWrap}>
                    <Image source={imgUrl(p.pImage || p.image)} style={styles.productImg} contentFit="cover" />
                    <TouchableOpacity
                        style={styles.wishlistFloat}
                        onPress={() => handleWishlist(pid)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name={favoritedIds[pid] ? "heart" : "heart-outline"} size={rf(16)} color="#F38000" />
                    </TouchableOpacity>
                    {!!offer && offer > 0 && (
                        <View style={styles.offerBadge}>
                            <Text allowFontScaling={false} style={styles.offerText}>{offer}% OFF</Text>
                        </View>
                    )}
                    {!!badge && !offer && (
                        <View style={[styles.newTag, { backgroundColor: '#F38000' }]}>
                            <Ionicons name="star" size={rf(9)} color="#FFF" />
                            <Text allowFontScaling={false} style={styles.newTagText}>{badge}</Text>
                        </View>
                    )}
                </View>

                {/* ── Info Section (auto height) ── */}
                <View style={styles.productInfo}>
                    {!!p.pBrand && (
                        <Text allowFontScaling={false} style={styles.productBrand} numberOfLines={1}>{p.pBrand}</Text>
                    )}
                    <Text allowFontScaling={false} style={styles.productName} numberOfLines={2}>{p.pName || p.name}</Text>
                    {(() => {
                        const v = activeV;
                        const vLabel = v?.attributes?.weight || v?.attributes?.size || v?.attributes?.color || v?.weight || v?.size || v?.name;
                        if (!vLabel) return null;
                        return (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: wp(1.8), paddingVertical: hp(0.35), borderRadius: rf(6), alignSelf: 'flex-start', marginTop: hp(0.5), borderWidth: 1, borderColor: '#FFEDD5' }}>
                                <View style={{ backgroundColor: '#F38000', borderRadius: rf(4), padding: 2, marginRight: wp(1.2) }}>
                                    <Ionicons name="pricetag" size={rf(8)} color="#FFF" />
                                </View>
                                <Text allowFontScaling={false} style={{ fontSize: rf(10), color: '#C2410C', fontWeight: '800', letterSpacing: 0.3 }}>{String(vLabel)}</Text>
                            </View>
                        );
                    })()}
                    {/* Stock Status */}
                    {(() => {
                        let totalStock = 0;
                        if (variants.length > 0) {
                            totalStock = variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0);
                        } else {
                            totalStock = Number(p.pStock || p.pQuantity || 0);
                        }
                        const isOutOfStock = totalStock <= 0;
                        return (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp(0.6), gap: wp(1.2) }}>
                                <View style={{ width: rf(6), height: rf(6), borderRadius: rf(3), backgroundColor: !isOutOfStock ? '#22C55E' : '#EF4444' }} />
                                <Text allowFontScaling={false} style={{ fontSize: rf(10), fontWeight: '700', color: !isOutOfStock ? '#22C55E' : '#EF4444' }}>
                                    {!isOutOfStock ? `${totalStock} in Stock` : 'Out of Stock'}
                                </Text>
                            </View>
                        );
                    })()}
                    {!!rating && (
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={rf(11)} color="#F59E0B" />
                            <Text allowFontScaling={false} style={styles.ratingText}>{rating}</Text>
                        </View>
                    )}
                    <View style={styles.priceCartRow}>
                        <View style={styles.priceBlock}>
                            {!!oldPrice && Number(oldPrice) > Number(price) && (
                                <Text allowFontScaling={false} style={styles.oldPrice}>₹{oldPrice}</Text>
                            )}
                            <Text allowFontScaling={false} style={styles.price}>₹{price}</Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.addCartBtn,
                                cartAddedIds[pid] && styles.addCartBtnDone,
                            ]}
                            onPress={async () => {
                                if (!token) {
                                    router.push('/(auth)/login');
                                    return;
                                }
                                if (cartAddedIds[pid]) {
                                    router.push('/(tabs)/cart');
                                    return;
                                }
                                setCartAddingIds(prev => ({ ...prev, [pid]: true }));
                                try {
                                    const success = await addToCart({
                                        productId: pid,
                                        quantity: 1,
                                        price: price,
                                        variantId: vid,
                                        variantType: vType || 'product',
                                        variantValue: vVal || 'Standard'
                                    });
                                    if (success) {
                                        setCartAddedIds(prev => ({ ...prev, [pid]: true }));
                                        Alert.alert('Added', 'Item added to cart successfully!');
                                    }
                                } catch (err: any) {
                                    Alert.alert('Error', err.message || 'Failed to add to cart');
                                } finally {
                                    setCartAddingIds(prev => ({ ...prev, [pid]: false }));
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            {cartAddingIds[pid] ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : cartAddedIds[pid] ? (
                                <Ionicons name="checkmark" size={rf(16)} color="#FFF" />
                            ) : (
                                <Ionicons name="bag-add-outline" size={rf(15)} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.root} edges={['left', 'right']}>

            <Animated.ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F38000" />}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(2) }]}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
            >
                {/* ── Header (scrolls away) ── */}
                <CustomHeader showGreeting />

                {/* ── Search Bar ── */}
                <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search')} activeOpacity={0.9}>
                    <View style={styles.searchInner}>
                        <Ionicons name="search-outline" size={rf(20)} color="#94A3B8" style={{ marginRight: wp(2) }} />
                        <Text allowFontScaling={false} style={styles.searchPlaceholder}>Search for premium picks...</Text>
                        <View style={styles.searchFilterBtn}>
                            <Ionicons name="options" size={rf(18)} color="#FFF" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* ── Brand Filter Chips ── */}
                {brands.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandChipsScroll}>
                        <TouchableOpacity style={[styles.brandChip, styles.brandChipAll]} onPress={() => router.push('/(tabs)/categories')}>
                            <Ionicons name="apps" size={rf(14)} color="#FFF" />
                            <Text allowFontScaling={false} style={[styles.brandChipText, { color: '#FFF' }]}>All</Text>
                        </TouchableOpacity>
                        {brands.slice(0, 12).map((b: any, i: number) => (
                            <TouchableOpacity
                                key={b._id || i}
                                style={styles.brandChip}
                                onPress={() => router.push(`/brand/${b.name || b.title}` as any)}
                            >
                                {(b.image || b.logo) ? (
                                    <Image source={imgUrl(b.image || b.logo)} style={styles.brandChipImg} contentFit="contain" />
                                ) : <Ionicons name="pricetag-outline" size={rf(14)} color="#F38000" />}
                                <Text allowFontScaling={false} style={styles.brandChipText} numberOfLines={1}>{b.name || b.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* ── Immersive Category Hero Carousel ── */}
                {categories.length > 0 && (
                    <View style={styles.bannerSection}>
                        <Animated.FlatList
                            ref={bannerRef}
                            data={categories.slice(0, 10)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={wp(92)}
                            snapToAlignment="start"
                            decelerationRate="fast"
                            contentContainerStyle={{ paddingHorizontal: wp(4) }}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: catScrollX } } }],
                                { useNativeDriver: true, listener: handleBannerScroll }
                            )}
                            scrollEventThrottle={16}
                            getItemLayout={(data, index) => ({ length: wp(92), offset: wp(92) * index, index })}
                            renderItem={({ item, index }) => {
                                const TAGLINES = ["Curated for you", "Explore wellness", "Premium picks", "Top deals", "Exclusive finds", "Daily essentials", "Trending now", "Pure & natural", "Seasonal picks", "Best sellers"];
                                const tagline = TAGLINES[index % TAGLINES.length];
                                const SZ = wp(92);
                                const inp = [(index - 1) * SZ, index * SZ, (index + 1) * SZ];
                                const scale = catScrollX.interpolate({ inputRange: inp, outputRange: [0.93, 1, 0.93], extrapolate: 'clamp' });
                                const opacity = catScrollX.interpolate({ inputRange: inp, outputRange: [0.65, 1, 0.65], extrapolate: 'clamp' });
                                return (
                                    <Animated.View style={[styles.catSlideWrap, { transform: [{ scale }], opacity }]}>
                                        <TouchableOpacity style={styles.catSlideCard} onPress={() => router.push(`/category/${item.cName || item.name}` as any)} activeOpacity={0.95}>
                                            <Image source={imgUrl(item.cImage || item.image)} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                                            <View style={styles.catSlideGradientBottom} />
                                            {/* Glassmorphic counter */}
                                            <View style={styles.catCountPill}>
                                                <Ionicons name="layers-outline" size={rf(10)} color="#FFF" />
                                                <Text allowFontScaling={false} style={styles.catCountText}>{index + 1} / {Math.min(categories.length, 10)}</Text>
                                            </View>
                                            {/* Bottom content */}
                                            <View style={styles.catSlideContent}>
                                                <View style={styles.catTaglinePill}>
                                                    <Ionicons name="sparkles" size={rf(10)} color="#F38000" />
                                                    <Text allowFontScaling={false} style={styles.catSlideTagline}>{tagline}</Text>
                                                </View>
                                                <Text allowFontScaling={false} style={styles.catSlideLabel} numberOfLines={1}>{item.cName || item.name}</Text>
                                                <View style={styles.catSlideBtn}>
                                                    <Text allowFontScaling={false} style={styles.catSlideBtnText}>Shop Now</Text>
                                                    <Ionicons name="arrow-forward" size={rf(13)} color="#FFF" />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            }}
                        />
                        {/* Animated pill dots */}
                        <View style={styles.heroDots}>
                            {categories.slice(0, 10).map((_, i) => (
                                <View key={i} style={[styles.heroDot, i === bannerIndex && styles.heroDotActive]} />
                            ))}
                        </View>
                    </View>
                )}
                {/* ── Features Row ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresRow}>
                    {FEATURES.map((f, i) => (
                        <View key={i} style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: f.color + '18' }]}>
                                <Ionicons name={f.icon as any} size={rf(18)} color={f.color} />
                            </View>
                            <Text allowFontScaling={false} style={styles.featureLabel}>{f.label}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* ── Today's Special Offers (Dynamic Slider) ── */}
                {offerProducts.length > 0 && (
                    <View style={[styles.section, { marginTop: hp(1) }]}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionAccent, { backgroundColor: '#EF4444' }]} />
                                <Text allowFontScaling={false} style={styles.sectionTitle}>Exclusive Offers</Text>
                                <View style={[styles.liveBadge, { backgroundColor: '#FEF2F2' }]}>
                                    <Ionicons name="flame" size={rf(12)} color="#EF4444" />
                                    <Text allowFontScaling={false} style={[styles.liveText, { color: '#EF4444' }]}>HOT</Text>
                                </View>
                            </View>
                        </View>
                        <Animated.FlatList
                            ref={offerRef}
                            data={combinedOffers}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={wp(89)}
                            snapToAlignment="start"
                            decelerationRate="fast"
                            contentContainerStyle={{ paddingHorizontal: wp(5) }}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: offerScrollX } } }],
                                { useNativeDriver: true }
                            )}
                            scrollEventThrottle={16}
                            onMomentumScrollEnd={(e) => {
                                const idx = Math.round(e.nativeEvent.contentOffset.x / wp(89));
                                if (idx !== offerIndex) setOfferIndex(idx);
                            }}
                            renderItem={({ item, index }) => {
                                const pid = item.product?._id || item.productId || item._id || item.id;
                                let offer = item.pOffer || item.offer || item.discount || 0;
                                if (offer <= 0 && item.pPreviousPrice > item.pPrice) {
                                    offer = Math.round(((item.pPreviousPrice - item.pPrice) / item.pPreviousPrice) * 100);
                                }
                                return (
                                    <TouchableOpacity
                                        activeOpacity={0.95}
                                        onPress={() => router.push(`/product/${pid}`)}
                                        style={styles.offerSlideContainer}
                                    >
                                        <Image source={imgUrl(item.pImage || item.image)} style={styles.offerSlideImg} contentFit="cover" />
                                        <View style={styles.offerSlideOverlay}>
                                            <View style={styles.offerSlideContent}>
                                                {offer > 0 && (
                                                    <View style={styles.offerSlideBadge}>
                                                        <Ionicons name="flash" size={rf(10)} color="#FFF" />
                                                        <Text style={styles.offerSlideBadgeText}>{offer}% OFF</Text>
                                                    </View>
                                                )}
                                                <Text numberOfLines={1} style={styles.offerSlideTitle}>{item.pName || item.name}</Text>
                                                <Text style={styles.offerSlideSub}>Premium curated deal for you</Text>
                                                <View style={styles.offerSlideCTA}>
                                                    <Text style={styles.offerSlideCTAText}>Shop Now</Text>
                                                    <Ionicons name="arrow-forward" size={rf(12)} color="#FFF" />
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        <View style={styles.offerPagination}>
                            {combinedOffers.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.offerDot,
                                        {
                                            backgroundColor: i === offerIndex ? '#EF4444' : '#CBD5E1',
                                            width: i === offerIndex ? wp(5) : wp(1.5),
                                            opacity: i === offerIndex ? 1 : 0.5
                                        }
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                )}



                {/* ── Fresh Picks (Latest Products) ── */}
                {latestProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={styles.sectionAccent} />
                                <Text allowFontScaling={false} style={styles.sectionTitle}>Fresh Picks</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/categories')} style={styles.seeAllBtn}>
                                <Text allowFontScaling={false} style={styles.seeAllText}>Explore All</Text>
                                <Ionicons name="chevron-forward" size={rf(14)} color="#F38000" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.grid}>
                            {latestProducts.slice(0, 10).map((p: any, i: number) => {
                                const pid = p._id || p.id;
                                const variants = Array.isArray(p.variants) ? p.variants : [];
                                const v = variants.find((x: any) => typeof x === 'object' && x.price !== undefined);
                                const price = v?.price || p.pPrice || p.price || 0;
                                const oldPrice = v?.previousPrice || p.pPreviousPrice;
                                const offer = v?.offer || p.pOffer || 0;
                                const reviews = p.pRatingsReviews || [];
                                const rating = reviews.length > 0
                                    ? (reviews.reduce((a: number, r: any) => a + (parseFloat(r.rating) || 0), 0) / reviews.length).toFixed(1)
                                    : null;
                                return renderProductCard({ p, pid, price, oldPrice, offer, rating, badge: null, i });
                            })}
                        </View>
                    </View>
                )}


                {/* ── Best Sellers (Herbal Products) ── */}
                {herbalProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={styles.sectionAccent} />
                                <Text allowFontScaling={false} style={styles.sectionTitle}>Best Sellers</Text>
                                <View style={[styles.liveBadge, { backgroundColor: '#FFF7ED' }]}>
                                    <Ionicons name="trending-up" size={rf(11)} color="#F38000" />
                                    <Text allowFontScaling={false} style={[styles.liveText]}>HOT</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.grid}>
                            {herbalProducts.slice(0, 8).map((p: any, i: number) => {
                                if (!p) return null;
                                const pid = p._id || p.id || p.productId;
                                const variants = Array.isArray(p.variants) ? p.variants : [];
                                const v = variants.find((x: any) => typeof x === 'object' && x.price !== undefined);
                                const price = v?.price || p.pPrice || p.price || 0;
                                const oldPrice = v?.previousPrice || p.pPreviousPrice;
                                const offer = v?.offer || p.pOffer || 0;
                                const reviews = p.pRatingsReviews || [];
                                const rating = reviews.length > 0
                                    ? (reviews.reduce((a: number, r: any) => a + (parseFloat(r.rating) || 0), 0) / reviews.length).toFixed(1)
                                    : null;
                                return renderProductCard({ p, pid, price, oldPrice, offer, rating, badge: 'TOP', i });
                            })}
                        </View>
                    </View>
                )}

                {/* ── Deal Products Grid ── */}
                {dealProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={styles.sectionAccent} />
                                <Text allowFontScaling={false} style={styles.sectionTitle}>Handpicked Deals</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/categories')} style={styles.seeAllBtn}>
                                <Text allowFontScaling={false} style={styles.seeAllText}>View All</Text>
                                <Ionicons name="chevron-forward" size={rf(14)} color="#F38000" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.grid}>
                            {dealProducts.slice(0, 10).map((dp: any, i: number) => {
                                const p = dp.product || dp.productId;
                                if (!p || typeof p !== 'object') return null;
                                const pid = p._id || p.id;
                                const price = dp.dealPrice || p.pPrice || p.price || 0;
                                const oldPrice = p.pPreviousPrice;
                                const offer = dp.dealDiscount || p.pOffer || 0;
                                const reviews = p.pRatingsReviews || [];
                                const rating = reviews.length > 0
                                    ? (reviews.reduce((a: number, r: any) => a + (parseFloat(r.rating) || 0), 0) / reviews.length).toFixed(1)
                                    : null;
                                return renderProductCard({ p, pid, price, oldPrice, offer, rating, badge: null, i, keyPrefix: 'dp' });
                            })}
                        </View>
                    </View>
                )}

                {/* ── All Products Grid (Flipkart Style Top Picks) ── */}
                {allProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={styles.sectionAccent} />
                                <Text allowFontScaling={false} style={styles.sectionTitle}>Suggested for You</Text>
                                <View style={[styles.liveBadge, { backgroundColor: '#F0F9FF' }]}>
                                    <Ionicons name="sparkles" size={rf(11)} color="#0EA5E9" />
                                    <Text allowFontScaling={false} style={[styles.liveText, { color: '#0EA5E9' }]}>PICKED</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.grid}>
                            {allProducts.map((p: any, i: number) => {
                                const pid = p._id || p.id;
                                const variants = Array.isArray(p.variants) ? p.variants : [];
                                const v = variants.find((x: any) => typeof x === 'object' && x.price !== undefined);
                                const price = v?.price || p.pPrice || p.price || 0;
                                const oldPrice = v?.previousPrice || p.pPreviousPrice;
                                const offer = v?.offer || p.pOffer || 0;
                                const reviews = p.pRatingsReviews || [];
                                const rating = reviews.length > 0
                                    ? (reviews.reduce((a: number, r: any) => a + (parseFloat(r.rating) || 0), 0) / reviews.length).toFixed(1)
                                    : null;
                                return renderProductCard({ p, pid, price, oldPrice, offer, rating, badge: null, i, keyPrefix: 'all' });
                            })}
                        </View>
                        {/* Loading More Indicator if needed */}
                        <TouchableOpacity style={styles.loadMoreBtn} onPress={() => router.push('/(tabs)/categories')}>
                            <Text allowFontScaling={false} style={styles.loadMoreText}>View More Products</Text>
                            <Ionicons name="arrow-forward" size={rf(16)} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Be a Seller Banner ── */}
                <TouchableOpacity
                    style={styles.sellerBanner}
                    activeOpacity={0.9}
                    onPress={() => Linking.openURL('https://picknow.in/vendor')}
                >
                    <View style={styles.sellerLeft}>
                        <Text allowFontScaling={false} style={styles.sellerTag}>PARTNER WITH US</Text>
                        <Text allowFontScaling={false} style={styles.sellerTitle}>Be a Seller</Text>
                        <Text allowFontScaling={false} style={styles.sellerSub}>Grow your business with Picknow.</Text>
                        <View style={styles.sellerBtn}>
                            <Text allowFontScaling={false} style={styles.sellerBtnText}>Register Now</Text>
                            <Ionicons name="arrow-forward-circle" size={rf(20)} color="#FFF" />
                        </View>
                    </View>
                    <View style={styles.sellerRight}>
                        <Ionicons name="storefront" size={rf(50)} color="#F38000" />
                    </View>
                </TouchableOpacity>
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F6F8FB' },

    // ── Sticky compact bar ──────────────────────────────────
    stickyBar: {
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 999, backgroundColor: '#FFF',
        paddingHorizontal: wp(4.2), paddingBottom: hp(1.2),
        borderBottomWidth: 1, borderBottomColor: '#EDF2F7',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 10, elevation: 8,
    },
    stickySearch: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F8FAFC', borderRadius: rf(24),
        paddingHorizontal: wp(4.2), paddingVertical: hp(1.2),
        marginTop: hp(0.8),
        borderWidth: 1, borderColor: '#EDF2F7',
    },
    stickySearchText: { flex: 1, marginLeft: wp(2.1), fontSize: rf(14), color: '#94A3B8', fontWeight: '600' },

    scrollContent: { flexGrow: 1 },

    // ── Search ──────────────────────────────────────────────
    searchBar: {
        marginHorizontal: wp(4.2), marginTop: hp(1.6), marginBottom: hp(1.4),
        height: hp(6), backgroundColor: '#FFF',
        borderRadius: rf(26),
        shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
        borderWidth: 1, borderColor: '#EDF2F7',
    },
    searchInner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: wp(4.8), paddingRight: wp(1.6) },
    searchPlaceholder: { flex: 1, fontSize: rf(14), color: '#94A3B8', fontWeight: '500' },
    searchFilterBtn: {
        width: wp(10.6), height: wp(10.6), borderRadius: wp(5.3), backgroundColor: '#F38000',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#F38000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
    },

    // ── Brand Filter Chips ──────────────────────────────────
    brandChipsScroll: { paddingHorizontal: wp(4.2), paddingBottom: hp(0.5), gap: wp(2.1), marginBottom: hp(1) },
    brandChip: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1.6),
        backgroundColor: '#FFF',
        paddingHorizontal: wp(3.2), paddingVertical: hp(0.8),
        borderRadius: rf(20),
        borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    brandChipAll: {
        backgroundColor: '#F38000', borderColor: '#F38000',
        shadowColor: '#F38000', shadowOpacity: 0.3,
    },
    brandChipImg: { width: wp(5.3), height: wp(5.3), borderRadius: wp(2.6) },
    brandChipText: { fontSize: rf(12), fontWeight: '800', color: '#374151' },

    // ── Hero Banner ─────────────────────────────────────────
    bannerSection: {
        paddingTop: hp(1),
        paddingBottom: hp(0.5),
        marginBottom: hp(1),
    },

    // ── Features Row ────────────────────────────────────────
    featuresRow: { paddingHorizontal: wp(4.2), paddingBottom: hp(1), gap: wp(2.6), marginBottom: hp(0.7) },
    featureItem: { alignItems: 'center', gap: wp(1.6), width: wp(18) },
    featureIcon: { width: wp(12.2), height: wp(12.2), borderRadius: rf(16), justifyContent: 'center', alignItems: 'center' },
    featureLabel: { fontSize: rf(10), fontWeight: '800', color: '#475569', textAlign: 'center', lineHeight: rf(13) },

    // ── Headers ──────────────────────────────────────────────
    section: { marginBottom: hp(3.5) },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: wp(5), marginBottom: hp(2), marginTop: hp(1),
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2) },
    sectionAccent: { width: wp(1.2), height: hp(2.5), backgroundColor: '#F38000', borderRadius: rf(4) },
    sectionTitle: { fontSize: rf(18), fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: wp(0.5) },
    seeAllText: { fontSize: rf(13), fontWeight: '700', color: '#F38000' },
    liveBadge: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1),
        backgroundColor: '#FFF7ED', paddingHorizontal: wp(2.1), paddingVertical: hp(0.4),
        borderRadius: rf(10),
    },
    liveDot: { width: wp(1.6), height: wp(1.6), borderRadius: wp(0.8), backgroundColor: '#F38000' },
    liveText: { fontSize: rf(10), fontWeight: '900', color: '#F38000' },
    newBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: wp(2.1), paddingVertical: hp(0.4), borderRadius: rf(10) },
    newBadgeText: { fontSize: rf(10), fontWeight: '900', color: '#15803D' },

    // ── Category Cards ────────────────────────────────────
    catSlideWrap: {
        width: wp(92), alignItems: 'center', justifyContent: 'center',
    },
    catSlideCard: {
        width: wp(90), height: hp(30), borderRadius: rf(22), overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18, shadowRadius: 16, elevation: 8,
    },
    catSlideGradientBottom: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    catCountPill: {
        position: 'absolute', top: hp(1.5), right: wp(4),
        flexDirection: 'row', alignItems: 'center', gap: wp(1.2),
        backgroundColor: 'rgba(0,0,0,0.35)',
        paddingHorizontal: wp(3), paddingVertical: hp(0.5),
        borderRadius: rf(20),
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    catCountText: {
        fontSize: rf(11), fontWeight: '700', color: '#FFF', letterSpacing: 0.3,
    },
    catSlideContent: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: wp(5), paddingBottom: hp(2.5),
    },
    catTaglinePill: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        gap: wp(1.5),
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: wp(3), paddingVertical: hp(0.5),
        borderRadius: rf(20), marginBottom: hp(0.8),
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    catSlideTagline: {
        fontSize: rf(11), fontWeight: '700', color: '#FFF',
        letterSpacing: 0.3,
    },
    catSlideLabel: {
        fontSize: rf(20), fontWeight: '900', color: '#FFF',
        letterSpacing: -0.6, marginBottom: hp(1.5),
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
    },
    catSlideBtn: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: wp(1.5),
        backgroundColor: '#F38000', paddingHorizontal: wp(5), paddingVertical: hp(1.2),
        borderRadius: rf(30),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
    },
    catSlideBtnText: {
        fontSize: rf(13), fontWeight: '800', color: '#FFF',
    },
    // ── Pill Dots ──
    heroDots: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        gap: wp(1.5), marginTop: hp(1.5),
    },
    heroDot: {
        width: wp(2), height: wp(2), borderRadius: wp(1),
        backgroundColor: 'rgba(0,0,0,0.12)',
    },
    heroDotActive: {
        width: wp(6), borderRadius: wp(1.5),
        backgroundColor: '#F38000',
    },
    offerSlideContainer: {
        width: wp(85), height: hp(24), marginRight: wp(4),
        borderRadius: rf(28), overflow: 'hidden', backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#EF4444', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
    },
    offerSlideImg: { width: '100%', height: '100%' },
    offerSlideOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
        padding: wp(6), justifyContent: 'flex-end',
    },
    offerSlideContent: { gap: hp(0.5) },
    offerSlideBadge: {
        flexDirection: 'row', alignItems: 'center', gap: wp(1.2),
        backgroundColor: '#EF4444', paddingHorizontal: wp(3.5), paddingVertical: hp(0.8),
        borderRadius: rf(12), alignSelf: 'flex-start', marginBottom: hp(0.5),
    },
    offerSlideBadgeText: { color: '#FFF', fontSize: rf(12), fontWeight: '900', letterSpacing: 0.8 },
    offerSlideTitle: {
        color: '#FFF', fontSize: rf(24), fontWeight: '900', marginBottom: hp(0.2), letterSpacing: -0.8,
        textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
    },
    offerSlideSub: {
        color: 'rgba(255,255,255,0.95)', fontSize: rf(13), fontWeight: '600', marginBottom: hp(1.5),
        textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
    },
    offerSlideCTA: {
        flexDirection: 'row', alignItems: 'center', gap: wp(2),
        backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: wp(4.5), paddingVertical: hp(1),
        borderRadius: rf(14), alignSelf: 'flex-start',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    },
    offerSlideCTAText: { color: '#FFF', fontSize: rf(12), fontWeight: '800' },
    offerPagination: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        gap: wp(1.6), marginTop: hp(1.8),
    },
    offerDot: { height: wp(1.5), borderRadius: wp(1) },

    // ── 2-Column Grid ────────────────────────────────────────
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: GRID_PAD,
        gap: CARD_GAP,
    },

    // ── Product Card (2-col, uniform height) ─────────────────
    wishlistFloat: {
        position: 'absolute', top: 10, right: 10,
        width: wp(8.5), height: wp(8.5), borderRadius: wp(4.25),
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
        zIndex: 20,
    },
    wishlistSmallBtn: {
        width: wp(10), height: wp(10), borderRadius: wp(5),
        backgroundColor: '#FFF1F2',
        justifyContent: 'center', alignItems: 'center',
    },
    productCard: {
        width: CARD_WIDTH,
        backgroundColor: '#FFF',
        borderRadius: rf(20),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 5,
    },
    productImgWrap: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F8FAFC',
        position: 'relative',
        overflow: 'hidden',
    },
    productImg: {
        width: '100%',
        height: '100%',
    },
    offerBadge: {
        position: 'absolute', top: 10, left: 10,
        backgroundColor: '#F38000',
        paddingHorizontal: wp(2), paddingVertical: hp(0.4),
        borderRadius: rf(8),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35, shadowRadius: 4, elevation: 3,
    },
    offerText: { color: '#FFF', fontSize: rf(9), fontWeight: '900', letterSpacing: 0.4 },
    newTag: {
        position: 'absolute', top: 10, left: 10,
        flexDirection: 'row', alignItems: 'center', gap: wp(0.8),
        backgroundColor: '#22C55E',
        paddingHorizontal: wp(2), paddingVertical: hp(0.4),
        borderRadius: rf(8),
    },
    newTagText: { color: '#FFF', fontSize: rf(9), fontWeight: '900' },

    // ── Card Info Section (auto height) ──────────────────────
    productInfo: {
        paddingHorizontal: wp(3),
        paddingVertical: hp(1.2),
    },
    productBrand: {
        fontSize: rf(10),
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: hp(0.4),
    },
    productName: {
        fontSize: rf(13),
        fontWeight: '700',
        color: '#1E293B',
        lineHeight: rf(18),
        letterSpacing: -0.2,
        marginBottom: hp(0.6),
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        marginBottom: hp(0.6),
    },
    ratingText: { fontSize: rf(11), fontWeight: '800', color: '#D97706' },

    // ── Price + Add-to-Cart Row ──────────────────────────────
    priceCartRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(0.4),
    },
    priceBlock: {
        flex: 1,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    oldPrice: {
        fontSize: rf(10),
        color: '#94A3B8',
        textDecorationLine: 'line-through',
        fontWeight: '600',
        marginBottom: 1,
    },
    price: {
        fontSize: rf(15),
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.4,
    },
    addCartBtn: {
        width: wp(9),
        height: wp(9),
        borderRadius: wp(4.5),
        backgroundColor: '#F38000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    addCartBtnDone: {
        backgroundColor: '#22C55E',
        shadowColor: '#22C55E',
    },


    // ── Deal Card (2-col) ────────────────────────────────────
    dealCard: {
        width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: rf(20), overflow: 'hidden',
        borderWidth: 1, borderColor: '#EDF2F7',
        shadowColor: '#64748B', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    },
    dealImgWrap: { width: '100%', height: CARD_WIDTH * 0.85, backgroundColor: '#F1F5F9', position: 'relative' },
    dealImg: { width: '100%', height: '100%' },
    dealBadge: {
        position: 'absolute', top: 8, left: 8,
        backgroundColor: '#F38000', paddingHorizontal: wp(1.8), paddingVertical: hp(0.4), borderRadius: rf(8),
    },
    dealBadgeText: { color: '#FFF', fontSize: rf(9), fontWeight: '900' },
    dealInfo: { padding: wp(2.6) },
    dealTitle: { fontSize: rf(13), fontWeight: '800', color: '#1E293B', lineHeight: rf(18), marginBottom: hp(0.5) },
    dealDiscount: { fontSize: rf(12), fontWeight: '900', color: '#16A34A' },

    // ── Promo Banner ─────────────────────────────────────────
    promoBanner: {
        marginHorizontal: wp(4.2), marginBottom: hp(2.8),
        borderRadius: rf(22), overflow: 'hidden',
        backgroundColor: '#0F172A',
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: wp(5.3), paddingVertical: hp(2.6),
    },
    promoLeft: { flex: 1 },
    promoTag: { fontSize: rf(10), fontWeight: '900', color: '#F38000', letterSpacing: 2, marginBottom: hp(0.7) },
    promoTitle: { fontSize: rf(24), fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: hp(0.5) },
    promoSub: { fontSize: rf(12), color: '#94A3B8', fontWeight: '500', lineHeight: rf(18), marginBottom: hp(1.9) },
    promoBtn: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: wp(1.6),
        backgroundColor: '#F38000', paddingHorizontal: wp(4.2), paddingVertical: hp(1.2), borderRadius: rf(14),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
    },
    promoBtnText: { color: '#FFF', fontWeight: '900', fontSize: rf(13) },
    promoRight: { marginLeft: wp(2.6), opacity: 0.6 },

    // ── Be a Seller ──────────────────────────────────────────
    sellerBanner: {
        marginHorizontal: wp(4.2), marginBottom: hp(3.5),
        borderRadius: rf(22), overflow: 'hidden',
        backgroundColor: '#1E293B',
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: wp(5.3), paddingVertical: hp(2.6),
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
    },
    sellerLeft: { flex: 1 },
    sellerTag: { fontSize: rf(10), fontWeight: '900', color: '#F38000', letterSpacing: 2, marginBottom: hp(0.7) },
    sellerTitle: { fontSize: rf(26), fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: hp(0.5) },
    sellerSub: { fontSize: rf(12), color: '#94A3B8', fontWeight: '500', lineHeight: rf(18), marginBottom: hp(1.9) },
    sellerBtn: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: wp(2.1),
    },
    sellerBtnText: { color: '#FFF', fontWeight: '800', fontSize: rf(14) },
    sellerRight: {
        width: wp(21.3), height: wp(21.3), borderRadius: wp(10.6),
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(243,128,0,0.25)',
        marginLeft: wp(2.6),
    },
    loadMoreBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: hp(1.9), marginTop: hp(1.2), gap: wp(2.1),
    },
    loadMoreText: {
        fontSize: rf(14), fontWeight: '700', color: '#94A3B8',
    },
});
