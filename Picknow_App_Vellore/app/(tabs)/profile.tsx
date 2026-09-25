import React, { useState, useEffect } from 'react';
import {
    StyleSheet, TouchableOpacity, ScrollView, View,
    Alert, TextInput, Modal, ActivityIndicator, RefreshControl, Text, Image, Animated, Share,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/Services/api';
import { useRouter } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import CustomHeader from '@/components/CustomHeader';
import PremiumLoader from '@/components/PremiumLoader';

export default function ProfileScreen() {
    const { user, token, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const scrollRef = React.useRef<any>(null);
    useScrollToTop(scrollRef);

    // Entrance Animation
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(30)).current;

    const [profile, setProfile] = useState<any>(user);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [editData, setEditData] = useState({ name: user?.name || '', email: user?.email || '', contact: user?.contact || '' });
    const [stats, setStats] = useState({ orders: 0, wallet: 0, wishlist: 0 });

    useEffect(() => {
        if (user) { setProfile(user); setEditData({ name: user.name || '', email: user.email || '', contact: user.contact || '' }); }
    }, [user]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (initialLoading) setInitialLoading(false);
        }, 3000); // 3s safety timeout

        if (token) {
            fetchProfile();
            fetchStats();
        } else {
            setInitialLoading(false);
        }
        return () => clearTimeout(timeout);
    }, [token]);

    useEffect(() => {
        if (!initialLoading) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]).start();
        }
    }, [initialLoading]);

    const fetchProfile = async () => {
        if (!token) {
            setInitialLoading(false);
            return;
        }
        try {
            const data = await authService.getProfile(token);
            const u = data.user || data;
            setProfile(u);
            setEditData({ name: u.name || '', email: u.email || '', contact: u.contact || '' });
        } catch (e) {
            console.error(e);
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!token) return;
        try {
            const [orders, wishlist, balance] = await Promise.all([
                authService.getUserOrders(token),
                authService.getWishlist(token),
                authService.checkBalance(token),
            ]);
            setStats({
                orders: orders.orders?.length || 0,
                wishlist: wishlist.count || wishlist.wishlist?.length || 0,
                wallet: balance.data?.walletBalance || balance.walletBalance || 0,
            });
        } catch (e) { console.error(e); }
    };

    const onRefresh = async () => { setRefreshing(true); await Promise.all([fetchProfile(), fetchStats()]); setRefreshing(false); };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const data = await authService.updateProfile(editData, token!);
            setProfile(data.user || data);
            setEditModal(false);
            Alert.alert('✅ Success', 'Profile updated successfully');
        } catch (e: any) { Alert.alert('Error', e.message || 'Update failed'); }
        finally { setLoading(false); }
    };

    const DELETE_REASONS = [
        "Privacy concerns",
        "Found a better alternative",
        "App is too complex",
        "Just want to take a break",
        "Other"
    ];

    const handleDeleteAccount = () => {
        if (!token) return;
        setDeleteModal(true);
    };

    const confirmDeleteAccount = async () => {
        if (!token) return;
        if (!deleteReason) {
            Alert.alert('Selection Required', 'Please select a reason for leaving.');
            return;
        }
        setDeleteModal(false);
        setLoading(true);
        try {
            await authService.deleteAccount(token);
            Alert.alert('✅ Success', 'Account deleted successfully.');
            logout();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete account');
        } finally {
            setLoading(false);
        }
    };
    
    const handleInvite = async () => {
        try {
            const message = `Hey! I'm using Picknow to shop for premium lifestyle and herbal products. You should check it out! \n\nDownload/Visit: https://picknow.in`;
            await Share.share({
                message,
                title: 'Invite to Picknow',
            });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const MENU_SECTIONS = [
        {
            title: 'My Activity',
            items: [
                { icon: 'cube-outline' as const, label: 'My Orders', sub: `${stats.orders} orders`, color: '#F38000', onPress: () => router.push('/(tabs)/orders' as any) },
                { icon: 'heart-outline' as const, label: 'Wishlist', sub: `${stats.wishlist} saved`, color: '#FF3B30', onPress: () => router.push('/wishlist') },
                { icon: 'wallet-outline' as const, label: 'My Wallet', sub: `₹${stats.wallet} balance`, color: '#4CAF50', onPress: () => router.push('/(tabs)/wallet' as any) },
                { icon: 'cart-outline' as const, label: 'Cart', sub: 'View cart items', color: '#5E5CE6', onPress: () => router.push('/(tabs)/cart' as any) },
            ],
        },
        {
            title: 'Account',
            items: [
                { icon: 'location-outline' as const, label: 'Saved Addresses', sub: 'Manage delivery addresses', color: '#007AFF', onPress: () => router.push('/addresses') },
                { icon: 'lock-closed-outline' as const, label: 'Change Password', sub: 'Update security', color: '#FF9500', onPress: () => router.push('/change-password') },
                { icon: 'gift-outline' as const, label: 'Invite Friends', sub: 'Refer and earn', color: '#AF52DE', onPress: handleInvite },
            ],
        },
        {
            title: 'Support',
items: [
  {
    icon: 'help-circle-outline' as const,
    label: 'Help Center',
    sub: 'Get help & contact support',
    color: '#34C759',
    onPress: () => router.push('/help-center')
  },
  {
    icon: 'newspaper-outline' as const,
    label: 'Read Articles',
    sub: 'Explore latest blog posts',
    color: '#F38000',
    onPress: () => router.push('/blogs' as any)
  },
  {
    icon: 'document-text-outline' as const,
    label: 'Terms & Conditions',
    sub: 'Understand usage rules',
    color: '#8E8E93',
    onPress: () => router.push('/terms')
  },
  {
    icon: 'shield-checkmark-outline' as const,
    label: 'Privacy Policy',
    sub: 'Learn how we protect data',
    color: '#8E8E93',
    onPress: () => router.push('/privacy')
  },
  {
    icon: 'bus-outline' as const,
    label: 'Shipping Policy',
    sub: 'Delivery timelines & details',
    color: '#8E8E93',
    onPress: () => router.push('/shipping')
  },
  {
    icon: 'refresh-circle-outline' as const,
    label: 'Cancellation & Refund Policy',
    sub: 'Refund rules & process',
    color: '#8E8E93',
    onPress: () => router.push('/refund')
  },
],
        },
    ];

    // Main Loading (Entire profile fetch) - We no longer return early to keep Header/Sidebar
    // We'll handle this within the render part.


    const initials = profile?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

    return (
        <View style={styles.container}>
            <CustomHeader
                title={!token ? "Create Profile" : "My Account"}
                showBack
                rightElement={
                    token ? (
                        <TouchableOpacity style={styles.editIconBtn} onPress={() => setEditModal(true)}>
                            <Ionicons name="settings-outline" size={rf(20)} color="#F38000" />
                        </TouchableOpacity>
                    ) : null
                }
            />

            {initialLoading ? (
                <PremiumLoader />
            ) : !token ? (
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.guestContainer}
                >
                    <View style={styles.guestHero}>
                        <View style={styles.guestIconCircle}>
                            <Ionicons name="person-add" size={rf(40)} color="#F38000" />
                        </View>
                        <Text allowFontScaling={false} style={styles.guestTitle}>Create Your Profile</Text>
                        <Text allowFontScaling={false} style={styles.guestSubtitle}>
                            Join the Picknow Elite community for a personalized shopping experience and exclusive benefits.
                        </Text>
                    </View>

                    <View style={styles.benefitCard}>
                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIconBox}>
                                <Ionicons name="time-outline" size={rf(18)} color="#F38000" />
                            </View>
                            <View>
                                <Text allowFontScaling={false} style={styles.benefitLabel}>Track Orders</Text>
                                <Text allowFontScaling={false} style={styles.benefitSub}>Real-time updates on your purchases</Text>
                            </View>
                        </View>

                        <View style={styles.benefitDivider} />

                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIconBox}>
                                <Ionicons name="heart-outline" size={rf(18)} color="#F38000" />
                            </View>
                            <View>
                                <Text allowFontScaling={false} style={styles.benefitLabel}>Save Favorites</Text>
                                <Text allowFontScaling={false} style={styles.benefitSub}>Keep track of products you love</Text>
                            </View>
                        </View>

                        <View style={styles.benefitDivider} />

                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIconBox}>
                                <Ionicons name="wallet-outline" size={rf(18)} color="#F38000" />
                            </View>
                            <View>
                                <Text allowFontScaling={false} style={styles.benefitLabel}>Picknow Wallet</Text>
                                <Text allowFontScaling={false} style={styles.benefitSub}>Faster checkouts and easy refunds</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.guestCta} 
                        onPress={() => router.push('/(auth)/register')}
                        activeOpacity={0.8}
                    >
                        <Text allowFontScaling={false} style={styles.guestCtaText}>Create Account Now</Text>
                        <Ionicons name="arrow-forward" size={rf(18)} color="#FFF" />
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
            ) : (
                <Animated.ScrollView
                    ref={scrollRef}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F38000" />}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + hp(0) }}
                    style={[styles.scroll, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
                >
                    {/* Profile Hero (Premium Showcase) */}
                    <View style={styles.premiumHeroSection}>
                        <View style={styles.heroCardPremium}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatarGlow} />
                                <View style={styles.avatarRing}>
                                    <View style={styles.avatarMain}>
                                        <Text allowFontScaling={false} style={styles.avatarTextPremium}>{initials}</Text>
                                    </View>
                                </View>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="shield-checkmark" size={rf(12)} color="#FFF" />
                                </View>
                            </View>

                            <View style={styles.heroInfo}>
                                <Text allowFontScaling={false} style={styles.premiumNameText}>{profile?.name || 'Picknow User'}</Text>

                                <View style={styles.infoDetails}>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="mail" size={rf(12)} color="#F38000" />
                                        <Text allowFontScaling={false} style={styles.infoText}>{profile?.email}</Text>
                                    </View>
                                    {profile?.contact && (
                                        <View style={styles.infoRow}>
                                            <Ionicons name="call" size={rf(12)} color="#F38000" />
                                            <Text allowFontScaling={false} style={styles.infoText}>{profile.contact}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Stats Grid (Sleek) */}
                    <View style={styles.statsShowcase}>
                        <TouchableOpacity style={styles.statChip} onPress={() => router.push('/(tabs)/orders' as any)}>
                            <Text allowFontScaling={false} style={styles.statValue}>{stats.orders}</Text>
                            <Text allowFontScaling={false} style={styles.statCaption}>Orders</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statChip} onPress={() => router.push('/wishlist')}>
                            <Text allowFontScaling={false} style={styles.statValue}>{stats.wishlist}</Text>
                            <Text allowFontScaling={false} style={styles.statCaption}>Saved</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.statChip, styles.statChipActive]} onPress={() => router.push('/(tabs)/wallet' as any)}>
                            <Text allowFontScaling={false} style={[styles.statValue, { color: '#F38000' }]}>₹{stats.wallet}</Text>
                            <Text allowFontScaling={false} style={styles.statCaption}>Wallet</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Menu Sections */}
                    {MENU_SECTIONS.map((section) => (
                        <View key={section.title} style={styles.menuSection}>
                            <Text allowFontScaling={false} style={styles.sectionLabel}>{section.title}</Text>
                            <View style={styles.menuCard}>
                                {section.items.map((item, i) => (
                                    <View key={item.label}>
                                        <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                                            <View style={[styles.menuIconWrap, { backgroundColor: item.color + '18' }]}>
                                                <Ionicons name={item.icon} size={rf(20)} color={item.color} />
                                            </View>
                                            <View style={styles.menuText}>
                                                <Text allowFontScaling={false} style={styles.menuLabel}>{item.label}</Text>
                                                {!!item.sub && <Text allowFontScaling={false} style={styles.menuSub}>{item.sub}</Text>}
                                            </View>
                                            <Ionicons name="chevron-forward" size={rf(16)} color="#C8C8C8" />
                                        </TouchableOpacity>
                                        {i < section.items.length - 1 && <View style={styles.menuDivider} />}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
                        <View style={styles.logoutIconBox}>
                            <Ionicons name="log-out" size={rf(18)} color="#FF3B30" />
                        </View>
                        <Text allowFontScaling={false} style={styles.logoutText}>Log Out Account</Text>
                        <Ionicons name="arrow-forward" size={rf(14)} color="#FF3B30" opacity={0.5} />
                    </TouchableOpacity>

                    {/* Delete Account */}
                    <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#FEF2F2', marginTop: hp(1.4), marginBottom: hp(2.3) }]} onPress={handleDeleteAccount} activeOpacity={0.8}>
                        <View style={[styles.logoutIconBox, { backgroundColor: '#FFF' }]}>
                            <Ionicons name="trash-outline" size={rf(18)} color="#EF4444" />
                        </View>
                        <Text allowFontScaling={false} style={[styles.logoutText, { color: '#EF4444' }]}>Delete Account</Text>
                        <Ionicons name="arrow-forward" size={rf(14)} color="#EF4444" opacity={0.5} />
                    </TouchableOpacity>

                    <View style={styles.footerBranding}>
                        <Text allowFontScaling={false} style={styles.versText}>Picknow Elite</Text>
                        <Text allowFontScaling={false} style={styles.versionNum}>Version 1.2.0 • Build 2025</Text>
                    </View>
                </Animated.ScrollView>
            )}

            {/* Edit Modal */}
            <Modal visible={editModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalTop}>
                            <Text allowFontScaling={false} style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setEditModal(false)}>
                                <Ionicons name="close" size={rf(24)} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {(['name', 'email', 'contact'] as const).map((field) => (
                            <View key={field} style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={styles.inputLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editData[field]}
                                    onChangeText={(v) => setEditData(p => ({ ...p, [field]: v }))}
                                    keyboardType={field === 'email' ? 'email-address' : field === 'contact' ? 'phone-pad' : 'default'}
                                    autoCapitalize={field === 'name' ? 'words' : 'none'}
                                    placeholder={`Enter ${field}`}
                                    placeholderTextColor="#CCC"
                                />
                            </View>
                        ))}

                        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleUpdate} disabled={loading}>
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text allowFontScaling={false} style={styles.saveBtnText}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Delete Account Modal */}
            <Modal visible={deleteModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalTop}>
                            <Text allowFontScaling={false} style={styles.modalTitle}>Delete Account</Text>
                            <TouchableOpacity onPress={() => setDeleteModal(false)}>
                                <Ionicons name="close" size={rf(24)} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.warningBox}>
                            <Ionicons name="warning" size={rf(20)} color="#EF4444" />
                            <Text allowFontScaling={false} style={styles.warningText}>This action is permanent and cannot be undone. All your data will be erased.</Text>
                        </View>

                        <Text allowFontScaling={false} style={styles.inputLabel}>Please tell us why you are leaving:</Text>
                        <View style={styles.reasonContainer}>
                            {DELETE_REASONS.map((reason) => (
                                <TouchableOpacity 
                                    key={reason} 
                                    style={[styles.reasonChip, deleteReason === reason && styles.reasonChipActive]}
                                    onPress={() => setDeleteReason(reason)}
                                    activeOpacity={0.7}
                                >
                                    <Text allowFontScaling={false} style={[styles.reasonChipText, deleteReason === reason && styles.reasonChipTextActive]}>{reason}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={[styles.deleteConfirmBtn, (!deleteReason || loading) && { opacity: 0.6 }]} onPress={confirmDeleteAccount} disabled={!deleteReason || loading}>
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text allowFontScaling={false} style={styles.deleteConfirmBtnText}>Permanently Delete Account</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    scroll: { flex: 1 },
    editIconBtn: { width: wp(10.6), height: wp(10.6), borderRadius: rf(14), backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },

    premiumHeroSection: {
        paddingHorizontal: wp(5.3),
        paddingTop: hp(2.3),
        marginBottom: hp(2.8),
    },
    heroCardPremium: {
        backgroundColor: '#FFFFFF',
        borderRadius: rf(32),
        padding: wp(6.4),
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
        elevation: 12,
        borderWidth: 1,
        borderColor: '#FEF3E7',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarGlow: {
        position: 'absolute',
        top: -hp(1),
        left: -hp(1),
        right: -hp(1),
        bottom: -hp(1),
        backgroundColor: '#F38000',
        borderRadius: rf(50),
        opacity: 0.05,
    },
    avatarRing: {
        padding: wp(1),
        borderRadius: rf(24),
        borderWidth: 1.5,
        borderColor: '#F3800030',
    },
    avatarMain: {
        width: wp(19.2),
        height: wp(19.2),
        borderRadius: rf(20),
        backgroundColor: '#F38000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 15, elevation: 8,
    },
    avatarTextPremium: {
        fontSize: rf(28),
        fontWeight: '900',
        color: '#FFF',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: hp(-0.5),
        right: wp(-1),
        backgroundColor: '#10B981',
        width: wp(6.4),
        height: wp(6.4),
        borderRadius: rf(12),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: wp(0.8),
        borderColor: '#FFF',
        elevation: 4,
    },
    heroInfo: {
        marginLeft: wp(5.3),
        flex: 1,
    },
    premiumNameText: {
        fontSize: rf(22),
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: hp(0.5),
        letterSpacing: -0.5,
    },
    idBadge: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: wp(2.6),
        paddingVertical: hp(0.5),
        borderRadius: rf(8),
        alignSelf: 'flex-start',
        marginBottom: hp(1.2),
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    idBadgeText: {
        fontSize: rf(9),
        fontWeight: '900',
        color: '#F38000',
        letterSpacing: 1.2,
    },
    infoDetails: {
        gap: hp(0.7),
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.6),
    },
    infoText: {
        fontSize: rf(13),
        color: '#64748B',
        fontWeight: '600',
    },
    statsShowcase: {
        flexDirection: 'row',
        gap: wp(4.2),
        paddingHorizontal: wp(5.3),
        marginBottom: hp(3.8),
    },
    statChip: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: rf(24),
        paddingVertical: hp(2.1),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statChipActive: {
        borderColor: '#F3800020',
        backgroundColor: '#FFFCFA',
    },
    statValue: {
        fontSize: rf(18),
        fontWeight: '900',
        color: '#1E293B',
    },
    statCaption: {
        fontSize: rf(10),
        color: '#94A3B8',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: hp(0.5),
    },
    menuSection: {
        marginBottom: hp(3.3),
        paddingHorizontal: wp(5.3),
    },
    sectionLabel: {
        fontSize: rf(12),
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: hp(1.9),
        marginLeft: wp(1),
    },
    menuCard: {
        backgroundColor: '#FFF',
        borderRadius: rf(28),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05, shadowRadius: 20, elevation: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(5.3),
        paddingVertical: hp(2.1),
    },
    menuIconWrap: {
        width: wp(11.2),
        height: wp(11.2),
        borderRadius: rf(14),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4.2),
    },
    menuText: {
        flex: 1,
    },
    menuLabel: {
        fontSize: rf(16),
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.3,
    },
    menuSub: {
        fontSize: rf(12),
        color: '#94A3B8',
        marginTop: hp(0.35),
        fontWeight: '500',
    },
    menuDivider: {
        height: hp(0.1),
        backgroundColor: '#F8FAFC',
        marginLeft: wp(20.8),
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: wp(5.3),
        marginTop: hp(0.9),
        paddingVertical: hp(2.1),
        paddingHorizontal: wp(6.4),
        backgroundColor: '#FFF',
        borderRadius: rf(24),
        borderWidth: 1.5,
        borderColor: '#FEF2F2',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    },
    logoutIconBox: {
        width: wp(8.5),
        height: wp(8.5),
        borderRadius: rf(10),
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4.2),
    },
    logoutText: {
        flex: 1,
        fontSize: rf(16),
        fontWeight: '800',
        color: '#EF4444',
    },
    footerBranding: {
        alignItems: 'center',
        marginTop: hp(1.2),
        paddingBottom: hp(1.2),
    },
    versText: {
        fontSize: rf(12),
        color: '#1E293B',
        fontWeight: '900',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    versionNum: {
        fontSize: rf(10),
        color: '#94A3B8',
        fontWeight: '700',
        marginTop: hp(0.7),
    },
    ctaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F38000', paddingHorizontal: wp(7.4), paddingVertical: hp(1.9), borderRadius: rf(20), shadowColor: '#F38000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    ctaBtnText: { color: '#FFF', fontWeight: '900', fontSize: rf(16), letterSpacing: -0.2 },

    guestContainer: { paddingBottom: hp(3.5), paddingHorizontal: wp(5.3) },
    guestHero: { alignItems: 'center', marginTop: hp(3.5), marginBottom: hp(2.3) },
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

    modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: rf(32), borderTopRightRadius: rf(32), padding: wp(6.4), paddingBottom: hp(4.7) },
    modalHandle: { width: wp(11.7), height: hp(0.6), borderRadius: rf(3), backgroundColor: '#F1F5F9', alignSelf: 'center', marginBottom: hp(2.8) },
    modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(3.3) },
    modalTitle: { fontSize: rf(22), fontWeight: '900', color: '#1E293B' },
    inputGroup: { marginBottom: hp(2.3) },
    inputLabel: { fontSize: rf(11), fontWeight: '900', color: '#94A3B8', marginBottom: hp(0.9), textTransform: 'uppercase', letterSpacing: 1 },
    input: { borderWidth: 1.5, borderColor: '#F1F5F9', borderRadius: rf(16), paddingHorizontal: wp(4.2), paddingVertical: hp(1.6), fontSize: rf(16), color: '#1E293B', backgroundColor: '#F8FAFC' },
    saveBtn: { backgroundColor: '#F38000', paddingVertical: hp(2.1), borderRadius: rf(18), alignItems: 'center', marginTop: hp(1.4), shadowColor: '#F38000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
    saveBtnText: { color: '#FFF', fontWeight: '900', fontSize: rf(16), letterSpacing: -0.2 },
    
    warningBox: { flexDirection: 'row', backgroundColor: '#FEF2F2', padding: wp(4.2), borderRadius: rf(16), alignItems: 'center', marginBottom: hp(2.8), gap: wp(3.2) },
    warningText: { flex: 1, fontSize: rf(13), color: '#DC2626', fontWeight: '600', lineHeight: rf(20) },
    reasonContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2.6), marginBottom: hp(3.5) },
    reasonChip: { paddingHorizontal: wp(4.2), paddingVertical: hp(1.4), borderRadius: rf(20), backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#F1F5F9' },
    reasonChipActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    reasonChipText: { fontSize: rf(14), color: '#64748B', fontWeight: '600' },
    reasonChipTextActive: { color: '#EF4444', fontWeight: '800' },
    deleteConfirmBtn: { backgroundColor: '#EF4444', paddingVertical: hp(2.1), borderRadius: rf(18), alignItems: 'center', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
    deleteConfirmBtnText: { color: '#FFF', fontWeight: '900', fontSize: rf(16), letterSpacing: -0.2 },
});
