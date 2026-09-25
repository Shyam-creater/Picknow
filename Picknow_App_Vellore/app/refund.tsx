import React from 'react';
import { StyleSheet, View, Text, ScrollView, Animated } from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';

export default function RefundPolicyScreen() {
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
            title: '1. Eligibility for Returns',
            content: 'You may request a return if:\n• The product delivered is defective, damaged, or incorrect.\n• The product does not match the description on our website.\n• The product is eligible under our returnable items list.\n\nTo be eligible:\n• The request must be made within 7 days from the date of delivery.\n• The product must be unused, in original condition, and in original packaging with tags, invoices, and accessories.',
        },
        {
            id: '2',
            title: '2. Non-Returnable Items',
            content: 'Certain categories of items are not eligible for return, including:\n• Perishable goods (e.g., food, groceries).\n• Personal care and hygiene products.\n• Innerwear, lingerie, and intimate wear.\n• Customized or made-to-order items.\n• Digital/downloadable products.',
        },
        {
            id: '3',
            title: '3. Refund Process',
            content: 'Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, the refund will be initiated to your original payment method within 5–7 business days.',
        },
        {
            id: '4',
            title: '4. Replacement/Exchange',
            content: 'If you receive a damaged or incorrect product, we will arrange for a replacement (subject to stock availability). If replacement is not available, a full refund will be issued.',
        },
        {
            id: '5',
            title: '5. Cancellations',
            content: 'Orders can be cancelled before they are shipped. If the order has already been shipped, it cannot be cancelled but may be eligible for return after delivery.',
        },
        {
            id: '6',
            title: '6. Shipping Costs',
            content: 'Return shipping charges may be borne by Picknow in case of wrong/defective products. For all other return reasons, shipping costs may be deducted from the refund.',
        },
        {
            id: '7',
            title: '7. How to Initiate a Return',
            content: 'To request a return or refund:\n• Contact us at support@picknow.in within the eligible return period.\n• Provide your order ID, invoice copy, and reason for return.\n• We will arrange pickup or guide you on return shipment.',
        },
    ];

    return (
        <View style={styles.container}>
            <CustomHeader title="Refund Policy" showBack rightElement={<View style={styles.headerRight} />} />

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(5) }]}
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
                <View style={styles.headerSection}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="receipt" size={rf(32)} color="#F38000" />
                    </View>
                    <Text allowFontScaling={false} style={styles.mainTitle}>Refund Policy</Text>
                    <Text allowFontScaling={false} style={styles.lastUpdated}>Updated • March 2026</Text>
                </View>

                <View style={styles.introCard}>
                    <Text allowFontScaling={false} style={styles.introText}>
                        At <Text allowFontScaling={false} style={styles.brandText}>Picknow.in</Text>, operated by <Text allowFontScaling={false} style={styles.brandText}>Vairaa Wealth Pvt Ltd</Text>, we want you to be completely satisfied. This policy outlines our conditions for returns, replacements, and refunds.
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
                        <Ionicons name="help-buoy-outline" size={rf(24)} color="#F38000" />
                        <Text allowFontScaling={false} style={styles.contactTitle}>Refund Support</Text>
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
