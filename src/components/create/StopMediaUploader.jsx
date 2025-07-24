import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Video,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  Film,
  Link as LinkIcon,
  Youtube,
  Globe
} from "lucide-react";
import { UploadFile } from "@/api/integrations";

export default function StopMediaUploader({ stopIndex, gallery = [], onGalleryChange }) {
  const [uploading, setUploading] = useState(false);
  const [newMediaType, setNewMediaType] = useState("image");
  const [addMethod, setAddMethod] = useState("upload"); // "upload" or "url"
  const [urlInput, setUrlInput] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  const handleFileUpload = async (file, type, index = null) => {
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      
      const newMediaItem = {
        type: type,
        url: file_url,
        source: "upload",
        caption: "",
        alt: type === "image" ? `${file.name}` : undefined,
        thumbnail: type === "video" ? "" : undefined,
        duration: type === "video" ? "" : undefined
      };

      let updatedGallery;
      if (index !== null) {
        updatedGallery = [...gallery];
        updatedGallery[index] = { ...updatedGallery[index], url: file_url, source: "upload" };
      } else {
        updatedGallery = [...gallery, newMediaItem];
      }
      
      onGalleryChange(stopIndex, updatedGallery);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const extractVideoId = (url) => {
    // YouTube URL patterns
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  const getYoutubeThumbnail = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const getYoutubeEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const isYouTubeUrl = (url) => {
    return /(?:youtube\.com|youtu\.be)/.test(url);
  };

  const isValidImageUrl = (url) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.includes('unsplash.com') || url.includes('images.');
  };

  const isValidVideoUrl = (url) => {
    return isYouTubeUrl(url) || /\.(mp4|webm|ogg|mov)$/i.test(url);
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) {
      alert("Please enter a valid URL");
      return;
    }

    setIsAddingUrl(true);

    try {
      let mediaItem;

      if (newMediaType === "image" && isValidImageUrl(urlInput)) {
        mediaItem = {
          type: "image",
          url: urlInput,
          source: "url",
          caption: "",
          alt: "External image"
        };
      } else if (newMediaType === "video") {
        if (isYouTubeUrl(urlInput)) {
          const videoId = extractVideoId(urlInput);
          if (videoId) {
            mediaItem = {
              type: "video",
              url: urlInput,
              embedUrl: getYoutubeEmbedUrl(videoId),
              thumbnail: getYoutubeThumbnail(videoId),
              source: "youtube",
              caption: "",
              duration: "",
              videoId: videoId
            };
          } else {
            alert("Invalid YouTube URL");
            setIsAddingUrl(false);
            return;
          }
        } else if (isValidVideoUrl(urlInput)) {
          mediaItem = {
            type: "video",
            url: urlInput,
            source: "url",
            caption: "",
            thumbnail: "",
            duration: ""
          };
        } else {
          alert("Invalid video URL. Please use YouTube links or direct video file URLs (.mp4, .webm, .ogg)");
          setIsAddingUrl(false);
          return;
        }
      } else {
        alert(`Invalid ${newMediaType} URL`);
        setIsAddingUrl(false);
        return;
      }

      const updatedGallery = [...gallery, mediaItem];
      onGalleryChange(stopIndex, updatedGallery);
      setUrlInput("");
      
    } catch (error) {
      console.error("Error adding URL:", error);
      alert("Failed to add media from URL");
    } finally {
      setIsAddingUrl(false);
    }
  };

  const updateMediaItem = (mediaIndex, field, value) => {
    const updatedGallery = [...gallery];
    updatedGallery[mediaIndex] = {
      ...updatedGallery[mediaIndex],
      [field]: value
    };
    onGalleryChange(stopIndex, updatedGallery);
  };

  const removeMediaItem = (mediaIndex) => {
    const updatedGallery = gallery.filter((_, index) => index !== mediaIndex);
    onGalleryChange(stopIndex, updatedGallery);
  };

  const addNewMedia = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = newMediaType === 'image' ? 'image/*' : 'video/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileUpload(file, newMediaType);
      }
    };
    input.click();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Media Gallery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Media */}
        <Tabs value={addMethod} onValueChange={setAddMethod}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Add URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3">
            <div className="flex gap-2">
              <Select value={newMediaType} onValueChange={setNewMediaType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4" />
                      Video
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={addNewMedia}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload {newMediaType === 'image' ? 'Image' : 'Video'}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-3">
            <div className="flex gap-2">
              <Select value={newMediaType} onValueChange={setNewMediaType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4" />
                      Video
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder={
                  newMediaType === 'image' 
                    ? "Enter image URL (jpg, png, etc.)" 
                    : "Enter YouTube URL or video file URL"
                }
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1"
              />
              
              <Button 
                onClick={handleUrlAdd}
                disabled={isAddingUrl || !urlInput.trim()}
              >
                {isAddingUrl ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Supported image URLs:</strong> Direct links to .jpg, .png, .gif, .webp files</p>
              <p><strong>Supported video URLs:</strong> YouTube links, direct video files (.mp4, .webm, .ogg)</p>
              <p><strong>Examples:</strong></p>
              <ul className="ml-4 list-disc">
                <li>https://images.unsplash.com/photo-xyz.jpg</li>
                <li>https://www.youtube.com/watch?v=dQw4w9WgXcQ</li>
                <li>https://youtu.be/dQw4w9WgXcQ</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Existing Media Items */}
        <div className="space-y-4">
          {gallery.map((item, index) => (
            <Card key={index} className="border-l-4 border-l-indigo-500">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={item.alt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.032v3.936a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg></div>';
                              }}
                            />
                          ) : (
                            <Video className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      )}
                      
                      <div className="absolute top-1 left-1 flex gap-1">
                        <Badge 
                          className="text-xs px-1 py-0"
                          variant={item.type === "image" ? "default" : "secondary"}
                        >
                          {item.type}
                        </Badge>
                        <Badge 
                          className="text-xs px-1 py-0 flex items-center gap-1"
                          variant="outline"
                        >
                          {getMediaSourceIcon(item)}
                        </Badge>
                      </div>
                      
                      {/* Fallback for broken images */}
                      <div className="w-full h-full items-center justify-center text-red-500 text-xs p-1 text-center" style={{display: 'none'}}>
                        Failed to load
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label>Caption</Label>
                      <Input
                        placeholder="Add a caption for this media"
                        value={item.caption || ""}
                        onChange={(e) => updateMediaItem(index, "caption", e.target.value)}
                      />
                    </div>
                    
                    {item.type === "image" && (
                      <div className="space-y-2">
                        <Label>Alt Text</Label>
                        <Input
                          placeholder="Describe this image"
                          value={item.alt || ""}
                          onChange={(e) => updateMediaItem(index, "alt", e.target.value)}
                        />
                      </div>
                    )}
                    
                    {item.type === "video" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Duration</Label>
                          <Input
                            placeholder="e.g., 2:30"
                            value={item.duration || ""}
                            onChange={(e) => updateMediaItem(index, "duration", e.target.value)}
                          />
                        </div>
                        {item.source !== "youtube" && (
                          <div className="space-y-2">
                            <Label>Thumbnail URL</Label>
                            <Input
                              placeholder="Thumbnail image URL"
                              value={item.thumbnail || ""}
                              onChange={(e) => updateMediaItem(index, "thumbnail", e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {item.source === "youtube" && (
                      <div className="p-2 bg-red-50 rounded-md border border-red-200">
                        <div className="flex items-center gap-2 text-red-700 text-sm">
                          <Youtube className="w-4 h-4" />
                          <span>YouTube Video</span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          Video ID: {item.videoId}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {item.source === "upload" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = item.type === 'image' ? 'image/*' : 'video/*';
                            input.onchange = (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleFileUpload(file, item.type, index);
                              }
                            };
                            input.click();
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Replace
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMediaItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                      
                      {item.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <LinkIcon className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {gallery.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No media added yet</p>
            <p className="text-sm">Upload files or add URLs to enhance this stop</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}