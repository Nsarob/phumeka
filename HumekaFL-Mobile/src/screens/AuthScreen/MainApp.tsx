import { Platform } from 'react-native';
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView, StyleSheet, Text, View, Animated, ActivityIndicator, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Audio } from "expo-av";
import RecordingButton from "../../component/RecordingButton"; 
import ResultScreen from "../HomeScreen/ResultsScreen"; 

export default function MainApp() {
  const [isRecording, setIsRecording] = useState(false);
  const [responseValue, setResponseValue] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recordingInitialized, setRecordingInitialized] = useState(false);
  const [countDown, setCountDown] = useState(10);
  const [recordingInstance, setRecordingInstance] = useState(null);
  const animationValue = useRef(new Animated.Value(0)).current;

  const uploadAudio = async () => {
    if (!recordingInstance) return;

    setLoading(true);
    const recordingUri = recordingInstance.getURI();
    const formData: any = new FormData();

    formData.append('file', {
      uri: recordingUri,
      type: 'audio/*',
      name: `audiofile.caf`,
    });

    try {
      const response = await fetch('https://humekafl-a7f0c8172c8d.herokuapp.com/', {
      // const response = await fetch('https://3f01-102-22-141-38.ngrok-free.app/process-audio', {
      // const response = await fetch(' https://d00c-41-216-98-178.ngrok-free.app/process-audio',{
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const responseBody = await response.json();
      if (responseBody) {
        const parsedValue:any = parseFloat(responseBody.prediction);
        setResponseValue(parsedValue > 0 ? true : (parsedValue < 0 ? false : "Neutral"));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert("Upload failed", "There was an error uploading your audio.");
    } finally {
      setIsRecording(false);
      setLoading(false);
      setShowResults(true);
    }
  };

  const handleRecording = async (isStarting) => {
    setIsRecording(isStarting);

    if (isStarting) {
      if (!(await requestRecordingPermission())) return;
      
      startAnimation();

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.caf',
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          web: {
          },
        });

        await recording.startAsync();
        setRecordingInstance(recording);

        
        // Start countdown
        const timer = setInterval(() => {
          setCountDown((prevCount) => {
            if (prevCount <= 1) {
              clearInterval(timer);
              uploadAudio(); // Upload after countdown
              return 10; // Reset countdown
            }
            return prevCount - 1;
          });
        }, 1000);

      } catch (error) {
        console.error("Error starting recording:", error);
      }
    } else {
      if (recordingInstance) {
        await recordingInstance.stopAndUnloadAsync();
        console.log("Stopped Recording!");
      }
      setCountDown(10); // Reset countdown
    }
  };

  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animationValue, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(animationValue, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      { iterations: -1 }
    ).start();
  };

  const requestRecordingPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need microphone access to record audio.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (countDown === 0 && isRecording) {
      uploadAudio();
      setCountDown(10); // Reset countdown
    }
  }, [countDown, isRecording]);

  return (
    showResults && !loading && responseValue !== null ? (
      <ResultScreen situation={responseValue} onPress={async () => { 
        setShowResults(false); 
        setCountDown(10); 
        setIsRecording(false); 
        if (recordingInstance) {
          await recordingInstance.stopAndUnloadAsync();
          console.log("Stopped Recording!");
        }
      }} />
    ) : loading ? (
      <SafeAreaView>
        <View style={styles.container}>
          <Text style={{ color: "#45B3CB", fontWeight: "600", fontSize: 20 }}>HumekaFL</Text>
          <View style={styles.innerContainer}>
            <Text style={{ lineHeight: 40, marginTop: 40, marginBottom: 10, textAlign: "center", fontSize: 20 }}>Results Loading</Text>
            <ActivityIndicator size="large" color="#45B3CB" />
            <StatusBar style="auto" />
          </View>
        </View>
      </SafeAreaView>
    ) : (
      <SafeAreaView>
        <View style={styles.container}>
          <Text style={{ color: "#45B3CB", fontWeight: "600", fontSize: 20 }}>HumekaFL</Text>
          <View style={styles.innerContainer}>
            {isRecording ? (
              <Text style={{ lineHeight: 40, textAlign: "center", fontSize: 20 }}>Keep holding for...</Text>
            ) : (
              <Text style={{ fontWeight: "600", lineHeight: 40, fontSize: 20 }}>Hold to record</Text>
            )}
            {isRecording && countDown > 0 && (
              <>
                <Text style={{ fontWeight: "600", lineHeight: 30, fontSize: 25 }}>{`${countDown}`}</Text>
                <Text style={{ fontWeight: "300", lineHeight: 40, fontSize: 20 }}>seconds</Text>
              </>
            )}
            {!isRecording && (
              <Text style={{ lineHeight: 20, textAlign: "center", fontSize: 20 }}>
                Hold the blue circle button below for {countDown} seconds to record the baby's cry.
              </Text>
            )}
            <StatusBar style="auto" />
          </View>
          <View style={styles.container}>
            <RecordingButton disabled={false} onPress={handleRecording} />
          </View>
        </View>
      </SafeAreaView>
    )
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    // backgroundColor: "#fff",
    alignItems: "center",
    flexGrow:1
   },
   innerContainer:{
     marginTop :145,
     alignItems:"center",
     justifyContent:"center",
     margin :50,
     padding :10
   },
});