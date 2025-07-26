
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Play, Pause, Upload, Trash } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function AudioRecorder({ stopIndex, audioIndex, audio, onAudioChange }) {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(new Audio());
  const fileInputRef = useRef(null);
  
  // Debug logging
  React.useEffect(() => {
    console.log(`AudioRecorder for stop ${stopIndex}, track ${audioIndex}:`, audio);
  }, [stopIndex, audioIndex, audio]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        console.log("Recording data available");
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        console.log("Recording stopped, processing...");
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Update audio preview
        audioRef.current.src = audioUrl;
        
        // Create a file from the blob for upload
        const audioFile = new File([audioBlob], `recording-${Date.now()}.mp3`, { 
          type: 'audio/mp3' 
        });
        
        // Upload the audio file
        await handleUploadAudio(audioFile);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("Stopping recording");
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      
      // Stop all tracks on the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const togglePlayback = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audio.audio_url) {
      audioRef.current.src = audio.audio_url;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };
  
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log("File selected:", file);
    await handleUploadAudio(file);
  };
  
  const handleUploadAudio = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    console.log("Uploading audio file:", {
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      hasName: !!file.name
    });
    
    try {
      // Upload the audio file using the dedicated audio upload function
      const result = await UploadFile(file, { bucket: 'audio-files' });
      
      if (!result.success) {
        throw new Error(result.error || 'Audio upload failed');
      }
      
      console.log("File uploaded successfully, URL:", result.url);
      
      // Validate that the uploaded URL is accessible
      try {
        const testResponse = await fetch(result.url, { method: 'HEAD' });
        if (!testResponse.ok) {
          throw new Error(`Uploaded file not accessible: ${testResponse.status}`);
        }
        console.log("Upload URL validation successful");
      } catch (validationError) {
        console.error("Upload URL validation failed:", validationError);
        throw new Error(`Upload succeeded but file is not accessible: ${validationError.message}`);
      }
      
      // Get duration of the audio file
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        const duration = Math.round(audio.duration);
        console.log("Audio duration:", duration);
        
        // Update the audio track data
        onAudioChange(stopIndex, audioIndex, "audio_url", result.url);
        onAudioChange(stopIndex, audioIndex, "duration", duration);
        
        setIsUploading(false);
      };
      
      // Set a fallback in case metadata doesn't load
      audio.onerror = () => {
        console.warn("Could not load audio metadata, using estimated duration");
        // Just set a default duration if we can't get it
        onAudioChange(stopIndex, audioIndex, "audio_url", file_url);
        onAudioChange(stopIndex, audioIndex, "duration", 60); // Default to 1 minute
        setIsUploading(false);
      };
      
      // Add a timeout in case metadata loading hangs
      setTimeout(() => {
        if (isUploading) {
          console.warn("Audio metadata loading timed out");
          onAudioChange(stopIndex, audioIndex, "audio_url", file_url);
          onAudioChange(stopIndex, audioIndex, "duration", 60);
          setIsUploading(false);
        }
      }, 3000);
    } catch (error) {
      console.error("Error uploading audio:", error);
      setIsUploading(false);
    }
  };
  
  const handleDeleteAudio = () => {
    console.log("Deleting audio");
    onAudioChange(stopIndex, audioIndex, "audio_url", "");
    onAudioChange(stopIndex, audioIndex, "duration", 0);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return (
    <div className="space-y-2">
      {audio.audio_url ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          
          <div className="flex-1 text-xs text-gray-500">
            {t('audio.audioFile')} {audio.audio_url.substring(0, 20)}...
            {audio.duration > 0 ? ` (${formatTime(audio.duration)})` : ""}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-red-500"
            onClick={handleDeleteAudio}
          >
            <Trash size={16} />
          </Button>
        </div>
      ) : isRecording ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
              <div className="absolute inset-0 rounded-full bg-red-600"></div>
            </div>
            <span className="text-sm text-red-600 font-medium">{t('audio.recording')} {formatTime(recordingTime)}</span>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 ml-auto"
              onClick={stopRecording}
            >
              <Square size={16} />
            </Button>
          </div>
          
          <Progress value={Math.min(100, (recordingTime / 300) * 100)} className="h-1" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-8 gap-1"
            onClick={startRecording}
          >
            <Mic size={16} />
            {t('audio.record')}
          </Button>
          
          <span className="text-gray-400 text-xs">or</span>
          
          <div className="relative">
            <Button
              variant="outline"
              className="h-8 gap-1"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              {t('audio.upload')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
          
          {isUploading && (
            <div className="ml-2 flex items-center text-xs text-gray-500">
              <div className="h-3 w-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mr-1"></div>
              {t('audio.uploading')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
