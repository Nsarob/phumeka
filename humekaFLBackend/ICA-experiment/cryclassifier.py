import librosa
import numpy as np
from sklearn import svm
from sklearn.model_selection import train_test_split
import os
from tqdm import tqdm
from joblib import dump

def extract_features(file_path):
    """Extract features from an audio file."""
    audio, sr = librosa.load(file_path, sr=None)
    spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr))
    spectral_bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sr))
    mfccs = np.mean(librosa.feature.mfcc(y=audio, sr=sr), axis=1)
    features = np.concatenate([mfccs, [spectral_centroid, spectral_bandwidth]])
    return features

def prepare_dataset(data_dir):
    """Prepare dataset from the data directory."""
    file_paths = []
    labels = []

    for label_dir, label_value in [("cry-audio-voices", 1), ("non-cry-audio-voices", 0)]:
        class_dir = os.path.join(data_dir, label_dir)
        if not os.path.isdir(class_dir):
            continue
        for fname in os.listdir(class_dir):
            if fname.lower().endswith('.wav'):
                file_paths.append(os.path.join(class_dir, fname))
                labels.append(label_value)

    if not file_paths:
        raise RuntimeError("No audio files found in data/cry-audio-voices or data/non-cry-audio-voices directories.")

    return file_paths, labels

def main():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    file_paths, labels = prepare_dataset(data_dir)

    # Extract features for all files with progress bar
    X = np.array([extract_features(fp) for fp in tqdm(file_paths, desc="Extracting features")])
    y = np.array(labels)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = svm.SVC(kernel='linear').fit(X_train, y_train)

    # Evaluate the classifier
    accuracy = clf.score(X_test, y_test)
    print(f"Classifier accuracy: {accuracy:.3f}")

    dump(clf, 'baby_cry_classifier.joblib')

if __name__ == "__main__":
    main()
