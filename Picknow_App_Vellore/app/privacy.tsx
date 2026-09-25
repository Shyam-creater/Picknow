import React from 'react';
import { StyleSheet, View, Text, ScrollView, Animated } from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';

export default function PrivacyPolicyScreen() {
    const insets = useSafeAreaInsets();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const sections = [
        {
            id: '1',
            title: '1. Information We Collect',
            content: 'We may collect the following types of information:\n\n• Personal Information: Name, email address, phone number, billing and shipping address.\n• Payment Information: UPI, wallet payments, credit/debit card details, and other transaction data.\n• Order Information: Products purchased, order history, preferences.\n• Technical Data: IP address, browser type, device details, operating system, and cookies.\n• Marketing Data: Information you provide when subscribing to newsletters, offers, or promotions.\n\nWe do not knowingly collect information from individuals under the age of 18.',
        },
        {
            id: '2',
            title: '2. How We Use Your Information',
            content: 'Your data may be used for:\n• Processing and fulfilling orders.\n• Managing secure payments and fraud prevention.\n• Shipping and delivery services.\n• Providing customer support.\n• Sending order updates, offers, and promotional messages (if you opt-in).\n• Improving website experience, products, and services.\n• Legal and regulatory compliance.',
        },
        {
            id: '3',
            title: '3. Data Security',
            content: 'Payment information is handled securely by PCI-DSS-compliant payment gateways. We implement encryption, firewalls, and secure servers to protect data. Access to personal data is restricted to authorized staff only.',
        },
        {
            id: '4',
            title: '4. Data Sharing & Disclosure',
            content: 'We do not sell or rent personal data. Information may be shared only with service providers (delivery partners, payment processors), authorities (when legally required), or in business transfers (mergers/acquisitions). All third parties are bound by confidentiality obligations.',
        },
        {
            id: '5',
            title: '5. Data Retention',
            content: 'We retain your data only as long as necessary to complete transactions, provide customer service, and meet legal, tax, and compliance obligations. After this period, data is securely deleted or anonymized.',
        },
        {
            id: '6',
            title: '6. Your Rights',
            content: 'Depending on your jurisdiction, you may have the right to access, correct, or update your information; request deletion of personal data; opt out of promotional communications; or restrict certain processing activities.',
        },
        {
            id: '7',
            title: '7. Cookies & Tracking',
            content: 'We use cookies and similar technologies to keep your shopping cart active, remember your preferences, and analyze site usage. Where legally required, we will request your consent before placing non-essential cookies.',
        },
        {
            id: '8',
            title: '8. International Data Transfers',
            content: 'If your information is transferred outside India, we ensure compliance with applicable laws including the India Digital Personal Data Protection (DPDP) Act 2023, the EU GDPR, and other relevant regulations.',
        },
        {
            id: '9',
            title: '9. Updates to This Policy',
            content: 'We may revise this Privacy Policy from time to time. Updates will be posted on this page with a new "Effective Date."',
        },
    ];

    return (
        <View style={styles.container}>
            <CustomHeader title="Privacy Policy" showBack rightElement={<View style={styles.headerRight} />} />

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(5) }]}
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
                <View style={styles.headerSection}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="shield-checkmark" size={rf(32)} color="#F38000" />
                    </View>
                    <Text allowFontScaling={false} style={styles.mainTitle}>Privacy Policy</Text>
                    <Text allowFontScaling={false} style={styles.lastUpdated}>Version 1.2 • March 2026</Text>
                </View>

                <View style={styles.introCard}>
                    <Text allowFontScaling={false} style={styles.introText}>
                        At <Text allowFontScaling={false} style={styles.brandText}>Vairaa Wealth Pvt Ltd ("Picknow")</Text>, we respect your privacy and are committed to protecting your personal information. This policy explains how we handle your data when you use <Text allowFontScaling={false} style={styles.brandText}>picknow.in</Text>.
                    </Text>
                </View>

                {sections.map((item, index) => (
                    <View key={item.id} style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.indexBadge}>
                                <Text allowFontScaling={false} style={styles.indexText}>{index + 1}</Text>
                            </View>
                            <Text allowFontScaling={false} style={styles.sectionTitle}>{item.title.split('. ')[1] || item.title}</Text>
                        </View>
                        <Text allowFontScaling={false} style={styles.sectionContent}>{item.content}</Text>
                    </View>
                ))}

                <View style={styles.contactCard}>
                    <View style={styles.contactHeader}>
                        <Ionicons name="headset-outline" size={rf(24)} color="#F38000" />
                        <Text allowFontScaling={false} style={styles.contactTitle}>Privacy Support</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.contactGrid}>
                        <View style={styles.contactItem}>
                            <Ionicons name="mail-outline" size={rf(18)} color="#64748B" />
                            <Text allowFontScaling={false} style={styles.contactText}>support@picknow.in</Text>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="call-outline" size={rf(18)} color="#64748B" />
                            <Text allowFontScaling={false} style={styles.contactText}>+91 7092770118</Text>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="location-outline" size={rf(18)} color="#64748B" />
                            <Text allowFontScaling={false} style={styles.contactText}>Madurai, Tamilnadu</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text allowFontScaling={false} style={styles.footerBrand}>© 2026 Picknow. All rights reserved.</Text>
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
    headerSection: {
        alignItems: 'center',
        marginVertical: hp(4),
    },
    iconContainer: {
        width: wp(18),
        height: wp(18),
        borderRadius: wp(6),
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(1.2) },
        shadowOpacity: 0.1,
        shadowRadius: wp(5),
        elevation: 5,
        borderWidth: 1,
        borderColor: '#FFF7ED',
    },
    mainTitle: {
        fontSize: rf(28),
        fontWeight: '900',
        color: '#1E293B',
        marginTop: hp(2.5),
        letterSpacing: -0.5,
    },
    lastUpdated: {
        fontSize: rf(13),
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: hp(1),
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    introCard: {
        backgroundColor: '#FFF',
        borderRadius: wp(6),
        padding: wp(6),
        marginBottom: hp(2.5),
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.03,
        shadowRadius: wp(2.5),
        elevation: 2,
    },
    introText: {
        fontSize: rf(16),
        lineHeight: rf(26),
        color: '#475569',
        textAlign: 'center',
    },
    brandText: {
        fontWeight: '800',
        color: '#1E293B',
    },
    sectionCard: {
        backgroundColor: '#FFF',
        borderRadius: wp(6),
        padding: wp(6),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.2) },
        shadowOpacity: 0.02,
        shadowRadius: wp(2),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    indexBadge: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(2.5),
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    indexText: {
        fontSize: rf(14),
        fontWeight: '900',
        color: '#F38000',
    },
    sectionTitle: {
        fontSize: rf(18),
        fontWeight: '800',
        color: '#1E293B',
        flex: 1,
    },
    sectionContent: {
        fontSize: rf(15),
        lineHeight: rf(24),
        color: '#64748B',
    },
    contactCard: {
        backgroundColor: '#1E293B',
        borderRadius: wp(7),
        padding: wp(6),
        marginTop: hp(2.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(1.5) },
        shadowOpacity: 0.2,
        shadowRadius: wp(5),
        elevation: 10,
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
        gap: wp(3),
    },
    contactTitle: {
        fontSize: rf(20),
        fontWeight: '800',
        color: '#FFF',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: hp(2.5),
    },
    contactGrid: {
        gap: hp(2),
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    contactText: {
        fontSize: rf(15),
        color: '#CBD5E1',
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        marginTop: hp(5),
        marginBottom: hp(2.5),
    },
    footerBrand: {
        fontSize: rf(13),
        fontWeight: '600',
        color: '#94A3B8',
    },
});
