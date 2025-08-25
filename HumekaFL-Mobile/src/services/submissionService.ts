import { API_BASE_URL, ENDPOINTS } from '../config/apiConfig';

export const submitCryRecord = async (data: {
    record_date: string;
    record_time: string;
    duration: number;
    file_path: string;
    recording_device: string;
    cry_type: 'Asphyxia' | 'Hunger' | 'Pain' | 'Discomfort' | 'Sleepiness';
    expert_annotation: boolean;
    id_baby: number;
    id_professional: string;
}) => {
    console.log("Submitting cry record:", data);
    // data["id_baby"] = 12; // Ensure id_baby is an integer
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.cry}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        console.error("Error submitting cry record:", response);
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const fetchUserSubmissions = async (professionalId: string) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.cry}?id_professional=${professionalId}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const createBaby = async (data: {
    first_name: string;
    last_name: string;
    gender: 'Male' | 'Female';
    age: number;
    weight: number;
    temperature?: number;
    pulse?: number;
    breathing_rate?: number;
    apgar_score?: number;
}) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.baby}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return response.json();
};
