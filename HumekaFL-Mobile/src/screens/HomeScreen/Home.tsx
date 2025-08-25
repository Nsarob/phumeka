import { Platform } from 'react-native';
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView, StyleSheet, Text, View, TextInput, Button, Animated, ActivityIndicator, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Audio } from "expo-av";
import RecordingButton from "../../component/RecordingButton";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import CustomButton from '../../component/CustomButton';
import CustomInput from '../../component/CustomInput';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Picker } from '@react-native-picker/picker';
import { submitCryRecord, createBaby } from '../../services/submissionService';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingInstance, setRecordingInstance] = useState<any>(null);
  const [timer, setTimer] = useState(1);
  const [durationOfRecoding, setDurationOfRecoding] = useState(10);
  const [recordedAudioUri, setRecordedAudioUri] = useState(null);
  const [soundObject, setSoundObject] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [babyName, setBabyName] = useState("");
  const [gender, setGender] = useState("Male");
  const [asphyxiated, setAsphyxiated] = useState("Yes");
  const [babyAge, setBabyAge] = useState("");
  const [babyWeight, setBabyWeight] = useState("");
  const animationValue = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    let intervalId;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000); // Update every second
    }

    return () => clearInterval(intervalId);
  }, [isRunning]);


  const handleRecording = async (isStarting) => {
    setIsRecording(isStarting);
    console.log("Logged >> ", isStarting)

    if (isRunning) {
      setIsRunning(false);
      setTimer(1); // Reset timer to 0
    } else {
      setIsRunning(true);
    }

    if (isStarting) {
      if (!(await requestRecordingPermission())) return;

      startAnimation();

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio?.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        setRecordingInstance(recording);
        recording.getStatusAsync().then((status) => {
          console.log("Recording status:", status);
        })
      } catch (error) {
        console.error("Error starting recording:", error);
      }
    } else {
      stopRecording();
    }
  };

  const stopRecording = async () => {
    console.log("recordingInstance", recordingInstance)
    if (recordingInstance) {
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      const status = await recordingInstance.getStatusAsync();
      console.log("status,,,,", status)
      const durationInMillis = status.durationMillis;
      console.log("Logged >>>", durationInMillis)
      const durationInSeconds = (durationInMillis / 1000).toFixed(1);

      console.log(`Recording duration: ${durationInSeconds} seconds`);
      setDurationOfRecoding(parseInt(durationInSeconds))
      setRecordedAudioUri(uri);
      setRecordingInstance(null);
      setIsRecording(false);
      setShowForm(true);
    }
  };

  const requestRecordingPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Microphone access is required to record audio.");
      return false;
    }
    return true;
  };

  const handleReRecord = () => {
    setRecordedAudioUri(null);
    setShowForm(false);
    setBabyName("");
    setGender("");
    setAsphyxiated("");
    setBabyAge("");
    setBabyWeight("");
  };

  const discardRecording = () => {
    setRecordingInstance(null);
    setIsRecording(false);
    setRecordedAudioUri(null);
  };

  const handleSubmit = async () => {
    console.log("Submitting data:", {
      babyAge,
      babyWeight,
      asphyxiated,
      gender,
      auth: auth.currentUser?.uid
    });

    if (!babyAge || !babyWeight || !asphyxiated || !gender || !auth.currentUser?.uid) {
      Alert.alert("Error", "All fields are required and you must be logged in!");
      return;
    }
    console.log("===============success===========")

    try {
      setLoading(true);
      console.log("Submitting baby records data")
  

      // First create baby record
      const babyData = await createBaby({
        first_name: "Anonymous",
        last_name: "Baby",
        gender: gender as 'Male' | 'Female',
        age: parseInt(babyAge),
        weight: parseFloat(babyWeight),
      });
      console.log("Baby record created:", babyData);

      // Then submit cry record
      if (!recordedAudioUri) {
        throw new Error('No recording file available');
      }

      await submitCryRecord({
        record_date: new Date().toISOString().split('T')[0],
        record_time: new Date().toTimeString().split(' ')[0],
        duration: durationOfRecoding,
        file_path: recordedAudioUri as string,
        recording_device: 'Smartphone',
        cry_type: asphyxiated === 'Yes' ? 'Asphyxia' : 'Discomfort',
        expert_annotation: false,
        id_baby: babyData.id_baby,
        // id_professional: auth.currentUser.uid
        id_professional: "bef79144-f842-4e5d-972c-6405a34bd916" // Get the professional ID from the authenticated user
      });

      Alert.alert("Success", "Record submitted successfully!");
      handleReRecord();
    } catch (error) {
      console.error("Failed to save submission:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to save submission.");
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

  const playAudio = async () => {
    if (playing === true) {
      console.log("1")
      setPlaying(false)
      await soundObject.stopAsync();
    } else {
      console.log("2")
      setPlaying(true)

      const { sound } = await Audio.Sound.createAsync({ uri: recordedAudioUri });
      setSoundObject(sound);
      await sound.playAsync();
    }
  }

  return (
    <SafeAreaView style={{ backgroundColor: '#fff', height: '100%' }}>
      <KeyboardAwareScrollView style={styles.container}>
        <Text style={styles.header}>HumekaFL</Text>
        <View style={styles.innerContainer}>
          {isRecording ? (
            <>
              <Text style={{ fontWeight: "600", fontSize: 20, textAlign: 'center', marginBottom: 10 }}>Recording...</Text>
              <Text style={{ fontWeight: "600", fontSize: 18, textAlign: 'center', marginHorizontal: 10 }}>Press the button after 10 seconds to stop recording</Text>
              <Text style={{ fontWeight: "300", fontSize: 25, textAlign: 'center' }}>{timer} seconds</Text>
            </>
          ) : recordedAudioUri ? (
            <>
              <Text style={{ fontWeight: "600", fontSize: 20, textAlign: 'center', marginBottom: 10 }}>Recording Complete!</Text>
              <CustomButton title={playing === true ? "Pause Recording" : "Play Recording"} onPress={playAudio} />
              <CustomButton title="Re-record" onPress={handleReRecord} logout />
            </>
          ) : (
            <Text style={{ fontWeight: "600", fontSize: 20, textAlign: 'center', marginBottom: 10 }}>Press the button to start recording</Text>
          )}
        </View>
        {!recordedAudioUri && <RecordingButton disabled={(isRecording && timer <= 10) ? true : false} onPress={handleRecording} />}
        {showForm && (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Baby's Age (in months)</Text>
            <CustomInput
              style={styles.input}
              placeholder="Baby's Age (in months)"
              keyboardType="numeric"
              value={babyAge}
              onChangeText={setBabyAge}
            />
            <Text style={styles.label}>Baby's Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => setGender(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
              </Picker>
            </View>
            <Text style={styles.label}>Baby's Weight (in kg)</Text>
            <CustomInput
              style={styles.input}
              placeholder="Baby's Weight (in kg)"
              keyboardType="numeric"
              value={babyWeight}
              onChangeText={setBabyWeight}
            />
            <Text style={styles.label}>Is Asphyxiated?</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={asphyxiated}
                onValueChange={(itemValue) => setAsphyxiated(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Yes" value="Yes" />
                <Picker.Item label="No" value="No" />
              </Picker>
            </View>
            <CustomButton title="Submit" loading={loading} onPress={handleSubmit} />
          </View>
        )}
        <StatusBar style="auto" />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    // alignSelf: 'center',
    // alignItems: "center",
    marginVertical: 30,
    backgroundColor: '#fff'
  },
  innerContainer: {
    marginTop: 40,
    // alignItems: "center",
    // justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#45B3CB',
    textAlign: 'center',
  },
  formContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  input: {
    // marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "100%",
  },
  label: {
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
  },
  pickerContainer: {
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#45B3CB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  picker: {
    height: 150,
    color: '#333',
  },
});
