import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Platform,
    Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/Services/api';

import { wp, hp, rf } from '@/constants/responsive';

interface CustomHeaderProps {
    title?: string;
    showBack?: boolean;
    showLogo?: boolean;
    onBackPress?: () => void;
    rightElement?: React.ReactNode;
    showGreeting?: boolean;
    forceTall?: boolean;
    subtitle?: string;
}

const HEADER_MAIN_HEIGHT = Platform.OS === 'ios' ? hp(5.5) : hp(7);
const FALLBACK_IMAGE = require('../assets/images/Kairaa4.png');

export default function CustomHeader({
    title,
    showBack = false,
    showLogo = true,
    onBackPress,
    rightElement,
    showGreeting = false,
    forceTall = false,
    subtitle
}: CustomHeaderProps) {
    const { token, user } = useAuth();
    const { totalQuantity } = useCart();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [wishlistCount, setWishlistCount] = React.useState(0);
    const scaleBack = React.useRef(new Animated.Value(1)).current;
    const scaleWish = React.useRef(new Animated.Value(1)).current;
    const scaleCart = React.useRef(new Animated.Value(1)).current;
    const badgeScaleWish = React.useRef(new Animated.Value(0)).current;
    const badgeScaleCart = React.useRef(new Animated.Value(0)).current;


    // Dynamic Header Padding based on Insets
    let dynamicHeaderMainHeight = HEADER_MAIN_HEIGHT;
    if (showGreeting) {
        dynamicHeaderMainHeight = hp(9);
    } else if (showBack || title || forceTall) {
        // Taller header for inner pages like Categories, Cart, Profile etc
        dynamicHeaderMainHeight = HEADER_MAIN_HEIGHT + hp(2);
    }

    const topInset = insets.top;
    const headerHeight = dynamicHeaderMainHeight + topInset;

    React.useEffect(() => {
        let mounted = true;
        const fetchWishlist = async () => {
            if (token) {
                try {
                    const res = await authService.getWishlist(token);
                    if (mounted && res.success && res.products) {
                        const newCount = res.products.length;
                        if (newCount !== wishlistCount) {
                            setWishlistCount(newCount);
                            // Pop animation for badge
                            Animated.sequence([
                                Animated.spring(badgeScaleWish, { toValue: 1.2, useNativeDriver: true, speed: 20 }),
                                Animated.spring(badgeScaleWish, { toValue: 1, useNativeDriver: true, speed: 20 }),
                            ]).start();
                        }
                    }
                } catch (e) {
                    // Silently fail for background refresh
                }
            }
        };
        fetchWishlist();
        return () => {
            mounted = false;
        };
    }, [token]);

    React.useEffect(() => {
        if (totalQuantity > 0) {
            Animated.sequence([
                Animated.spring(badgeScaleCart, { toValue: 1.2, useNativeDriver: true, speed: 20 }),
                Animated.spring(badgeScaleCart, { toValue: 1, useNativeDriver: true, speed: 20 }),
            ]).start();
        } else {
            badgeScaleCart.setValue(0);
        }
    }, [totalQuantity]);


    const onPressIn = (val: Animated.Value) => {
        Animated.spring(val, { toValue: 0.9, useNativeDriver: true, speed: 20 }).start();
    };
    const onPressOut = (val: Animated.Value) => {
        Animated.spring(val, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    };

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <View style={[styles.root, { height: headerHeight, paddingTop: topInset }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <View style={[styles.navRow, { height: dynamicHeaderMainHeight }]}>
                {/* 1. LEFT BLOCK: Back Button + Title/Logo */}
                <View style={styles.leftBlock}>
                    {showBack ? (
                        <Animated.View style={[{ transform: [{ scale: scaleBack }] }, styles.backButtonWrapper]}>
                            <TouchableOpacity
                                style={styles.backTouch}
                                onPress={handleBack}
                                activeOpacity={1}
                                onPressIn={() => onPressIn(scaleBack)}
                                onPressOut={() => onPressOut(scaleBack)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialIcons name="arrow-back" size={rf(24)} color="#000" />
                            </TouchableOpacity>
                        </Animated.View>
                    ) : null}

                    <View style={[showBack ? { marginLeft: wp(3) } : null, styles.titleContainer]}>
                        {title ? (
                            <View style={styles.titleWrapper}>
                                <Text allowFontScaling={false} style={styles.headerTitleText} numberOfLines={1}>{title}</Text>
                                {subtitle ? (
                                    <Text allowFontScaling={false} style={styles.headerSubtitleText} numberOfLines={1}>{subtitle}</Text>
                                ) : null}
                            </View>
                        ) : showLogo ? (
                            <View style={styles.logoStack}>
                                <Image
                                    source={FALLBACK_IMAGE}
                                    style={styles.logoImage}
                                    contentFit="contain"
                                    transition={300}
                                />
                                <View style={styles.premiumUnderline} />
                                {showGreeting && user && (
                                    <View style={styles.miniGreetingWrap}>
                                        <Text allowFontScaling={false} style={styles.miniGreetingWelcome}>Welcome Back,</Text>
                                        <Text allowFontScaling={false} style={styles.miniGreetingUser}>{user?.name?.split(' ')[0] || 'User'} </Text>
                                    </View>
                                )}
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* 2. RIGHT BLOCK: Brand Slider + Actions */}
                <View style={styles.rightBlock}>

                    {rightElement ? (
                        rightElement
                    ) : (
                        <>
                            {/* Cart */}
                            <Animated.View style={{ transform: [{ scale: scaleCart }] }}>
                                <TouchableOpacity
                                    style={styles.actionPressable}
                                    onPress={() => router.push('/(tabs)/cart' as any)}
                                    activeOpacity={1}
                                    onPressIn={() => onPressIn(scaleCart)}
                                    onPressOut={() => onPressOut(scaleCart)}
                                >
                                    <MaterialCommunityIcons name="cart-outline" size={rf(24)} color="#000" />
                                    {totalQuantity > 0 && (
                                        <Animated.View style={[styles.badgeContainer, styles.blackBadge, { transform: [{ scale: badgeScaleCart }] }]}>
                                            <Text allowFontScaling={false} style={styles.badgeLabel}>{totalQuantity > 9 ? '9+' : totalQuantity}</Text>
                                        </Animated.View>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                            {/* Wishlist */}
                            <Animated.View style={{ transform: [{ scale: scaleWish }] }}>
                                <TouchableOpacity
                                    style={styles.actionPressable}
                                    onPress={() => router.push('/wishlist')}
                                    activeOpacity={1}
                                    onPressIn={() => onPressIn(scaleWish)}
                                    onPressOut={() => onPressOut(scaleWish)}
                                >
                                    <MaterialCommunityIcons name="heart-outline" size={rf(24)} color="#000" />
                                    {wishlistCount > 0 && (
                                        <Animated.View style={[styles.badgeContainer, styles.orangeBadge, { transform: [{ scale: badgeScaleWish }] }]}>
                                            <Text allowFontScaling={false} style={styles.badgeLabel}>{wishlistCount > 9 ? '9+' : wishlistCount}</Text>
                                        </Animated.View>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>

                        </>
                    )}
                </View>
            </View>

            {/* Premium Hairline Bottom Line removed as it's now part of root border */}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        zIndex: 1000,
        // Premium soft floating shadow
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F4F7',
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        justifyContent: 'space-between',
    },
    leftBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Let title use available space
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    titleWrapper: {
        justifyContent: 'center',
    },
    rightBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: wp(3),
    },
    logoImage: {
        width: wp(25),
        height: hp(3.5),
    },
    logoStack: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    premiumUnderline: {
        width: wp(3),
        height: hp(0.2),
        backgroundColor: '#F38000',
        borderRadius: rf(1),
        marginTop: hp(0.2),
        opacity: 0.6,
    },
    miniGreetingWrap: {
    flexDirection: 'row',
    alignItems: 'baseline', // ✅ IMPORTANT CHANGE
    marginTop: hp(0.2),
    gap: wp(1),
},
    miniGreetingWelcome: {
        fontSize: rf(10),
        fontWeight: '900',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    miniGreetingUser: {
        fontSize: rf(12),
        fontWeight: '900',
        color: '#F38000',
        letterSpacing: -0.2,
        
    },
    headerTitleText: {
        fontSize: rf(18),
        fontWeight: '800', // Bold, premium look
        color: '#111',
        letterSpacing: -0.5,
    },
    headerSubtitleText: {
        fontSize: rf(11),
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: hp(0.1),
    },
    backButtonWrapper: {
        justifyContent: 'center',
    },
    backTouch: {
        width: rf(44),
        height: rf(44),
        borderRadius: rf(22),
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    actionPressable: {
        width: rf(44),
        height: rf(44),
        borderRadius: rf(22),
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    badgeContainer: {
        position: 'absolute',
        top: -hp(0.8),
        right: -wp(2),
        borderRadius: rf(10),
        minWidth: rf(18),
        height: rf(18),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    orangeBadge: {
        backgroundColor: '#F38000',
    },
    blackBadge: {
        backgroundColor: '#111',
    },
    badgeLabel: {
        color: '#FFF',
        fontSize: rf(8),
        fontWeight: '900',
    },
    spacer: {
        width: wp(0.1),
    },
    bottomHairline: {
        height: hp(0.1),
        backgroundColor: '#F1F3F5',
        width: '100%',
    },
});
