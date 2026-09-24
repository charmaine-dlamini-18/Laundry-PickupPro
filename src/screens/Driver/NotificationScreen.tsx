import React from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
    useFonts,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import type { DriverStackParamList } from '../../navigation/DriverNavigator';
import FancyAlert from '../../components/FancyAlert';
import {
    useNotifications,
    type AppNotification,
} from '../../context/NotificationsContext';

const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const WHITE = '#FFFFFF';
const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const GREEN = '#00A85A';
const GREEN_TINT = '#DDF8E8';
const BORDER = '#E8ECF1';

const GRADIENT_HEADER = ['#FFFFFF', '#F2F4F7'] as const;

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<
    DriverStackParamList,
    'Notifications'
>;

type Notification = {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    tint: string;
};

const KIND_META: Record<
    AppNotification['kind'],
    {
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        color: string;
        tint: string;
    }
> = {
    order_assigned: {
        icon: 'truck-delivery-outline',
        color: BLUE,
        tint: BLUE_TINT,
    },
    driver_assigned: {
        icon: 'clipboard-check-outline',
        color: BLUE,
        tint: BLUE_TINT,
    },
    order_placed: {
        icon: 'clipboard-check-outline',
        color: BLUE,
        tint: BLUE_TINT,
    },
    order_updated: {
        icon: 'update',
        color: BLUE,
        tint: BLUE_TINT,
    },
    new_message: {
        icon: 'message-text-outline',
        color: GREEN,
        tint: GREEN_TINT,
    },
    order_delivered: {
        icon: 'check-circle-outline',
        color: GREEN,
        tint: GREEN_TINT,
    },
    info: {
        icon: 'information-outline',
        color: BLUE,
        tint: BLUE_TINT,
    },
};

function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

function decorate(notification: AppNotification): Notification {
    const meta = KIND_META[notification.kind] ?? {
        icon: 'bell-outline' as const,
        color: TEXT_MUTED,
        tint: '#F0F3F6',
    };
    return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        time: relativeTime(notification.createdAt),
        read: notification.read,
        ...meta,
    };
}

export default function NotificationScreen({
    navigation,
}: Props) {
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    const {
        notifications: stored,
        unreadCount,
        loading,
        markAsRead: persistAsRead,
        markAllAsRead: persistAllAsRead,
    } = useNotifications();

    const notifications = stored.map(decorate);

    const [selected, setSelected] = React.useState<Notification | null>(null);

    const openNotification = (notification: Notification) => {
        persistAsRead(notification.id);
        setSelected(notification);
    };

    const markAllAsRead = () => {
        persistAllAsRead();
    };

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={styles.safeArea}>

            {/* Header */}
            <LinearGradient colors={GRADIENT_HEADER} style={styles.header}>

                <TouchableOpacity
                    style={styles.headerIcon}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialCommunityIcons
                        name="arrow-left"
                        size={24}
                        color={TEXT_DARK}
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Notifications
                </Text>

                <TouchableOpacity
                    onPress={markAllAsRead}
                    disabled={unreadCount === 0}
                >
                    <Text
                        style={[
                            styles.markAll,
                            unreadCount === 0 && styles.markAllDisabled,
                        ]}
                    >
                        Mark all
                    </Text>
                </TouchableOpacity>

            </LinearGradient>

            {/* Unread badge */}
            {unreadCount > 0 && (
                <View style={styles.unreadBanner}>
                    <Text style={styles.unreadBannerText}>
                        {unreadCount} unread notification
                        {unreadCount > 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            {/* List */}
            <ScrollView contentContainerStyle={styles.container}>

                {notifications.length === 0 && (
                    <View style={styles.emptyWrap}>
                        <View style={styles.emptyIconWrap}>
                            <MaterialCommunityIcons
                                name="bell-off-outline"
                                size={38}
                                color={BLUE}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {loading ? 'Loading notifications…' : 'No notifications yet'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            Alerts about assigned orders, customer messages and
                            deliveries will appear here.
                        </Text>
                    </View>
                )}

                {notifications.map((notification) => (
                    <TouchableOpacity
                        key={notification.id}
                        style={styles.card}
                        activeOpacity={0.7}
                        onPress={() => openNotification(notification)}
                    >
                        <View
                            style={[
                                styles.iconCircle,
                                { backgroundColor: notification.tint },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={notification.icon}
                                size={22}
                                color={notification.color}
                            />
                        </View>

                        <View style={styles.cardBody}>

                            <View style={styles.cardTitleRow}>

                                <Text
                                    style={[
                                        styles.cardTitle,
                                        !notification.read &&
                                        styles.cardTitleUnread,
                                    ]}
                                >
                                    {notification.title}
                                </Text>

                                {!notification.read && (
                                    <View style={styles.unreadDot} />
                                )}

                            </View>

                            <Text style={styles.cardMessage} numberOfLines={2}>
                                {notification.message}
                            </Text>

                            <View style={styles.cardFooter}>
                                <Text style={styles.cardTime}>
                                    {notification.time}
                                </Text>
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={16}
                                    color="#B9BEC7"
                                />
                            </View>

                        </View>

                    </TouchableOpacity>
                ))}

            </ScrollView>

            {/* Full Message Alert */}
            <FancyAlert
                visible={selected !== null}
                title={selected?.title ?? ''}
                message={selected?.message ?? ''}
                icon={selected?.icon}
                iconColor={selected?.color}
                iconBackground={selected?.tint}
                onClose={() => setSelected(null)}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: WHITE,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },

    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEF1F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E6EB',
    },

    headerTitle: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 18,
        color: TEXT_DARK,
    },

    markAll: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 13,
        color: BLUE,
    },

    markAllDisabled: {
        color: '#B9BEC7',
    },

    unreadBanner: {
        backgroundColor: BLUE_TINT,
        paddingHorizontal: 20,
        paddingVertical: 8,
    },

    unreadBannerText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 12,
        color: BLUE,
    },

    container: {
        paddingHorizontal: isWeb ? 32 : 16,
        paddingVertical: 16,
        paddingBottom: 30,
        ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
    },

    card: {
        backgroundColor: WHITE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        elevation: 1,
        shadowColor: '#26384A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },

    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    cardBody: {
        flex: 1,
    },

    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    cardTitle: {
        flex: 1,
        fontFamily: 'Poppins_500Medium',
        fontSize: 15,
        color: TEXT_DARK,
    },

    cardTitleUnread: {
        fontFamily: 'Poppins_700Bold',
    },

    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: BLUE,
        marginLeft: 8,
    },

    cardMessage: {
        marginTop: 3,
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: TEXT_MUTED,
        lineHeight: 19,
    },

    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },

    cardTime: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 11,
        color: '#B9BEC7',
    },

    emptyWrap: {
        alignItems: 'center',
        paddingTop: 70,
        paddingHorizontal: 36,
    },

    emptyIconWrap: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: BLUE_TINT,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyTitle: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: TEXT_DARK,
        marginTop: 14,
        textAlign: 'center',
    },

    emptySubtitle: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: TEXT_MUTED,
        marginTop: 6,
        textAlign: 'center',
        lineHeight: 20,
    },

});
