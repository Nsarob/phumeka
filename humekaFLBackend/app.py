from flask import Flask, request, jsonify
import os
import librosa
import numpy as np
import onnxruntime as ort
import glob
import subprocess
import wave
import contextlib
import webrtcvad
import collections
import sys
from scipy.interpolate import interp1d
import random
import uuid
from datetime import date, datetime, time
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import CheckConstraint

basedir = os.path.abspath(os.path.dirname(__file__))
cpath = os.path.join(basedir, "ca.pem")


app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql+psycopg2://avnadmin:AVNS_5di14luk0kQ8YPLIBHD@"
    f"pg-17edd2a3-humekafl.c.aivencloud.com:18054/defaultdb"
    f"?sslmode=verify-full&sslrootcert={cpath}"
)
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://neondb_owner:npg_N0rBQeIipco3@ep-floral-bread-a5mn8ecv-pooler.us-east-2.aws.neon.tech/postgres?sslmode=require'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True

db = SQLAlchemy(app)

# --- MODELS FROM testsqlapp.py ---

class Hospital(db.Model):
    __tablename__ = 'hospital'
    id_hospital = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name_hospital = db.Column(db.String(255), nullable=False)
    country = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(255), nullable=False)
    professionals = db.relationship('MedicalProfessional', back_populates='hospital', cascade='all, delete-orphan')
    devices = db.relationship('Device', back_populates='hospital', cascade='all, delete-orphan')
    def to_dict(self):
        return {
            'id_hospital': str(self.id_hospital),
            'name_hospital': self.name_hospital,
            'country': self.country,
            'city': self.city,
            'status': self.status
        }

class MedicalProfessional(db.Model):
    __tablename__ = 'medical_professional'
    id_professional = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    position = db.Column(db.String(100), nullable=False)
    id_hospital = db.Column(UUID(as_uuid=True), db.ForeignKey('hospital.id_hospital', ondelete='RESTRICT'), nullable=False)
    hospital = db.relationship('Hospital', back_populates='professionals')
    cry_records = db.relationship('Cry', back_populates='professional', cascade='all, delete-orphan')
    def to_dict(self):
        return {
            'id_professional': str(self.id_professional),
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'position': self.position,
            'id_hospital': str(self.id_hospital)
        }

class Baby(db.Model):
    __tablename__ = 'baby'
    id_baby = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    age = db.Column(db.Integer, nullable=True)
    weight = db.Column(db.Float, nullable=True)
    temperature = db.Column(db.Float, nullable=True)
    pulse = db.Column(db.Integer, nullable=True)
    breathing_rate = db.Column(db.Integer, nullable=True)
    apgar_score = db.Column(db.Integer, nullable=True)
    __table_args__ = (
        CheckConstraint("gender IN ('Male', 'Female', 'Other')", name='check_gender'),
    )
    cry_records = db.relationship('Cry', back_populates='baby', cascade='all, delete-orphan')
    def to_dict(self):
        return {
            'id_baby': self.id_baby,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'gender': self.gender,
            'age': self.age,
            'weight': self.weight,
            'temperature': self.temperature,
            'pulse': self.pulse,
            'breathing_rate': self.breathing_rate,
            'apgar_score': self.apgar_score
        }

class Device(db.Model):
    __tablename__ = 'device'
    id_device = db.Column(db.Integer, primary_key=True)
    device_type = db.Column(db.String(20), nullable=False)
    manufacturer = db.Column(db.String(255), nullable=False)
    model_number = db.Column(db.String(100), nullable=False)
    serial_number = db.Column(db.String(100), nullable=False, unique=True)
    purchase_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Active')
    location = db.Column(db.String(255), nullable=False)
    device_name = db.Column(db.String(100), nullable=False)
    id_hospital = db.Column(UUID(as_uuid=True), db.ForeignKey('hospital.id_hospital', ondelete='RESTRICT'), nullable=False)
    __table_args__ = (
        CheckConstraint("device_type IN ('Smartphone', 'Wearable')", name='check_device_type'),
        CheckConstraint("status IN ('Active', 'Inactive', 'Maintenance')", name='check_device_status'),
    )
    hospital = db.relationship('Hospital', back_populates='devices')
    def to_dict(self):
        return {
            'id_device': self.id_device,
            'device_type': self.device_type,
            'manufacturer': self.manufacturer,
            'model_number': self.model_number,
            'serial_number': self.serial_number,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'status': self.status,
            'location': self.location,
            'device_name': self.device_name,
            'id_hospital': str(self.id_hospital)
        }

class Cry(db.Model):
    __tablename__ = 'cry'
    id_record = db.Column(db.Integer, primary_key=True)
    record_date = db.Column(db.Date, nullable=False, default=date.today)
    record_time = db.Column(db.Time, nullable=False, default=datetime.now().time)
    duration = db.Column(db.Float, nullable=True)
    file_path = db.Column(db.String(500), nullable=False)
    recording_device = db.Column(db.String(100), nullable=False)
    cry_type = db.Column(db.String(20), nullable=False)
    expert_annotation = db.Column(db.Boolean, nullable=False, default=False)
    id_baby = db.Column(db.Integer, db.ForeignKey('baby.id_baby', ondelete='RESTRICT'), nullable=False)
    id_professional = db.Column(UUID(as_uuid=True), db.ForeignKey('medical_professional.id_professional', ondelete='RESTRICT'), nullable=False)
    __table_args__ = (
        CheckConstraint("cry_type IN ('Asphyxia', 'Hunger', 'Pain', 'Discomfort', 'Sleepiness')", name='check_cry_type'),
    )
    baby = db.relationship('Baby', back_populates='cry_records')
    professional = db.relationship('MedicalProfessional', back_populates='cry_records')
    def to_dict(self):
        return {
            'id_record': self.id_record,
            'record_date': self.record_date.isoformat() if self.record_date else None,
            'record_time': self.record_time.isoformat() if self.record_time else None,
            'duration': self.duration,
            'file_path': self.file_path,
            'recording_device': self.recording_device,
            'cry_type': self.cry_type,
            'expert_annotation': self.expert_annotation,
            'id_baby': self.id_baby,
            'id_professional': str(self.id_professional)
        }

class Frame(object):
    """Represents a "frame" of audio data."""
    def __init__(self, bytes, timestamp, duration):
        self.bytes = bytes
        self.timestamp = timestamp
        self.duration = duration

def read_wave(path):
    """Reads a .wav file.

    Takes the path, and returns (PCM audio data, sample rate).
    """
    with contextlib.closing(wave.open(path, 'rb')) as wf:
        num_channels = wf.getnchannels()
        print("num_channels >> ", num_channels)
        # assert num_channels == 1
        sample_width = wf.getsampwidth()
        # assert sample_width == 2
        sample_rate = wf.getframerate()
        # assert sample_rate == 8000 # 8000, 16000, 32000, 48000
        pcm_data = wf.readframes(wf.getnframes())
        return pcm_data, sample_rate

def frame_generator(frame_duration_ms, audio, sample_rate):
    """Generates audio frames from PCM audio data.

    Takes the desired frame duration in milliseconds, the PCM data, and
    the sample rate.

    Yields Frames of the requested duration.
    """
    n = int(sample_rate * (frame_duration_ms / 1000.0) * 2)
    offset = 0
    timestamp = 0.0
    duration = (float(n) / sample_rate) / 2.0
    while offset + n < len(audio):
        yield Frame(audio[offset:offset + n], timestamp, duration)
        timestamp += duration
        offset += n

def vad_collector(sample_rate, frame_duration_ms,
                  padding_duration_ms, vad, frames):
    """Filters out non-voiced audio frames.

    Given a webrtcvad.Vad and a source of audio frames, yields only
    the voiced audio.

    Uses a padded, sliding window algorithm over the audio frames.
    When more than 90% of the frames in the window are voiced (as
    reported by the VAD), the collector triggers and begins yielding
    audio frames. Then the collector waits until 90% of the frames in
    the window are unvoiced to detrigger.

    The window is padded at the front and back to provide a small
    amount of silence or the beginnings/endings of speech around the
    voiced frames.

    Arguments:

    sample_rate - The audio sample rate, in Hz.
    frame_duration_ms - The frame duration in milliseconds.
    padding_duration_ms - The amount to pad the window, in milliseconds.
    vad - An instance of webrtcvad.Vad.
    frames - a source of audio frames (sequence or generator).

    Returns: A generator that yields PCM audio data.
    """
    num_padding_frames = int(padding_duration_ms / frame_duration_ms)
    # We use a deque for our sliding window/ring buffer.
    ring_buffer = collections.deque(maxlen=num_padding_frames)
    # We have two states: TRIGGERED and NOTTRIGGERED. We start in the
    # NOTTRIGGERED state.
    triggered = False

    voiced_frames = []
    for frame in frames:
        is_speech = vad.is_speech(frame.bytes, sample_rate)

        sys.stdout.write('1' if is_speech else '0')
        if not triggered:
            ring_buffer.append((frame, is_speech))
            num_voiced = len([f for f, speech in ring_buffer if speech])
            # If we're NOTTRIGGERED and more than 90% of the frames in
            # the ring buffer are voiced frames, then enter the
            # TRIGGERED state.
            if num_voiced > 0.9 * ring_buffer.maxlen:
                triggered = True
                sys.stdout.write('+(%s)' % (ring_buffer[0][0].timestamp,))
                # We want to yield all the audio we see from now until
                # we are NOTTRIGGERED, but we have to start with the
                # audio that's already in the ring buffer.
                for f, s in ring_buffer:
                    voiced_frames.append(f)
                ring_buffer.clear()
        else:
            # We're in the TRIGGERED state, so collect the audio data
            # and add it to the ring buffer.
            voiced_frames.append(frame)
            ring_buffer.append((frame, is_speech))
            num_unvoiced = len([f for f, speech in ring_buffer if not speech])
            # If more than 90% of the frames in the ring buffer are
            # unvoiced, then enter NOTTRIGGERED and yield whatever
            # audio we've collected.
            if num_unvoiced > 0.9 * ring_buffer.maxlen:
                sys.stdout.write('-(%s)' % (frame.timestamp + frame.duration))
                triggered = False
                yield b''.join([f.bytes for f in voiced_frames])
                ring_buffer.clear()
                voiced_frames = []
    if triggered:
        sys.stdout.write('-(%s)' % (frame.timestamp + frame.duration))
    sys.stdout.write('\n')
    # If we have any leftover voiced audio when we run out of input,
    # yield it.
    if voiced_frames:
        yield b''.join([f.bytes for f in voiced_frames])

def write_wave(path, audio, sample_rate):
    """Writes a .wav file.

    Takes path, PCM audio data, and sample rate.
    """
    with contextlib.closing(wave.open(path, 'wb')) as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio)

def feauture_interpolation(mffcs_to_interpolate, desired_size = 4040):

  """ Interpolate the existing MFCC features to generate additional feature vectors. """

  if(mffcs_to_interpolate.shape[0] != 4040):

    # Define the original time axis
    original_time_axis = np.linspace(0, 1, len(mffcs_to_interpolate))

    # Define the desired time axis after interpolation
    desired_time_axis = np.linspace(0, 1, desired_size)

    # Perform linear interpolation to generate new MFCC values
    interpolated_mfcc_values = interp1d(original_time_axis, mffcs_to_interpolate, kind='linear')(desired_time_axis)

    interpolated_mfcc_values = interpolated_mfcc_values.astype(np.float32)

    return interpolated_mfcc_values

def load_audio(dir, audio_type):
  """
      args:
                current_dir: current directory
                audio_type: audio files type or extension
      return:
                list of audio files
  """
  files = os.listdir(dir)
  audio_files = []
  for filename in glob.glob(os.path.join(dir, audio_type)):
    data, smplerate = librosa.load(filename, sr = 8000)
    audio_files.append(data)
  return audio_files

def load_mfccs(audio_files, mfccs):
  """
      args: audio files, list mfccs, list labels and data label (-1 for normal and 1 for asphyxia)

      return: tuple of audio mfccs and labels
  """
  for data in audio_files:
    mfccs.append(librosa.feature.mfcc(y=data, win_length=int(0.03*8000), hop_length=int(0.01*8000), n_mfcc=40).flatten())
    if mfccs[-1].shape[0]!=4040:
      mfccs[-1] = feauture_interpolation(mfccs[-1], 4040)
  mfccs = (mfccs - np.mean(mfccs)) / np.std(mfccs) # cepstral normalization
  return mfccs

def perform_inference(mfccs, model_path, i):

  """
      args:
          (list) mfccs: a list of audio signal mfccs
          (int)  i    : iteration variable
          (str) model_path: onnx inference path
      return:
          (float) result: inference result
  """
  ort_session = ort.InferenceSession(model_path)

  input_name = ort_session.get_inputs()[0].name

  output_names = [output.name for output in ort_session.get_outputs()]

  input_rank = mfccs[i].ndim

  if input_rank != 2:
    mfccs[i] = mfccs[i].reshape((1, -1))

  result = ort_session.run(output_names, {input_name: mfccs[i]})

  return float(result[0][0])

def majority_vote(inference_results):
  """
  This function determines the majority sign of an array of numbers.

  Args:
      inference_results: A numpy array of numbers.

  Returns:
      1 if the majority of elements are greater than 0, -1 if the majority are less than 0,
      and 0 if there is an equal count of positive and negative elements (or the array is empty).
  """

  count_positive = np.sum(inference_results > 0)
  count_negative = np.sum(inference_results < 0)

  if count_positive > count_negative:
    return '1'
  elif count_negative > count_positive:
    return '-1'
  else:
    return '0'


model_path = 'best_model.onnx'

@app.route('/', methods=['POST'])
def inference_cry():
    # Anonymous inference endpoint: no DB write, no authentication
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    file_path = os.path.join('./', file.filename)
    file.save(file_path)

    caf_file = f'./{file.filename}'
    random_name = random.random()

    wav_file = f'{random_name}.wav'
    
    command = ["ffmpeg", "-i", caf_file, wav_file]
    
    subprocess.run(command, check=True)
    
    clean_audio_path = f'{random_name}.wav'
    
    audio_type = '*.wav'
    
    vad_audio_path = "data/1s-audio/"

    mode = 1  # mode between 0 and 3

    audio, sample_rate = read_wave(clean_audio_path)

    sample_rate = 8000

    vad = webrtcvad.Vad(int(mode))

    frames = frame_generator(30, audio, sample_rate)

    frames = list(frames)

    segments = vad_collector(sample_rate, 30, 300, vad, frames)
    
    for i, segment in enumerate(segments):

        # Check if the segment is approximately 1 second long

        segment_length = len(segment) / float(sample_rate)

        if len(segment) / float(sample_rate) >= 0.9 and len(segment) / float(sample_rate) <= 1.5:

            path = os.path.join(vad_audio_path, 'vad-cry-%002d.wav' % (i,))

            write_wave(path, segment, sample_rate)
        
        else:
            print('Segment %d is not approximately 1 second long. Skipping.' % i)
    

    mfccs = []

    normal_cry_dir = vad_audio_path

    audio_files_normal = load_audio(normal_cry_dir, audio_type)

    if audio_files_normal == []:
        return {'prediction': '0'}
    
    load_mfccs(audio_files_normal, mfccs)
    
    # test for five asphyxiated signals
    if len(mfccs) != 0:
        
        inference_results = []

        for i in range(len(mfccs)):

            result = perform_inference(mfccs, model_path, i)

            inference_results.append(result)
            
        result = majority_vote(np.array(inference_results))

    else:
        result = '0'
        
    print("INFERENCE RESULTS>>>>>",result)
    
    # Clean up files as before
    try:
        os.remove(file_path)
        for filename in os.listdir('data/1s-audio'):
            if filename.endswith('.wav'):
                os.remove(os.path.join('data/1s-audio', filename))
    except Exception:
        pass

    return jsonify({'prediction': result})

@app.route('/collect-cry', methods=['POST'])
def collect_cry():
    # Data collection endpoint: requires professional_id, baby_id, device_name
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    professional_id = request.form.get('professional_id')
    baby_id = request.form.get('baby_id')
    device_name = request.form.get('device_name', 'Unknown')

    if not all([professional_id, baby_id]):
        return jsonify({'error': 'Missing required parameters'}), 400

    file_path = os.path.join('./', file.filename)
    file.save(file_path)

    caf_file = f'./{file.filename}'
    random_name = random.random()

    wav_file = f'{random_name}.wav'
    
    command = ["ffmpeg", "-i", caf_file, wav_file]
    
    subprocess.run(command, check=True)
    
    clean_audio_path = f'{random_name}.wav'
    
    audio_type = '*.wav'
    
    vad_audio_path = "data/1s-audio/"

    mode = 1  # mode between 0 and 3

    audio, sample_rate = read_wave(clean_audio_path)

    sample_rate = 8000

    vad = webrtcvad.Vad(int(mode))

    frames = frame_generator(30, audio, sample_rate)

    frames = list(frames)

    segments = vad_collector(sample_rate, 30, 300, vad, frames)
    
    for i, segment in enumerate(segments):

        # Check if the segment is approximately 1 second long

        segment_length = len(segment) / float(sample_rate)

        if len(segment) / float(sample_rate) >= 0.9 and len(segment) / float(sample_rate) <= 1.5:

            path = os.path.join(vad_audio_path, 'vad-cry-%002d.wav' % (i,))

            write_wave(path, segment, sample_rate)
        
        else:
            print('Segment %d is not approximately 1 second long. Skipping.' % i)
    

    mfccs = []

    normal_cry_dir = vad_audio_path

    audio_files_normal = load_audio(normal_cry_dir, audio_type)

    if audio_files_normal == []:
        return {'prediction': '0'}
    
    load_mfccs(audio_files_normal, mfccs)
    
    # test for five asphyxiated signals
    if len(mfccs) != 0:
        
        inference_results = []

        for i in range(len(mfccs)):

            result = perform_inference(mfccs, model_path, i)

            inference_results.append(result)
            
        result = majority_vote(np.array(inference_results))

    else:
        result = '0'
        
    print("INFERENCE RESULTS>>>>>",result)
    
    # After inference, store the cry record
    try:
        cry_record = Cry(
            record_date=date.today(),
            record_time=datetime.now().time(),
            duration=len(audio) / float(sample_rate),
            file_path=file_path,
            recording_device=device_name,
            cry_type='Asphyxia' if result == '1' else 'Normal',
            expert_annotation=False,
            id_baby=int(baby_id),
            id_professional=int(professional_id)
        )
        db.session.add(cry_record)
        db.session.commit()
        # Clean up files as before
        os.remove(file_path)
        for filename in os.listdir('data/1s-audio'):
            if filename.endswith('.wav'):
                os.remove(os.path.join('data/1s-audio', filename))
        return jsonify({
            'prediction': result,
            'cry_record': cry_record.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# CRUD Operations for Hospital
@app.route('/hospitals', methods=['POST'])
def create_hospital():
    data = request.get_json()
    try:
        hospital = Hospital(
            name_hospital=data['name_hospital'],
            country=data['country'],
            city=data['city'],
            status=data['status']
        )
        db.session.add(hospital)
        db.session.commit()
        return jsonify(hospital.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/hospitals/<hospital_id>', methods=['GET'])
def get_hospital(hospital_id):
    hospital = Hospital.query.get(hospital_id)
    if not hospital:
        return jsonify({'error': 'Hospital not found'}), 404
    return jsonify(hospital.to_dict())

@app.route('/hospitals', methods=['GET'])
def get_all_hospitals():
    hospitals = Hospital.query.all()
    return jsonify([h.to_dict() for h in hospitals])

@app.route('/hospitals/<hospital_id>', methods=['PUT'])
def update_hospital(hospital_id):
    hospital = Hospital.query.get(hospital_id)
    if not hospital:
        return jsonify({'error': 'Hospital not found'}), 404
    
    data = request.get_json()
    try:
        hospital.name_hospital = data.get('name_hospital', hospital.name_hospital)
        hospital.country = data.get('country', hospital.country)
        hospital.city = data.get('city', hospital.city)
        hospital.status = data.get('status', hospital.status)
        db.session.commit()
        return jsonify(hospital.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/hospitals/<hospital_id>', methods=['DELETE'])
def delete_hospital(hospital_id):
    hospital = Hospital.query.get(hospital_id)
    if not hospital:
        return jsonify({'error': 'Hospital not found'}), 404
    
    try:
        db.session.delete(hospital)
        db.session.commit()
        return jsonify({'message': 'Hospital deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Medical Professional CRUD
@app.route('/professionals', methods=['POST'])
def create_professional():
    data = request.get_json()
    try:
        professional = MedicalProfessional(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            position=data['position'],
            id_hospital=data['id_hospital']
        )
        db.session.add(professional)
        db.session.commit()
        return jsonify(professional.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/professionals', methods=['GET'])
def get_all_professionals():
    professionals = MedicalProfessional.query.all()
    return jsonify([p.to_dict() for p in professionals])

@app.route('/professionals/<professional_id>', methods=['GET'])
def get_professional(professional_id):
    professional = MedicalProfessional.query.get(professional_id)
    if not professional:
        return jsonify({'error': 'Professional not found'}), 404
    return jsonify(professional.to_dict())

@app.route('/professionals/<professional_id>', methods=['PUT'])
def update_professional(professional_id):
    professional = MedicalProfessional.query.get(professional_id)
    if not professional:
        return jsonify({'error': 'Professional not found'}), 404
    
    data = request.get_json()
    try:
        professional.first_name = data.get('first_name', professional.first_name)
        professional.last_name = data.get('last_name', professional.last_name)
        professional.email = data.get('email', professional.email)
        professional.position = data.get('position', professional.position)
        professional.id_hospital = data.get('id_hospital', professional.id_hospital)
        db.session.commit()
        return jsonify(professional.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/professionals/<professional_id>', methods=['DELETE'])
def delete_professional(professional_id):
    professional = MedicalProfessional.query.get(professional_id)
    if not professional:
        return jsonify({'error': 'Professional not found'}), 404
    
    try:
        db.session.delete(professional)
        db.session.commit()
        return jsonify({'message': 'Professional deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Baby CRUD
@app.route('/babies', methods=['POST'])
def create_baby():
    data = request.get_json()
    valid_genders = ['Male', 'Female', 'Other']
    if data.get('gender') not in valid_genders:
        return jsonify({'error': f'Gender must be one of: {valid_genders}'}), 400
    try:
        baby = Baby(
            first_name=data['first_name'],
            last_name=data['last_name'],
            gender=data['gender'],
            age=data.get('age'),
            weight=data.get('weight'),
            temperature=data.get('temperature'),
            pulse=data.get('pulse'),
            breathing_rate=data.get('breathing_rate'),
            apgar_score=data.get('apgar_score')
        )
        db.session.add(baby)
        db.session.commit()
        return jsonify(baby.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/babies', methods=['GET'])
def get_all_babies():
    babies = Baby.query.all()
    return jsonify([b.to_dict() for b in babies])

@app.route('/babies/<baby_id>', methods=['GET'])
def get_baby(baby_id):
    baby = Baby.query.get(baby_id)
    if not baby:
        return jsonify({'error': 'Baby not found'}), 404
    return jsonify(baby.to_dict())

@app.route('/babies/<baby_id>', methods=['PUT'])
def update_baby(baby_id):
    baby = Baby.query.get(baby_id)
    if not baby:
        return jsonify({'error': 'Baby not found'}), 404
    data = request.get_json()
    if 'gender' in data:
        valid_genders = ['Male', 'Female', 'Other']
        if data['gender'] not in valid_genders:
            return jsonify({'error': f'Gender must be one of: {valid_genders}'}), 400
    try:
        baby.first_name = data.get('first_name', baby.first_name)
        baby.last_name = data.get('last_name', baby.last_name)
        baby.gender = data.get('gender', baby.gender)
        baby.age = data.get('age', baby.age)
        baby.weight = data.get('weight', baby.weight)
        baby.temperature = data.get('temperature', baby.temperature)
        baby.pulse = data.get('pulse', baby.pulse)
        baby.breathing_rate = data.get('breathing_rate', baby.breathing_rate)
        baby.apgar_score = data.get('apgar_score', baby.apgar_score)
        db.session.commit()
        return jsonify(baby.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/babies/<baby_id>', methods=['DELETE'])
def delete_baby(baby_id):
    baby = Baby.query.get(baby_id)
    if not baby:
        return jsonify({'error': 'Baby not found'}), 404
    try:
        db.session.delete(baby)
        db.session.commit()
        return jsonify({'message': 'Baby deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Device CRUD
@app.route('/devices', methods=['POST'])
def create_device():
    data = request.get_json()
    valid_device_types = ['Smartphone', 'Wearable']
    valid_statuses = ['Active', 'Inactive', 'Maintenance']
    if data.get('device_type') not in valid_device_types:
        return jsonify({'error': f'Device type must be one of: {valid_device_types}'}), 400
    if data.get('status', 'Active') not in valid_statuses:
        return jsonify({'error': f'Status must be one of: {valid_statuses}'}), 400
    try:
        device = Device(
            device_type=data['device_type'],
            manufacturer=data['manufacturer'],
            model_number=data['model_number'],
            serial_number=data['serial_number'],
            purchase_date=datetime.strptime(data['purchase_date'], '%Y-%m-%d').date(),
            status=data.get('status', 'Active'),
            location=data['location'],
            device_name=data['device_name'],
            id_hospital=data['id_hospital']
        )
        db.session.add(device)
        db.session.commit()
        return jsonify(device.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/devices', methods=['GET'])
def get_all_devices():
    devices = Device.query.all()
    return jsonify([d.to_dict() for d in devices])

@app.route('/devices/<device_id>', methods=['GET'])
def get_device(device_id):
    device = Device.query.get(device_id)
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    return jsonify(device.to_dict())

@app.route('/devices/<device_id>', methods=['PUT'])
def update_device(device_id):
    device = Device.query.get(device_id)
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    data = request.get_json()
    if 'device_type' in data:
        valid_device_types = ['Smartphone', 'Wearable']
        if data['device_type'] not in valid_device_types:
            return jsonify({'error': f'Device type must be one of: {valid_device_types}'}), 400
    if 'status' in data:
        valid_statuses = ['Active', 'Inactive', 'Maintenance']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Status must be one of: {valid_statuses}'}), 400
    try:
        device.device_type = data.get('device_type', device.device_type)
        device.manufacturer = data.get('manufacturer', device.manufacturer)
        device.model_number = data.get('model_number', device.model_number)
        device.serial_number = data.get('serial_number', device.serial_number)
        if 'purchase_date' in data:
            device.purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()
        device.status = data.get('status', device.status)
        device.location = data.get('location', device.location)
        device.device_name = data.get('device_name', device.device_name)
        device.id_hospital = data.get('id_hospital', device.id_hospital)
        db.session.commit()
        return jsonify(device.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/devices/<device_id>', methods=['DELETE'])
def delete_device(device_id):
    device = Device.query.get(device_id)
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    try:
        db.session.delete(device)
        db.session.commit()
        return jsonify({'message': 'Device deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Cry CRUD
@app.route('/cries', methods=['POST'])
def create_cry():
    data = request.get_json()
    valid_cry_types = ['Asphyxia', 'Hunger', 'Pain', 'Discomfort', 'Sleepiness']
    if data.get('cry_type') not in valid_cry_types:
        return jsonify({'error': f'Cry type must be one of: {valid_cry_types}'}), 400
    try:
        cry = Cry(
            duration=data.get('duration'),
            file_path=data['file_path'],
            recording_device=data['recording_device'],
            cry_type=data['cry_type'],
            expert_annotation=data.get('expert_annotation', False),
            id_baby=data['id_baby'],
            id_professional=data['id_professional'],
            record_date=datetime.strptime(data.get('record_date', datetime.now().date().isoformat()), '%Y-%m-%d').date(),
            record_time=datetime.strptime(data.get('record_time', datetime.now().time().isoformat()), '%H:%M:%S').time()
        )
        db.session.add(cry)
        db.session.commit()
        return jsonify(cry.to_dict()), 201
    except Exception as e:
        print("================================")
        print(f"Error creating cry record: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/cries', methods=['GET'])
def get_all_cries():
    cries = Cry.query.all()
    return jsonify([c.to_dict() for c in cries])

@app.route('/cries/<cry_id>', methods=['GET'])
def get_cry(cry_id):
    cry = Cry.query.get(cry_id)
    if not cry:
        return jsonify({'error': 'Cry record not found'}), 404
    return jsonify(cry.to_dict())

@app.route('/cries/<cry_id>', methods=['PUT'])
def update_cry(cry_id):
    cry = Cry.query.get(cry_id)
    if not cry:
        return jsonify({'error': 'Cry record not found'}), 404
    data = request.get_json()
    if 'cry_type' in data:
        valid_cry_types = ['Asphyxia', 'Hunger', 'Pain', 'Discomfort', 'Sleepiness']
        if data['cry_type'] not in valid_cry_types:
            return jsonify({'error': f'Cry type must be one of: {valid_cry_types}'}), 400
    try:
        cry.duration = data.get('duration', cry.duration)
        cry.file_path = data.get('file_path', cry.file_path)
        cry.recording_device = data.get('recording_device', cry.recording_device)
        cry.cry_type = data.get('cry_type', cry.cry_type)
        cry.expert_annotation = data.get('expert_annotation', cry.expert_annotation)
        cry.id_baby = data.get('id_baby', cry.id_baby)
        cry.id_professional = data.get('id_professional', cry.id_professional)
        if 'record_date' in data:
            cry.record_date = datetime.strptime(data['record_date'], '%Y-%m-%d').date()
        if 'record_time' in data:
            cry.record_time = datetime.strptime(data['record_time'], '%H:%M:%S').time()
        db.session.commit()
        return jsonify(cry.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/cries/<cry_id>', methods=['DELETE'])
def delete_cry(cry_id):
    cry = Cry.query.get(cry_id)
    if not cry:
        return jsonify({'error': 'Cry record not found'}), 404
    try:
        db.session.delete(cry)
        db.session.commit()
        return jsonify({'message': 'Cry record deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def initialize_database():
    with app.app_context():
        db.create_all()
        print("Database initialized successfully!")

if __name__ == '__main__':
    # initialize_database()  COMMENT THIS in PRODUCTION
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    if not os.path.exists('data/1s-audio'):
        os.makedirs('data/1s-audio')
    app.run(debug=True, host='0.0.0.0')