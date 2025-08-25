
import os
import numpy as np
import soundfile as sf
from sklearn.decomposition import FastICA
import pywt
import librosa
import joblib 

current_dir = os.path.dirname(os.path.abspath(__file__))

#Load the trained SVM classifier
model_filename = os.path.join(current_dir, "baby_cry_svm_classifier.joblib")
try:
    loaded_svm_classifier = joblib.load(model_filename)
    print("SVM classifier loaded successfully.")
except FileNotFoundError:
    print(f"Error: SVM classifier model '{model_filename}' not found.")
    print("Please train and save the model first by running the SVM training script (Step 1).")
    exit()

def extract_features_for_component(y_component, sr):
    """
    Extracts features (MFCCs, spectral centroid, spectral bandwidth) for a given audio component.
    This must exactly match the feature extraction used during SVM training.
    """
    # Handle potential silent components to avoid needless errors 
    if len(y_component) == 0 or np.max(np.abs(y_component)) < 1e-6:
        # Return a dummy feature vector of the correct size ( zeros)
        # librosa.feature.mfcc default n_mfcc is 20. So 20 MFCCs + 1 SC + 1 BW = 22 features.
        return np.zeros(22) 
    
    spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y_component, sr=sr))
    spectral_bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=y_component, sr=sr))
    mfccs = np.mean(librosa.feature.mfcc(y=y_component, sr=sr), axis=1)
    
    features = np.concatenate([mfccs, [spectral_centroid, spectral_bandwidth]])
    return features

def ica_baby_cry_separation(audio_input, sr=16000):
    """
    Real-time ICA pipeline for baby cry separation in mobile environments
    Input: Raw audio buffer (5-second clips at 16kHz)
    Output: Separated baby cry component and a boolean indicating if it's a cry
    """
    # Preprocessing: to normalize and center
    audio_normalized = (audio_input - np.mean(audio_input)) / np.std(audio_input)
    
    # Add slight delay and noise to simulate real recording conditions
    delayed_channel = np.roll(audio_normalized, 100)
    noisy_channel = audio_normalized + 0.1 * np.random.normal(size=audio_normalized.shape)
    mixed_signal = np.c_[audio_normalized, noisy_channel]
    
    # Real-time optimized ICA (reduced iterations)
    ica = FastICA(n_components=2, max_iter=100, tol=0.01, random_state=0)
    separated_sources = ica.fit_transform(mixed_signal)
    
    # Component selection and cry classification using our loaded SVM
    cry_component_idx, is_cry = identify_cry_component(separated_sources, sr, loaded_svm_classifier)
    
    # Post-processing: Wavelet denoising
    clean_cry = wavelet_denoise(separated_sources[:, cry_component_idx])
    
    return clean_cry, is_cry

def identify_cry_component(components, sr, svm_classifier):
    """
    Identifies baby cry component using a trained SVM classifier.
    Returns index of the most probable cry component and a boolean (is_cry).
    """
    component_predictions = []
    
    for i in range(components.shape[1]):
        y_component = components[:, i]
        
        # Extract features for the current component
        features = extract_features_for_component(y_component, sr)

        # Predict using the SVM classifier
        # as SVM expects a 2D array for prediction, even for a single sample
        prediction = svm_classifier.predict(features.reshape(1, -1))
        component_predictions.append(prediction)

    # Determine if any component is classified as a cry (label 1)
    is_cry_activity = any(pred == 1 for pred in component_predictions)

    # Select the component to denoise.
    # If a cry is detected, pick the first component classified as a cry.
    # Otherwise, just pick the first component (its output won't be saved anyway if not a cry).
    cry_component_idx = 0 
    for idx, pred in enumerate(component_predictions):
        if pred == 1:
            cry_component_idx = idx
            break
            
    return cry_component_idx, is_cry_activity

def wavelet_denoise(signal, wavelet='db4', level=3):
    """Wavelet-based denoising for mobile optimization"""
    if signal.ndim > 1:
        signal = signal.flatten()

    coeffs = pywt.wavedec(signal, wavelet, level=level)
    threshold = 0.5  # tunable
    coeffs = [pywt.threshold(c, threshold, mode='soft') for c in coeffs]
    denoised_signal = pywt.waverec(coeffs, wavelet)
    
    #to ensure length consistency after wavelet reconstruction
    if len(denoised_signal) > len(signal):
        denoised_signal = denoised_signal[:len(signal)]
    elif len(denoised_signal) < len(signal):
        denoised_signal = np.pad(denoised_signal, (0, len(signal) - len(denoised_signal)), mode='constant')

    return denoised_signal

# main func 
audio_path = os.path.join(current_dir, "cry_audio.mp3") 
# audio_path = os.path.join(current_dir, "non_cry_audio.mp3")

try:
    audio_input, sr = librosa.load(audio_path, sr=16000)
except FileNotFoundError:
    print(f"Error: Audio file not found at {audio_path}. Please ensure the file exists.")
    exit()

target_length_samples = 5 * sr
if len(audio_input) > target_length_samples:
    audio_input = audio_input[:target_length_samples]
else:
    padding = target_length_samples - len(audio_input)
    audio_input = np.pad(audio_input, (0, padding), mode='constant')

# Call the function
separated_cry, is_cry_activity = ica_baby_cry_separation(audio_input, sr)

output_filename = 'separated_cry.wav'
if is_cry_activity:
    sf.write(output_filename, separated_cry, sr)
    print(f"Audio classified as a baby cry. Separated cry saved to {output_filename}")
else:
    print(f"Audio classified as NOT a baby cry. No separated cry file generated.")