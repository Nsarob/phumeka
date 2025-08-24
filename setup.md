# HumekaFL Setup Guide

## Overview
HumekaFL is a dual-module mobile application for:
1. **Inference Module**: Quick cry analysis using deployed ML model (no login required)
2. **Data Collection Module**: Collect annotated datasets for research (requires medical professional login)

## Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- FFmpeg installed on your system
- PostgreSQL database (or use SQLite for development)

## Frontend Setup (React Native Expo)

### 1. Install Dependencies
```bash
cd HUMEKAFL/Asphyxia-detector-
npm install
# or
yarn install
```

### 2. Start the App
```bash
npm start
# or
yarn start
```

### 3. Run on Device/Emulator
- Install Expo Go on your mobile device
- Scan the QR code from the terminal
- Or press 'a' for Android emulator, 'i' for iOS simulator

## Backend Setup (Python Flask)

### 1. Create Virtual Environment
```bash
cd HUMEKAFL/Backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Create Required Directories
```bash
mkdir uploads
mkdir -p data/1s-audio
```

### 4. Add ML Model
- Place your `best_model.onnx` file in the Backend directory
- Or update the `MODEL_PATH` in `env.config`

### 5. Start the Backend
```bash
python app.py
```

The backend will run on `http://localhost:5000`

## Proxy Server Setup

### 1. Install Dependencies
```bash
cd HUMEKAFL/proxy-server
npm install
```

### 2. Start the Proxy Server
```bash
npm start
```

The proxy server will run on `http://localhost:3001`

## Database Setup

### Option 1: PostgreSQL (Production)
1. Update the `DATABASE_URL` in `Backend/env.config`
2. Ensure your database is running and accessible
3. Uncomment `initialize_database()` in `app.py` for first run

### Option 2: SQLite (Development)
1. The app will automatically use SQLite if no PostgreSQL URL is provided
2. Database file will be created as `humekafl.db`

## Environment Configuration

### Frontend
- Copy `env.config` to `.env` (if using react-native-dotenv)
- Update Firebase configuration as needed

### Backend
- Update `env.config` with your database credentials
- Set `MODEL_PATH` to your ML model file location

### Proxy Server
- Update `env.config` with your backend URL

## App Modules

### 📱 Inference Module (No Login)
- **Purpose**: Quick cry analysis demonstration
- **Flow**: Record audio → ML analysis → Show result → No data saved
- **Use Case**: Public demos, quick assessments, model validation
- **Data Storage**: None (privacy-focused)

### 🔐 Data Collection Module (With Login)
- **Purpose**: Collect annotated datasets for research
- **Flow**: Login → Record audio → Expert annotation → Save to PostgreSQL
- **Use Case**: Clinical research, model improvement, compliance
- **Data Storage**: PostgreSQL (research database)

## Testing the Integration

### 1. Test Inference Module
1. Start all services (Frontend, Backend, Proxy)
2. Open app without logging in
3. Record 10 seconds of audio
4. Verify ML analysis works and shows results
5. Confirm no data is saved

### 2. Test Data Collection Module
1. Log in as a medical professional
2. Record 10 seconds of audio
3. Fill out the expert annotation form
4. Submit - should save to PostgreSQL
5. Verify data appears in research database

## Troubleshooting

### Common Issues:

1. **Port Conflicts**: Ensure ports 3001 (proxy) and 5000 (backend) are available
2. **CORS Issues**: Backend includes CORS headers, but check if your proxy server is working
3. **Audio Format**: The backend expects CAF files from iOS, converts to WAV for processing
4. **ML Model**: Ensure `best_model.onnx` is in the correct location
5. **Database**: Check database connection and credentials
6. **Authentication**: Verify Firebase configuration for data collection module

### Debug Mode:
- Backend runs in debug mode by default
- Check console logs for detailed error messages
- Frontend logs to console and can be viewed in Expo DevTools

### Module-Specific Issues:

#### Inference Module Problems:
- Check ML backend connectivity
- Verify audio recording permissions
- Ensure ONNX model is loaded correctly

#### Data Collection Module Problems:
- Verify Firebase authentication
- Check PostgreSQL connection
- Ensure user has proper permissions

## Production Deployment

1. Set `FLASK_ENV=production` in backend config
2. Use proper database credentials
3. Set up HTTPS for all services
4. Configure proper CORS origins
5. Use environment variables instead of config files
6. Set up proper logging and monitoring
7. Implement HIPAA compliance measures
8. Set up data retention and backup policies

## Research Workflow

### Data Collection Process:
1. Medical professional logs in
2. Records cry audio (10 seconds)
3. Expert provides annotation
4. Data stored in PostgreSQL with audio file
5. Dataset available for research and model improvement

### Dataset Management:
- Export capabilities for research
- Model performance tracking
- Compliance and audit trails
- Ethical review board compliance

## Security Considerations

### Privacy:
- Inference module: No data stored, completely anonymous
- Data collection module: Proper consent and HIPAA compliance
- Data anonymization for research purposes

### Authentication:
- Firebase handles medical professional authentication
- Role-based access control
- Secure session management

### Data Protection:
- PostgreSQL encryption at rest
- Secure data transmission
- Audit logging for compliance
