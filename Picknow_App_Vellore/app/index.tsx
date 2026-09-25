import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    Easing,
    withRepeat,
    withSequence
} from 'react-native-reanimated';

// Remove Dimensions import or usage if not strictly needed
// const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const router = useRouter();
    const { token, isLoading } = useAuth();
    const insets = useSafeAreaInsets();

    // Reanimated Shared Values
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const progressWidth = useSharedValue(0);
    const bgScale = useSharedValue(1.1);
    const glowOpacity = useSharedValue(0.3);


    useEffect(() => {
        // Background Ken Burns Effect
        bgScale.value = withTiming(1, { duration: 6000, easing: Easing.out(Easing.quad) });

        // Logo Entrance - Smooth Bounce In
        logoOpacity.value = withTiming(1, { duration: 800 });
        logoScale.value = withDelay(200, withSpring(1, {
            damping: 5,
            stiffness: 120,
            mass: 1,
            velocity: 2
        }));

        // Text & Tagline Staggered
        textOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
        textTranslateY.value = withDelay(1200, withSpring(0, { damping: 15 }));


        // Progress Bar
        progressWidth.value = withDelay(1200, withTiming(wp(60), {
            duration: 3500,
            easing: Easing.inOut(Easing.quad)
        }));

        // Subtle Glow Pulse
        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 2000 }),
                withTiming(0.3, { duration: 2000 })
            ),
            -1,
            true
        );

        // Navigation logic
        const timer = setTimeout(() => {
            if (!isLoading) {
                router.replace('/(tabs)');
            }
        }, 5500);

        return () => clearTimeout(timer);
    }, [token, isLoading]);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: progressWidth.value,
    }));

    const animatedBgStyle = useAnimatedStyle(() => ({
        transform: [{ scale: bgScale.value }],
    }));

    const animatedGlowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Premium Dark Background with Ken Burns Effect */}
            <Animated.View style={[StyleSheet.absoluteFill, animatedBgStyle]}>
                <View style={styles.bgOverlay} />
                <View style={styles.gradientBottom} />
            </Animated.View>

            {/* Decorative Ambient Glow */}
            <Animated.View style={[styles.ambientGlow, animatedGlowStyle]} />

            <View style={styles.content}>
                {/* Logo Section */}
                <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                    <View style={styles.logoCircle}>
                        <Image
                            source={require('../assets/images/unnamed-removebg-preview.png')}
                            style={styles.logo}
                            contentFit="contain"
                        />
                    </View>
                </Animated.View>


                {/* Brand & Tagline */}
                <Animated.View style={[styles.textSection, animatedTextStyle]}>
                    <Text allowFontScaling={false} style={styles.brandTitle}>PICKNOW</Text>
                    <Text allowFontScaling={false} style={styles.tagline}>Elevate Your Lifestyle</Text>

                    <View style={styles.descriptionContainer}>
                        <Text allowFontScaling={false} style={styles.description}>
                            Discover a curated collection of premium essentials and lifestyle products delivered to your doorstep.
                        </Text>
                    </View>
                </Animated.View>

                {/* Elegant Progress/Loading */}
                <View style={styles.footer}>
                    <View style={styles.progressBarBg}>
                        <Animated.View style={[styles.progressBarFill, animatedProgressStyle]}>
                            <View style={styles.progressGlow} />
                        </Animated.View>
                    </View>
                    <Text allowFontScaling={false} style={styles.loadingText}>Initializing Experience...</Text>
                </View>
            </View>

            {/* Subtle Version/Protocol Note */}
            <View style={[styles.metadata, { bottom: insets.bottom + hp(2.5) }]}>
                <Text allowFontScaling={false} style={styles.metadataText}>PICKNOW PREMIUM • v1.2.0</Text>
            </View>
        </View>
    );
}const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    bgOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
    },
    gradientBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: hp(40),
        backgroundColor: 'transparent',
    },
    ambientGlow: {
        position: 'absolute',
        top: hp(20),
        left: wp(10),
        width: wp(80),
        height: wp(80),
        borderRadius: wp(40),
        backgroundColor: '#F3800010',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: hp(5),
    },
    logoCircle: {
        width: wp(40),
        height: wp(40),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textSection: {
        alignItems: 'center',
        paddingHorizontal: wp(10),
    },
    brandTitle: {
        fontSize: rf(32),
        fontWeight: '900',
        color: '#111111',
        letterSpacing: 8,
        marginBottom: hp(1),
    },
    tagline: {
        fontSize: rf(14),
        fontWeight: '600',
        color: '#F38000',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: hp(3),
    },
    descriptionContainer: {
        maxWidth: wp(75),
    },
    description: {
        fontSize: rf(13),
        color: '#666666',
        textAlign: 'center',
        lineHeight: rf(20),
        fontWeight: '400',
    },
    footer: {
        position: 'absolute',
        bottom: hp(15),
        alignItems: 'center',
    },
    progressBarBg: {
        width: wp(60),
        height: hp(0.4),
        backgroundColor: '#EEEEEE',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: hp(1.5),
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#F38000',
    },
    progressGlow: {
        position: 'absolute',
        right: 0,
        width: wp(5),
        height: '100%',
        backgroundColor: '#FFF',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: wp(2.5),
    },
    loadingText: {
        fontSize: rf(10),
        color: '#999',
        letterSpacing: 2,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    metadata: {
        position: 'absolute',
        width: '100%',
        alignItems: 'center',
    },
    metadataText: {
        fontSize: rf(9),
        color: '#BBBBBB',
        letterSpacing: 2,
        fontWeight: '700',
    },
});

