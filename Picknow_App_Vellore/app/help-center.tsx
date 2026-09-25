import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated, Linking, Platform } from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';

// Remove Dimensions import if not needed
// const { width } = Dimensions.get('window');

export default function HelpCenterScreen() {
    const insets = useSafeAreaInsets();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(30)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleCall = () => {
        Linking.openURL('tel:+917092770118');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@picknow.in?subject=Support Request');
    };

    const handleMap = () => {
        const address = 'Madurai, Tamilnadu';
        const url = Platform.select({
            ios: `maps:0,0?q=${address}`,
            android: `geo:0,0?q=${address}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${address}`;
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <CustomHeader title="Help Center" showBack rightElement={<View style={styles.headerRight} />} />

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(5) }]}
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
                {/* ── Hero Section ─────────────────────────── */}
                <View style={styles.heroSection}>
                    <View style={styles.heroIconContainer}>
                        <Ionicons name="headset-outline" size={rf(40)} color="#F38000" />
                    </View>
                    <Text allowFontScaling={false} style={styles.heroTitle}>How can we help?</Text>
                    <Text allowFontScaling={false} style={styles.heroSubtitle}>We're here to assist you with any questions or concerns. Reach out to us through any of the channels below.</Text>
                </View>

                {/* ── Contact Grid ─────────────────────────── */}
                <View style={styles.contactContainer}>
                    <TouchableOpacity style={styles.contactCard} onPress={handleCall} activeOpacity={0.7}>
                        <View style={[styles.iconWrapper, { backgroundColor: '#F0F9FF' }]}>
                            <Ionicons name="call" size={rf(24)} color="#0EA5E9" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text allowFontScaling={false} style={styles.contactLabel}>Phone Support</Text>
                            <Text allowFontScaling={false} style={styles.contactValue}>+91 7092770118</Text>
                            <Text allowFontScaling={false} style={styles.contactAction}>Tap to Call</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.7}>
                        <View style={[styles.iconWrapper, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="mail" size={rf(24)} color="#22C55E" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text allowFontScaling={false} style={styles.contactLabel}>Email Us</Text>
                            <Text allowFontScaling={false} style={styles.contactValue}>support@picknow.in</Text>
                            <Text allowFontScaling={false} style={styles.contactAction}>Send Message</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} onPress={handleMap} activeOpacity={0.7}>
                        <View style={[styles.iconWrapper, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="location" size={rf(24)} color="#F38000" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text allowFontScaling={false} style={styles.contactLabel}>Our Office</Text>
                            <Text allowFontScaling={false} style={styles.contactValue}>Madurai, Tamilnadu</Text>
                            <Text allowFontScaling={false} style={styles.contactAction}>View on Maps</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── Support Info ─────────────────────────── */}
                <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <Ionicons name="time-outline" size={rf(20)} color="#F38000" />
                        <Text allowFontScaling={false} style={styles.infoTitle}>Support Hours</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Text allowFontScaling={false} style={styles.infoLabel}>Monday - Saturday</Text>
                        <Text allowFontScaling={false} style={styles.infoValue}>10:00 AM - 07:00 PM</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text allowFontScaling={false} style={styles.infoLabel}>Sunday</Text>
                        <Text allowFontScaling={false} style={styles.infoValue}>Closed</Text>
                    </View>
                </View>

                <View style={styles.footerBranding}>
                    <Text allowFontScaling={false} style={styles.footerText}>© 2026 Picknow. All rights reserved.</Text>
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerRight: {
        width: wp(11),
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingTop: hp(1.2),
    },
    heroSection: {
        alignItems: 'center',
        marginTop: hp(4),
        marginBottom: hp(5),
        paddingHorizontal: wp(5),
    },
    heroIconContainer: {
        width: wp(20),
        height: wp(20),
        borderRadius: wp(7),
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(1.2) },
        shadowOpacity: 0.1,
        shadowRadius: wp(5),
        elevation: 8,
        borderWidth: 1,
        borderColor: '#FFF7ED',
        marginBottom: hp(3),
    },
    heroTitle: {
        fontSize: rf(28),
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.5,
        marginBottom: hp(1.5),
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: rf(15),
        lineHeight: rf(22),
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '500',
    },
    contactContainer: {
        gap: hp(2),
        marginBottom: hp(3),
    },
    contactCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: wp(6),
        padding: wp(5),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.03,
        shadowRadius: wp(2.5),
        elevation: 2,
    },
    iconWrapper: {
        width: wp(13),
        height: wp(13),
        borderRadius: wp(4),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(5),
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: rf(13),
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: hp(0.5),
    },
    contactValue: {
        fontSize: rf(17),
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: hp(0.7),
    },
    contactAction: {
        fontSize: rf(13),
        fontWeight: '700',
        color: '#F38000',
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderRadius: wp(7),
        padding: wp(6),
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: hp(5),
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2.5),
        marginBottom: hp(2),
    },
    infoTitle: {
        fontSize: rf(18),
        fontWeight: '800',
        color: '#1E293B',
    },
    infoDivider: {
        height: 1,
        backgroundColor: '#F8FAFC',
        marginBottom: hp(2.5),
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    infoLabel: {
        fontSize: rf(14),
        fontWeight: '600',
        color: '#64748B',
    },
    infoValue: {
        fontSize: rf(14),
        fontWeight: '700',
        color: '#1E293B',
    },
    footerBranding: {
        alignItems: 'center',
        marginTop: hp(1.2),
    },
    footerText: {
        fontSize: rf(12),
        fontWeight: '600',
        color: '#94A3B8',
    },
});
