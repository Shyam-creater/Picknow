import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
    TextInput,
    Share
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { productService, productVariantService, authService, searchService, BASE_URL } from '@/Services/api';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PremiumLoader from '@/components/PremiumLoader';

const { width } = Dimensions.get('window');
const API_URL = 'https://backmern.picknow.in';

const getImageUrl = (img: string) => {
    if (!img) return require('../../assets/images/Kairaa4.png');
    if (img.startsWith('http')) return { uri: img };
    if (img.startsWith('/')) return { uri: `${API_URL}${img}` };
    return { uri: `${API_URL}/images/${img}` };
};

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { token } = useAuth();
    const { addToCart, cart } = useCart();
    const insets = useSafeAreaInsets();

    const [product, setProduct] = useState<any>(null);
    const [variants, setVariants] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isInCart, setIsInCart] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [matchedColors, setMatchedColors] = useState<any[]>([]);
    const [currentProductId, setCurrentProductId] = useState<string>(id as string);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    // Expansion State
    const [isDescExpanded, setIsDescExpanded] = useState(false);
    const [isShippingExpanded, setIsShippingExpanded] = useState(false);

    // Review State
    const [reviews, setReviews] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState<number>(0);
    const [totalRatings, setTotalRatings] = useState<number>(0);
    const [newReviewRating, setNewReviewRating] = useState(5);
    const [newReviewText, setNewReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [canUserReview, setCanUserReview] = useState(false);

    // Wishlist state
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // Sync state if routing changes
    useEffect(() => {
        if (id) setCurrentProductId(id as string);
    }, [id]);

    useEffect(() => {
        fetchProductDetails();
    }, [currentProductId]);

    // Check if product is already in cart whenever cart or product changes
    useEffect(() => {
        if (product && cart && cart.items && cart.items.length > 0) {
            const found = cart.items.some((item: any) => {
                const pid = item.product?._id || item.productId;
                return pid === product._id;
            });
            setIsInCart(found);
        } else {
            setIsInCart(false);
        }
    }, [cart, product]);

    // Fetch wishlist status on load
    useEffect(() => {
        if (token && product) {
            fetchWishlistStatus();
            checkReviewEligibility();
        }
    }, [token, product]);

    const checkReviewEligibility = async () => {
        try {
            const res = await productService.checkReviewEligibility(product._id, token!);
            setCanUserReview(res.canreview);
        } catch (e) {
            setCanUserReview(false);
        }
    };

    const fetchWishlistStatus = async () => {
        try {
            const data = await authService.getWishlist(token!);
            const products = data.products || [];
            const found = products.some((p: any) => p._id === product._id);
            setIsWishlisted(found);
        } catch (e) {
            // silently fail
        }
    };

    const fetchProductDetails = async () => {
        try {
            setIsLoading(true);
            const [productRes, variantsRes, reviewsRes] = await Promise.all([
                productService.getProductById(currentProductId),
                productVariantService.getVariantsByProductId(currentProductId).catch(() => ({ success: true, variants: [] })),
                productService.getReviews(currentProductId).catch(() => ({ success: true, reviews: [], avgRating: 0, totalRatings: 0 }))
            ]);

            if (productRes.product) {
                setProduct(productRes.product);
                fetchSuggestions(productRes.product);
            }

            if (reviewsRes.success) {
                setReviews(reviewsRes.reviews || []);
                setAvgRating(Number(reviewsRes.averageRating) || 0);
                setTotalRatings(reviewsRes.totalReviews || 0);
            }

            const variantsData = Array.isArray(variantsRes) ? variantsRes : (variantsRes.variants || variantsRes.data || []);
            setVariants(variantsData);

            if (variantsRes && variantsRes.groupedProducts && variantsRes.groupedProducts.length > 0 && variantsRes.groupedProducts[0].color) {
                const validColors = variantsRes.groupedProducts[0].color.filter((c: any) => c.color && c.color.trim() !== '');
                setMatchedColors(validColors);
            } else if (variantsRes && variantsRes.color) {
                const validColors = variantsRes.color.filter((c: any) => c.color && c.color.trim() !== '');
                setMatchedColors(validColors);
            }

            if (variantsData.length > 0) {
                setSelectedVariant(variantsData[0]);
            }
        } catch (error) {
            console.log('Error fetching product details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSuggestions = async (prod: any) => {
        try {
            setSuggestionsLoading(true);
            const res = await productService.getRelatedProducts(prod._id);

            if (res.success && res.relatedProducts) {
                // map keys from related products API safely
                const filtered = res.relatedProducts
                    .filter((s: any) => s._id !== prod._id)
                    .map((s: any) => ({
                        _id: s._id,
                        pName: s.pName,
                        pBrand: s.pBrand || 'Picknow',
                        pPrice: Number(s.pPrice) || 0,
                        pPreviousPrice: Number(s.pPreviousPrice) || Number(s.pPrice) || 0,
                        pOffer: Number(s.pOffer) || 0,
                        pImage: Array.isArray(s.pImage) ? s.pImage : [s.pImage]
                    }));
                setSuggestions(filtered);
            }
        } catch (error) {
            console.log('Error fetching suggestions:', error);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!token) {
            Alert.alert("Login Required", "Please login to write a review and share your feedback.");
            router.push('/(auth)/login');
            return;
        }
        if (!newReviewText.trim()) {
            Alert.alert("Oops!", "Please write a review before submitting.");
            return;
        }
        try {
            setIsSubmittingReview(true);
            const res = await productService.addReview(currentProductId, token, { rating: newReviewRating, review: newReviewText });
            if (res.success) {
                Alert.alert("Review Submitted", "Thank you for your feedback!");
                setNewReviewText('');
                // Refresh reviews
                const reviewsRes = await productService.getReviews(currentProductId);
                if (reviewsRes.success) {
                    setReviews(reviewsRes.reviews || []);
                    setAvgRating(Number(reviewsRes.averageRating) || 0);
                    setTotalRatings(reviewsRes.totalReviews || 0);
                }
            }
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to submit review.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleToggleWishlist = async () => {
        if (!token) {
            Alert.alert('Login Required', 'Please login to save your favorite items to your wishlist!');
            router.push('/(auth)/login');
            return;
        }
        setWishlistLoading(true);
        try {
            if (isWishlisted) {
                await authService.removeFromWishlist({ productId: product._id }, token);
                setIsWishlisted(false);
                Alert.alert('Removed', 'Item removed from wishlist');
            } else {
                await authService.addToWishlist(product._id, token);
                setIsWishlisted(true);
                Alert.alert('❤️ Saved!', 'Item added to your wishlist');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not update wishlist');
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            const message = `Check out this product on Picknow: ${product.pName} \n\nView details: https://picknow.in/product/${product._id}`;
            await Share.share({
                message,
                title: product.pName,
            });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleAddToCart = async () => {
        if (!token) {
            Alert.alert('Login Required', 'Please login to add items to your cart and enjoy the full shopping experience!');
            router.push('/(auth)/login');
            return;
        }

        // If already in cart → go to cart directly
        if (isInCart) {
            router.push('/(tabs)/cart');
            return;
        }

        try {
            setIsAdding(true);

            const priceToUse = selectedVariant ? selectedVariant.price : (variants[0]?.price || product.pPrice || 0);
            const variantTypeToUse = selectedVariant ?
                (selectedVariant.attributes ? Object.keys(selectedVariant.attributes).find((k: string) => selectedVariant.attributes[k]) : selectedVariant.type) : null;
            const variantValueToUse = selectedVariant && variantTypeToUse ?
                (selectedVariant.attributes ? selectedVariant.attributes[variantTypeToUse] : selectedVariant.size) : null;

            await addToCart({
                productId: product._id,
                quantity,
                variantId: selectedVariant ? selectedVariant._id : undefined,
                variantType: variantTypeToUse,
                variantValue: variantValueToUse,
                price: priceToUse,
            });

            setIsInCart(true);
            Alert.alert('✅ Added to Cart!', 'Item has been added to your cart successfully.');
        } catch (error: any) {
            alert(error.message || 'Failed to add to cart');
        } finally {
            setIsAdding(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <PremiumLoader />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.loadingContainer}>
                <Text allowFontScaling={false} style={styles.errorText}>Product not found.</Text>
                <TouchableOpacity style={styles.backBtnWrapper} onPress={() => router.back()}>
                    <Text allowFontScaling={false} style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Derive current display price and stock based on variant
    const currentPrice = (selectedVariant && selectedVariant.price) ? selectedVariant.price : (variants[0]?.price || product.price || product.pPrice || 0);
    const currentPrevPrice = (selectedVariant && selectedVariant.previousPrice) ? selectedVariant.previousPrice : (variants[0]?.previousPrice || product.pPreviousPrice);
    const currentOffer = selectedVariant && selectedVariant.offer > 0 ? selectedVariant.offer : (product.pOffer || 0);
    const currentStock = selectedVariant ? selectedVariant.stock : (variants.length > 0 && variants[0].stock !== undefined ? variants[0].stock : (product.pStock !== undefined ? product.pStock : 10));
    const isOutOfStock = currentStock <= 0;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={rf(24)} color="#111" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text allowFontScaling={false} style={styles.headerBrand} numberOfLines={1}>{product.pBrand || 'PICKNOW'}</Text>
                    <Text allowFontScaling={false} style={styles.headerTitle} numberOfLines={1}>{product.pName}</Text>
                </View>

                {/* Right side: Wishlist + Cart icons */}
                <View style={styles.headerRight}>
                    {/* Wishlist Heart Button */}
                    <TouchableOpacity
                        style={[styles.iconButton, { marginRight: wp(2) }]}
                        onPress={handleToggleWishlist}
                        disabled={wishlistLoading}
                    >
                        {wishlistLoading ? (
                            <ActivityIndicator size="small" color="#FF3B30" />
                        ) : (
                            <MaterialCommunityIcons
                                name={isWishlisted ? 'heart' : 'heart-outline'}
                                size={rf(22)}
                                color={isWishlisted ? '#FF3B30' : '#000'}
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.iconButton, { marginRight: wp(2) }]} onPress={handleShare}>
                        <Ionicons name="share-outline" size={rf(22)} color="#000" />
                    </TouchableOpacity>

                    {/* Cart Button */}
                    <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/cart')}>
                        <MaterialCommunityIcons name="cart-outline" size={rf(24)} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Product Images Gallery */}
                <View style={styles.imageGallery}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const slideSize = e.nativeEvent.layoutMeasurement.width;
                            const index = e.nativeEvent.contentOffset.x / slideSize;
                            setActiveImageIndex(Math.round(index));
                        }}
                        scrollEventThrottle={16}
                    >
                        {(product.pImage && product.pImage.length > 0 ? product.pImage : ['']).map((img: string, index: number) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={getImageUrl(img)} style={styles.productImage} resizeMode="contain" />
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.pagination}>
                        {(product.pImage && product.pImage.length > 0 ? product.pImage : ['']).map((_: any, index: number) => (
                            <View key={index} style={[styles.dot, activeImageIndex === index && styles.activeDot]} />
                        ))}
                    </View>

                    {/* Quick Badges */}
                    <View style={styles.quickBadges}>
                        {currentOffer && currentOffer > 0 ? (
                            <View style={styles.offerBadge}>
                                <Text allowFontScaling={false} style={styles.offerText}>{currentOffer}% OFF</Text>
                            </View>
                        ) : null}
                        {isOutOfStock && (
                            <View style={styles.outOfStockBadge}>
                                <Text allowFontScaling={false} style={styles.outOfStockText}>Out of Stock</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Product Info */}
                <View style={styles.infoSection}>
                    <View style={styles.brandRow}>
                        <View style={styles.brandBadge}>
                            <Text allowFontScaling={false} style={styles.brandText}>{product.pBrand || 'PREMIUM'}</Text>
                        </View>
                        <View style={styles.ratingBox}>
                            <Ionicons name="star" size={rf(12)} color="#F38000" />
                            <Text allowFontScaling={false} style={styles.ratingText}>{avgRating > 0 ? avgRating : "New"}</Text>
                        </View>
                    </View>

                    <Text allowFontScaling={false} style={styles.productTitle}>{product.pName}</Text>

                    <View style={styles.pricingRow}>
                        <Text allowFontScaling={false} style={styles.currentPrice}>₹{currentPrice}</Text>
                        {currentPrevPrice ? (
                            <Text allowFontScaling={false} style={styles.oldPrice}>₹{currentPrevPrice}</Text>
                        ) : null}
                        <Text allowFontScaling={false} style={styles.taxInfo}>Inclusive of all taxes</Text>
                    </View>

                    {/* Variants Selector */}
                    {!!(matchedColors.length > 0) && (
                        <View style={styles.variantsSection}>
                            <Text allowFontScaling={false} style={styles.sectionTitle}>Available Colors</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: wp(3.2) }}>
                                {matchedColors.map((c: any, index: number) => {
                                    const isActiveColor = c.productId === currentProductId;
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.colorCircle,
                                                { backgroundColor: c.hex || c.color },
                                                isActiveColor && styles.activeColorCircle
                                            ]}
                                            onPress={() => {
                                                if (!isActiveColor) {
                                                    setCurrentProductId(c.productId);
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {!!(variants.length > 0) && (
                        <View style={styles.variantsSection}>
                            <Text allowFontScaling={false} style={styles.sectionTitle}>Available Variants</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: wp(5) }}
                                style={styles.variantList}
                            >
                                {variants.map((v) => {
                                    const isSelected = selectedVariant?._id === v._id;
                                    const attrArray = [];

                                    const vSize = v.attributes?.size || (v.type === 'size' ? v.size : null);
                                    const vWeight = v.attributes?.weight || (v.type === 'weight' ? v.size : null);
                                    const vColor = v.attributes?.color || v.color;
                                    const vShoe = v.attributes?.shoe;
                                    const vBelt = v.attributes?.belt;

                                    if (vSize && !vWeight) attrArray.push(vSize);
                                    if (vWeight) attrArray.push(vWeight);
                                    if (vColor) attrArray.push(vColor);
                                    if (vShoe) attrArray.push(`Shoe: ${vShoe}`);
                                    if (vBelt) attrArray.push(`Belt: ${vBelt}`);

                                    if (attrArray.length === 0 && v.size) {
                                        attrArray.push(v.size);
                                    }

                                    const attrs = attrArray.length > 0 ? attrArray.join(', ') : 'Standard';
                                    const stockStatus = v.stock <= 0 ? ' (Out of stock)' : '';
                                    const variantValue = `${attrs} - ₹${v.price || 0}${stockStatus}`;

                                    return (
                                        <TouchableOpacity
                                            key={v._id}
                                            style={[styles.variantBox, isSelected && styles.selectedVariantBox]}
                                            onPress={() => {
                                                setSelectedVariant(v);
                                                setQuantity(1);
                                            }}
                                        >
                                            <Text allowFontScaling={false} style={[styles.variantText, isSelected && styles.selectedVariantText]}>
                                                {variantValue}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* Quantity Selector */}
                    {!isOutOfStock && (
                        <View style={styles.quantitySection}>
                            <Text allowFontScaling={false} style={styles.sectionTitle}>Quantity</Text>
                            <View style={styles.quantityControls}>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Ionicons name="remove" size={rf(20)} color="#000" />
                                </TouchableOpacity>
                                <Text allowFontScaling={false} style={styles.qtyValue}>{quantity}</Text>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => setQuantity(Math.min(currentStock, quantity + 1))}
                                >
                                    <Ionicons name="add" size={rf(20)} color="#000" />
                                </TouchableOpacity>
                                <Text allowFontScaling={false} style={styles.stockText}>({currentStock} available)</Text>
                            </View>
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.descSection}>
                        <Text allowFontScaling={false} style={styles.sectionTitle}>Description</Text>
                        <Text allowFontScaling={false} style={styles.descText} numberOfLines={isDescExpanded ? undefined : 3}>
                            {product.pDescription}
                        </Text>
                        {!!(product.pDescription && product.pDescription.length > 100) && (
                            <TouchableOpacity onPress={() => setIsDescExpanded(!isDescExpanded)} style={{ marginTop: hp(1) }}>
                                <Text allowFontScaling={false} style={styles.readMoreText}>{isDescExpanded ? 'Read Less' : 'Read More'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Shipping & Delivery Information */}
                    <View style={styles.descSection}>
                        <Text allowFontScaling={false} style={styles.sectionTitle}>Shipping & Delivery Information</Text>
                        <View style={{ overflow: 'hidden', height: isShippingExpanded ? undefined : hp(9.5) }}>
                            <Text allowFontScaling={false} style={styles.descText}>We strive to get your order to you as quickly and safely as possible!</Text>
                            <Text allowFontScaling={false} style={[styles.descText, { fontWeight: 'bold', marginTop: hp(1.2) }]}>Fast & Reliable Shipping</Text>
                            <Text allowFontScaling={false} style={styles.descText}>Partnering with trusted carriers to ensure timely delivery</Text>
                            <Text allowFontScaling={false} style={[styles.descText, { fontWeight: 'bold', marginTop: hp(1.2) }]}>Order Processing</Text>
                            <Text allowFontScaling={false} style={styles.descText}>Processed within 1-3 business days (excl. weekends/holidays)</Text>
                            <Text allowFontScaling={false} style={[styles.descText, { fontWeight: 'bold', marginTop: hp(1.2) }]}>Free Shipping*</Text>
                            <Text allowFontScaling={false} style={styles.descText}>On all orders over ₹500</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsShippingExpanded(!isShippingExpanded)} style={{ marginTop: hp(1) }}>
                            <Text allowFontScaling={false} style={styles.readMoreText}>{isShippingExpanded ? 'Read Less' : 'Read More'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Customer Reviews Section */}
                    <View style={styles.descSection}>
                        <View style={styles.reviewHeaderRow}>
                            <Text allowFontScaling={false} style={styles.sectionTitle}>Customer Reviews ({totalRatings})</Text>
                            {canUserReview && (
                                <TouchableOpacity
                                    style={styles.writeReviewButtonBtn}
                                    onPress={() => router.push(`/product/review/${product._id}`)}
                                >
                                    <Ionicons name="pencil" size={rf(16)} color="#FFF" />
                                    <Text allowFontScaling={false} style={styles.writeReviewButtonTxt}>Write Review</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* List Reviews */}
                        {reviews && reviews.length > 0 ? (
                            reviews.map((r, idx) => (
                                <View key={idx} style={styles.userReviewCard}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(0.7) }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={styles.reviewAvatar}>
                                                <Text allowFontScaling={false} style={styles.reviewAvatarText}>{(r.user?.name || 'A')?.charAt(0).toUpperCase()}</Text>
                                            </View>
                                            <Text allowFontScaling={false} style={styles.reviewAuthor}>{r.user?.name || 'Anonymous'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="star" size={rf(14)} color="#F38000" />
                                            <Text allowFontScaling={false} style={{ fontSize: rf(13), fontWeight: '700', marginLeft: wp(1), color: '#333' }}>{r.rating}</Text>
                                        </View>
                                    </View>
                                    <Text allowFontScaling={false} style={styles.reviewComment}>{r.review}</Text>

                                    {!!(r.image && r.image.length > 0) && (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewMediaScroll}>
                                            {r.image.map((imgUri: string, i: number) => (
                                                <Image key={i} source={{ uri: imgUri }} style={styles.reviewMediaImage} />
                                            ))}
                                        </ScrollView>
                                    )}

                                    <Text allowFontScaling={false} style={styles.reviewDate}>{new Date(r.createdAt || Date.now()).toLocaleDateString()}</Text>
                                </View>
                            ))
                        ) : (
                            <Text allowFontScaling={false} style={[styles.descText, { fontStyle: 'italic', marginTop: hp(1.2), alignSelf: 'flex-start' }]}>No reviews yet. Be the first to review this product!</Text>
                        )}
                    </View>

                    {/* Suggestions Horizontal Scope */}
                    {!!(suggestions.length > 0) && (
                        <View style={styles.suggestionsContainer}>
                            <View style={styles.suggestionsHeader}>
                                <Text allowFontScaling={false} style={styles.suggestionsTitle}>You Might Also Like</Text>
                                <Text allowFontScaling={false} style={styles.suggestionsSub}>Discover handpicked products that complement your style</Text>
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.suggestionsScrollContent}
                                snapToInterval={wp(46) + wp(4)}
                                decelerationRate="fast"
                            >
                                {suggestions.map((item, idx) => {
                                    const productImageSource = getImageUrl(item.pImage?.[0]);

                                    return (
                                        <TouchableOpacity
                                            key={item._id}
                                            style={styles.suggestionItem}
                                            activeOpacity={0.9}
                                            onPress={() => {
                                                router.push(`/product/${item._id}`);
                                            }}
                                        >
                                            <View style={styles.suggestionImageWrap}>
                                                <Image source={productImageSource} style={styles.suggestionImg} />
                                                {!!(item.pOffer > 0) && (
                                                    <View style={styles.suggestionBadge}>
                                                        <Text allowFontScaling={false} style={styles.suggestionBadgeText}>-{(item.pOffer)}%</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.suggestionInfo}>
                                                <Text allowFontScaling={false} style={styles.suggestionBrand} numberOfLines={1}>{item.pBrand}</Text>
                                                <Text allowFontScaling={false} style={styles.suggestionName} numberOfLines={2}>{item.pName}</Text>

                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, hp(2)) }]}>
                <View style={styles.bottomPriceInfo}>
                    <Text allowFontScaling={false} style={styles.bottomTotalLabel}>Total Price</Text>
                    <Text allowFontScaling={false} style={styles.bottomTotalPrice}>₹{(currentPrice * quantity).toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.addToCartButton,
                        isOutOfStock && styles.disabledButton,
                        isInCart && styles.goToCartButton,
                    ]}
                    disabled={isOutOfStock || isAdding}
                    onPress={handleAddToCart}
                >
                    {isAdding ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <MaterialCommunityIcons
                                name={isInCart ? 'check-circle' : 'cart'}
                                size={rf(20)}
                                color="#FFF"
                                style={{ marginRight: wp(2) }}
                            />
                            <Text allowFontScaling={false} style={styles.addToCartButtonText}>
                                {isOutOfStock ? 'Out of Stock' : isInCart ? 'Go to Cart' : 'Add to Cart'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    errorText: {
        fontSize: rf(16),
        color: '#666',
        fontWeight: '600',
        marginBottom: hp(2.5),
    },
    backBtnWrapper: {
        paddingHorizontal: wp(7),
        paddingVertical: hp(1.8),
        backgroundColor: '#F38000',
        borderRadius: wp(4),
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.3,
        shadowRadius: wp(2),
        elevation: 4,
    },
    backBtnText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: rf(14),
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        zIndex: 100,
    },
    backIconButton: {
        width: wp(11),
        height: wp(11),
        borderRadius: wp(5.5),
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: wp(3),
    },
    headerBrand: {
        fontSize: rf(10),
        fontWeight: '900',
        color: '#F38000',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: hp(0.2),
    },
    headerTitle: {
        fontSize: rf(15),
        fontWeight: '800',
        color: '#111',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: wp(11),
        height: wp(11),
        borderRadius: wp(5.5),
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: wp(2),
    },
    scrollContent: {
        paddingBottom: hp(10),
    },
    imageGallery: {
        width: wp(100),
        height: wp(110),
        backgroundColor: '#F7F8FA',
        position: 'relative',
    },
    imageWrapper: {
        width: wp(100),
        height: wp(110),
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(5),
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: hp(5),
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: wp(5),
    },
    dot: {
        width: wp(1.5),
        height: wp(1.5),
        borderRadius: wp(0.75),
        backgroundColor: '#DDD',
        marginHorizontal: wp(1),
    },
    activeDot: {
        backgroundColor: '#F38000',
        width: wp(4),
    },
    quickBadges: {
        position: 'absolute',
        top: hp(2.5),
        left: wp(5),
        zIndex: 10,
    },
    offerBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.7),
        borderRadius: wp(2.5),
        marginBottom: hp(1),
    },
    offerText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: rf(11),
        letterSpacing: 0.5,
    },
    outOfStockBadge: {
        backgroundColor: '#111',
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.7),
        borderRadius: wp(2.5),
    },
    outOfStockText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: rf(11),
    },
    infoSection: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: wp(8),
        borderTopRightRadius: wp(8),
        marginTop: -hp(2.8),
        padding: wp(6),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -hp(1.2) },
        shadowOpacity: 0.05,
        shadowRadius: wp(5),
        elevation: 8,
    },
    brandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    brandBadge: {
        backgroundColor: '#F8F9FB',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.7),
        borderRadius: wp(2.5),
    },
    brandText: {
        fontSize: rf(11),
        fontWeight: '900',
        color: '#111',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8F0',
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.7),
        borderRadius: wp(3),
    },
    ratingText: {
        fontSize: rf(13),
        fontWeight: '800',
        color: '#F38000',
        marginLeft: wp(1),
    },
    productTitle: {
        fontSize: rf(24),
        fontWeight: '900',
        color: '#111',
        lineHeight: rf(32),
        marginBottom: hp(2),
    },
    pricingRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: wp(3),
        marginBottom: hp(3.5),
    },
    currentPrice: {
        fontSize: rf(32),
        fontWeight: '900',
        color: '#111',
    },
    oldPrice: {
        fontSize: rf(18),
        fontWeight: '600',
        color: '#BBB',
        textDecorationLine: 'line-through',
    },
    taxInfo: {
        fontSize: rf(12),
        color: '#AAA',
        fontWeight: '600',
        marginLeft: 'auto',
    },
    sectionTitle: {
        fontSize: rf(17),
        fontWeight: '800',
        color: '#111',
        marginBottom: hp(2),
        letterSpacing: -0.2,
    },
    variantsSection: {
        marginBottom: hp(4),
    },
    variantList: {
        flexDirection: 'row',
    },
    variantBox: {
        paddingHorizontal: wp(4.5),
        paddingVertical: hp(1.8),
        borderRadius: wp(4),
        backgroundColor: '#F8F9FB',
        marginRight: wp(2.5),
        borderWidth: 1.5,
        borderColor: '#F8F9FB',
    },
    selectedVariantBox: {
        backgroundColor: '#FFF',
        borderColor: '#F38000',
    },
    variantText: {
        fontSize: rf(14),
        fontWeight: '700',
        color: '#666',
    },
    selectedVariantText: {
        color: '#F38000',
    },
    colorCircle: {
        width: wp(9),
        height: wp(9),
        borderRadius: wp(4.5),
        borderWidth: 2,
        borderColor: '#F0F0F0',
    },
    activeColorCircle: {
        borderColor: '#F38000',
        transform: [{ scale: 1.1 }],
    },
    quantitySection: {
        marginBottom: hp(4),
        padding: wp(5),
        backgroundColor: '#F8F9FB',
        borderRadius: wp(6),
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    qtyBtn: {
        width: wp(11),
        height: wp(11),
        borderRadius: wp(5.5),
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.2) },
        shadowOpacity: 0.1,
        shadowRadius: wp(1),
        elevation: 2,
    },
    qtyValue: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#111',
        marginHorizontal: wp(6),
    },
    stockText: {
        marginLeft: 'auto',
        fontSize: rf(13),
        color: '#F38000',
        fontWeight: '700',
        backgroundColor: '#FFF8F0',
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.5),
        borderRadius: wp(2),
    },
    descSection: {
        marginBottom: hp(4),
        paddingBottom: hp(3),
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    descText: {
        fontSize: rf(15),
        lineHeight: rf(24),
        color: '#444',
        fontWeight: '500',
    },
    readMoreText: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#F38000',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    reviewHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2.5),
    },
    writeReviewButtonBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderRadius: wp(3.5),
        gap: wp(2),
    },
    writeReviewButtonTxt: {
        color: '#FFF',
        fontSize: rf(13),
        fontWeight: '800',
    },
    userReviewCard: {
        backgroundColor: '#F9FAFB',
        padding: wp(5),
        borderRadius: wp(5),
        marginBottom: hp(2),
    },
    reviewAvatar: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        backgroundColor: '#F38000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    reviewAvatarText: {
        color: '#FFF',
        fontSize: rf(14),
        fontWeight: '900',
    },
    reviewAuthor: {
        fontSize: rf(15),
        fontWeight: '800',
        color: '#111',
    },
    reviewComment: {
        fontSize: rf(14),
        color: '#444',
        lineHeight: rf(22),
        marginVertical: hp(1.5),
        fontWeight: '500',
    },
    reviewMediaScroll: {
        flexDirection: 'row',
        marginBottom: hp(1.5),
    },
    reviewMediaImage: {
        width: wp(25),
        height: wp(25),
        borderRadius: wp(4),
        marginRight: wp(3),
    },
    reviewDate: {
        fontSize: rf(12),
        color: '#AAA',
        fontWeight: '600',
    },
    suggestionsContainer: {
        marginTop: hp(1.2),
    },
    suggestionsHeader: {
        marginBottom: hp(2.5),
    },
    suggestionsTitle: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#111',
    },
    suggestionsSub: {
        fontSize: rf(13),
        color: '#888',
        fontWeight: '600',
        marginTop: hp(0.5),
    },
    suggestionsScrollContent: {
        paddingRight: wp(6),
        gap: wp(4),
    },
    suggestionItem: {
        width: wp(46),
        backgroundColor: '#FFF',
        borderRadius: wp(6),
        borderWidth: 1,
        borderColor: '#F0F0F0',
        overflow: 'hidden',
    },
    suggestionImageWrap: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F8F9FA',
    },
    suggestionImg: {
        width: '100%',
        height: '100%',
    },
    suggestionBadge: {
        position: 'absolute',
        top: hp(1.5),
        left: wp(3),
        backgroundColor: '#FF3B30',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: wp(2),
    },
    suggestionBadgeText: {
        color: '#FFF',
        fontSize: rf(10),
        fontWeight: '900',
    },
    suggestionInfo: {
        padding: wp(4),
    },
    suggestionBrand: {
        fontSize: rf(10),
        fontWeight: '900',
        color: '#AAA',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: hp(0.5),
    },
    suggestionName: {
        fontSize: rf(14),
        fontWeight: '700',
        color: '#111',
        lineHeight: rf(20),
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
        backgroundColor: '#FFF',
        borderTopLeftRadius: wp(8),
        borderTopRightRadius: wp(8),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -hp(1.2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(5),
        elevation: 20,
        zIndex: 999,
    },
    bottomPriceInfo: {
        flex: 1,
    },
    bottomTotalLabel: {
        fontSize: rf(12),
        color: '#888',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: hp(0.2),
    },
    bottomTotalPrice: {
        fontSize: rf(26),
        fontWeight: '900',
        color: '#111',
    },
    addToCartButton: {
        flex: 1.5,
        flexDirection: 'row',
        height: hp(7.5),
        backgroundColor: '#F38000',
        borderRadius: wp(4.5),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(1) },
        shadowOpacity: 0.35,
        shadowRadius: wp(3),
        elevation: 8,
    },
    goToCartButton: {
        backgroundColor: '#22C55E',
        shadowColor: '#22C55E',
    },
    disabledButton: {
        backgroundColor: '#E5E7EB',
        shadowOpacity: 0,
    },
    addToCartButtonText: {
        color: '#FFF',
        fontSize: rf(16),
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
