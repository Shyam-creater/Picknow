import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { wp, hp, rf } from '@/constants/responsive';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

const LOGO_IMAGE = require('../assets/images/Kairaa4.png');



/**
 * RegistrationReminder Component
 * Shows a premium reminder every 5 minutes if the user is not logged in.
 */
export default function RegistrationReminder() {
    const { token, isLoading } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const [isVisible, setIsVisible] = useState(false);
    
    // Animation value
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
    const intervalRef = useRef<any>(null);

    const isAuthPage = segments[0] === '(auth)';

    useEffect(() => {
        // If user is logged in or loading, clear any existing interval and hide
        if (token || isLoading || isAuthPage) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (isVisible) hideBanner();
            return;
        }

        // Start 5-minute interval if not already running
        if (!intervalRef.current) {
            // User requested "3 mins once remainder"
            intervalRef.current = setInterval(() => {
                showBanner();
            }, 180000); // 3 minutes = 180,000ms
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [token, isLoading, isAuthPage]);

    const showBanner = () => {
        setIsVisible(true);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
        }).start();
    };

    const hideBanner = () => {
        Animated.timing(slideAnim, {
            toValue: Dimensions.get('window').height,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            setIsVisible(false);
        });
    };

    const handleAction = () => {
        hideBanner();
        router.push('/(auth)/register');
    };

    if (token || isLoading || isAuthPage || !isVisible) {
        return null;
    }

    return (
        <Animated.View 
            style={[
                styles.container, 
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            <LinearGradient
                colors={['#1E293B', '#0F172A']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <View style={styles.logoCircle}>
                            <Image source={LOGO_IMAGE} style={styles.logoImg} contentFit="contain" />
                        </View>
                    </View>
                    
                    <View style={styles.textContainer}>
                        <Text allowFontScaling={false} style={styles.title}>Unlock Full Experience</Text>
                        <Text allowFontScaling={false} style={styles.subtitle}>Sign in to save your wishlist, track orders, and get personalized deals.</Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.closeBtn} 
                        onPress={hideBanner}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons name="close" size={rf(20)} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.laterBtn} onPress={hideBanner}>
                        <Text allowFontScaling={false} style={styles.laterText}>Maybe Later</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.signInBtn} onPress={handleAction}>
                        <Text allowFontScaling={false} style={styles.signInText}>Register Now</Text>
                        <MaterialIcons name="arrow-forward" size={rf(16)} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? hp(11) : hp(9), // Positioned above the tab bar
        left: wp(4),
        right: wp(4),
        zIndex: 9999,
        borderRadius: rf(20),
        overflow: 'hidden',
        // Shadow for premium feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    gradient: {
        padding: wp(5),
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: wp(4),
    },
    logoCircle: {
        width: rf(54),
        height: rf(54),
        borderRadius: rf(16),
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(1),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logoImg: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: rf(16),
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: hp(0.3),
    },
    subtitle: {
        fontSize: rf(12),
        color: '#94A3B8',
        lineHeight: rf(18),
    },
    closeBtn: {
        padding: wp(2),
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: hp(2),
    },
    laterBtn: {
        flex: 1,
        height: hp(5),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: rf(12),
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
        marginRight: wp(1.5),
    },
    laterText: {
        color: '#94A3B8',
        fontSize: rf(13),
        fontWeight: '700',
    },
    signInBtn: {
        flex: 2,
        height: hp(5),
        backgroundColor: '#F38000',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: rf(12),
        marginLeft: wp(1.5),
    },
    signInText: {
        color: '#FFFFFF',
        fontSize: rf(13),
        fontWeight: '900',
    },
});
