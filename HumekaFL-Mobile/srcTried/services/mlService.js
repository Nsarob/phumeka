import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';
const PROXY_URL = 'http://localhost:3001';

class MLService {
  // ===== INFERENCE MODULE (No Login) =====
  // Just analyze cry audio and return result - no data storage
  
  static async analyzeCry(audioFile) {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);

      const response = await axios.post(`${BACKEND_URL}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error analyzing cry:', error);
      throw error;
    }
  }

  // ===== DATA COLLECTION MODULE (With Login) =====
  // Store cry recording + annotation in PostgreSQL for research
  
  static async collectCryData(audioFile, annotationData) {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      
      // Add all the annotation data
      formData.append('baby_age', annotationData.babyAge);
      formData.append('baby_weight', annotationData.babyWeight);
      formData.append('baby_gender', annotationData.babyGender);
      formData.append('expert_assessment', annotationData.isAsphyxiated);
      formData.append('recording_duration', annotationData.duration);
      formData.append('professional_id', annotationData.professionalId);
      formData.append('device_name', 'Mobile App');

      // Send to backend for storage in PostgreSQL
      const response = await axios.post(`${BACKEND_URL}/collect-cry`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error collecting cry data:', error);
      throw error;
    }
  }
}

export default MLService;
