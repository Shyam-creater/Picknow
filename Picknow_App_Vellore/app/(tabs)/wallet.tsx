import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, TouchableOpacity, ScrollView, View,
    ActivityIndicator, RefreshControl, TextInput, Alert, Text, Modal, Animated,
    Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/Services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';

import CustomHeader from '@/components/CustomHeader';
import PremiumLoader from '@/components/PremiumLoader';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
    const { token } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<any>(null);
    useScrollToTop(scrollRef);

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Add Money with Code & Pass state
    const [isPassModalVisible, setIsPassModalVisible] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [inputPass, setInputPass] = useState('');
    const [inputAmount, setInputAmount] = useState('');
    const [isPassSubmitting, setIsPassSubmitting] = useState(false);
    const [activeInputField, setActiveInputField] = useState<string | null>(null);

    // Animations
    const balanceAnim = useRef(new Animated.Value(0)).current;
    const headerAnim = useRef(new Animated.Value(0)).current;
    const cardSlideAnim = useRef(new Animated.Value(40)).current;
    const cardOpacityAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(-width)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(cardOpacityAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
            Animated.timing(cardSlideAnim, { toValue: 0, duration: 500, delay: 200, useNativeDriver: true }),
        ]).start();

        // Shimmer loop
        const startShimmer = () => {
            shimmerAnim.setValue(-width);
            Animated.timing(shimmerAnim, {
                toValue: width * 2,
                duration: 2000,
                useNativeDriver: true,
            }).start(() => startShimmer());
        };
        startShimmer();
    }, []);

    useEffect(() => {
        if (token) {
            fetchWalletData();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchWalletData = async () => {
        try {
            const [balData, transData] = await Promise.all([
                authService.checkBalance(token!),
                authService.getTransactions(token!),
            ]);
            setBalance(balData.data?.walletBalance || balData.walletBalance || 0);
            setTransactions(transData.data || transData.wallettranscations || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const onRefresh = async () => { setRefreshing(true); await fetchWalletData(); setRefreshing(false); };

    const handleAddMoneyWithCodePass = async () => {
        if (!inputCode.trim() || !inputPass.trim() || !inputAmount.trim()) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        setIsPassSubmitting(true);
        try {
            await authService.addMoneyWithCodePass({
                code: inputCode.trim(),
                pass: inputPass.trim(),
                amount: inputAmount.trim(),
            }, token!);
            Alert.alert('🎉 Success!', 'Money added to your wallet');
            setIsPassModalVisible(false);
            setInputCode(''); setInputPass(''); setInputAmount('');
            fetchWalletData();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Something went wrong');
        } finally {
            setIsPassSubmitting(false);
        }
    };

    const creditCount = transactions.filter(t => t.type === 'credit').length;
    const debitCount = transactions.filter(t => t.type === 'debit').length;
    const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0);

    if (loading) return <PremiumLoader />;

    if (!token) return (
        <View style={styles.container}>
            <CustomHeader title="My Wallet" />
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.guestContainer}
            >
                <View style={styles.guestHero}>
                    <View style={styles.guestIconCircle}>
                        <Ionicons name="wallet" size={rf(32)} color="#F38000" />
                    </View>
                    <Text allowFontScaling={false} style={styles.guestTitle}>Secure Picknow Wallet</Text>
                    <Text allowFontScaling={false} style={styles.guestSubtitle}>
                        Log in to manage your balance, redeem gift cards, and enjoy instant, encrypted payments.
                    </Text>
                </View>

                <View style={styles.benefitCard}>
                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIconBox}>
                            <Ionicons name="flash-outline" size={rf(16)} color="#F38000" />
                        </View>
                        <View>
                            <Text allowFontScaling={false} style={styles.benefitLabel}>Instant Credit</Text>
                            <Text allowFontScaling={false} style={styles.benefitSub}>Refunds & top-ups in seconds</Text>
                        </View>
                    </View>
                    <View style={styles.benefitDivider} />
                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIconBox}>
                            <Ionicons name="gift-outline" size={rf(16)} color="#F38000" />
                        </View>
                        <View>
                            <Text allowFontScaling={false} style={styles.benefitLabel}>Gift Cards</Text>
                            <Text allowFontScaling={false} style={styles.benefitSub}>Redeem codes for wallet balance</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.guestCta} 
                    onPress={() => router.push('/(auth)/register')}
                    activeOpacity={0.8}
                >
                    <Text allowFontScaling={false} style={styles.guestCtaText}>Create Account Now</Text>
                    <Ionicons name="arrow-forward" size={rf(16)} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.guestLoginLink} 
                    onPress={() => router.push('/(auth)/login')}
                >
                    <Text allowFontScaling={false} style={styles.guestLoginText}>
                        Already have an account? <Text style={{ color: '#F38000', fontWeight: '900' }}>Login</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Hero Section */}
            <Animated.View style={[styles.heroSection, { paddingTop: insets.top + hp(0.9), opacity: headerAnim }]}>
                {/* Header bar */}
                <View style={styles.heroBar}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={rf(22)} color="#FFF" />
                    </TouchableOpacity>
                    <Text allowFontScaling={false} style={styles.heroTitle}>My Wallet</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                        <Ionicons name="refresh-outline" size={rf(20)} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Balance Card */}
                <Animated.View style={[
                    styles.balanceCard,
                    { opacity: cardOpacityAnim, transform: [{ translateY: cardSlideAnim }] }
                ]}>
                    {/* Shimmer overlay */}
                    <Animated.View
                        style={[styles.shimmer, { transform: [{ translateX: shimmerAnim }] }]}
                        pointerEvents="none"
                    />

                    <View style={styles.balanceCardTop}>
                        <View style={styles.balanceIconWrap}>
                            <Ionicons name="wallet" size={rf(26)} color="#F38000" />
                        </View>
                        <View style={styles.balTagRow}>
                            <View style={styles.balTag}>
                                <View style={styles.liveDot} />
                                <Text allowFontScaling={false} style={styles.balTagText}>Live Balance</Text>
                            </View>
                        </View>
                    </View>

                    <Text allowFontScaling={false} style={styles.balLabel}>Available Balance</Text>
                    <Text allowFontScaling={false} style={styles.balAmount}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>

                    <View style={styles.balCardDivider} />

                    <View style={styles.balCardFooter}>
                        <View style={styles.balFooterItem}>
                            <Ionicons name="shield-checkmark" size={rf(14)} color="#4CAF50" />
                            <Text allowFontScaling={false} style={styles.balFooterText}>Secure</Text>
                        </View>
                        <View style={styles.balFooterDot} />
                        <View style={styles.balFooterItem}>
                            <Ionicons name="flash" size={rf(14)} color="#F38000" />
                            <Text allowFontScaling={false} style={styles.balFooterText}>Instant</Text>
                        </View>
                        <View style={styles.balFooterDot} />
                        <View style={styles.balFooterItem}>
                            <Ionicons name="lock-closed" size={rf(13)} color="#3B82F6" />
                            <Text allowFontScaling={false} style={styles.balFooterText}>Encrypted</Text>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>

            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: wp(4.2), paddingBottom: insets.bottom + hp(4.7), paddingTop: hp(0.5) }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F38000" />}
            >
                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
                            <Ionicons name="arrow-down-circle" size={rf(22)} color="#22C55E" />
                        </View>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: '#16A34A' }]}>{creditCount}</Text>
                        <Text allowFontScaling={false} style={styles.statLabel}>Credits</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#FFEDD5' }]}>
                            <Ionicons name="arrow-up-circle" size={rf(22)} color="#F38000" />
                        </View>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: '#EA580C' }]}>{debitCount}</Text>
                        <Text allowFontScaling={false} style={styles.statLabel}>Debits</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="trending-up" size={rf(22)} color="#3B82F6" />
                        </View>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: '#2563EB' }]}>₹{totalCredits}</Text>
                        <Text allowFontScaling={false} style={styles.statLabel}>Total In</Text>
                    </View>
                </View>

                {/* Redeem / Add Card */}
                <View style={styles.redeemCard}>
                    <View style={styles.redeemCardBg}>
                        <Ionicons name="ellipse" size={rf(160)} color="rgba(243,128,0,0.05)" style={styles.redeemCircle1} />
                        <Ionicons name="ellipse" size={rf(100)} color="rgba(243,128,0,0.04)" style={styles.redeemCircle2} />
                    </View>
                    <View style={styles.redeemMain}>
                        <View style={styles.redeemLeft}>
                            <View style={styles.redeemIconWrap}>
                                <Ionicons name="gift" size={22} color="#F38000" />
                            </View>
                            <View>
                                <Text allowFontScaling={false} style={styles.redeemTitle}>Add Money</Text>
                                <Text allowFontScaling={false} style={styles.redeemSub}>Use a gift / redeem code</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.passBtn}
                            onPress={() => setIsPassModalVisible(true)}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="add-circle" size={rf(18)} color="#FFF" />
                            <Text allowFontScaling={false} style={styles.passBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.redeemInfoRow}>
                        <View style={styles.redeemInfoItem}>
                            <Ionicons name="checkmark-circle" size={rf(14)} color="#22C55E" />
                            <Text allowFontScaling={false} style={styles.redeemInfoText}>Instant credit</Text>
                        </View>
                        <View style={styles.redeemInfoItem}>
                            <Ionicons name="checkmark-circle" size={rf(14)} color="#22C55E" />
                            <Text allowFontScaling={false} style={styles.redeemInfoText}>No expiry</Text>
                        </View>
                        <View style={styles.redeemInfoItem}>
                            <Ionicons name="checkmark-circle" size={rf(14)} color="#22C55E" />
                            <Text allowFontScaling={false} style={styles.redeemInfoText}>Easy to use</Text>
                        </View>
                    </View>
                </View>

                {/* Wallet Benefits Banner */}
                <View style={styles.benefitBanner}>
                    <View style={styles.bannerBenefitItem}>
                        <Text allowFontScaling={false} style={styles.benefitEmoji}>💸</Text>
                        <Text allowFontScaling={false} style={styles.bannerBenefitLabel}>Save up to 50%</Text>
                        <Text allowFontScaling={false} style={styles.benefitDesc}>on offer products</Text>
                    </View>
                    <View style={styles.bannerBenefitDivider} />
                    <View style={styles.bannerBenefitItem}>
                        <Text allowFontScaling={false} style={styles.benefitEmoji}>⚡</Text>
                        <Text allowFontScaling={false} style={styles.bannerBenefitLabel}>Instant Payment</Text>
                        <Text allowFontScaling={false} style={styles.benefitDesc}>no waiting</Text>
                    </View>
                    <View style={styles.bannerBenefitDivider} />
                    <View style={styles.bannerBenefitItem}>
                        <Text allowFontScaling={false} style={styles.benefitEmoji}>🔒</Text>
                        <Text allowFontScaling={false} style={styles.bannerBenefitLabel}>100% Secure</Text>
                        <Text allowFontScaling={false} style={styles.benefitDesc}>encrypted</Text>
                    </View>
                </View>

                {/* Transaction History */}
                <View style={styles.histSection}>
                    <View style={styles.histHeader}>
                        <View style={styles.histTitleRow}>
                            <View style={styles.histAccent} />
                            <Text allowFontScaling={false} style={styles.histTitle}>Transaction History</Text>
                        </View>
                        <View style={styles.histBadge}>
                            <Text allowFontScaling={false} style={styles.histBadgeText}>{transactions.length}</Text>
                        </View>
                    </View>

                    {transactions.length === 0 ? (
                        <View style={styles.noTrans}>
                            <View style={styles.noTransIconWrap}>
                                <Ionicons name="receipt-outline" size={rf(36)} color="#CBD5E1" />
                            </View>
                            <Text allowFontScaling={false} style={styles.noTransTitle}>No Transactions Yet</Text>
                            <Text allowFontScaling={false} style={styles.noTransSub}>Your transaction history will appear here once you start using your wallet.</Text>
                        </View>
                    ) : (
                        transactions.map((item, i) => {
                            const dateObj = new Date(item.createdAt);
                            const day = dateObj.getDate();
                            const month = dateObj.toLocaleString('en-IN', { month: 'short' });
                            const year = dateObj.getFullYear();
                            const hours = dateObj.getHours();
                            const minutes = dateObj.getMinutes();
                            const ampm = hours >= 12 ? 'PM' : 'AM';
                            const formattedHours = hours % 12 || 12;
                            const paddedMins = minutes < 10 ? `0${minutes}` : minutes;
                            const formattedDate = `${day} ${month} ${year}  •  ${formattedHours}:${paddedMins} ${ampm}`;

                            let displayDesc = item.description || 'Transaction';
                            if (displayDesc.toLowerCase().includes('cancelling order') || displayDesc.toLowerCase().includes('cancelled order')) {
                                const orderIdMatch = displayDesc.match(/[a-fA-F0-9]{24}/) || [displayDesc.split(' ').pop()];
                                displayDesc = `${item.amount} Kaitcoins added for cancelling order ${orderIdMatch[0]}.`;
                            }

                            const isCredit = item.type === 'credit';

                            return (
                                <View key={item._id || i} style={styles.transCard}>
                                    <View style={[styles.transIconWrap, { backgroundColor: isCredit ? '#F0FDF4' : '#FFF7ED' }]}>
                                        <Ionicons
                                            name={isCredit ? 'arrow-down' : 'arrow-up'}
                                            size={rf(20)}
                                            color={isCredit ? '#22C55E' : '#F38000'}
                                        />
                                    </View>
                                    <View style={styles.transInfo}>
                                        <Text allowFontScaling={false} style={styles.transDesc} numberOfLines={2}>{displayDesc}</Text>
                                        <View style={styles.transMetaRow}>
                                            <Ionicons name="time-outline" size={rf(11)} color="#94A3B8" />
                                            <Text allowFontScaling={false} style={styles.transDate}>{formattedDate}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.transAmtWrap}>
                                        <Text style={[styles.transAmt, { color: isCredit ? '#16A34A' : '#EA580C' }]}>
                                            {isCredit ? '+' : '-'}₹{item.amount}
                                        </Text>
                                        <View style={[styles.transTypeBadge, { backgroundColor: isCredit ? '#DCFCE7' : '#FFEDD5' }]}>
                                            <Text style={[styles.transTypeTxt, { color: isCredit ? '#15803D' : '#C2410C' }]}>
                                                {isCredit ? 'Credit' : 'Debit'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Add Money Modal */}
            <Modal
                visible={isPassModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsPassModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setIsPassModalVisible(false)}
                    >
                        <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={() => {}}>
                        {/* Modal header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderIcon}>
                                <Ionicons name="wallet" size={rf(24)} color="#F38000" />
                            </View>
                            <Text allowFontScaling={false} style={styles.modalTitle}>Add Money to Wallet</Text>
                            <Text allowFontScaling={false} style={styles.modalSub}>Enter your code, pass and amount</Text>
                        </View>

                        <View style={styles.modalDivider} />

                        <View style={[styles.modalInputGroup, activeInputField === 'code' && styles.inputGroupActive]}>
                            <View style={styles.modalInputIcon}>
                                <Ionicons name="barcode-outline" size={rf(18)} color={activeInputField === 'code' ? '#F38000' : '#94A3B8'} />
                            </View>
                            <View style={styles.modalInputInner}>
                                <Text allowFontScaling={false} style={styles.modalLabel}>Code</Text>
                                <TextInput
                                    allowFontScaling={false}
                                    style={styles.modalInput}
                                    placeholder="Enter redeem code"
                                    value={inputCode}
                                    onChangeText={setInputCode}
                                    placeholderTextColor="#CBD5E1"
                                    onFocus={() => setActiveInputField('code')}
                                    onBlur={() => setActiveInputField(null)}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        <View style={[styles.modalInputGroup, activeInputField === 'pass' && styles.inputGroupActive]}>
                            <View style={styles.modalInputIcon}>
                                <Ionicons name="key-outline" size={rf(18)} color={activeInputField === 'pass' ? '#F38000' : '#94A3B8'} />
                            </View>
                            <View style={styles.modalInputInner}>
                                <Text allowFontScaling={false} style={styles.modalLabel}>Password</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Enter pass"
                                    value={inputPass}
                                    onChangeText={setInputPass}
                                    secureTextEntry
                                    placeholderTextColor="#CBD5E1"
                                    onFocus={() => setActiveInputField('pass')}
                                    onBlur={() => setActiveInputField(null)}
                                />
                            </View>
                        </View>

                        <View style={[styles.modalInputGroup, activeInputField === 'amount' && styles.inputGroupActive]}>
                            <View style={styles.modalInputIcon}>
                                <Ionicons name="cash-outline" size={rf(18)} color={activeInputField === 'amount' ? '#F38000' : '#94A3B8'} />
                            </View>
                            <View style={styles.modalInputInner}>
                                <Text allowFontScaling={false} style={styles.modalLabel}>Amount (₹)</Text>
                                <TextInput
                                    allowFontScaling={false}
                                    style={styles.modalInput}
                                    placeholder="Enter amount"
                                    value={inputAmount}
                                    onChangeText={setInputAmount}
                                    keyboardType="numeric"
                                    placeholderTextColor="#CBD5E1"
                                    onFocus={() => setActiveInputField('amount')}
                                    onBlur={() => setActiveInputField(null)}
                                />
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsPassModalVisible(false)}>
                                <Text allowFontScaling={false} style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.addBtn, isPassSubmitting && styles.applyDisabled]}
                                onPress={handleAddMoneyWithCodePass}
                                disabled={isPassSubmitting}
                            >
                                {isPassSubmitting ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="add-circle-outline" size={rf(18)} color="#FFF" />
                                        <Text allowFontScaling={false} style={styles.addBtnText}>Add Money</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },

    // Hero
    heroSection: {
        backgroundColor: '#F38000',
        paddingHorizontal: wp(4.2),
        paddingBottom: hp(3.3),
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 14,
        borderBottomLeftRadius: rf(36),
        borderBottomRightRadius: rf(36),
    },
    heroBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: hp(1.2),
        marginBottom: hp(1.9),
    },
    backBtn: {
        width: wp(10.6),
        height: wp(10.6),
        borderRadius: wp(5.3),
        backgroundColor: 'rgba(255,255,255,0.22)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshBtn: {
        width: wp(10.6),
        height: wp(10.6),
        borderRadius: wp(5.3),
        backgroundColor: 'rgba(255,255,255,0.22)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 0.5,
    },

    // Balance Card
    balanceCard: {
        backgroundColor: '#FFF',
        borderRadius: rf(28),
        padding: wp(5.8),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 10,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: wp(21.3),
        backgroundColor: 'rgba(255,255,255,0.3)',
        transform: [{ skewX: '-20deg' }],
    },
    balanceCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.6),
    },
    balanceIconWrap: {
        width: wp(12.8),
        height: wp(12.8),
        borderRadius: rf(16),
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FED7AA',
    },
    balTagRow: { flexDirection: 'row', gap: wp(2.1) },
    balTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.6),
        backgroundColor: '#F0FDF4',
        paddingHorizontal: wp(3.2),
        paddingVertical: hp(0.7),
        borderRadius: rf(20),
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    liveDot: {
        width: wp(1.8),
        height: wp(1.8),
        borderRadius: wp(0.9),
        backgroundColor: '#22C55E',
    },
    balTagText: { color: '#16A34A', fontSize: rf(12), fontWeight: '800' },
    balLabel: {
        fontSize: rf(12),
        color: '#94A3B8',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: hp(0.7),
    },
    balAmount: {
        fontSize: rf(40),
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1.5,
    },
    balCardDivider: {
        height: hp(0.1),
        backgroundColor: '#F1F5F9',
        marginVertical: hp(1.9),
    },
    balCardFooter: { flexDirection: 'row', alignItems: 'center', gap: wp(1.6) },
    balFooterItem: { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
    balFooterText: { fontSize: rf(12), fontWeight: '700', color: '#64748B' },
    balFooterDot: { width: wp(1), height: wp(1), borderRadius: wp(0.5), backgroundColor: '#CBD5E1', marginHorizontal: wp(1) },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: wp(3.2),
        marginTop: hp(2.3),
        marginBottom: hp(0.5),
    },
    statCard: {
        flex: 1,
        borderRadius: rf(20),
        padding: wp(4.2),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconWrap: {
        width: wp(11.7),
        height: wp(11.7),
        borderRadius: rf(14),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1.2),
    },
    statValue: {
        fontSize: rf(18),
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: hp(0.2),
    },
    statLabel: {
        fontSize: rf(11),
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Redeem Card
    redeemCard: {
        backgroundColor: '#FFF',
        borderRadius: rf(24),
        padding: wp(5.3),
        marginTop: hp(1.9),
        marginBottom: hp(0.5),
        overflow: 'hidden',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#FEE8CC',
    },
    redeemCardBg: { position: 'absolute', top: hp(-4.7), right: wp(-10.6) },
    redeemCircle1: { position: 'absolute', top: 0, right: 0 },
    redeemCircle2: { position: 'absolute', top: hp(4.7), right: wp(10.6) },
    redeemMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: hp(1.9),
    },
    redeemLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(3.7) },
    redeemIconWrap: {
        width: wp(13.3),
        height: wp(13.3),
        borderRadius: rf(18),
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FED7AA',
    },
    redeemTitle: { fontSize: rf(16), fontWeight: '900', color: '#1E293B' },
    redeemSub: { fontSize: rf(12), color: '#94A3B8', marginTop: hp(0.2), fontWeight: '600' },
    passBtn: {
        backgroundColor: '#F38000',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4.8),
        paddingVertical: hp(1.4),
        borderRadius: rf(16),
        gap: wp(1.6),
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    passBtnText: { color: '#FFF', fontWeight: '900', fontSize: rf(15) },
    redeemInfoRow: {
        flexDirection: 'row',
        gap: wp(4.2),
        paddingTop: hp(1.9),
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    redeemInfoItem: { flexDirection: 'row', alignItems: 'center', gap: wp(1.3) },
    redeemInfoText: { fontSize: rf(12), fontWeight: '700', color: '#64748B' },

    // Benefits Banner
    benefitBanner: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: rf(20),
        marginTop: hp(1.9),
        padding: wp(4.2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    bannerBenefitItem: { flex: 1, alignItems: 'center', gap: wp(1) },
    benefitEmoji: { fontSize: rf(22), marginBottom: hp(0.2) },
    bannerBenefitLabel: { fontSize: rf(11), fontWeight: '900', color: '#1E293B', textAlign: 'center' },
    benefitDesc: { fontSize: rf(10), color: '#94A3B8', fontWeight: '600', textAlign: 'center' },
    bannerBenefitDivider: { width: wp(0.2), backgroundColor: '#F1F5F9', marginVertical: hp(0.5) },

    // Transactions
    histSection: { marginTop: 24 },
    histHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    histTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    histAccent: { width: 4, height: 20, backgroundColor: '#F38000', borderRadius: 2 },
    histTitle: { fontSize: 17, fontWeight: '900', color: '#1E293B' },
    histBadge: {
        backgroundColor: '#F38000',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    histBadgeText: { color: '#FFF', fontWeight: '900', fontSize: 12 },

    noTrans: {
        alignItems: 'center',
        paddingVertical: 50,
        backgroundColor: '#FFF',
        borderRadius: 24,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    noTransIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    noTransTitle: { fontSize: 17, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
    noTransSub: { fontSize: 13, color: '#94A3B8', fontWeight: '600', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },

    transCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    transIconWrap: {
        width: wp(13.3),
        height: wp(13.3),
        borderRadius: rf(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3.7),
    },
    transInfo: { flex: 1 },
    transDesc: { fontSize: rf(13), fontWeight: '800', color: '#1E293B', lineHeight: rf(19), marginBottom: hp(0.7) },
    transMetaRow: { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
    transDate: { fontSize: rf(11), color: '#94A3B8', fontWeight: '600' },
    transAmtWrap: { alignItems: 'flex-end', gap: hp(0.7) },
    transAmt: { fontSize: rf(16), fontWeight: '900', letterSpacing: -0.3 },
    transTypeBadge: {
        paddingHorizontal: wp(2.1),
        paddingVertical: hp(0.4),
        borderRadius: rf(8),
    },
    transTypeTxt: { fontSize: rf(10), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

    guestContainer: { paddingBottom: hp(3.5), paddingHorizontal: wp(5.3) },
    guestHero: { alignItems: 'center', marginTop: hp(4.7), marginBottom: hp(2.3) },
    guestIconCircle: { width: wp(20), height: wp(20), borderRadius: rf(40), backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: hp(1.9), shadowColor: '#F38000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 4 },
    guestTitle: { fontSize: rf(22), fontWeight: '900', color: '#1E293B', marginBottom: hp(0.9), textAlign: 'center', letterSpacing: -0.5 },
    guestSubtitle: { fontSize: rf(13), color: '#64748B', textAlign: 'center', lineHeight: rf(20), paddingHorizontal: wp(5.3) },
    benefitCard: { backgroundColor: '#FFF', borderRadius: rf(24), padding: wp(4.2), marginBottom: hp(3.5), shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
    benefitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp(1.2) },
    benefitIconBox: { width: wp(9), height: wp(9), borderRadius: rf(10), backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: wp(3.5) },
    benefitLabel: { fontSize: rf(14), fontWeight: '700', color: '#1E293B' },
    benefitSub: { fontSize: rf(11), color: '#94A3B8', marginTop: hp(0.1) },
    benefitDivider: { height: 1, backgroundColor: '#F8FAFC', marginLeft: wp(12.5), marginVertical: hp(0.4) },
    guestCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F38000', paddingVertical: hp(1.9), borderRadius: rf(18), gap: wp(2.1), shadowColor: '#F38000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    guestCtaText: { color: '#FFF', fontSize: rf(15), fontWeight: '900', letterSpacing: -0.2 },
    guestLoginLink: { marginTop: hp(2.3), alignItems: 'center' },
    guestLoginText: { fontSize: rf(13), color: '#64748B', fontWeight: '500' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: rf(36),
        borderTopRightRadius: rf(36),
        padding: wp(7.4),
        paddingBottom: hp(4.2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 30,
    },
    modalHeader: { alignItems: 'center', marginBottom: hp(2.3) },
    modalHeaderIcon: {
        width: wp(17),
        height: wp(17),
        borderRadius: rf(22),
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1.6),
        borderWidth: 2,
        borderColor: '#FED7AA',
    },
    modalTitle: { fontSize: rf(20), fontWeight: '900', color: '#1E293B', textAlign: 'center', letterSpacing: -0.5 },
    modalSub: { fontSize: rf(13), color: '#94A3B8', fontWeight: '600', marginTop: hp(0.5) },
    modalDivider: { height: hp(0.1), backgroundColor: '#F1F5F9', marginBottom: hp(2.3) },
    modalInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: rf(18),
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        marginBottom: hp(1.6),
        paddingLeft: wp(4.2),
        paddingRight: wp(3.2),
        paddingVertical: hp(0.7),
    },
    inputGroupActive: {
        borderColor: '#F38000',
        backgroundColor: '#FFFBF5',
    },
    modalInputIcon: { marginRight: wp(3.2) },
    modalInputInner: { flex: 1 },
    modalLabel: { fontSize: rf(10), fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: hp(0.2) },
    modalInput: {
        fontSize: rf(15),
        color: '#1E293B',
        fontWeight: '700',
        paddingVertical: hp(0.7),
    },
    modalActions: { flexDirection: 'row', gap: wp(3.7), marginTop: hp(1) },
    cancelBtn: {
        flex: 1,
        paddingVertical: hp(1.9),
        borderRadius: rf(18),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: { color: '#64748B', fontWeight: '900', fontSize: rf(15) },
    addBtn: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: hp(1.9),
        borderRadius: rf(18),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F38000',
        gap: wp(2.1),
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    applyDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
    addBtnText: { color: '#FFF', fontWeight: '900', fontSize: rf(15) },
});
