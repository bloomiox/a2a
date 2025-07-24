import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Radio, AlertCircle, PlayCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { audioRelay } from '@/api/functions';

export default function LiveAudioReceiver({ driverId, isActive = true }) {
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [receivedChunks, setReceivedChunks] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState('');
    const [currentSession, setCurrentSession] = useState(null);
    
    const audioElementRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const lastChunkIdRef = useRef(null);
    const audioQueueRef = useRef([]);
    const isPlayingChunkRef = useRef(false);

    // Stop polling on component unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    const handleConnect = () => {
        if (!driverId) {
            setError("Driver ID is not available.");
            return;
        }
        startPolling();
    };

    const startPolling = async () => {
        try {
            setError('');
            setConnectionStatus('connecting');
            
            // Create audio element for playback
            if (!audioElementRef.current) {
                audioElementRef.current = new Audio();
                audioElementRef.current.autoplay = false;
                audioElementRef.current.volume = 1.0;
                
                // Handle audio events
                audioElementRef.current.onended = () => {
                    console.log('[DRIVER] Audio chunk finished playing');
                    isPlayingChunkRef.current = false;
                    playNextChunk();
                };
                
                audioElementRef.current.onerror = (e) => {
                    console.error('[DRIVER] Audio playback error:', e);
                    isPlayingChunkRef.current = false;
                    playNextChunk();
                };
                
                console.log('[DRIVER] Audio element initialized');
            }

            // Immediately poll for audio
            await pollForAudio();

            // Start subsequent polling
            setConnectionStatus('connected');
            setReceivedChunks(0);
            
            pollingIntervalRef.current = setInterval(async () => {
                try {
                    await pollForAudio();
                } catch (pollError) {
                    // This is handled inside pollForAudio
                }
            }, 2000); // Poll every 2 seconds
            
            console.log('[DRIVER] 📡 Started polling for audio chunks');
            
        } catch (error) {
            console.error('[DRIVER] Failed to start audio receiver:', error);
            setError('Failed to initialize audio receiver');
            setConnectionStatus('error');
        }
    };

    const pollForAudio = async () => {
        if (!driverId) return;

        try {
            const response = await audioRelay({
                action: 'getAudio',
                driverId: driverId,
                lastChunkId: lastChunkIdRef.current
            });

            if (response.status === 200 && response.data) {
                const { chunks, sessionId, status } = response.data;
                
                if (status === 'broadcasting' && !currentSession) {
                    console.log('[DRIVER] 🎙️ Broadcast started, session:', sessionId);
                    setCurrentSession(sessionId);
                    setIsPlaying(true);
                    audioQueueRef.current = [];
                } else if (status === 'stopped' && currentSession) {
                    console.log('[DRIVER] 🛑 Broadcast ended');
                    setCurrentSession(null);
                    setIsPlaying(false);
                    lastChunkIdRef.current = null;
                    audioQueueRef.current = [];
                }
                
                if (chunks && chunks.length > 0) {
                    for (const chunk of chunks) {
                        console.log('[DRIVER] 🎵 Received audio chunk:', chunk.id);
                        await processAudioChunk(chunk.audioData, chunk.mimeType);
                        setReceivedChunks(prev => prev + 1);
                        lastChunkIdRef.current = chunk.id;
                    }
                }
            } else if (response.status === 400) {
                setError('Bad request to audio service. Check parameters.');
                setConnectionStatus('error');
                stopPolling();
            }
        } catch (error) {
            // Only show error if it's not a typical "not found" which means no broadcast
            if (error.response?.status !== 404 && error.response?.status !== 500) {
                 console.warn('[DRIVER] Audio polling error:', error.message);
                 setError('A network error occurred while fetching audio.');
                 setConnectionStatus('error');
                 stopPolling();
            }
        }
    };

    const processAudioChunk = async (base64AudioData, mimeType) => {
        try {
            // Convert base64 to blob
            const binaryString = atob(base64AudioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const audioBlob = new Blob([bytes], { type: mimeType || 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            console.log('[DRIVER] Created audio URL for chunk:', audioUrl);
            
            // Add to queue
            audioQueueRef.current.push({
                url: audioUrl,
                blob: audioBlob
            });
            
            // Start playing if not already playing
            if (!isPlayingChunkRef.current) {
                playNextChunk();
            }
            
        } catch (error) {
            console.error('[DRIVER] Error processing audio chunk:', error);
            setError('Failed to process audio chunk.');
        }
    };

    const playNextChunk = () => {
        if (audioQueueRef.current.length === 0 || !audioElementRef.current) {
            return;
        }
        
        if (isPlayingChunkRef.current) {
            return; // Already playing something
        }
        
        const nextChunk = audioQueueRef.current.shift();
        console.log('[DRIVER] Playing next audio chunk:', nextChunk.url);
        
        isPlayingChunkRef.current = true;
        audioElementRef.current.src = nextChunk.url;
        
        audioElementRef.current.play().then(() => {
            console.log('[DRIVER] Audio chunk started playing');
        }).catch((error) => {
            console.error('[DRIVER] Failed to play audio chunk:', error);
            isPlayingChunkRef.current = false;
            // Clean up the URL
            URL.revokeObjectURL(nextChunk.url);
            // Try next chunk
            setTimeout(playNextChunk, 100);
        });
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            console.log('[DRIVER] Polling stopped.');
        }
    };

    const disconnect = () => {
        stopPolling();
        
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current.src = '';
            audioElementRef.current = null;
        }
        
        // Clean up any remaining blob URLs
        audioQueueRef.current.forEach(chunk => {
            URL.revokeObjectURL(chunk.url);
        });
        audioQueueRef.current = [];
        
        setConnectionStatus('disconnected');
        setIsPlaying(false);
        isPlayingChunkRef.current = false;
        console.log('[DRIVER] 🔌 Audio receiver disconnected');
    };

    const getStatusBadge = () => {
        switch(connectionStatus) {
            case 'connected':
                return isPlaying ? <Badge className="bg-green-500 text-white">LIVE</Badge> : <Badge variant="secondary">Connected</Badge>;
            case 'connecting':
                return <Badge variant="outline">Connecting...</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            case 'disconnected':
            default:
                return <Badge variant="outline">Offline</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Radio className="h-5 w-5" />
                        Live Broadcast Audio
                    </div>
                    {getStatusBadge()}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {connectionStatus === 'disconnected' || connectionStatus === 'error' ? (
                    <div className="text-center py-4">
                        <p className="text-muted-foreground mb-4">
                            {connectionStatus === 'error' ? 'Connection failed. Please try again.' : 'Ready to receive live audio from the guide.'}
                        </p>
                        <Button onClick={handleConnect} size="lg" className="gap-2">
                            <PlayCircle />
                            Connect to Live Audio
                        </Button>
                    </div>
                ) : connectionStatus === 'connecting' ? (
                     <div className="text-center py-4 flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Initializing connection...</span>
                    </div>
                ) : (
                    <div>
                        {isPlaying ? (
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                <Volume2 className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-800">Receiving Live Audio</p>
                                    <p className="text-sm text-green-600">Audio chunks: {audioQueueRef.current.length} queued</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
                                <VolumeX className="h-8 w-8 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-700">Waiting for Broadcast</p>
                                    <p className="text-sm text-gray-500">Connected and ready to receive audio.</p>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            Received: {receivedChunks} chunks
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}