import React, { useMemo, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BookingHeader from '../../components/BookingHeader';
import { useAuth } from '../../hooks/useAuth';
import { useDriverOrders } from '../../context/DriverOrdersContext';

import type { DriverStackParamList } from '../../navigation/DriverNavigator';

const isWeb = Platform.OS === 'web';

const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const WHITE = '#FFFFFF';
const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const PURPLE = '#7857FF';
const GREEN = '#00A85A';
const GREEN_TINT = '#DDF8E8';
const BORDER = '#E8ECF1';
const GRADIENT_PRIMARY = [BLUE, PURPLE] as const;

type Props = NativeStackScreenProps<
    DriverStackParamList,
    'Navigation'
>;

type Stop = {
    id: string;
    orderNumber: string;
    type: 'Pickup' | 'Delivery';
    customer: string;
    phone: string;
    address: string;
    time: string;
    notes: string;
    done: boolean;
};

export default function NavigationScreen({
    navigation,
}: Props) {
    const { user } = useAuth();
    const { orders } = useDriverOrders();

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    const [started, setStarted] = useState(false);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const routeStops = useMemo<Stop[]>(
        () =>
            orders
                .filter(
                    (order) =>
                        !order.driver || order.driver === user?.name,
                )
                .filter((order) => order.status !== 'Completed')
                .map((order) => ({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    type:
                        order.type === 'Delivery'
                            ? 'Delivery'
                            : 'Pickup',
                    customer: order.customer,
                    phone: order.phone ?? '',
                    address: order.address,
                    time: order.time,
                    notes: order.notes?.trim()
                        ? order.notes
                        : 'No additional notes for this stop.',
                    done: false,
                })),
        [orders, user],
    );

    const stops: Stop[] = routeStops.map((stop) => ({
        ...stop,
        done: completedIds.includes(stop.id),
    }));

    const completedCount = stops.filter((stop) => stop.done).length;
    const currentStop = started
        ? stops[currentIndex]
        : null;
    const finished =
        started &&
        stops.length > 0 &&
        completedCount === stops.length;

    const startRoute = () => {
        if (stops.length === 0) return;
        setStarted(true);
    };

    const completeCurrentStop = () => {
        if (!currentStop) return;

        setCompletedIds((prev) => [...prev, currentStop.id]);

        if (currentIndex + 1 >= stops.length) {
            setCurrentIndex(stops.length);
        } else {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const callCustomer = () => {
        if (!currentStop) return;
        if (!currentStop.phone) {
            Alert.alert(
                'Cannot call',
                'No phone number is available for this customer.',
            );
            return;
        }
        Linking.openURL(`tel:${currentStop.phone}`).catch(() =>
            Alert.alert(
                'Cannot call',
                'No calling app is available on this device.',
            ),
        );
    };

    const openMaps = () => {
        if (!currentStop) return;
        Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                currentStop.address,
            )}`,
        ).catch(() =>
            Alert.alert(
                'Cannot open maps',
                'No map application is available on this device.',
            ),
        );
    };

    const finishRoute = () => {
        navigation.goBack();
    };

    const renderStopStatus = (index: number) => {
        const stop = stops[index];
        if (stop.done) {
            return (
                <View style={[styles.stopDot, styles.stopDotDone]}>
                    <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={WHITE}
                    />
                </View>
            );
        }
        if (started && index === currentIndex) {
            return (
                <View style={styles.stopDotActive}>
                    <View style={styles.stopDotActiveInner} />
                </View>
            );
        }
        return <View style={styles.stopDot} />;
    };

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <BookingHeader
                title="Navigation"
                onBack={() => navigation.goBack()}
                showCancelBooking={false}
            />

            <ScrollView contentContainerStyle={styles.container}>

                {/* Route Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTop}>
                        <View>
                            <Text style={styles.summaryLabel}>
                                Today's Route
                            </Text>
                            <Text style={styles.summaryTitle}>
                                {completedCount} of {stops.length} stops
                                completed
                            </Text>
                        </View>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressText}>
                                {Math.round(
                                    (completedCount /
                                        (stops.length || 1)) *
                                        100,
                                )}
                                %
                            </Text>
                        </View>
                    </View>
                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${
                                        (completedCount /
                                            (stops.length || 1)) *
                                        100
                                    }%`,
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Current Stop */}
                {started && !finished && currentStop && (
                    <View style={styles.currentCard}>
                        <View style={styles.currentHeader}>
                            <View
                                style={[
                                    styles.currentBadge,
                                    {
                                        backgroundColor:
                                            currentStop.type === 'Pickup'
                                                ? BLUE_TINT
                                                : GREEN_TINT,
                                    },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={
                                        currentStop.type === 'Pickup'
                                            ? 'truck-delivery-outline'
                                            : 'package-variant'
                                    }
                                    size={20}
                                    color={
                                        currentStop.type === 'Pickup'
                                            ? BLUE
                                            : GREEN
                                    }
                                />
                            </View>
                            <View style={styles.currentInfo}>
                                <Text style={styles.currentOrderNumber}>
                                    {currentStop.orderNumber}
                                </Text>
                                <Text style={styles.currentType}>
                                    {currentStop.type} · {currentStop.time}
                                </Text>
                            </View>
                            <View style={styles.nextBadge}>
                                <Text style={styles.nextBadgeText}>
                                    Stop {currentIndex + 1} of {stops.length}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.currentCustomer}>
                            {currentStop.customer}
                        </Text>
                        <Text style={styles.currentAddress}>
                            <MaterialCommunityIcons
                                name="map-marker-outline"
                                size={13}
                                color={TEXT_MUTED}
                            />
                            {'  '}
                            {currentStop.address}
                        </Text>
                        <Text style={styles.currentNotes}>
                            {currentStop.notes}
                        </Text>

                        <View style={styles.currentActions}>
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={callCustomer}
                            >
                                <MaterialCommunityIcons
                                    name="phone-outline"
                                    size={18}
                                    color={BLUE}
                                />
                                <Text style={styles.callButtonText}>
                                    Call
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.navigateButton}
                                onPress={openMaps}
                            >
                                <LinearGradient
                                    colors={GRADIENT_PRIMARY}
                                    style={styles.navigateGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <MaterialCommunityIcons
                                        name="navigation-outline"
                                        size={18}
                                        color={WHITE}
                                    />
                                    <Text style={styles.navigateButtonText}>
                                        Navigate
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Finished */}
                {finished && (
                    <View style={styles.finishedCard}>
                        <View style={styles.finishedIcon}>
                            <MaterialCommunityIcons
                                name="flag"
                                size={32}
                                color={GREEN}
                            />
                        </View>
                        <Text style={styles.finishedTitle}>
                            Route Complete!
                        </Text>
                        <Text style={styles.finishedMessage}>
                            All {stops.length} stops have been completed.
                            Great work today.
                        </Text>
                        <TouchableOpacity
                            style={styles.finishButton}
                            onPress={finishRoute}
                        >
                            <LinearGradient
                                colors={GRADIENT_PRIMARY}
                                style={styles.finishGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.finishButtonText}>
                                    Back to Dashboard
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* No Orders Assigned */}
                {stops.length === 0 && (
                    <View style={styles.finishedCard}>
                        <View style={styles.finishedIcon}>
                            <MaterialCommunityIcons
                                name="package-variant-closed"
                                size={32}
                                color={BLUE}
                            />
                        </View>
                        <Text style={styles.finishedTitle}>
                            No Orders Assigned
                        </Text>
                        <Text style={styles.finishedMessage}>
                            You can only start a route once an order has
                            been assigned to you. New assignments will
                            appear here automatically.
                        </Text>
                    </View>
                )}

                {/* Stops List */}
                {stops.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>
                            Route Stops
                        </Text>

                        <View style={styles.stopsCard}>
                            {stops.map((stop, index) => (
                                <View
                                    key={stop.id}
                                    style={[
                                        styles.stopRow,
                                        index === stops.length - 1 &&
                                        styles.stopRowLast,
                                    ]}
                                >
                                    <View style={styles.stopIndicator}>
                                        {renderStopStatus(index)}
                                        {index !== stops.length - 1 && (
                                            <View style={styles.stopLine} />
                                        )}
                                    </View>
                                    <View style={styles.stopInfo}>
                                        <View style={styles.stopInfoTop}>
                                            <Text style={styles.stopOrderNumber}>
                                                {stop.orderNumber}
                                            </Text>
                                            <Text style={styles.stopTime}>
                                                {stop.time}
                                            </Text>
                                        </View>
                                        <Text style={styles.stopCustomer}>
                                            {stop.customer}
                                        </Text>
                                        <Text style={styles.stopAddress}>
                                            {stop.address}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.stopType,
                                                {
                                                    color:
                                                        stop.type === 'Pickup'
                                                            ? BLUE
                                                            : GREEN,
                                                },
                                            ]}
                                        >
                                            {stop.type}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Start Route Button */}
                {!started && stops.length > 0 && (
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={startRoute}
                    >
                        <LinearGradient
                            colors={GRADIENT_PRIMARY}
                            style={styles.startGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <MaterialCommunityIcons
                                name="play"
                                size={20}
                                color={WHITE}
                            />
                            <Text style={styles.startButtonText}>
                                Start Route
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Complete Stop Button */}
                {started && !finished && currentStop && (
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={completeCurrentStop}
                    >
                        <LinearGradient
                            colors={GRADIENT_PRIMARY}
                            style={styles.startGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <MaterialCommunityIcons
                                name="check-all"
                                size={20}
                                color={WHITE}
                            />
                            <Text style={styles.startButtonText}>
                                {currentIndex + 1 >= stops.length
                                    ? 'Finish Route'
                                    : 'Complete & Next Stop'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: WHITE,
    },

    container: {
        paddingHorizontal: isWeb ? 32 : 20,
        paddingVertical: 20,
        paddingBottom: 30,
        backgroundColor: '#F5F7FA',
        ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
    },

    summaryCard: {
        backgroundColor: WHITE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#26384A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },

    summaryTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    summaryLabel: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 12,
        color: TEXT_MUTED,
    },

    summaryTitle: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 16,
        color: TEXT_DARK,
        marginTop: 3,
    },

    progressCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: BLUE_TINT,
        justifyContent: 'center',
        alignItems: 'center',
    },

    progressText: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 14,
        color: BLUE,
    },

    progressTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: BORDER,
        marginTop: 14,
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: BLUE,
    },

    currentCard: {
        backgroundColor: WHITE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BLUE_TINT,
        borderLeftWidth: 4,
        borderLeftColor: BLUE,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#26384A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },

    currentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    currentBadge: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    currentInfo: {
        flex: 1,
    },

    currentOrderNumber: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 15,
        color: TEXT_DARK,
    },

    currentType: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 12,
        color: TEXT_MUTED,
        marginTop: 2,
    },

    nextBadge: {
        backgroundColor: BLUE,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    nextBadgeText: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 10,
        color: WHITE,
    },

    currentCustomer: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 16,
        color: TEXT_DARK,
        marginTop: 12,
    },

    currentAddress: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: TEXT_MUTED,
        marginTop: 4,
    },

    currentNotes: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 12,
        color: TEXT_MUTED,
        marginTop: 8,
        lineHeight: 18,
        fontStyle: 'italic',
    },

    currentActions: {
        flexDirection: 'row',
        marginTop: 14,
    },

    callButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BLUE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },

    callButtonText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 14,
        color: BLUE,
        marginLeft: 6,
    },

    navigateButton: {
        flex: 1,
        marginLeft: 8,
    },

    navigateGradient: {
        height: 44,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    navigateButtonText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 14,
        color: WHITE,
        marginLeft: 6,
    },

    finishedCard: {
        backgroundColor: WHITE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#26384A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },

    finishedIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: GREEN_TINT,
        justifyContent: 'center',
        alignItems: 'center',
    },

    finishedTitle: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 18,
        color: TEXT_DARK,
        marginTop: 12,
    },

    finishedMessage: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: TEXT_MUTED,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 20,
    },

    finishButton: {
        alignSelf: 'stretch',
        height: 48,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 16,
    },

    finishGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    finishButtonText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: WHITE,
    },

    sectionTitle: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: TEXT_DARK,
        marginBottom: 10,
    },

    stopsCard: {
        backgroundColor: WHITE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginBottom: 18,
        elevation: 1,
        shadowColor: '#26384A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },

    stopRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: BORDER,
    },

    stopRowLast: {
        borderBottomWidth: 0,
    },

    stopIndicator: {
        alignItems: 'center',
        width: 24,
        marginRight: 10,
    },

    stopDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: BORDER,
        backgroundColor: WHITE,
    },

    stopDotDone: {
        borderColor: GREEN,
        backgroundColor: GREEN,
        justifyContent: 'center',
        alignItems: 'center',
    },

    stopDotActive: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: BLUE,
        justifyContent: 'center',
        alignItems: 'center',
    },

    stopDotActiveInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: BLUE,
    },

    stopLine: {
        flex: 1,
        width: 2,
        backgroundColor: BORDER,
        minHeight: 16,
        marginVertical: 2,
    },

    stopInfo: {
        flex: 1,
    },

    stopInfoTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    stopOrderNumber: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 13,
        color: BLUE,
    },

    stopTime: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 12,
        color: TEXT_MUTED,
    },

    stopCustomer: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 14,
        color: TEXT_DARK,
        marginTop: 3,
    },

    stopAddress: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 12,
        color: TEXT_MUTED,
        marginTop: 2,
    },

    stopType: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 11,
        marginTop: 4,
    },

    startButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
    },

    startGradient: {
        height: 52,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    startButtonText: {
        fontFamily: 'Poppins_700Bold',
        color: WHITE,
        fontSize: 16,
        marginLeft: 8,
    },

});
