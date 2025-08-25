import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

export default function RecordingButton({ disabled, onPress }) {

    const [isRecording, setIsRecording] = useState(false);
    const [lottieKey, setLottieKey] = useState(0);
    const animationRef = useRef(null);

    const handlePress = () => {
        const nextState = !isRecording;
        setIsRecording(nextState);
        onPress(nextState);
    };

    useEffect(() => {
        if (isRecording && animationRef.current) {
            // Introduce a slight delay before playing the animation
            setTimeout(() => {
                animationRef.current.reset();  // Reset the animation
                animationRef.current.play();   // Play the animation
            }, 50);
        }
    }, [isRecording]);
    return (
        <View style={styles.container}>
            <View style={[styles.outerCircle, { backgroundColor: disabled ? "#999" : '#45B3CB' }]} />
            <View style={[styles.midCircle, { backgroundColor: disabled ? "#999" : '#45B3CB' }]} />
            <TouchableOpacity disabled={disabled} style={[styles.button, { backgroundColor: disabled ? "#999" : '#45B3CB' }]} onPress={handlePress}>
                {/* {isRecording ? (
                    <LottieView
                        key={lottieKey}
                        ref={animationRef}
                        source={require('../../assets/animation.json')}
                        autoPlay
                        loop
                        style={styles.lottie}
                    />
                ) : (
                )} */}
                <MaterialIcons name="keyboard-voice" size={40} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerCircle: {
        width: 330,
        height: 330,
        borderRadius: 150,
        opacity: 0.1,
        position: 'absolute',
    },
    midCircle: {
        width: 240,
        height: 240,
        borderRadius: 150,
        opacity: 0.3,
        position: 'absolute',
    },
    button: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: 80,
        height: 80,
        paddingLeft: 2,
    },
});
