
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
    Mic,
    MicOff,
    Radio,
    Volume2,
    VolumeX,
    AlertCircle,
    Settings,
    MapPin,
    Star
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { audioRelay } from '@/api/functions';

export default function LiveAudioBroadcast({ activeTours, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [selectedTour, setSelectedTour] = useState(null);
    const [selectedStop, setSelectedStop] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('ready');
    const [sentChunks, setSentChunks] = useState(0);
    const [failedChunks, setFailedChunks] = useState(0);

    const [audioSettings, setAudioSettings] = useState({
        chunkInterval: 3000, // Increased to 3 seconds to reduce rate limiting
        sampleRate: 22050, // Reduced sample rate to decrease data size
        bitRate: 32000, // Reduced bitrate significantly
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    });

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const audioLevelIntervalRef = useRef(null);
    const currentSessionRef = useRef(null);
    const sendQueueRef = useRef([]);
    const sendIntervalRef = useRef(null);
    const lastSendTimeRef = useRef(0);

    useEffect(() => {
        return () => cleanup();
    }, []);

    useEffect(() => {
        if (selectedTour && !selectedTour.assignment?.driver_id) {
            setError('Selected tour does not have an assigned driver.');
        } else {
            setError('');
        }
    }, [selectedTour]);

    const startRecording = async () => {
        if (!selectedTour) {
            setError('Please select a tour first.');
            return;
        }

        if (!selectedTour.assignment?.driver_id) {
            setError('Selected tour does not have an assigned driver.');
            return;
        }

        try {
            setError('');
            setConnectionStatus('connecting');
            setSentChunks(0);
            setFailedChunks(0);
            console.log('[ADMIN] 🎤 Starting live broadcast...');
            
            // Start broadcast session through the service
            console.log('[ADMIN] 🚀 Starting broadcast for:', {
                tourId: selectedTour.tour_id,
                driverId: selectedTour.assignment.driver_id,
                selectedTour: selectedTour
            });

            const broadcastResponse = await audioRelay({
                action: 'startBroadcast',
                tourId: selectedTour.tour_id,
                driverId: selectedTour.assignment.driver_id,
                adminId: 'admin-user' // You might want to pass this as a prop
            });

            if (!broadcastResponse.data.success) {
                throw new Error(broadcastResponse.data.error || 'Failed to start broadcast session');
            }

            const sessionId = broadcastResponse.data.sessionId;
            currentSessionRef.current = sessionId;
            console.log('[ADMIN] ✓ Broadcast session created:', sessionId, 'for tour:', selectedTour.tour_id);

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: audioSettings.sampleRate,
                    echoCancellation: audioSettings.echoCancellation,
                    noiseSuppression: audioSettings.noiseSuppression,
                    autoGainControl: audioSettings.autoGainControl,
                    channelCount: 1 // Mono to reduce data size
                }
            });
            streamRef.current = stream;
            console.log('[ADMIN] ✓ Microphone access granted');

            // Set up audio level monitoring
            audioContextRef.current = new AudioContext({ sampleRate: audioSettings.sampleRate });
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            monitorAudioLevel();

            // Set up MediaRecorder with optimized settings
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
            const options = { 
                mimeType, 
                audioBitsPerSecond: audioSettings.bitRate 
            };
            mediaRecorderRef.current = new MediaRecorder(stream, options);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0 && currentSessionRef.current && event.data.size < 50000) { // Limit chunk size to 50KB
                    console.log(`[ADMIN] Audio chunk ready: ${event.data.size} bytes`);
                    sendQueueRef.current.push({
                        data: event.data,
                        mimeType,
                        timestamp: Date.now()
                    });
                } else if (event.data.size >= 50000) {
                    console.warn('[ADMIN] Audio chunk too large, skipping:', event.data.size, 'bytes');
                }
            };

            mediaRecorderRef.current.onstop = () => {
                console.log("[ADMIN] MediaRecorder stopped.");
            };

            mediaRecorderRef.current.onerror = (event) => {
                console.error("[ADMIN] MediaRecorder error:", event.error);
                setError('Recording error: ' + event.error.message);
            };

            // Start recording with longer chunks
            mediaRecorderRef.current.start(audioSettings.chunkInterval);

            // Start the send queue processor
            startSendQueue();

            setIsRecording(true);
            setConnectionStatus('connected');
            console.log('[ADMIN] 🔴 Live broadcasting started');

        } catch (error) {
            console.error('[ADMIN] Failed to start recording:', error);
            if (error.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone permissions.');
            } else if (error.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone.');
            } else {
                setError(error.message || 'Could not start live broadcast. Check mic permissions.');
            }
            setConnectionStatus('error');
            cleanup();
        }
    };

    const startSendQueue = () => {
        // Process send queue with rate limiting
        sendIntervalRef.current = setInterval(async () => {
            if (sendQueueRef.current.length > 0) {
                const now = Date.now();
                // Enforce minimum 2.5 second gap between sends
                if (now - lastSendTimeRef.current >= 2500) {
                    const chunk = sendQueueRef.current.shift();
                    lastSendTimeRef.current = now;
                    await sendAudioChunk(chunk.data, chunk.mimeType);
                }
            }
        }, 1000); // Check every second, but only send if enough time has passed
    };

    const sendAudioChunk = async (audioBlob, mimeType) => {
        if (!currentSessionRef.current || !selectedTour?.assignment?.driver_id) return;

        try {
            console.log(`[ADMIN] Sending audio chunk: ${audioBlob.size} bytes`);
            
            // Convert blob to array buffer for the new service
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioData = new Uint8Array(arrayBuffer);
            
            const response = await audioRelay({
                action: 'sendAudio',
                sessionId: currentSessionRef.current,
                audioData: Array.from(audioData),
                mimeType: mimeType
            });

            if (response.status === 200) {
                setSentChunks(prev => prev + 1);
                console.log(`[ADMIN] ✓ Audio chunk sent successfully (${audioBlob.size} bytes)`);
            } else if (response.status === 429) {
                setFailedChunks(prev => prev + 1);
                console.warn('[ADMIN] Rate limit hit, will retry later');
                setError('Rate limited - slowing down transmission...');
                // Don't re-queue, just skip this chunk to avoid buildup
                setTimeout(() => setError(''), 3000);
            } else {
                setFailedChunks(prev => prev + 1);
                console.error('[ADMIN] Failed to send audio chunk:', response.status, response.data);
                if (response.data?.error) {
                    setError(`Send failed: ${response.data.error}`);
                    setTimeout(() => setError(''), 5000);
                }
            }
        } catch (error) {
            setFailedChunks(prev => prev + 1);
            console.error('[ADMIN] Failed to send audio chunk:', error);
            if (error.message.includes('429') || error.message.includes('Rate limit')) {
                setError('Rate limit reached. Audio transmission slowed down...');
                setTimeout(() => setError(''), 3000);
            } else {
                setError(`Network error: ${error.message}`);
                setTimeout(() => setError(''), 5000);
            }
        }
    };

    const stopRecording = async () => {
        console.log('[ADMIN] 🛑 Stopping live broadcast...');
        setIsRecording(false);
        setConnectionStatus('disconnecting');
        
        // Preserve session ID before cleanup
        const sessionIdToStop = currentSessionRef.current;
        
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        if (sendIntervalRef.current) {
            clearInterval(sendIntervalRef.current);
            sendIntervalRef.current = null;
        }

        // Clear remaining queue
        sendQueueRef.current = [];

        // Send stop signal BEFORE cleanup, using preserved session ID
        if (sessionIdToStop) {
            try {
                console.log('[ADMIN] 📡 Sending broadcast stop signal for session:', sessionIdToStop);
                await audioRelay({
                    action: 'stopBroadcast',
                    sessionId: sessionIdToStop,
                    tourId: selectedTour?.tour_id
                });
                console.log('[ADMIN] ✓ Broadcast stop signal sent successfully.');
            } catch (error) {
                console.error('[ADMIN] Error signaling broadcast stop:', error);
                // Don't show error to user as broadcast is already stopping
            }
        } else {
            console.warn('[ADMIN] No session ID available to send stop signal');
        }

        // Now do cleanup
        cleanup();
        setConnectionStatus('ready');
    };

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            console.log('[ADMIN] 🔇 Audio track released.');
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current);
            audioLevelIntervalRef.current = null;
        }
        if (sendIntervalRef.current) {
            clearInterval(sendIntervalRef.current);
            sendIntervalRef.current = null;
        }
        setAudioLevel(0);
        // Clear session ID AFTER stop signal is sent
        currentSessionRef.current = null;
        sendQueueRef.current = [];
        lastSendTimeRef.current = 0;
    };

    const monitorAudioLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        audioLevelIntervalRef.current = setInterval(() => {
            if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
                setAudioLevel(Math.min(100, (average / 255) * 200));
            }
        }, 100);
    };

    const getStatusText = () => ({
        connected: 'Live',
        connecting: 'Starting...',
        disconnecting: 'Stopping...',
        error: 'Error',
        ready: 'Ready'
    }[connectionStatus]);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Tabs defaultValue="broadcast" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="broadcast">Live Broadcast</TabsTrigger>
                    <TabsTrigger value="settings">Audio Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="broadcast" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Radio className="h-5 w-5" /> Live Audio Broadcast
                                <Badge variant={connectionStatus === 'error' ? 'destructive' : connectionStatus === 'connected' ? 'default' : 'outline'} className="ml-auto">
                                    {getStatusText()}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Select Active Tour:</Label>
                                    <Select 
                                        value={selectedTour?.tour_id || ''} 
                                        onValueChange={(v) => setSelectedTour(activeTours.find(t => t.tour_id === v))} 
                                        disabled={isRecording}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose active tour..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeTours.map((tour) => (
                                                <SelectItem key={tour.tour_id} value={tour.tour_id}>
                                                    <div>
                                                        <div className="font-medium">{tour.tour?.title || 'Unknown Tour'}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Driver: {tour.driver?.full_name || tour.driver_id || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {activeTours.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">No tours are currently in progress.</p>
                                    )}
                                </div>
                                
                                {selectedTour?.tour?.stops && (
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Target Stop (Optional):</Label>
                                        <Select value={selectedStop || ''} onValueChange={setSelectedStop} disabled={isRecording}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Broadcast to current driver location" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={null}>Current driver location</SelectItem>
                                                {selectedTour.tour.stops.map((stop) => (
                                                    <SelectItem key={stop.id} value={stop.id}>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-3 w-3" />
                                                            {stop.title}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Audio Level:</Label>
                                    <div className="flex items-center gap-2">
                                        {audioLevel > 5 ? (
                                            <Volume2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <VolumeX className="h-4 w-4 text-gray-400" />
                                        )}
                                        <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full transition-all duration-100 bg-green-500" 
                                                style={{ width: `${Math.min(100, audioLevel)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono w-8">{Math.round(audioLevel)}%</span>
                                    </div>
                                </div>

                                {isRecording && (
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div className="text-center p-2 bg-green-50 rounded">
                                            <div className="font-medium text-green-800">Sent</div>
                                            <div className="text-green-600">{sentChunks} chunks</div>
                                        </div>
                                        <div className="text-center p-2 bg-red-50 rounded">
                                            <div className="font-medium text-red-800">Failed</div>
                                            <div className="text-red-600">{failedChunks} chunks</div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex gap-2 pt-2">
                                    <Button 
                                        onClick={isRecording ? stopRecording : startRecording} 
                                        variant={isRecording ? "destructive" : "default"} 
                                        className="flex-1" 
                                        disabled={!selectedTour || ['connecting', 'disconnecting'].includes(connectionStatus)}
                                    >
                                        {isRecording ? (
                                            <>
                                                <MicOff className="h-4 w-4 mr-2" />
                                                Stop Broadcasting
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="h-4 w-4 mr-2" />
                                                Start Broadcasting
                                            </>
                                        )}
                                    </Button>
                                    <Button variant="outline" onClick={onClose}>Close</Button>
                                </div>
                                
                                {isRecording && (
                                    <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <Badge variant="destructive" className="animate-pulse text-sm">
                                            🔴 LIVE - Broadcasting to {selectedTour.assignment?.driver_id || selectedTour.driver?.full_name || 'driver'}
                                        </Badge>
                                        <div className="text-xs text-red-600 mt-2">
                                            Optimized transmission: {audioSettings.chunkInterval/1000}s intervals • {audioSettings.sampleRate/1000}kHz • {audioSettings.bitRate/1000}kbps
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Audio Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Chunk Interval: {audioSettings.chunkInterval / 1000}s</Label>
                                <Slider
                                    value={[audioSettings.chunkInterval]}
                                    onValueChange={([value]) => setAudioSettings(prev => ({ ...prev, chunkInterval: value }))}
                                    min={2000}
                                    max={10000}
                                    step={1000}
                                    disabled={isRecording}
                                />
                                <p className="text-xs text-muted-foreground">Longer intervals reduce rate limiting but increase latency</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Sample Rate: {audioSettings.sampleRate} Hz</Label>
                                <Slider
                                    value={[audioSettings.sampleRate]}
                                    onValueChange={([value]) => setAudioSettings(prev => ({ ...prev, sampleRate: value }))}
                                    min={8000}
                                    max={44100}
                                    step={1000}
                                    disabled={isRecording}
                                />
                                <p className="text-xs text-muted-foreground">Lower sample rates reduce data size</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Bit Rate: {Math.round(audioSettings.bitRate / 1000)} kbps</Label>
                                <Slider
                                    value={[audioSettings.bitRate]}
                                    onValueChange={([value]) => setAudioSettings(prev => ({ ...prev, bitRate: value }))}
                                    min={16000}
                                    max={128000}
                                    step={8000}
                                    disabled={isRecording}
                                />
                                <p className="text-xs text-muted-foreground">Lower bitrates reduce chunk sizes</p>
                            </div>
                            
                            <div className="space-y-4">
                                <Label>Audio Processing</Label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={audioSettings.echoCancellation}
                                            onChange={(e) => setAudioSettings(prev => ({ ...prev, echoCancellation: e.target.checked }))}
                                            disabled={isRecording}
                                        />
                                        <span>Echo Cancellation</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={audioSettings.noiseSuppression}
                                            onChange={(e) => setAudioSettings(prev => ({ ...prev, noiseSuppression: e.target.checked }))}
                                            disabled={isRecording}
                                        />
                                        <span>Noise Suppression</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={audioSettings.autoGainControl}
                                            onChange={(e) => setAudioSettings(prev => ({ ...prev, autoGainControl: e.target.checked }))}
                                            disabled={isRecording}
                                        />
                                        <span>Auto Gain Control</span>
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
