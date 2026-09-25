import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withRepeat,
    withSequence,
    withDelay,
    Easing
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const PremiumLoader = () => {
    // Reanimated Shared Values
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const progress = useSharedValue(0);
    const glowOpacity = useSharedValue(0.1);
    const glowScale = useSharedValue(0.8);
    const translateY = useSharedValue(0);

    useEffect(() => {
        // Entrance
        opacity.value = withTiming(1, { duration: 1000 });
        scale.value = withSpring(1, { damping: 12, stiffness: 100 });

        // Continuous Logo Float & Pulse
        translateY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );

        scale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );

        // Continuous Progress Tracking
        progress.value = withRepeat(
            withTiming(1, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            -1,
            false
        );

        // Ambient Glow Dynamics
        glowOpacity.value = withRepeat(
            withTiming(0.4, { duration: 2500 }),
            -1,
            true
        );
        glowScale.value = withRepeat(
            withTiming(1.2, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedBrandStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { scale: scale.value },
            { translateY: translateY.value }
        ],
    }));

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: progress.value * 180,
    }));

    const animatedGlowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: glowScale.value }],
    }));

    return (
        <View style={styles.container}>
            {/* Soft Ambient Background Glow */}
            <Animated.View style={[styles.ambientGlow, animatedGlowStyle]} />

            <View style={styles.content}>
                {/* Brand Logo Section */}
                <Animated.View style={[styles.brandWrapper, animatedBrandStyle]}>
                    <View style={styles.logoCircle}>
                        <Image
                            source={require('../assets/images/unnamed-removebg-preview.png')}
                            style={styles.logo}
                            contentFit="contain"
                        />
                    </View>
                </Animated.View>

                {/* Typography & Status */}
                <View style={styles.statusContainer}>


                    {/* Modern Progress Indicator */}
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, animatedProgressStyle]}>
                            <View style={styles.glowHead} />
                        </Animated.View>
                    </View>

                    <Text style={styles.statusText}>Syncing Your Collection...</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ambientGlow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#F3800010',
        zIndex: 1,
    },
    content: {
        alignItems: 'center',
        zIndex: 10,
    },
    brandWrapper: {
        marginBottom: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    logo: {
        width: '60%',
        height: '60%',
    },
    statusContainer: {
        alignItems: 'center',
    },

    progressTrack: {
        width: 150,
        height: 3,
        backgroundColor: '#F5F5F5',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 15,
        marginTop: -45,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F38000',
        borderRadius: 2,
    },
    glowHead: {
        position: 'absolute',
        right: 0,
        width: 15,
        height: '100%',
        backgroundColor: '#FFF',
        opacity: 0.6,
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    statusText: {
        fontSize: 9,
        color: '#BBB',
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#DDD',
        letterSpacing: 2,
        fontWeight: '800',
    },
});

export default PremiumLoader;

