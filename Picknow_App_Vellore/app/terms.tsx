import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';

export default function TermsConditionsScreen() {
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
            title: '1. Eligibility',
            content: 'You must be at least 18 years old (or the age of majority in your jurisdiction) to use our platform.\nBy registering, you confirm that all details provided are accurate and complete.',
        },
        {
            id: '2',
            title: '2. Account Registration',
            content: 'You may need to create an account to shop with us.\nYou are responsible for maintaining the confidentiality of your account credentials.\nAny activity under your account will be considered your responsibility.',
        },
        {
            id: '3',
            title: '3. Products & Orders',
            content: 'All products listed on picknow.in are subject to availability.\nPrices are subject to change without prior notice.\nOrders are confirmed only after successful payment.\nWe reserve the right to cancel or refuse orders in cases of fraud, unauthorized activity, or product unavailability.',
        },
        {
            id: '4',
            title: '4. Payments',
            content: 'Payments must be made via approved methods (credit/debit cards, UPI, wallets, net banking, etc.).\nAll payments are processed securely through trusted third-party gateways.\nWe are not responsible for delays or failures caused by third-party payment providers.',
        },
        {
            id: '5',
            title: '5. Shipping & Delivery',
            content: 'Delivery timelines are estimates and may vary due to logistics or unforeseen events.\nShipping charges (if applicable) will be displayed at checkout.\nRisk of loss passes to you upon delivery of the order to the provided address.',
        },
        {
            id: '6',
            title: '6. Returns, Refunds & Cancellations',
            content: 'Our Return & Refund Policy (available on the website) governs product returns, cancellations, and refunds.\nItems must be returned in their original condition and packaging (where applicable).\nCertain items (e.g., perishable, personal care, or customized products) may not be eligible for returns.',
        },
        {
            id: '7',
            title: '7. Use of Website',
            content: 'You agree not to misuse the platform for fraudulent, illegal, or harmful activities.\nYou must not attempt to disrupt or hack the website, servers, or security systems.\nContent on the website (images, logos, product descriptions) is the intellectual property of Vairaa Wealth Pvt Ltd and cannot be copied without prior consent.',
        },
        {
            id: '8',
            title: '8. Limitation of Liability',
            content: 'Vairaa Wealth Pvt Ltd shall not be liable for:\n• Delays in delivery due to third-party logistics.\n• Errors or inaccuracies in product descriptions (we strive to keep information accurate).\n• Losses arising from misuse of your account credentials.\n• Any indirect, incidental, or consequential damages.',
        },
        {
            id: '9',
            title: '9. Indemnity',
            content: 'You agree to indemnify and hold harmless Vairaa Wealth Pvt Ltd (Picknow), its directors, employees, and partners from any claims, damages, or liabilities arising out of your use of the platform or violation of these Terms.',
        },
        {
            id: '10',
            title: '10. Changes to Terms',
            content: 'We may update these Terms from time to time. Changes will be posted on this page with a revised "Effective Date." Continued use of the website after changes means you accept the updated Terms.',
        },
        {
            id: '11',
            title: '11. Governing Law & Dispute Resolution',
            content: 'These Terms are governed by the laws of India.\nIn case of disputes, the matter will fall under the jurisdiction of the courts of Madurai, Tamil Nadu, India.',
        },
        {
            id: '12',
            title: '12. Contact us',
            content: 'For any queries regarding these Terms, contact us at:\n• Website: https://picknow.in\n• Phone: +91 7092770118\n• Email: support@picknow.in\n• Address: 34, TM Nagar, Mattuthavani, Madurai, Tamilnadu - 625107',
        },
    ];

    return (
        <View style={styles.container}>
            <CustomHeader title="Terms & Conditions" showBack rightElement={<View style={styles.headerRight} />} />

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(5) }]}
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
                <View style={styles.headerSection}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="document-text" size={rf(32)} color="#F38000" />
                    </View>
                    <Text allowFontScaling={false} style={styles.mainTitle}>Terms & Conditions</Text>
                    <Text allowFontScaling={false} style={styles.lastUpdated}>Last Updated • March 2026</Text>
                </View>

                <View style={styles.introCard}>
                    <Text allowFontScaling={false} style={styles.introText}>
                        Welcome to <Text allowFontScaling={false} style={styles.brandText}>Picknow.in</Text>, operated by <Text allowFontScaling={false} style={styles.brandText}>Vairaa Wealth Pvt Ltd</Text>. These Terms & Conditions govern your access to and use of our website, services, and purchases.
                    </Text>
                </View>

                {sections.slice(0, 11).map((item, index) => (
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
                        <Ionicons name="help-buoy-outline" size={rf(24)} color="#F38000" />
                        <Text allowFontScaling={false} style={styles.contactTitle}>Terms Support</Text>
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
