import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import ActionButton from './ActionButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WinLoseScreen = ({
    isVisible = false,
    result, // 'win' | 'lose' | 'draw'
    playerStats,
    onPlayAgain,
    onBackToLobby,
    style = {}
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const confettiAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible && result) {
            startResultAnimation();
        }
    }, [isVisible, result]);

    const startResultAnimation = () => {
        // Reset animation values
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.5);
        bounceAnim.setValue(0);
        confettiAnim.setValue(0);

        const animationSequence = Animated.sequence([
            // Fade in background
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            // Scale in main content with bounce
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            // Start confetti animation for wins
            ...(result === 'win' ? [
                Animated.timing(confettiAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ] : []),
            // Bounce animation for emphasis
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: -1 }
            ),
        ]);

        animationSequence.start();
    };

    const getResultConfig = (resultType) => {
        switch (resultType) {
            case 'win':
                return {
                    title: 'VICTORY!',
                    subtitle: 'Congratulations, you won!',
                    emoji: '🏆',
                    color: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.95)',
                    borderColor: '#28a745',
                    confetti: ['🎉', '🎊', '✨', '🌟', '💫'],
                };
            case 'lose':
                return {
                    title: 'DEFEAT',
                    subtitle: 'Better luck next time!',
                    emoji: '💀',
                    color: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.95)',
                    borderColor: '#dc3545',
                    confetti: [],
                };
            case 'draw':
                return {
                    title: 'DRAW',
                    subtitle: 'It\'s a tie!',
                    emoji: '🤝',
                    color: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.95)',
                    borderColor: '#ffc107',
                    confetti: ['⭐', '✨'],
                };
            default:
                return {
                    title: 'GAME OVER',
                    subtitle: 'The match has ended',
                    emoji: '🎮',
                    color: '#6c757d',
                    backgroundColor: 'rgba(108, 117, 125, 0.95)',
                    borderColor: '#6c757d',
                    confetti: [],
                };
        }
    };

    const renderConfetti = (confettiItems) => {
        if (!confettiItems || confettiItems.length === 0) return null;

        return (
            <View style={styles.confettiContainer}>
                {Array.from({ length: 20 }, (_, index) => {
                    const randomEmoji = confettiItems[Math.floor(Math.random() * confettiItems.length)];
                    const randomDelay = Math.random() * 2000;
                    const randomDuration = 2000 + Math.random() * 3000;
                    const randomX = Math.random() * screenWidth;

                    return (
                        <Animated.Text
                            key={index}
                            style={[
                                styles.confettiItem,
                                {
                                    left: randomX,
                                    transform: [
                                        {
                                            translateY: confettiAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-50, screenHeight + 50],
                                            }),
                                        },
                                        {
                                            rotate: confettiAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            {randomEmoji}
                        </Animated.Text>
                    );
                })}
            </View>
        );
    };

    if (!isVisible || !result) {
        return null;
    }

    const config = getResultConfig(result);

    return (
        <Animated.View
            style={[
                styles.overlay,
                {
                    opacity: fadeAnim,
                    backgroundColor: config.backgroundColor,
                },
                style,
            ]}
        >
            {renderConfetti(config.confetti)}

            <Animated.View
                style={[
                    styles.container,
                    {
                        borderColor: config.borderColor,
                        transform: [
                            { scale: scaleAnim },
                            {
                                translateY: bounceAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -10],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <Animated.Text
                    style={[
                        styles.emoji,
                        {
                            color: config.color,
                            transform: [
                                {
                                    scale: bounceAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.2],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    {config.emoji}
                </Animated.Text>

                <Text style={[styles.title, { color: config.color }]}>
                    {config.title}
                </Text>

                <Text style={styles.subtitle}>
                    {config.subtitle}
                </Text>

                {playerStats && (
                    <View style={styles.statsContainer}>
                        <Text style={styles.statsTitle}>Final Stats:</Text>
                        <View style={styles.statsRow}>
                            <Text style={styles.statItem}>❤️ Health: {playerStats.health}</Text>
                            <Text style={styles.statItem}>⚡ Charges: {playerStats.charges}</Text>
                        </View>
                        {playerStats.statusEffects && playerStats.statusEffects.length > 0 && (
                            <Text style={styles.statItem}>
                                Effects: {playerStats.statusEffects.map(e => e.type).join(', ')}
                            </Text>
                        )}
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <ActionButton
                        title="Play Again"
                        onPress={onPlayAgain}
                        variant="success"
                        size="medium"
                        icon="🔄"
                        style={styles.button}
                    />
                    <ActionButton
                        title="Back to Lobby"
                        onPress={onBackToLobby}
                        variant="secondary"
                        size="medium"
                        icon="🏠"
                        style={styles.button}
                    />
                </View>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    confettiItem: {
        position: 'absolute',
        fontSize: 20,
        top: -50,
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 25,
        borderWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 15,
        minWidth: 300,
        maxWidth: screenWidth * 0.9,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 15,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        fontStyle: 'italic',
    },
    statsContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        padding: 15,
        marginBottom: 25,
        width: '100%',
    },
    statsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 5,
    },
    statItem: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    button: {
        flex: 1,
    },
});

export default WinLoseScreen;