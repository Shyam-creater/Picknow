import React, { useState, useEffect } from 'react';
import {
    StyleSheet, TouchableOpacity, ScrollView, View,
    ActivityIndicator, RefreshControl, Alert, Text, Animated,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/Services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';

const TYPE_COLORS: Record<string, string> = {
    Home: '#F38000', Work: '#007AFF', Other: '#5E5CE6',
};

export default function AddressesScreen() {
    const { token } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Entrance Animation
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(30)).current;

    useEffect(() => { if (token) fetchAddresses(); }, [token]);

    const fetchAddresses = async () => {
        try {
            const data = await authService.getAddresses(token!);
            setAddresses(data.addresses || []);
        } catch (e) { console.error(e); }
        finally {
            setLoading(false);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]).start();
        }
    };

    const onRefresh = async () => { setRefreshing(true); await fetchAddresses(); setRefreshing(false); };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Address?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await authService.deleteAddress(id, token!);
                        setAddresses(a => a.filter(x => x._id !== id));
                    } catch (e: any) { Alert.alert('Error', e.message); }
                }
            }
        ]);
    };

    const handleDefault = async (id: string) => {
        try {
            await authService.setDefaultAddress(id, token!);
            setAddresses(a => a.map(x => ({ ...x, isDefault: x._id === id })));
        } catch (e: any) { Alert.alert('Error', e.message); }
    };

    if (loading) return (
        <View style={[styles.center, { paddingTop: insets.top }]}>
            <ActivityIndicator size="large" color="#F38000" />
        </View>
    );

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Saved Addresses"
                showBack
                rightElement={
                    <TouchableOpacity style={styles.addIconBtn} onPress={() => router.push('/add-address')}>
                        <MaterialIcons name="add" size={rf(26)} color="#F38000" />
                    </TouchableOpacity>
                }
            />

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: wp(5), paddingBottom: insets.bottom + hp(8) }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F38000" />}
                style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
                {addresses.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="location-outline" size={rf(48)} color="#F38000" />
                        </View>
                        <Text allowFontScaling={false} style={styles.emptyTitle}>No Saved Addresses</Text>
                        <Text allowFontScaling={false} style={styles.emptySub}>Add a delivery address to enjoy faster checkout and real-time delivery tracking.</Text>
                        <TouchableOpacity style={styles.emptyAddBtn} onPress={() => router.push('/add-address')}>
                            <Text allowFontScaling={false} style={styles.emptyAddBtnText}>Add New Address</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    addresses.map((addr) => (
                        <View key={addr._id} style={[styles.addrCard, addr.isDefault && styles.defaultCard]}>
                            {/* Card Top */}
                            <View style={styles.cardTop}>
                                <View style={[styles.typeTag, { backgroundColor: (TYPE_COLORS[addr.type] || '#888') + '15', borderColor: (TYPE_COLORS[addr.type] || '#888') + '30' }]}>
                                    <Ionicons
                                        name={addr.type === 'Home' ? 'home' : addr.type === 'Work' ? 'briefcase' : 'location'}
                                        size={rf(12)}
                                        color={TYPE_COLORS[addr.type] || '#888'}
                                    />
                                    <Text allowFontScaling={false} style={[styles.typeText, { color: TYPE_COLORS[addr.type] || '#888' }]}>{addr.type}</Text>
                                </View>
                                {addr.isDefault && (
                                    <View style={styles.defaultBadge}>
                                        <Ionicons name="shield-checkmark" size={rf(12)} color="#10B981" />
                                        <Text allowFontScaling={false} style={styles.defaultBadgeText}> Primary Address</Text>
                                    </View>
                                )}
                            </View>

                            {/* Address Info */}
                            <Text allowFontScaling={false} style={styles.addrName}>{addr.name}</Text>
                            <Text allowFontScaling={false} style={styles.addrPhone}>📞 {addr.mobile}</Text>
                            <Text allowFontScaling={false} style={styles.addrLine}>{addr.street}</Text>
                            <Text allowFontScaling={false} style={styles.addrLine}>{addr.city}, {addr.state} - {addr.pincode}</Text>
                            {addr.country && <Text allowFontScaling={false} style={styles.addrLine}>{addr.country}</Text>}

                            {/* Card Actions */}
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/add-address', params: { address: JSON.stringify(addr) } })}>
                                    <Ionicons name="create-outline" size={rf(16)} color="#007AFF" />
                                    <Text allowFontScaling={false} style={[styles.actionTxt, { color: '#007AFF' }]}>Edit</Text>
                                </TouchableOpacity>
                                {!addr.isDefault && (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDefault(addr._id)}>
                                        <Ionicons name="checkmark-circle-outline" size={rf(16)} color="#10B981" />
                                        <Text allowFontScaling={false} style={[styles.actionTxt, { color: '#10B981' }]}>Primary</Text>
                                    </TouchableOpacity>
                                )}
                                <View style={{ flex: 1 }} />
                                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(addr._id)}>
                                    <Ionicons name="trash-outline" size={rf(16)} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                {addresses.length > 0 && (
                    /* Add New CTA */
                    <TouchableOpacity style={styles.addNewBtn} onPress={() => router.push('/add-address')} activeOpacity={0.8}>
                        <View style={styles.addNewInner}>
                            <Ionicons name="add-circle" size={rf(24)} color="#F38000" />
                            <Text allowFontScaling={false} style={styles.addNewText}>Add New Address</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFC', padding: wp(5) },
    addIconBtn: { width: wp(9), height: wp(9), borderRadius: wp(3), backgroundColor: '#FFF5EB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFE8D6' },
    emptyWrap: { alignItems: 'center', paddingTop: hp(10), paddingHorizontal: wp(10) },
    emptyIconBox: { width: wp(25), height: wp(25), borderRadius: wp(10), backgroundColor: '#FFF5EB', justifyContent: 'center', alignItems: 'center', marginBottom: hp(2.5), shadowColor: '#F38000', shadowOffset: { width: 0, height: hp(1) }, shadowOpacity: 0.1, shadowRadius: wp(4), elevation: 4 },
    emptyTitle: { fontSize: rf(22), fontWeight: '900', color: '#111', marginBottom: hp(1.5) },
    emptySub: { fontSize: rf(14), color: '#999', textAlign: 'center', lineHeight: rf(22), marginBottom: hp(4) },
    emptyAddBtn: { backgroundColor: '#F38000', paddingHorizontal: wp(7), paddingVertical: hp(1.7), borderRadius: wp(3.5), shadowColor: '#F38000', shadowOffset: { width: 0, height: hp(0.7) }, shadowOpacity: 0.3, shadowRadius: wp(3), elevation: 6 },
    emptyAddBtnText: { color: '#FFF', fontWeight: '900', fontSize: rf(16) },
    addrCard: {
        backgroundColor: '#FFF',
        borderRadius: wp(6),
        padding: wp(5),
        marginBottom: hp(2.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(1.2) },
        shadowOpacity: 0.05,
        shadowRadius: wp(4),
        elevation: 6,
        borderWidth: 1.5,
        borderColor: '#F1F3F5'
    },
    defaultCard: { borderColor: '#F3800030', backgroundColor: '#FFF' },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: wp(2.5), marginBottom: hp(2) },
    typeTag: { flexDirection: 'row', alignItems: 'center', gap: wp(1.5), paddingHorizontal: wp(3), paddingVertical: hp(0.6), borderRadius: wp(2.5), borderWidth: 1 },
    typeText: { fontSize: rf(12), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    defaultBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: wp(3), paddingVertical: hp(0.6), borderRadius: wp(2.5), borderWidth: 1, borderColor: '#D1FAE5' },
    defaultBadgeText: { fontSize: rf(11), fontWeight: '800', color: '#10B981', textTransform: 'uppercase' },
    addrName: { fontSize: rf(18), fontWeight: '900', color: '#111', marginBottom: hp(0.5), letterSpacing: -0.5 },
    addrPhone: { fontSize: rf(14), color: '#999', fontWeight: '700', marginBottom: hp(1.2) },
    addrLine: { fontSize: rf(14), color: '#666', lineHeight: rf(21), fontWeight: '500' },
    cardActions: { flexDirection: 'row', gap: wp(2.5), marginTop: hp(2.2), paddingTop: hp(2), borderTopWidth: 1.5, borderTopColor: '#F9FAFC', alignItems: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: wp(1.5), paddingHorizontal: wp(3.5), paddingVertical: hp(1.1), borderRadius: wp(3), backgroundColor: '#F7F8FA', borderWidth: 1, borderColor: '#E5E7EB' },
    deleteBtn: { backgroundColor: '#FFF5F5', borderColor: '#FFEDED', width: wp(11), justifyContent: 'center' },
    actionTxt: { fontSize: rf(13), fontWeight: '800' },
    addNewBtn: { marginTop: hp(1) },
    addNewInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(3),
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#F3800060',
        borderRadius: wp(6),
        paddingVertical: hp(2.5),
        backgroundColor: '#FFF'
    },
    addNewText: { fontSize: rf(16), fontWeight: '900', color: '#F38000', letterSpacing: -0.3 },
});
