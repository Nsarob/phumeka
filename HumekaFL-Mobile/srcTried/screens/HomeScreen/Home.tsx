import { Platform } from 'react-native';
import React, { useState, useRef, useEffect, useContext } from "react";
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
import MLService from '../../services/mlService';
import { useAuth } from '../../Hooks/AuthContext';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
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
  const [mlPrediction, setMlPrediction] = useState(null);
  const [showInferenceResult, setShowInferenceResult] = useState(false);
  const animationValue = useRef(new Animated.Value(0)).current;

  // Determine app mode based on authentication
  const isDataCollectionMode = isAuthenticated;
  const isInferenceMode = !isAuthenticated;

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
      
      // Handle based on mode
      if (isDataCollectionMode) {
        setShowForm(true);
      } else {
        // Inference mode - analyze immediately
        await performInference();
      }
    }
  };

  const performInference = async () => {
    try {
      setLoading(true);
      
      // Create a file object from the recorded audio URI
      const audioFile = {
        uri: recordedAudioUri,
        type: 'audio/caf',
        name: 'recording.caf'
      };

      // Analyze cry using ML service
      const mlResult = await MLService.analyzeCry(audioFile);
      setMlPrediction(mlResult.prediction);
      setShowInferenceResult(true);
      
      console.log("ML Analysis Result:", mlResult);
    } catch (mlError) {
      console.error("ML analysis failed:", mlError);
      Alert.alert("Error", "ML analysis failed. Please try again.");
    } finally {
      setLoading(false);
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
    setShowInferenceResult(false);
    setMlPrediction(null);
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
    setShowInferenceResult(false);
    setMlPrediction(null);
  };

  const handleSubmit = async () => {
    console.log(babyAge, babyWeight, asphyxiated, gender)
    if (!babyAge || !babyWeight || !asphyxiated || !gender) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    try {
      setLoading(true);

      const userId = auth.currentUser?.uid;

      // Create a file object from the recorded audio URI
      const audioFile = {
        uri: recordedAudioUri,
        type: 'audio/caf',
        name: 'recording.caf'
      };

      // Collect cry data for research (store in PostgreSQL)
      try {
        const annotationData = {
          babyAge: parseInt(babyAge),
          babyWeight: parseFloat(babyWeight),
          babyGender: gender,
          isAsphyxiated: asphyxiated,
          duration: durationOfRecoding,
          professionalId: userId
        };

        const result = await MLService.collectCryData(audioFile, annotationData);
        console.log("Data collection result:", result);
        
        Alert.alert("Success!", "Cry data collected and stored for research!");
        
      } catch (collectionError) {
        console.error("Data collection failed:", collectionError);
        Alert.alert("Error", "Failed to store data for research.");
      }

      // Clean up
      discardRecording();
      setBabyName("");
      setGender("");
      setAsphyxiated("");
      setBabyAge("");
      setBabyWeight("");
      setLoading(false);
      handleReRecord()
      
    } catch (error) {
      console.error("Failed to submit:", error);
      setLoading(false);
      handleReRecord()
      Alert.alert("Error", "Failed to submit data.");
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

  const getModeDescription = () => {
    if (isDataCollectionMode) {
      return "Data Collection Mode - Recording will be saved for research";
    } else {
      return "Inference Mode - Quick analysis only, no data saved";
    }
  };

  const getPredictionText = () => {
    if (mlPrediction === '1') {
      return "🚨 Asphyxia Detected";
    } else if (mlPrediction === '0') {
      return "✅ Normal Cry";
    } else {
      return "❓ Analysis Failed";
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#fff', height: '100%' }}>
      <KeyboardAwareScrollView style={styles.container}>
        <Text style={styles.header}>HumekaFL</Text>
        
        {/* Mode Indicator */}
        <View style={styles.modeIndicator}>
          <Text style={styles.modeText}>{getModeDescription()}</Text>
          {isDataCollectionMode && (
            <Text style={styles.userInfo}>Logged in as: {user?.email}</Text>
          )}
        </View>

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
              <CustomButton title="Re-record" onPress={handleReRecord} />
            </>
          ) : (
            <Text style={{ fontWeight: "600", fontSize: 20, textAlign: 'center', marginBottom: 10 }}>Press the button to start recording</Text>
          )}
        </View>

        {!recordedAudioUri && <RecordingButton disabled={(isRecording && timer <= 10) ? true : false} onPress={handleRecording} />}

        {/* Inference Result Display */}
        {showInferenceResult && mlPrediction && (
          <View style={styles.inferenceContainer}>
            <Text style={styles.inferenceTitle}>ML Analysis Result</Text>
            <Text style={[styles.predictionText, 
              mlPrediction === '1' ? styles.asphyxiaDetected : 
              mlPrediction === '0' ? styles.normalCry : styles.analysisFailed
            ]}>
              {getPredictionText()}
            </Text>
            <Text style={styles.inferenceNote}>
              This is a quick analysis for demonstration purposes. 
              For research data collection, please log in.
            </Text>
          </View>
        )}

        {/* Data Collection Form */}
        {showForm && isDataCollectionMode && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Data Collection Form</Text>
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
            <CustomButton title="Submit for Research" loading={loading} onPress={handleSubmit} />
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
  modeIndicator: {
    backgroundColor: '#E0F2F7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  modeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  formContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#45B3CB',
    textAlign: 'center',
    marginBottom: 15,
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
  inferenceContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#F0F9EB', // Light green background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A5D6A7', // Green border
  },
  inferenceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32', // Dark green
    textAlign: 'center',
    marginBottom: 10,
  },
  predictionText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  asphyxiaDetected: {
    color: '#D32F2F', // Red
  },
  normalCry: {
    color: '#4CAF50', // Green
  },
  analysisFailed: {
    color: '#FF9800', // Orange
  },
  inferenceNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
