import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Camera,
  Video,
  Info,
  X,
  Youtube,
  Globe,
  Upload,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

export default function StopInteractiveContent({ stop, className = "" }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoVolume, setVideoVolume] = useState(1);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videoRef = useRef(null);

  // Use actual gallery data from stop or fallback to sample data
  const gallery = stop?.gallery || [
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800",
      caption: "Historic architecture of the building",
      alt: "Historic building exterior",
      source: "url"
    },
    {
      type: "image", 
      url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
      caption: "Interior details and decorations",
      alt: "Interior view",
      source: "url"
    },
    {
      type: "video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      caption: "Historical overview of this location",
      duration: "3:32",
      source: "youtube",
      videoId: "dQw4w9WgXcQ"
    },
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=800", 
      caption: "Surrounding area and context",
      alt: "Aerial view",
      source: "url"
    }
  ];

  const images = gallery.filter(item => item.type === "image");
  const videos = gallery.filter(item => item.type === "video");
  const allMedia = gallery;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setVideoCurrentTime(video.currentTime);
    const updateDuration = () => setVideoDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsVideoPlaying(false));

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', () => setIsVideoPlaying(false));
    };
  }, [currentVideoIndex]);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleVideoSeek = (newTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime[0];
      setVideoCurrentTime(newTime[0]);
    }
  };

  const handleVolumeChange = (newVolume) => {
    const volume = newVolume[0];
    setVideoVolume(volume);
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
    setIsVideoMuted(volume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isVideoMuted) {
        videoRef.current.volume = videoVolume;
        setIsVideoMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsVideoMuted(true);
      }
    }
  };

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadImage = (imageUrl, filename) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMediaSourceIcon = (item) => {
    switch (item.source) {
      case "youtube":
        return <Youtube className="w-3 h-3 text-red-600" />;
      case "url":
        return <Globe className="w-3 h-3 text-blue-600" />;
      case "upload":
      default:
        return <Upload className="w-3 h-3 text-green-600" />;
    }
  };

  const renderVideoPlayer = (video, index) => {
    if (video.source === "youtube") {
      return (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="256"
            src={`${video.embedUrl}?enablejsapi=1`}
            title={video.caption || `YouTube video ${index + 1}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-64"
          />
          
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge className="bg-red-600 text-white flex items-center gap-1">
              <Youtube className="w-3 h-3" />
              YouTube
            </Badge>
            {video.duration && (
              <Badge className="bg-black/70 text-white">
                {video.duration}
              </Badge>
            )}
          </div>
          
          <div className="absolute bottom-2 right-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-black/50 hover:bg-black/70 text-white"
              onClick={() => window.open(video.url, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    } else {
      // Regular video file
      return (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={index === currentVideoIndex ? videoRef : null}
            src={video.url}
            className="w-full h-64 object-cover"
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            poster={video.thumbnail}
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              onClick={handleVideoPlay}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full h-16 w-16"
            >
              {isVideoPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </Button>
          </div>
          
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge className="bg-black/70 text-white flex items-center gap-1">
              {getMediaSourceIcon(video)}
              {video.source === "url" ? "External" : "Uploaded"}
            </Badge>
            {video.duration && (
              <Badge className="bg-black/70 text-white">
                {video.duration}
              </Badge>
            )}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="space-y-2">
              <Slider
                value={[videoCurrentTime]}
                max={videoDuration || 100}
                step={1}
                onValueChange={handleVideoSeek}
                className="w-full"
              />
              
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center gap-2">
                  <span>{formatTime(videoCurrentTime)} / {formatTime(videoDuration)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isVideoMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Slider
                    value={[isVideoMuted ? 0 : videoVolume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  if (!gallery || gallery.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No media available for this stop</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Explore this Stop
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Gallery ({images.length})
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              All Media
            </TabsTrigger>
          </TabsList>

          {/* Image Gallery Tab */}
          <TabsContent value="gallery" className="space-y-4">
            {images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={images[currentImageIndex]?.url}
                    alt={images[currentImageIndex]?.alt}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer"
                    onClick={() => setShowImageDialog(true)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  
                  {/* Error fallback */}
                  <div className="w-full h-64 bg-gray-200 rounded-lg items-center justify-center text-gray-500" style={{display: 'none'}}>
                    <div className="text-center">
                      <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Failed to load image</p>
                    </div>
                  </div>
                  
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                        onClick={handlePrevImage}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                        onClick={handleNextImage}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-black/70 text-white flex items-center gap-1">
                      {getMediaSourceIcon(images[currentImageIndex])}
                      {images[currentImageIndex]?.source === "url" ? "External" : "Uploaded"}
                    </Badge>
                  </div>
                  
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setShowImageDialog(true)}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    {images[currentImageIndex]?.source !== "url" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-black/50 hover:bg-black/70 text-white"
                        onClick={() => downloadImage(images[currentImageIndex]?.url, `${stop?.title}-image-${currentImageIndex + 1}.jpg`)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    {images[currentImageIndex]?.source === "url" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-black/50 hover:bg-black/70 text-white"
                        onClick={() => window.open(images[currentImageIndex]?.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {images[currentImageIndex]?.caption && (
                  <p className="text-sm text-gray-600 text-center">
                    {images[currentImageIndex].caption}
                  </p>
                )}
                
                {images.length > 1 && (
                  <>
                    <div className="flex justify-center space-x-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <div className="flex overflow-x-auto gap-2 pb-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === currentImageIndex ? 'border-indigo-600' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No images available</p>
              </div>
            )}
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video" className="space-y-4">
            {videos.length > 0 ? (
              <div className="space-y-4">
                {videos.length > 1 && (
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {videos.map((video, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentVideoIndex(index)}
                        className={`flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentVideoIndex ? 'border-indigo-600' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={video.thumbnail || 'https://via.placeholder.com/80x48?text=Video'}
                          alt={`Video ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                
                {renderVideoPlayer(videos[currentVideoIndex], currentVideoIndex)}
                
                {videos[currentVideoIndex]?.caption && (
                  <p className="text-sm text-gray-600 text-center">
                    {videos[currentVideoIndex].caption}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No videos available</p>
              </div>
            )}
          </TabsContent>

          {/* All Media Tab */}
          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {allMedia.map((item, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => {
                    if (item.type === "image") {
                      setCurrentImageIndex(images.findIndex(img => img.url === item.url));
                      setShowImageDialog(true);
                    } else {
                      setCurrentVideoIndex(videos.findIndex(vid => vid.url === item.url));
                    }
                  }}
                >
                  <img
                    src={item.type === "video" ? item.thumbnail : item.url}
                    alt={item.alt || item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  
                  {/* Error fallback */}
                  <div className="w-full h-full bg-gray-200 items-center justify-center text-gray-500" style={{display: 'none'}}>
                    <div className="text-center text-xs p-2">
                      {item.type === "image" ? <Camera className="w-6 h-6 mx-auto mb-1" /> : <Video className="w-6 h-6 mx-auto mb-1" />}
                      Failed to load
                    </div>
                  </div>
                  
                  {item.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="bg-white rounded-full p-2">
                        <Play className="w-6 h-6 text-black ml-0.5" />
                      </div>
                      {item.duration && (
                        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                          {item.duration}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-black/70 text-white flex items-center gap-1">
                      {getMediaSourceIcon(item)}
                    </Badge>
                  </div>
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Full Screen Image Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <img
                src={images[currentImageIndex]?.url}
                alt={images[currentImageIndex]?.alt}
                className="w-full max-h-[80vh] object-contain"
              />
              
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setShowImageDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{images[currentImageIndex]?.caption}</p>
                      <p className="text-sm opacity-75">
                        Image {currentImageIndex + 1} of {images.length}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {images[currentImageIndex]?.source !== "url" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadImage(images[currentImageIndex]?.url, `${stop?.title}-image-${currentImageIndex + 1}.jpg`)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(images[currentImageIndex]?.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}