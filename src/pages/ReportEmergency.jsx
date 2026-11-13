import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  AlertCircle,
  MapPin,
  Users,
  Image as ImageIcon,
  Send,
  Loader2,
  CheckCircle2,
  Volume2,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { getCurrentLocation } from '../services/location';
import { createSpeechRecognition, isSpeechRecognitionSupported } from '../services/speech';
import { saveUserIncident, getReporterId } from '../utils/session';

const CATEGORIES = [
  { value: 'medical', label: 'Medical Emergency (Trauma / Stroke / Severe Illness)' },
  { value: 'cardiac', label: 'Cardiac Arrest / Chest Pain / Heart Failure' },
  { value: 'accident', label: 'Road / Highway Vehicle Collision' },
  { value: 'fire', label: 'Fire Outbreak / Chemical Smoke' },
  { value: 'flood', label: 'Flooding / Musi River Water Inundation' },
  { value: 'collapse', label: 'Structural Collapse / Building Entrapment' },
  { value: 'crime', label: 'Assault / Armed Violence / Crime' },
  { value: 'other', label: 'Other Urgent Crisis' },
];

export default function ReportEmergency() {
  const navigate = useNavigate();

  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('medical');
  const [affectedPeople, setAffectedPeople] = useState(1);
  const [latitude, setLatitude] = useState(17.3850); // Default Hyderabad Central
  const [longitude, setLongitude] = useState(78.4867);
  const [locating, setLocating] = useState(false);
  const [locSuccess, setLocSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    // Attempt auto-location detection on mount
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocating(true);
    setLocSuccess(false);
    getCurrentLocation()
      .then((pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setLocSuccess(true);
      })
      .catch((err) => {
        console.warn('Geolocation auto-detect failed, using default coords:', err);
      })
      .finally(() => {
        setLocating(false);
      });
  };

  const handleVoiceToggle = () => {
    setVoiceError('');

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceError('Web Speech API is not supported in this browser. Please type your report.');
      return;
    }

    const rec = createSpeechRecognition({
      onStart: () => setIsRecording(true),
      onResult: (transcript) => {
        // Append voice text to natural-language description so user can review and edit
        setDescription((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      },
      onError: (err) => {
        setVoiceError(err.message || 'Microphone error');
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    if (rec) {
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        setVoiceError('Failed to activate microphone: ' + err.message);
        setIsRecording(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!description.trim()) {
      setSubmitError('Please describe the emergency situation.');
      return;
    }

    setSubmitting(true);

    try {
      // Backend expects multipart/form-data: incident_type, description, latitude, longitude, affected_people, image
      const formData = new FormData();
      formData.append('reporter_id', getReporterId());
      formData.append('incident_type', incidentType);
      formData.append('description', description.trim());
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('affected_people', String(affectedPeople));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post('/incidents/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      if (data && data.incident && data.incident.id) {
        // Save to user's local session so they see only their incidents
        saveUserIncident(data.incident.id);
        setSubmittedData(data);
      } else {
        throw new Error('Invalid response received from emergency server.');
      }
    } catch (err) {
      console.error('Report submission failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Emergency submission failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedData) {
    const inc = submittedData.incident;
    const classification = submittedData.classification;
    const alloc = submittedData.allocation;

    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white">Emergency Dispatched & Registered</h2>
          <p className="text-gray-300">
            Incident <span className="font-mono text-emerald-400 font-bold">#{inc.id}</span> has been broadcast to emergency responders.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Triage & Classification Result
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-800/60 p-3 rounded-xl">
              <span className="text-gray-400 block text-xs">Incident ID</span>
              <span className="text-lg font-bold text-white">#{inc.id}</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl">
              <span className="text-gray-400 block text-xs">AI Priority</span>
              <span className={`text-lg font-bold uppercase ${inc.priority === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                {inc.priority}
              </span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl">
              <span className="text-gray-400 block text-xs">AI Severity</span>
              <span className="text-lg font-bold text-rose-400">{inc.severity} / 5</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl">
              <span className="text-gray-400 block text-xs">Status</span>
              <span className="text-lg font-bold text-emerald-400 uppercase">{inc.status}</span>
            </div>
          </div>

          {(classification?.classification_reason || classification?.reason) && (
            <div className="p-3.5 bg-purple-950/40 border border-purple-800/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-200 text-xs">AI Triage Assessment</span>
                {classification?.confidence && (
                  <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                    {Math.round(classification.confidence * 100)}% Confidence
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-300 leading-relaxed">
                {classification.classification_reason || classification.reason}
              </p>
              {classification?.required_responders && classification.required_responders.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-400">Required Services:</span>
                  {classification.required_responders.map((res) => (
                    <span key={res} className="text-[11px] bg-slate-800 text-gray-200 px-2 py-0.5 rounded border border-slate-700 capitalize font-medium">
                      {res.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {alloc && (
            <div className="bg-slate-800/80 p-4 rounded-xl space-y-3 border border-slate-700">
              <h4 className="text-sm font-semibold text-gray-200">Dispatched Emergency Grid:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-gray-400 block text-xs">Ambulance</span>
                  <span className="font-semibold text-white text-xs">
                    {alloc.ambulance_id ? `Unit #${alloc.ambulance_id}` : 'Standby'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-gray-400 block text-xs">Fire Tender</span>
                  <span className="font-semibold text-amber-400 text-xs">
                    {alloc.fire_engine_id ? `Fire Unit #${alloc.fire_engine_id}` : 'Not Required'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-gray-400 block text-xs">Police Patrol</span>
                  <span className="font-semibold text-blue-400 text-xs">
                    {alloc.police_vehicle_id ? `Police #${alloc.police_vehicle_id}` : 'Monitoring'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-gray-400 block text-xs">Receiving Hospital</span>
                  <span className="font-semibold text-emerald-400 text-xs truncate block" title={alloc.hospital_id ? `Hospital #${alloc.hospital_id}` : 'Designated'}>
                    {alloc.hospital_id ? `Hospital #${alloc.hospital_id}` : 'Designating'}
                  </span>
                </div>
              </div>

              {alloc.allocation_reason && (
                <div className="p-2.5 bg-slate-900/90 rounded-lg text-xs text-gray-300 border border-slate-800">
                  <span className="text-gray-400 font-semibold block mb-0.5">Coordination Routing:</span>
                  {alloc.allocation_reason}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Distance: <strong className="text-white">{alloc.distance_km} km</strong></span>
                <span>Calculated Road ETA: <strong className="text-emerald-400 font-bold">{alloc.estimated_time_minutes} min</strong></span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => navigate('/my')}
              className="flex-1 bg-primary hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition duration-150 flex items-center justify-center gap-2"
            >
              Track in My Emergencies
            </button>
            <button
              onClick={() => {
                setSubmittedData(null);
                setDescription('');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-gray-200 font-medium py-3 px-6 rounded-xl transition"
            >
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-purple-950/60 border border-red-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Report an Emergency</h1>
            <p className="text-gray-300 text-sm mt-1">
              Speak or describe the situation. AI classifies severity and dispatches nearest ambulance and hospital automatically.
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-red-950/60 border border-red-600/50 rounded-xl text-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Reporting Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Natural Language & Voice Reporting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              Emergency Description (Text or Voice)
            </label>
            <span className="text-xs text-gray-400">English (en-US)</span>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. There is a multi-car collision near Indiranagar, 3 people badly injured and bleeding..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-base leading-relaxed pr-14"
              required
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              title={isRecording ? 'Stop Recording' : 'Speak Emergency in English'}
              className={`absolute right-3 bottom-3 p-3 rounded-xl transition-all shadow-md flex items-center justify-center ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-600/40'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-xs text-rose-400 animate-pulse bg-red-950/30 p-2.5 rounded-lg border border-red-900/40">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Listening in English... Speak clearly. Your speech will be typed above for you to review before submitting.
            </div>
          )}

          {voiceError && (
            <p className="text-xs text-amber-400 mt-1">{voiceError}</p>
          )}
        </div>

        {/* Emergency Category */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-200">Emergency Category</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.value}
                onClick={() => setIncidentType(cat.value)}
                className={`p-3 rounded-xl text-left text-sm font-medium border transition-all ${
                  incidentType === cat.value
                    ? 'bg-red-950/40 border-red-500 text-white ring-1 ring-red-500'
                    : 'bg-slate-950/50 border-slate-800 text-gray-400 hover:border-slate-700 hover:text-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Affected People & Image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Affected People
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={affectedPeople}
              onChange={(e) => setAffectedPeople(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              Optional Scene Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-purple-300 hover:file:bg-slate-700 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-1.5"
            />
          </div>
        </div>

        {/* Location Detection & Coordinates */}
        <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              Incident Coordinates (GPS)
            </label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={locating}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-purple-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              {locating ? 'Detecting GPS...' : 'Refetch My GPS'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-400 block mb-1">Latitude</span>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
              />
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-1">Longitude</span>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
              />
            </div>
          </div>
          {locSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> High-accuracy browser GPS location attached
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || isRecording}
          className="w-full py-4 bg-primary hover:bg-red-600 disabled:opacity-50 text-white text-lg font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 tracking-wide"
        >
          {submitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Transmitting to Emergency Grid...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>CONFIRM & TRANSMIT EMERGENCY</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

