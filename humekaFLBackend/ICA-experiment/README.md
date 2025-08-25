# ICA Baby Cry Detection

This project provides a pipeline for detecting and separating baby cries from audio using ICA and an SVM classifier.

## Setup

1. **Install dependencies** (preferably in a virtual environment):

   ```
   pip install numpy librosa scikit-learn tqdm joblib soundfile pywt
   ```

2. **Prepare your dataset**:

   - Place `.wav` files in the following directories:
     - `data/cry-audio-voices/` (for baby cry samples)
     - `data/non-cry-audio-voices/` (for non-cry samples)

## Training the SVM Classifier

Run the following script to extract features and train the SVM model:

```
python cryclassifier.py
```

- This will process all audio files in the `data` directory, train an SVM classifier, and save the model as `baby_cry_classifier.joblib`.

## Running Cry Detection

1. Place your test audio file (e.g., `cry_audio.mp3`) in the project directory.
2. Run the detection script:

   ```
   python crydetector.py
   ```

- The script will load the trained SVM model, process the audio, and output whether a baby cry was detected.
- If a cry is detected, the separated cry component will be saved as `separated_cry.wav`.

## Version Control: Creating and Pushing to a New Branch

To push this directory to a new branch called `icaExperiment`:

1. Initialize git (if not already done):

   ```
   git init
   git add .
   git commit -m "Initial commit for ICA experiment"
   ```

2. Create and switch to the new branch:

   ```
   git checkout -b icaExperiment
   ```

3. Add your remote repository (replace URL with your repo):

   ```
   git remote add origin <your-repo-url>
   ```

4. Push the branch to the remote:

   ```
   git push -u origin icaExperiment
   ```

Now your code is on the `icaExperiment` branch in your remote repository.

## Notes

- Ensure the SVM model (`baby_cry_classifier.joblib`) is present before running `crydetector.py`.
- The SVM model is trained using MFCCs, spectral centroid, and bandwidth features extracted from the dataset.
