import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomHeader from '@/components/CustomHeader';
import { blogService } from '@/Services/api';

// const { width } = Dimensions.get('window');
const API_URL = 'https://backmern.picknow.in';

const FALLBACK = require('../assets/images/Kairaa4.png');

const imgUrl = (img: any) => {
    if (!img) return FALLBACK;
    const s = Array.isArray(img) ? img[0] : img;
    if (!s) return FALLBACK;
    if (s.startsWith('http')) return { uri: s };
    if (s.startsWith('/')) return { uri: `${API_URL}${s}` };
    if (s.includes('uploads')) return { uri: `${API_URL}/${s}` };
    return { uri: `${API_URL}/images/${s}` };
};

export default function BlogsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const res = await blogService.getAllBlogs();
            setBlogs(Array.isArray(res) ? res : (res?.blogs || res?.data || []));
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    if (loading && !refreshing) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#F38000" />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <CustomHeader
                title="Latest Articles"
                showBack
                onBackPress={() => router.back()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBlogs(); }} tintColor="#F38000" />}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + hp(2.5) }]}
            >
                {blogs.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="documents-outline" size={rf(60)} color="#CBD5E1" />
                        <Text allowFontScaling={false} style={styles.emptyText}>No articles found yet.</Text>
                    </View>
                ) : (
                    blogs.map((blog: any, i: number) => (
                        <TouchableOpacity key={blog._id || i} style={styles.blogCard} activeOpacity={0.9}>
                            <Image source={imgUrl(blog.image)} style={styles.blogImg} contentFit="cover" />
                            <View style={styles.blogBody}>
                                <Text allowFontScaling={false} style={styles.blogTag}>ARTICLE</Text>
                                <Text allowFontScaling={false} style={styles.blogTitle}>{blog.title}</Text>
                                <Text allowFontScaling={false} style={styles.blogDesc} numberOfLines={3}>
                                    {blog.description ? blog.description.replace(/<[^>]+>/g, '') : ''}
                                </Text>
                                <View style={styles.blogFooter}>
                                    <View style={styles.readMore}>
                                        <Text allowFontScaling={false} style={styles.readMoreText}>Read More</Text>
                                        <Ionicons name="arrow-forward" size={rf(14)} color="#F38000" />
                                    </View>
                                    <Text allowFontScaling={false} style={styles.date}>{new Date(blog.createdAt).toLocaleDateString()}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: wp(4), paddingVertical: hp(1.5),
        backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#EDF2F7',
    },
    backBtn: { width: wp(10), height: wp(10), justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: rf(18), fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    content: { padding: wp(4) },
    blogCard: {
        backgroundColor: '#FFF', borderRadius: wp(6), overflow: 'hidden',
        marginBottom: hp(2.5),
        shadowColor: '#64748B', shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.1, shadowRadius: wp(3), elevation: 5,
        borderWidth: 1, borderColor: '#EDF2F7',
    },
    blogImg: { width: '100%', height: hp(25), backgroundColor: '#F1F5F9' },
    blogBody: { padding: wp(4.5) },
    blogTag: { fontSize: rf(10), fontWeight: '900', color: '#F38000', letterSpacing: 1.5, marginBottom: hp(1) },
    blogTitle: { fontSize: rf(18), fontWeight: '900', color: '#1E293B', lineHeight: rf(24), marginBottom: hp(1) },
    blogDesc: { fontSize: rf(14), color: '#64748B', lineHeight: rf(20), marginBottom: hp(2) },
    blogFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    readMore: { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
    readMoreText: { fontSize: rf(14), fontWeight: '800', color: '#F38000' },
    date: { fontSize: rf(12), color: '#94A3B8', fontWeight: '500' },
    empty: { alignItems: 'center', marginTop: hp(12), gap: hp(1.5) },
    emptyText: { fontSize: rf(16), color: '#94A3B8', fontWeight: '600' },
});
