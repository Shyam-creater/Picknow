import React, { useState } from 'react';
import {
    StyleSheet, TouchableOpacity, ScrollView, View,
    TextInput, ActivityIndicator, Alert, Text, Switch,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/Services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';

const TYPE_OPTIONS = [
    { label: 'Home', icon: 'home-outline' as const, color: '#F38000' },
    { label: 'Work', icon: 'briefcase-outline' as const, color: '#007AFF' },
    { label: 'Other', icon: 'location-outline' as const, color: '#5E5CE6' },
];

const Field = ({ label, icon, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'words' }: any) => {
    const [focused, setFocused] = useState(false);
    return (
        <View style={fieldStyles.wrap}>
            <Text allowFontScaling={false} style={fieldStyles.label}>{label}</Text>
            <View style={[fieldStyles.row, focused && fieldStyles.rowFocused]}>
                <View style={fieldStyles.iconBox}>
                    <Ionicons name={icon} size={rf(20)} color={focused ? '#F38000' : '#BBBBBB'} />
                </View>
                <TextInput
                    style={fieldStyles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#CCC"
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoCorrect={false}
                    allowFontScaling={false}
                />
            </View>
        </View>
    );
};

const fieldStyles = StyleSheet.create({
    wrap: { marginBottom: hp(2.5) },
    label: { fontSize: rf(11), fontWeight: '800', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: hp(1), paddingLeft: wp(1) },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: wp(4), borderWidth: 1.5, borderColor: '#F1F3F5', shadowColor: '#000', shadowOffset: { width: 0, height: hp(0.5) }, shadowOpacity: 0.02, shadowRadius: wp(2), elevation: 1 },
    rowFocused: { borderColor: '#F38000', backgroundColor: '#FFF', shadowOpacity: 0.05, shadowRadius: wp(3) },
    iconBox: { width: wp(12), justifyContent: 'center', alignItems: 'center' },
    input: { flex: 1, paddingVertical: hp(1.8), paddingRight: wp(4), fontSize: rf(15), color: '#111', fontWeight: '600' },
});

export default function AddAddressScreen() {
    const { token } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    const editAddress = params.address ? JSON.parse(params.address as string) : null;
    const isEdit = !!editAddress;

    const [form, setForm] = useState({
        name: editAddress?.name || '',
        mobile: editAddress?.mobile || '',
        street: editAddress?.street || '',
        city: editAddress?.city || '',
        state: editAddress?.state || '',
        pincode: editAddress?.pincode || '',
        type: editAddress?.type || 'Home',
        isDefault: editAddress?.isDefault || false,
    });

    const [loading, setLoading] = useState(false);
    const set = (k: keyof typeof form) => (v: any) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        const required = ['name', 'mobile', 'street', 'city', 'pincode'];
        const missing = required.filter(k => !form[k as keyof typeof form]);
        if (missing.length) { Alert.alert('Missing Fields', `Please fill in: ${missing.join(', ')}`); return; }
        setLoading(true);
        try {
            if (isEdit) {
                await authService.updateAddress(editAddress._id, form, token!);
                Alert.alert('✅ Updated', 'Address updated successfully', [{ text: 'OK', onPress: () => router.back() }]);
            } else {
                await authService.addAddress(form, token!);
                Alert.alert('✅ Added', 'New address saved', [{ text: 'OK', onPress: () => router.back() }]);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not save address');
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <CustomHeader
                title={isEdit ? 'Edit Address' : 'New Address'}
                showBack
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + hp(5) }]}
            >
                {/* Address Type */}
                <Text allowFontScaling={false} style={styles.sectionLabel}>Address Type</Text>
                <View style={styles.typeRow}>
                    {TYPE_OPTIONS.map((t) => (
                        <TouchableOpacity
                            key={t.label}
                            style={[styles.typeBtn, form.type === t.label && styles.typeBtnActive]}
                            onPress={() => set('type')(t.label)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={form.type === t.label ? (t.icon.replace('-outline', '') as any) : t.icon} size={rf(18)} color={form.type === t.label ? '#FFF' : t.color} />
                            <Text allowFontScaling={false} style={[styles.typeBtnText, form.type === t.label && styles.typeBtnTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Fields */}
                <Field label="Full Name" icon="person-outline" value={form.name} onChangeText={set('name')} placeholder="Enter name" autoCapitalize="words" />
                <Field label="Mobile Number" icon="call-outline" value={form.mobile} onChangeText={set('mobile')} placeholder="10-digit number" keyboardType="phone-pad" autoCapitalize="none" />
                <Field label="Street / House No." icon="business-outline" value={form.street} onChangeText={set('street')} placeholder="Flat, Building, Road" />

                <View style={styles.halfRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Field label="Pincode" icon="barcode-outline" value={form.pincode} onChangeText={set('pincode')} placeholder="6-digit" keyboardType="number-pad" autoCapitalize="none" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Field label="City" icon="map-outline" value={form.city} onChangeText={set('city')} placeholder="City" />
                    </View>
                </View>

                <Field label="State" icon="flag-outline" value={form.state} onChangeText={set('state')} placeholder="State name" />

                {/* Default Toggle */}
                <View style={styles.defaultRow}>
                    <View style={styles.defaultInfo}>
                        <View style={styles.defaultIconWrap}>
                            <Ionicons name="star" size={rf(20)} color="#F38000" />
                        </View>
                        <View>
                            <Text allowFontScaling={false} style={styles.defaultLabel}>Primary Address</Text>
                            <Text allowFontScaling={false} style={styles.defaultSub}>Set as your main delivery point</Text>
                        </View>
                    </View>
                    <Switch
                        value={form.isDefault}
                        onValueChange={set('isDefault')}
                        trackColor={{ false: '#E0E0E0', true: '#F38000' }}
                        thumbColor="#FFF"
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading
                        ? <ActivityIndicator color="#FFF" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={rf(20)} color="#FFF" />
                            <Text allowFontScaling={false} style={styles.saveBtnText}> {isEdit ? 'Update Address' : 'Save Address'}</Text>
                        </>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFC' },
    content: { padding: wp(6), paddingTop: hp(2) },
    sectionLabel: { fontSize: rf(11), fontWeight: '800', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: hp(1.5), paddingLeft: wp(1) },
    typeRow: { flexDirection: 'row', gap: wp(3), marginBottom: hp(3.5) },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(2),
        paddingVertical: hp(1.5),
        borderRadius: wp(3.5),
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF'
    },
    typeBtnActive: { backgroundColor: '#F38000', borderColor: '#F38000' },
    typeBtnText: { fontSize: rf(13), fontWeight: '800', color: '#999' },
    typeBtnTextActive: { color: '#FFF' },
    halfRow: { flexDirection: 'row' },
    defaultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: wp(5),
        padding: wp(4.5),
        marginBottom: hp(4),
        borderWidth: 1.5,
        borderColor: '#F1F3F5',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.7) },
        shadowOpacity: 0.03,
        shadowRadius: wp(2.5),
        elevation: 2
    },
    defaultInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    defaultIconWrap: { width: wp(9), height: wp(9), borderRadius: wp(2.5), backgroundColor: '#FFF5F0', justifyContent: 'center', alignItems: 'center', marginRight: wp(3) },
    defaultLabel: { fontSize: rf(16), fontWeight: '800', color: '#111' },
    defaultSub: { fontSize: rf(12), color: '#AAAAAA', marginTop: hp(0.2), fontWeight: '500' },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F38000',
        paddingVertical: hp(2.2),
        borderRadius: wp(4.5),
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(1) },
        shadowOpacity: 0.35,
        shadowRadius: wp(3),
        elevation: 8
    },
    saveBtnText: { color: '#FFF', fontSize: rf(16), fontWeight: '900', letterSpacing: -0.2 },
});
