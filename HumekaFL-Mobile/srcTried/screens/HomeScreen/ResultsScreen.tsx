import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';

export default function ResultScreen({ situation, onPress }) {
    return (
        <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
            <View style={styles.container}>
                <Text style={styles.title}>HumekaFL</Text>

                {/* Placeholder image */}
                <Image
                    source={situation === false ? require('../../../assets/baby_happy.png') : situation === true ? require('../../../assets/baby_sad.png') : require('../../../assets/baby_sad.png')}
                    style={styles.image}
                />

                <Text style={styles.subTitle}>{situation === false ? 'The baby is in' : situation === true ? 'Unfortunately, \n the baby has' : 'Please record the audio'}</Text>
                <Text style={styles.result}>{situation === false ? 'Perfect condition' : situation === true ? 'Asphyxia' : 'Again'}</Text>

                <TouchableOpacity onPress={onPress} style={styles.button}>
                    <Text style={styles.buttonText}>Record again</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        alignItems: 'center',
        backgroundColor: 'white',
    },
    title: {
        marginTop: 40,
        fontSize: 24,
        color: '#45B3CB',
        fontWeight: '600',
    },
    image: {
        marginTop: 20,
        width: 290,
        height: 290,
        resizeMode: 'contain',
    },
    subTitle: {
        marginTop: 20,
        fontSize: 20,
        fontWeight: '300',
    },
    result: {
        marginTop: 10,
        fontSize: 32,
        fontWeight: 'bold',
    },
    button: {
        marginTop: 70,
        paddingVertical: 12,
        paddingHorizontal: 40,
        backgroundColor: '#45B3CB',
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '500',
    },
});
