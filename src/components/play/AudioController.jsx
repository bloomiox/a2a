import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Languages,
  Repeat,
  Repeat1
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AudioErrorAlert from '@/components/common/AudioErrorAlert';

export default function AudioController({
  currentStop,
  onNext,
  onPrevious,
  userPreferences = { language: "English" },
  onLanguageChange,
  className = ""
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none', 'one', 'all'
  const [selectedLanguage, setSelectedLanguage] = useState(userPreferences.language);
  const [audioReady, setAudioReady] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const audioRef = useRef(null);
  const progressUpdateRef = useRef(null);

  // Get available audio tracks for current stop
  const audioTracks = currentStop?.audio_tracks || [];
  const currentTrack = audioTracks.find(track => track.language === selectedLanguage) || audioTracks[0];

  // Debug logging for audio tracks
  useEffect(() => {
    if (currentStop) {
      console.log('AudioController - Current stop:', currentStop.title);
      console.log('AudioController - Available audio tracks:', audioTracks.length);
      console.log('AudioController - Current track:', currentTrack);
      if (currentTrack) {
        console.log('AudioController - Audio URL:', currentTrack.audio_url);
        console.log('AudioController - Audio URL length:', currentTrack.audio_url?.length);
        console.log('AudioController - Audio URL starts with:', currentTrack.audio_url?.substring(0, 50));
      }
    }
  }, [currentStop, audioTracks, currentTrack]);

  // Initialize audio when track changes
  useEffect(() => {
    if (!currentTrack?.audio_url) {
      setAudioReady(false);
      setError({
        message: "No audio available",
        details: "This stop doesn't have any audio files. Audio may need to be uploaded during tour editing."
      });
      return;
    }

    // Validate audio URL format
    const audioUrl = currentTrack.audio_url.trim();
    if (!audioUrl) {
      setError({
        message: "Audio URL is empty",
        details: "The audio file reference is missing. Please check the tour configuration."
      });
      setAudioReady(false);
      return;
    }

    setError(null);
    setAudioReady(false);
    setRetryCount(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.removeEventListener('ended', handleEnded);
      audioRef.current.removeEventListener('error', handleError);
    }

    audioRef.current = new Audio();
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.playbackRate = playbackRate;

    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);
    audioRef.current.addEventListener('canplay', () => {
      console.log('Audio can play:', currentTrack.audio_url);
    });

    // Set the source after adding event listeners
    try {
      audioRef.current.src = currentTrack.audio_url;
    } catch (srcError) {
      console.error('Error setting audio source:', srcError);
      setError({
        message: "Invalid audio source",
        details: "The audio file URL is not valid or accessible."
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  }, [currentTrack?.audio_url]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioReady(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);

    if (repeatMode === 'one') {
      // Replay current track
      handlePlay();
    } else if (repeatMode === 'all' && onNext) {
      // Go to next stop
      onNext();
    }
  };

  const handleError = (e) => {
    console.error('Audio error:', e);
    console.error('Audio URL that failed:', currentTrack?.audio_url);
    
    let errorMessage = "Audio not available";
    let userFriendlyMessage = "This audio file may not have been uploaded properly during tour creation.";
    
    if (e.target?.error) {
      switch (e.target.error.code) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = "Audio loading was cancelled";
          userFriendlyMessage = "Audio loading was interrupted. Please try again.";
          break;
        case 2: // MEDIA_ERR_NETWORK
          errorMessage = "Network error";
          userFriendlyMessage = "Check your internet connection and try again.";
          break;
        case 3: // MEDIA_ERR_DECODE
          errorMessage = "Invalid audio file";
          userFriendlyMessage = "The audio file appears to be corrupted or in an unsupported format.";
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          errorMessage = "Audio file not accessible";
          userFriendlyMessage = "The audio file may not have been uploaded properly or is not accessible.";
          break;
        default:
          errorMessage = "Audio playback error";
          userFriendlyMessage = "There was an issue playing this audio file.";
      }
    }
    
    setError({ message: errorMessage, details: userFriendlyMessage });
    setAudioReady(false);
    setIsPlaying(false);
  };

  const handlePlay = async () => {
    if (!audioRef.current || !audioReady) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      setError("Playback failed. Please try again.");
    }
  };

  const handleSeek = (newTime) => {
    if (audioRef.current && audioReady) {
      audioRef.current.currentTime = newTime[0];
      setCurrentTime(newTime[0]);
    }
  };

  const handleVolumeChange = (newVolume) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : vol;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const toggleRepeatMode = () => {
    const modes = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    if (currentTrack?.audio_url) {
      const link = document.createElement('a');
      link.href = currentTrack.audio_url;
      link.download = `${currentStop?.title || 'audio'}-${selectedLanguage}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const retryAudio = () => {
    if (retryCount < 3 && currentTrack?.audio_url) {
      console.log(`Retrying audio load (attempt ${retryCount + 1})`);
      setRetryCount(prev => prev + 1);
      setError(null);
      setAudioReady(false);
      
      // Recreate the audio element
      if (audioRef.current) {
        audioRef.current.src = '';
        audioRef.current.load();
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = currentTrack.audio_url;
          }
        }, 1000);
      }
    }
  };

  if (!currentStop) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No stop selected</p>
        </CardContent>
      </Card>
    );
  }

  if (audioTracks.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-gray-500">No audio available for this stop</p>
            <p className="text-xs text-gray-400">
              Audio files may need to be uploaded for "{currentStop?.title}"
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Stop Info */}
        <div className="text-center">
          <h3 className="font-semibold text-lg">{currentStop.title}</h3>
          {currentTrack && (
            <p className="text-sm text-gray-600">
              Audio in {currentTrack.language}
              {duration > 0 && ` • ${formatTime(duration)}`}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <AudioErrorAlert 
            error={error}
            onRetry={retryCount < 3 ? retryAudio : null}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Language Selection */}
        {audioTracks.length > 1 && (
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-gray-500" />
            <Select value={selectedLanguage} onValueChange={handleLanguageSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {audioTracks.map((track) => (
                  <SelectItem key={track.language} value={track.language}>
                    {track.language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            disabled={!audioReady}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRestart}
            disabled={!audioReady}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            size="lg"
            onClick={handlePlay}
            disabled={!audioReady}
            className="h-12 w-12 rounded-full"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleRepeatMode}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className={`w-4 h-4 ${repeatMode === 'all' ? 'text-indigo-600' : ''}`} />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={!onNext}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between text-sm">
          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          {/* Speed Control */}
          <Select value={playbackRate.toString()} onValueChange={(val) => handleSpeedChange(parseFloat(val))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>

          {/* Download Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={downloadAudio}
            className="h-8 w-8"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Transcript */}
        {currentTrack?.transcript && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              View Transcript
            </summary>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
              {currentTrack.transcript}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}