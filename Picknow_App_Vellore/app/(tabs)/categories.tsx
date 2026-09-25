import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { authService, categoryService, productService, comboService, dealService, brandService } from '@/Services/api';
import CustomHeader from '@/components/CustomHeader';
import PremiumLoader from '@/components/PremiumLoader';

const API_URL = 'https://backmern.picknow.in';

const SIDEBAR_WIDTH = wp(23.5);
const PRODUCT_AREA_WIDTH = wp(100) - SIDEBAR_WIDTH;

// Curated accent colors for category tabs so each category feels unique
const CATEGORY_ACCENTS = [
  '#F38000', '#22C55E', '#3B82F6', '#A855F7',
  '#EF4444', '#F59E0B', '#06B6D4', '#EC4899',
  '#10B981', '#6366F1',
];

const getImageUrl = (img: string | any[] | undefined) => {
  if (!img) return require('../../assets/images/Kairaa4.png');
  const imgStr = Array.isArray(img) ? img[0] : img;
  if (!imgStr) return require('../../assets/images/Kairaa4.png');
  if (imgStr.startsWith('http')) return { uri: imgStr };
  if (imgStr.startsWith('/')) return { uri: `${API_URL}${imgStr}` };
  return { uri: `${API_URL}/images/${imgStr}` };
};

export default function MenuScreen() {
  const { user, token } = useAuth();
  const { cart, addToCart, removeFromCart } = useCart();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeSubCategory, setActiveSubCategory] = useState<string>('All');
  const [products, setProducts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistItems, setWishlistItems] = useState(new Set<string>());

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  useScrollToTop(scrollRef);

  const HEADER_CONTENT_HEIGHT = hp(9);
  const HEADER_TOTAL_HEIGHT = HEADER_CONTENT_HEIGHT + insets.top;

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [catsRes, dealRes] = await Promise.all([
        categoryService.getAllCategories().catch(() => ({ CategoryList: [] })),
        dealService.getAllDeals().catch(() => ({ deals: [] })),
      ]);

      if (user && token) {
        authService.getWishlist(token).then((res: any) => {
          const wSet = new Set<string>();
          const list = res.products || res.wishlist || [];
          list.forEach((p: any) => wSet.add(p._id || p.product?._id || p.productId));
          setWishlistItems(wSet);
        }).catch(() => { });
      }

      const catsList = Array.isArray(catsRes)
        ? catsRes
        : (catsRes?.CategoryList || catsRes?.categories || catsRes?.data || []);

      setDeals(Array.isArray(dealRes) ? dealRes : (dealRes?.deals || dealRes?.data || []));

      if (catsList && catsList.length > 0) {
        setCategories(catsList);
        setActiveCategory(catsList[0]);
        setActiveCategoryIndex(0);
        await fetchCategoryProducts(catsList[0].cName || catsList[0].name);
      } else {
        const latestRes = await productService.getLatestProducts().catch(() => ({ products: [] }));
        if (latestRes?.products) setProducts(latestRes.products);
      }
    } catch (error) {
      console.log('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategoryProducts = async (categoryName: string) => {
    try {
      setProductsLoading(true);
      const res = await categoryService.getProductsByCategory(categoryName).catch(() => null);
      if (res?.success && res.data) {
        setProducts(res.data);
      } else if (res?.products) {
        setProducts(res.products);
      } else {
        const latestRes = await productService.getLatestProducts().catch(() => ({ products: [] }));
        if (latestRes?.products) {
          setProducts(latestRes.products.filter((p: any) => p.pCategory === categoryName));
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchInitialData(); };

  const handleCategoryPress = (cat: any, index: number) => {
    setActiveCategory(cat);
    setActiveCategoryIndex(index);
    setActiveSubCategory('All');
    fetchCategoryProducts(cat.cName || cat.name);
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!user || !token) {
      Alert.alert('Login Required', 'Please login to save items to wishlist');
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

  const accentColor = CATEGORY_ACCENTS[activeCategoryIndex % CATEGORY_ACCENTS.length];

  const renderProductItem = ({ item, index }: { item: any; index: number }) => {
    const variantsList = item.variants || [];
    const firstVariant = variantsList.find((v: any) => typeof v === 'object');

    // Aggregate stock from all variants if they exist, otherwise use main pStock
    let effectiveStock = 0;
    if (variantsList.length > 0 && typeof variantsList[0] === 'object') {
      effectiveStock = variantsList.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
    } else {
      effectiveStock = Number(item.pStock || item.pQuantity || 0);
    }
    const isOutOfStock = effectiveStock <= 0;

    const displayPrice = (firstVariant?.price) || item.price || item.pPrice || 0;
    const oldPrice = firstVariant?.previousPrice || item.previousPrice || item.pPreviousPrice;
    const offerPercentage = firstVariant?.offer || item.offer || item.pOffer || 0;

    const productId = item._id || item.productId;
    const isWishlisted = wishlistItems.has(productId);

    const cartItem = cart?.items?.find((cItem: any) => {
      const cProductId = cItem.product?._id || cItem.product || cItem.productId;
      return cProductId === productId;
    });
    const isInCart = !!cartItem;

    const reviews = item.pRatingsReviews || [];
    const avgRating = reviews.length > 0
      ? (reviews.reduce((acc: number, cur: any) => acc + (parseFloat(cur.rating) || 0), 0) / reviews.length).toFixed(1)
      : null;

    const hasDiscount = Number(oldPrice) > Number(displayPrice);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push(`/product/${productId}`)}
      >
        {/* Product Image */}
        <View style={styles.cardImageContainer}>
          <Image
            style={styles.cardImage}
            source={getImageUrl(item.pImage)}
            resizeMode="contain"
          />
          {/* Overlay badges */}
          {offerPercentage > 0 && (
            <View style={[styles.offerBadge, { backgroundColor: accentColor }]}>
              <Text allowFontScaling={false} style={styles.offerText}>{offerPercentage}% OFF</Text>
            </View>
          )}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text allowFontScaling={false} style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {/* Wishlist button on image */}
          <TouchableOpacity
            style={[styles.wishlistBtn, isWishlisted && styles.wishlistBtnActive]}
            onPress={(e) => { e.stopPropagation(); handleToggleWishlist(productId); }}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={rf(15)}
              color={isWishlisted ? '#FF3B30' : '#64748B'}
            />
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.cardContent}>
          {/* Brand + Rating row */}
          <View style={styles.cardTopRow}>
            {item.pBrand ? (
              <Text allowFontScaling={false} style={[styles.cardBrand, { color: accentColor }]} numberOfLines={1}>
                {item.pBrand}
              </Text>
            ) : <View />}
            {avgRating ? (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={rf(11)} color="#F59E0B" />
                <Text allowFontScaling={false} style={styles.ratingValue}>{avgRating}</Text>
              </View>
            ) : (
              <View style={styles.newPill}>
                <Text allowFontScaling={false} style={styles.newText}>NEW</Text>
              </View>
            )}
          </View>

          {/* Name */}
          <Text allowFontScaling={false} style={styles.cardTitle} numberOfLines={2}>{item.pName}</Text>

          {/* Variant & Stock Info */}
          <View style={styles.variantStockRow}>
            {(() => {
              const v = firstVariant;
              const vLabel = v?.attributes?.weight || v?.attributes?.size || v?.attributes?.color || v?.weight || v?.size || v?.name || item.pWeight || item.pSize || item.pColor;
              if (!vLabel) return null;
              return (
                <View style={styles.variantBadge}>
                  <Text allowFontScaling={false} style={styles.variantText}>{String(vLabel)}</Text>
                </View>
              );
            })()}

            <View style={styles.stockRow}>
              <View style={[styles.stockDot, { backgroundColor: isOutOfStock ? '#EF4444' : '#22C55E' }]} />
              <Text allowFontScaling={false} style={[styles.stockStatusText, isOutOfStock && { color: '#EF4444' }]}>
                {isOutOfStock ? 'Out of Stock' : `${effectiveStock} in Stock`}
              </Text>
            </View>
          </View>

          {/* Price + Add button */}
          <View style={styles.priceRow}>
            <View>
              {hasDiscount && (
                <Text allowFontScaling={false} style={styles.strikePrice}>₹{oldPrice}</Text>
              )}
              <Text allowFontScaling={false} style={styles.activePrice}>₹{displayPrice}</Text>
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: isOutOfStock ? '#E2E8F0' : (isInCart ? '#10B981' : accentColor) }]}
              onPress={async (e) => {
                e.stopPropagation();
                if (isOutOfStock) return;
                if (isInCart) {
                  const vId = cartItem.variantId || cartItem.variant?._id || null;
                  await removeFromCart(vId, productId);
                } else {
                  const variantId = firstVariant ? (firstVariant._id || firstVariant.id) : null;
                  const vType = firstVariant ? (firstVariant.attributes ? Object.keys(firstVariant.attributes).find((k: string) => firstVariant.attributes[k]) : firstVariant.type) : null;
                  const vVal = firstVariant && vType ? (firstVariant.attributes ? firstVariant.attributes[vType] : firstVariant.size) : (item.pSize || item.pWeight || item.pColor);

                  const success = await addToCart({
                    productId,
                    variantId,
                    quantity: 1,
                    variantType: vType || (item.pSize ? 'size' : (item.pWeight ? 'weight' : (item.pColor ? 'color' : 'product'))),
                    variantValue: vVal,
                    price: displayPrice
                  });
                  if (success) {
                    Alert.alert('Added', 'Item added to cart successfully!');
                  }
                }
              }}
              disabled={isOutOfStock}
            >
              <Ionicons
                name={isOutOfStock ? 'close' : (isInCart ? 'checkmark' : 'cart-outline')}
                size={rf(14)}
                color={isOutOfStock ? '#94A3B8' : '#FFF'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const displayedProducts = products.filter(p =>
    activeSubCategory === 'All' ? true : p.pSubCategory === activeSubCategory
  );

  const renderListHeader = () => (
    <View>
      {/* Category Banner */}
      <View style={[styles.categoryBannerRow, { borderLeftColor: accentColor }]}>
        <View>
          <Text allowFontScaling={false} style={styles.categoryBannerLabel}>
            {activeCategory?.cName || activeCategory?.name || 'All Products'}
          </Text>
          <Text allowFontScaling={false} style={styles.categoryBannerCount}>
            {displayedProducts.length} {displayedProducts.length === 1 ? 'product' : 'products'}
          </Text>
        </View>
        {activeCategory?.cImage || activeCategory?.image ? (
          <Image
            source={getImageUrl(activeCategory?.cImage || activeCategory?.image)}
            style={[styles.categoryBannerImg, { borderColor: accentColor + '33' }]}
            resizeMode="cover"
          />
        ) : null}
      </View>

      {/* Today's Deals Strip */}
      {deals && deals.length > 0 && (
        <View style={styles.dealsSection}>
          <View style={styles.dealsTitleRow}>
            <View style={[styles.dealsTitleAccent, { backgroundColor: accentColor }]} />
            <Text allowFontScaling={false} style={styles.dealsTitle}>Today's Deals</Text>
            <View style={[styles.dealsDotBadge, { backgroundColor: accentColor }]}>
              <Text allowFontScaling={false} style={styles.dealsDotText}>{deals.length}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsScroll}>
            {deals.map((d: any, idx: number) => (
              <TouchableOpacity key={d._id || idx} style={styles.dealCard} activeOpacity={0.9}>
                <Image source={getImageUrl(d.image)} style={styles.dealImage} resizeMode="cover" />
                <View style={styles.dealInfo}>
                  <Text allowFontScaling={false} style={styles.dealText} numberOfLines={1}>{d.title}</Text>
                  {d.discount && (
                    <View style={[styles.dealBadge, { backgroundColor: accentColor }]}>
                      <Text allowFontScaling={false} style={styles.dealBadgeText}>{d.discount}% OFF</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Subcategory filter */}
      {activeCategory?.subCategories && activeCategory.subCategories.length > 0 && (
        <View style={styles.subCatSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCatScroll}>
            <TouchableOpacity
              style={[styles.subCatChip, activeSubCategory === 'All' && { backgroundColor: accentColor, borderColor: accentColor }]}
              onPress={() => setActiveSubCategory('All')}
            >
              <Ionicons name="apps" size={rf(13)} color={activeSubCategory === 'All' ? '#FFF' : '#64748B'} />
              <Text allowFontScaling={false} style={[styles.subCatChipText, activeSubCategory === 'All' && styles.subCatChipTextActive]}>All</Text>
            </TouchableOpacity>
            {activeCategory.subCategories.map((sub: any, idx: number) => {
              const isActive = activeSubCategory === sub.name;
              return (
                <TouchableOpacity
                  key={sub._id || idx}
                  style={[styles.subCatChip, isActive && { backgroundColor: accentColor, borderColor: accentColor }]}
                  onPress={() => setActiveSubCategory(sub.name)}
                >
                  {sub.image && (
                    <Image source={getImageUrl(sub.image)} style={styles.subCatChipImg} />
                  )}
                  <Text allowFontScaling={false} style={[styles.subCatChipText, isActive && styles.subCatChipTextActive]} numberOfLines={1}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Products title */}
      <View style={styles.productsTitleRow}>
        <View style={[styles.productsTitleAccent, { backgroundColor: accentColor }]} />
        <Text allowFontScaling={false} style={styles.productsTitle}>Products</Text>
      </View>
    </View>
  );

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_CONTENT_HEIGHT],
    outputRange: [0, -HEADER_TOTAL_HEIGHT],
    extrapolate: 'clamp',
  });

  const contentTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_CONTENT_HEIGHT],
    outputRange: [0, -HEADER_CONTENT_HEIGHT],
    extrapolate: 'clamp',
  });

  const windowHeight = Dimensions.get('window').height;

  return (
    <View style={styles.safeArea}>
      {/* Sticky Header */}
      <Animated.View style={[styles.headerWrapper, { height: HEADER_TOTAL_HEIGHT, transform: [{ translateY: headerTranslateY }] }]}>
        <CustomHeader showGreeting />
      </Animated.View>

      <Animated.View style={[
        styles.mainWrapper,
        {
          paddingTop: HEADER_TOTAL_HEIGHT,
          height: windowHeight + HEADER_CONTENT_HEIGHT,
          transform: [{ translateY: contentTranslateY }],
        }
      ]}>
        {/* LEFT SIDEBAR */}
        <View style={styles.sidebar}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: hp(15), paddingTop: hp(1.5) }}
          >
            {categories.map((cat, idx) => {
              const catName = cat.cName || cat.name;
              const isActive = activeCategory && (activeCategory.cName || activeCategory.name) === catName;
              const catAccent = CATEGORY_ACCENTS[idx % CATEGORY_ACCENTS.length];
              return (
                <TouchableOpacity
                  key={cat._id || idx}
                  style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                  onPress={() => handleCategoryPress(cat, idx)}
                  activeOpacity={0.75}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <View style={[styles.sidebarBar, { backgroundColor: catAccent }]} />
                  )}

                  {/* Image circle */}
                  <View style={[
                    styles.sidebarImageWrap,
                    isActive && { borderColor: catAccent, borderWidth: 2, backgroundColor: catAccent + '12' }
                  ]}>
                    <Image
                      source={getImageUrl(cat.cImage || cat.image)}
                      style={styles.sidebarImage}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Name */}
                  <Text
                    allowFontScaling={false}
                    style={[styles.sidebarText, isActive && { color: catAccent, fontWeight: '900' }]}
                    numberOfLines={2}
                  >
                    {catName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* RIGHT PRODUCT AREA */}
        <View style={styles.productArea}>
          {(isLoading || productsLoading) ? (
            <View style={{ flex: 6, backgroundColor: '#F8FAFC' }}>
              <PremiumLoader />
            </View>
          ) : (
            <Animated.FlatList
              ref={scrollRef}
              data={displayedProducts}
              keyExtractor={(item) => (item._id || item.productId || Math.random()).toString()}
              renderItem={renderProductItem}
              ListHeaderComponent={renderListHeader}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
              contentContainerStyle={styles.listPadding}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              ListEmptyComponent={() => (
                <View style={styles.emptyWrap}>
                  <View style={[styles.emptyIconBg, { backgroundColor: accentColor + '15' }]}>
                    <Ionicons name="cube-outline" size={rf(40)} color={accentColor} />
                  </View>
                  <Text allowFontScaling={false} style={styles.emptyTitle}>No Products Found</Text>
                  <Text allowFontScaling={false} style={styles.emptySubtext}>
                    No products in this {activeSubCategory !== 'All' ? 'subcategory' : 'category'} yet.
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',

  },
  headerWrapper: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    backgroundColor: '#FFF',
  },
  mainWrapper: {
    flexDirection: 'row',
    width: wp(100),
  },

  // ── SIDEBAR ──────────────────────────────────────────────────
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#EDF2F7',
    paddingVertical: hp(1.6),
  },
  sidebarItem: {
    alignItems: 'center',
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(1.6),
    marginBottom: hp(0.2),
    position: 'relative',
  },
  sidebarItemActive: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: rf(20),
    borderBottomLeftRadius: rf(20),
    marginLeft: wp(1.6),
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#EDF2F7',
  },
  sidebarBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    height: '60%',
    width: wp(0.8),
    borderTopRightRadius: rf(3),
    borderBottomRightRadius: rf(3),
  },
  sidebarImageWrap: {
    width: wp(14.4),
    height: wp(14.4),
    borderRadius: rf(18),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(0.8),
    borderWidth: 1.5,
    borderColor: '#EDF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  sidebarImage: {
    width: '100%',
    height: '100%',
  },
  sidebarText: {
    fontSize: rf(10),
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: rf(13),
    letterSpacing: 0.2,
  },

  // ── PRODUCT AREA ─────────────────────────────────────────────
  productArea: {
    flex: 3,
    backgroundColor: '#F8FAFC',
    paddingVertical: hp(1.6),
  },
  listPadding: {
    paddingHorizontal: wp(3.2),
    paddingTop: 0,
    paddingBottom: hp(8),

  },

  // ── CATEGORY BANNER ──────────────────────────────────────────
  categoryBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginBottom: hp(1.6),
    marginTop: hp(1.4),
    borderRadius: rf(18),
    padding: wp(3.7),
    borderLeftWidth: wp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,

  },
  categoryBannerLabel: {
    fontSize: rf(18),
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
    marginBottom: hp(0.4),
  },
  categoryBannerCount: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryBannerImg: {
    width: wp(15.4),
    height: wp(15.4),
    borderRadius: rf(16),
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
  },

  // ── DEALS ─────────────────────────────────────────────────────
  dealsSection: {
    marginBottom: hp(1.5),
  },
  dealsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(1.2),
  },
  dealsTitleAccent: { width: wp(1), height: hp(2), borderRadius: rf(2) },
  dealsTitle: { fontSize: rf(14), fontWeight: '900', color: '#1E293B', flex: 1 },
  dealsDotBadge: {
    paddingHorizontal: wp(2.1),
    paddingVertical: hp(0.2),
    borderRadius: rf(10),
  },
  dealsDotText: { fontSize: rf(10), fontWeight: '900', color: '#FFF' },
  dealsScroll: { gap: wp(2.6), paddingRight: wp(1) },
  dealCard: {
    width: wp(34.6),
    backgroundColor: '#FFF',
    borderRadius: rf(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F4F8',
  },
  dealImage: {
    width: '100%',
    height: hp(9.5),
    backgroundColor: '#F8FAFC',
  },
  dealInfo: {
    padding: wp(2),
  },
  dealText: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: hp(0.5),
  },
  dealBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: wp(1.6),
    paddingVertical: hp(0.2),
    borderRadius: rf(6),
  },
  dealBadgeText: { fontSize: rf(9), fontWeight: '900', color: '#FFF' },

  // ── SUBCATEGORY CHIPS ─────────────────────────────────────────
  subCatSection: {
    marginBottom: hp(1.5),
  },
  subCatScroll: {
    gap: wp(2),
    paddingRight: wp(1),
  },
  subCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.3),
    paddingHorizontal: wp(3.2),
    paddingVertical: hp(0.8),
    borderRadius: rf(20),
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  subCatChipImg: {
    width: wp(5.3),
    height: wp(5.3),
    borderRadius: wp(2.6),
    backgroundColor: '#F8FAFC',
  },
  subCatChipText: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#64748B',
    maxWidth: wp(21.3),
  },
  subCatChipTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },

  // ── PRODUCTS TITLE ────────────────────────────────────────────
  productsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(1.2),
  },
  productsTitleAccent: { width: wp(0.8), height: hp(2), borderRadius: rf(2) },
  productsTitle: { fontSize: rf(14), fontWeight: '900', color: '#1E293B' },

  // ── PRODUCT CARD ──────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: rf(24),
    padding: wp(2.6),
    marginBottom: hp(1.6),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardImageContainer: {
    position: 'relative',
    borderRadius: rf(14),
    overflow: 'hidden',
    width: wp(29.8),
    height: hp(15.4),
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC', // Softest background for image containment
  },
  offerBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    paddingHorizontal: wp(1.8),
    paddingVertical: hp(0.4),
    borderRadius: rf(8),
    zIndex: 2,
  },
  offerText: {
    color: '#FFF',
    fontSize: rf(9),
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  outOfStockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: hp(0.6),
    alignItems: 'center',
    zIndex: 2,
  },
  outOfStockText: {
    color: '#FFF',
    fontSize: rf(10),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: wp(7.4),
    height: wp(7.4),
    borderRadius: rf(10),
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  wishlistBtnActive: {
    backgroundColor: '#FEF2F2',
  },
  cardContent: {
    flex: 1,
    marginLeft: wp(3.2),
    justifyContent: 'space-between',
    paddingVertical: hp(0.2),
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  cardBrand: {
    fontSize: rf(10),
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.8),
    backgroundColor: '#FFFBEB',
    paddingHorizontal: wp(1.8),
    paddingVertical: hp(0.4),
    borderRadius: rf(8),
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  ratingValue: {
    fontSize: rf(11),
    fontWeight: '800',
    color: '#D97706',
  },
  newPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: wp(1.8),
    paddingVertical: hp(0.4),
    borderRadius: rf(8),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  newText: {
    fontSize: rf(9),
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: rf(13),
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: rf(18),
    marginBottom: hp(0.4),
    letterSpacing: -0.2,
  },
  variantStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(0.8),
    flexWrap: 'wrap',
  },
  variantBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: rf(4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  variantText: {
    fontSize: rf(10),
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  stockDot: {
    width: rf(6),
    height: rf(6),
    borderRadius: rf(3),
  },
  stockStatusText: {
    fontSize: rf(10),
    fontWeight: '700',
    color: '#22C55E',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  strikePrice: {
    fontSize: rf(11),
    color: '#CBD5E1',
    textDecorationLine: 'line-through',
    fontWeight: '600',
    marginBottom: hp(0.1),
  },
  activePrice: {
    fontSize: rf(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3.2),
    paddingVertical: hp(1),
    borderRadius: rf(12),
    gap: wp(1),
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: rf(12),
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // ── EMPTY STATE ───────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    marginTop: hp(7),
    paddingHorizontal: wp(5.3),
  },
  emptyIconBg: {
    width: wp(24),
    height: wp(24),
    borderRadius: rf(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2.1),
  },
  emptyTitle: {
    fontSize: rf(18),
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: hp(1),
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: rf(13),
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: rf(20),
  },
});
