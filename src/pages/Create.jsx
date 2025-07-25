
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tour } from "@/api/entities";
import { TourStop } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { AudioTrack } from "@/api/entities";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  PlusCircle,
  Trash2,
  UploadCloud,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Volume2,
  AlignLeft,
  GripVertical,
  LocateFixed,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Download
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import TourMap from "../components/create/TourMap";
import AudioRecorder from "../components/create/AudioRecorder";
import AccessibilityPicker from "../components/create/AccessibilityPicker";
import StopMediaUploader from "../components/create/StopMediaUploader";
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function Create() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tourId, setTourId] = useState(null);
  const [loadingTour, setLoadingTour] = useState(false);

  const [csvUploadLoading, setCsvUploadLoading] = useState(false);
  const [csvUploadError, setCsvUploadError] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false); // New state for CSV export loading

  const [tour, setTour] = useState({
    title: "",
    description: "",
    theme: "cultural",
    difficulty: "easy",
    accessibility: [],
    transportation: "walking",
    duration: 60,
    distance: 1,
    languages: ["English"],
    preview_image: "",
    is_public: true,
    location: {
      city: "",
      country: "",
      start_point: {
        latitude: null,
        longitude: null,
        address: ""
      }
    },
    financials: {
      price_per_tourist: 0,
      costs: {
        driver_fee: 0,
        fuel_cost: 0,
        food_cost_per_tourist: 0,
        other_costs: 0
      },
      min_tourists: 1,
      max_tourists: 10
    }
  });
  
  const [stops, setStops] = useState([
    {
      title: "",
      description: "",
      position: 0,
      location: {
        latitude: null,
        longitude: null,
        address: ""
      },
      trigger_radius: 50,
      preview_image: "",
      estimated_time: 5,
      audio_tracks: [
        {
          language: "English",
          audio_url: "",
          transcript: "",
          duration: 0
        }
      ],
      gallery: []
    }
  ]);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editModeParam = urlParams.get("edit") === "true";
    const idParam = urlParams.get("id");
    
    if (editModeParam && idParam) {
      setIsEditMode(true);
      setTourId(idParam);
      loadTourData(idParam);
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ latitude, longitude });
          
          if (!tour.location.start_point.latitude) {
            setTour(prev => ({
              ...prev,
              location: {
                ...prev.location,
                start_point: {
                  ...prev.location.start_point,
                  latitude,
                  longitude
                }
              }
            }));
          }
          
          if (stops.length > 0 && !stops[0].location.latitude) {
            const newStops = [...stops];
            newStops[0].location.latitude = latitude;
            newStops[0].location.longitude = longitude;
            setStops(newStops);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);
  
  const loadTourData = async (id) => {
    setLoadingTour(true);
    try {
      const tourData = await Tour.get(id);
      if (tourData) {
        const financials = tourData.financials || {};
        financials.costs = financials.costs || {};

        setTour({
          ...tourData,
          accessibility: tourData.accessibility || [],
          languages: tourData.languages || ["English"],
          location: tourData.location || { city: "", country: "", start_point: {} },
          financials: {
            price_per_tourist: financials.price_per_tourist || 0,
            costs: {
              driver_fee: financials.costs.driver_fee || 0,
              fuel_cost: financials.costs.fuel_cost || 0,
              food_cost_per_tourist: financials.costs.food_cost_per_tourist || 0,
              other_costs: financials.costs.other_costs || 0,
            },
            min_tourists: financials.min_tourists || 1,
            max_tourists: financials.max_tourists || 10,
          }
        });
        
        if (tourData.preview_image) {
          setPreviewImageUrl(tourData.preview_image);
        }
        
        // Fetch ALL stops and audio tracks for the tour at once for efficiency
        const tourStopsData = await TourStop.filter({ tour_id: id }, "position", 500) || [];
        const allAudioTracks = await AudioTrack.filter({ tour_id: id }, null, 1000) || [];

        // Group audio tracks by their stop_id for quick lookup
        const tracksByStopId = allAudioTracks.reduce((acc, track) => {
            (acc[track.stop_id] = acc[track.stop_id] || []).push(track);
            return acc;
        }, {});

        if (tourStopsData.length > 0) {
          // Map the pre-fetched audio tracks to each stop
          const stopsWithAudio = tourStopsData.map((s) => {
            const tracks = tracksByStopId[s.id] || [];
            const validTracks = tracks.map(t => ({
                language: t.language || "English",
                audio_url: t.audio_url || "",
                transcript: t.transcript || "",
                duration: t.duration || 0
            }));
            return { 
              ...s, 
              audio_tracks: validTracks.length > 0 ? validTracks : [{ language: "English", audio_url: "", transcript: "", duration: 0 }],
              gallery: s.gallery || []
            };
          });
          setStops(stopsWithAudio);
        } else {
          setStops([
            {
              title: "", description: "", position: 0,
              location: { latitude: null, longitude: null, address: "" },
              trigger_radius: 50, preview_image: "", estimated_time: 5,
              audio_tracks: [{ language: "English", audio_url: "", transcript: "", duration: 0 }],
              gallery: []
            }
          ]);
        }
      }
    } catch (error) {
      console.error("Error loading tour for editing:", error);
      alert("Failed to load tour data. Please try again.");
      navigate(createPageUrl("Profile"));
    } finally {
      setLoadingTour(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvUploadError(t('create.csvErrorFileType'));
      return;
    }

    setCsvUploadLoading(true);
    setCsvUploadError(null);

    try {
      console.log("Uploading CSV file:", file.name);
      
      // Upload the file first
      const result = await UploadFile(file);
      
      if (!result.success) {
        throw new Error(result.error || 'CSV upload failed');
      }
      
      console.log("CSV uploaded successfully:", result.url);

      // Define the JSON schema for stops data matching the actual database schema
      const stopsSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            address: { type: "string" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            duration_minutes: { type: "number" },
            order_in_tour: { type: "number" },
            preview_image_url: { type: "string" },
            gallery_images: { type: "string" },
            gallery_videos: { type: "string" },
            audio_english_url: { type: "string" },
            audio_english_transcript: { type: "string" },
            audio_spanish_url: { type: "string" },
            audio_spanish_transcript: { type: "string" },
            audio_french_url: { type: "string" },
            audio_french_transcript: { type: "string" },
            audio_german_url: { type: "string" },
            audio_german_transcript: { type: "string" },
            audio_bosnian_url: { type: "string" },
            audio_bosnian_transcript: { type: "string" },
            audio_turkish_url: { type: "string" },
            audio_turkish_transcript: { type: "string" },
            audio_arabic_url: { type: "string" },
            audio_arabic_transcript: { type: "string" },
            audio_italian_url: { type: "string" },
            audio_italian_transcript: { type: "string" },
            audio_japanese_url: { type: "string" },
            audio_japanese_transcript: { type: "string" },
            audio_chinese_url: { type: "string" },
            audio_chinese_transcript: { type: "string" }
          },
          required: ["name", "description", "address"]
        }
      };

      // Extract data from the uploaded CSV
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: result.url,
        json_schema: stopsSchema
      });

      console.log("CSV extraction result:", extractResult);

      if (extractResult.status === "error") {
        setCsvUploadError(extractResult.details || t('create.csvErrorProcessing'));
        return;
      }

      const csvStops = extractResult.output || [];
      
      if (!Array.isArray(csvStops) || csvStops.length === 0) {
        setCsvUploadError(t('create.csvErrorNoData'));
        return;
      }

      // Convert CSV data to tour stops format with enhanced data
      const newStops = csvStops.map((csvStop, index) => {
        // Parse gallery data
        const galleryImages = csvStop.gallery_images ? 
          csvStop.gallery_images.split(';').map(url => url.trim()).filter(url => url).map(url => ({
            type: 'image',
            url: url,
            source: 'url',
            caption: '',
            alt: 'Imported image'
          })) : [];
          
        const galleryVideos = csvStop.gallery_videos ? 
          csvStop.gallery_videos.split(';').map(url => url.trim()).filter(url => url).map(url => ({
            type: 'video',
            url: url,
            source: 'url',
            caption: '',
            duration: ''
          })) : [];

        // Prepare audio tracks
        const audioTracks = [];
        const languages = ['english', 'spanish', 'french', 'german', 'bosnian', 'turkish', 'arabic', 'italian', 'japanese', 'chinese'];
        
        languages.forEach(lang => {
          const audioUrl = csvStop[`audio_${lang}_url`];
          const transcript = csvStop[`audio_${lang}_transcript`];
          
          if (audioUrl || transcript) {
            audioTracks.push({
              language: lang.charAt(0).toUpperCase() + lang.slice(1),
              audio_url: audioUrl || "",
              transcript: transcript || "",
              duration: 0
            });
          }
        });

        // If no audio tracks, add default English track
        if (audioTracks.length === 0) {
          audioTracks.push({
            language: "English",
            audio_url: "",
            transcript: "",
            duration: 0
          });
        }

        return {
          title: csvStop.name || `${t('create.stop')} ${stops.length + index + 1}`,
          description: csvStop.description || "",
          position: stops.length + index,
          location: {
            latitude: csvStop.latitude || null,
            longitude: csvStop.longitude || null,
            address: csvStop.address || ""
          },
          trigger_radius: 50, // Default value since it's not in the database schema
          preview_image: csvStop.preview_image_url || "",
          estimated_time: csvStop.duration_minutes || 5,
          audio_tracks: audioTracks,
          gallery: [...galleryImages, ...galleryVideos]
        };
      });

      // Add new stops to existing stops
      setStops(prevStops => {
        const combinedStops = [...prevStops, ...newStops];
        // Re-assign positions to ensure they are sequential after adding
        return combinedStops.map((stop, idx) => ({ ...stop, position: idx }));
      });
      
      alert(t('create.csvSuccess', { count: newStops.length }));
      
    } catch (error) {
      console.error("Error processing CSV:", error);
      setCsvUploadError(t('create.csvErrorGeneral'));
    } finally {
      setCsvUploadLoading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvTemplate = `name,description,address,latitude,longitude,duration_minutes,order_in_tour,preview_image_url,gallery_images,gallery_videos,audio_english_url,audio_english_transcript,audio_spanish_url,audio_spanish_transcript,audio_french_url,audio_french_transcript,audio_german_url,audio_german_transcript,audio_bosnian_url,audio_bosnian_transcript,audio_turkish_url,audio_turkish_transcript,audio_arabic_url,audio_arabic_transcript,audio_italian_url,audio_italian_transcript,audio_japanese_url,audio_japanese_transcript,audio_chinese_url,audio_chinese_transcript
"${t('create.templateStop1Title')}","${t('create.templateStop1Description')}","${t('create.templateStop1Address')}",40.785091,-73.968285,10,1,"","","","","${t('create.templateStop1AudioTranscript')}","","","","","","","","","","","","","","","","","",""
"${t('create.templateStop2Title')}","${t('create.templateStop2Description')}","${t('create.templateStop2Address')}",40.758896,-73.985130,15,2,"","","","","${t('create.templateStop2AudioTranscript')}","","","","","","","","","","","","","","","","","",""
"${t('create.templateStop3Title')}","${t('create.templateStop3Description')}","${t('create.templateStop3Address')}",40.706086,-73.996864,100,20,"","","","","${t('create.templateStop3AudioTranscript')}","","","","","","","","","","","","","","","","","",""`;
    
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tour_stops_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  // Helper function to fetch all records for an entity by paginating through the results.
  const fetchAllPages = async (entity, filterQuery, sort) => {
    let allRecords = [];
    let page = 1;
    const limit = 50; // Fetch in pages of 50 to be safe.
    
    while (true) {
      try {
        const records = await entity.filter(filterQuery, sort, limit, page);
        if (records && records.length > 0) {
          allRecords.push(...records);
          if (records.length < limit) {
            // This was the last page
            break;
          }
          page++;
        } else {
          // No more records found, break the loop
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${page} for entity:`, error);
        // Stop fetching on error to avoid incomplete data
        break;
      }
    }
    
    return allRecords;
  };

  const handleExportStops = async () => {
    if (!isEditMode || !tourId) {
      alert("This function is only available for existing tours.");
      return;
    }

    setExportingCsv(true);

    try {
      // Fetch ALL stops and audio tracks using the new paginated helper function
      const tourStops = await fetchAllPages(TourStop, { tour_id: tourId }, "position");
      const audioTracks = await fetchAllPages(AudioTrack, { tour_id: tourId }, null);
      
      console.log(`[EXPORT] Fetched a total of ${tourStops.length} stops and ${audioTracks.length} audio tracks.`);

      if (tourStops.length === 0) {
        alert("No stops found for this tour.");
        setExportingCsv(false);
        return;
      }

      // Create audio tracks lookup by stop_id
      const audioByStop = {};
      audioTracks.forEach(track => {
        if (!audioByStop[track.stop_id]) {
          audioByStop[track.stop_id] = [];
        }
        audioByStop[track.stop_id].push(track);
      });

      // Enhanced CSV Headers - including all fields needed for import
      const csvHeaders = [
        'name',
        'description', 
        'address',
        'latitude',
        'longitude',
        'duration_minutes',
        'order_in_tour',
        'preview_image_url',
        'gallery_images',
        'gallery_videos',
        'audio_english_url',
        'audio_english_transcript',
        'audio_spanish_url',
        'audio_spanish_transcript',
        'audio_french_url',
        'audio_french_transcript',
        'audio_german_url',
        'audio_german_transcript',
        'audio_bosnian_url',
        'audio_bosnian_transcript',
        'audio_turkish_url',
        'audio_turkish_transcript',
        'audio_arabic_url',
        'audio_arabic_transcript',
        'audio_italian_url',
        'audio_italian_transcript',
        'audio_japanese_url',
        'audio_japanese_transcript',
        'audio_chinese_url',
        'audio_chinese_transcript'
      ];

      // Generate CSV rows
      const csvRows = [csvHeaders.join(',')];
      
      tourStops.forEach((stop) => {
        const stopAudioTracks = audioByStop[stop.id] || [];
        
        // Create audio tracks lookup by language
        const audioByLanguage = {};
        stopAudioTracks.forEach(track => {
          audioByLanguage[track.language.toLowerCase()] = track;
        });
        
        const gallery = stop.gallery || [];
        const images = gallery.filter(item => item.type === 'image').map(item => item.url).join('; ');
        const videos = gallery.filter(item => item.type === 'video').map(item => item.url).join('; ');
        
        // Escape CSV values properly
        const escapeCSV = (value) => {
          if (value == null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        };
        
        // Helper function to get audio data for a language
        const getAudioData = (language) => {
          const track = audioByLanguage[language.toLowerCase()];
          return {
            url: track ? track.audio_url : '',
            transcript: track ? track.transcript : ''
          };
        };
        
        const row = [
          escapeCSV(stop.title || ''),
          escapeCSV(stop.description || ''),
          escapeCSV(stop.location?.address || ''),
          stop.location?.latitude || '',
          stop.location?.longitude || '',
          stop.estimated_time || 5, // duration_minutes
          stop.position || index + 1, // order_in_tour
          escapeCSV(stop.preview_image || ''),
          escapeCSV(images),
          escapeCSV(videos),
          escapeCSV(getAudioData('english').url),
          escapeCSV(getAudioData('english').transcript),
          escapeCSV(getAudioData('spanish').url),
          escapeCSV(getAudioData('spanish').transcript),
          escapeCSV(getAudioData('french').url),
          escapeCSV(getAudioData('french').transcript),
          escapeCSV(getAudioData('german').url),
          escapeCSV(getAudioData('german').transcript),
          escapeCSV(getAudioData('bosnian').url),
          escapeCSV(getAudioData('bosnian').transcript),
          escapeCSV(getAudioData('turkish').url),
          escapeCSV(getAudioData('turkish').transcript),
          escapeCSV(getAudioData('arabic').url),
          escapeCSV(getAudioData('arabic').transcript),
          escapeCSV(getAudioData('italian').url),
          escapeCSV(getAudioData('italian').transcript),
          escapeCSV(getAudioData('japanese').url),
          escapeCSV(getAudioData('japanese').transcript),
          escapeCSV(getAudioData('chinese').url),
          escapeCSV(getAudioData('chinese').transcript)
        ];
        
        csvRows.push(row.join(','));
      });

      // Create and download CSV
      const csvContent = csvRows.join('\n');
      const safeTourTitle = (tour.title || "Tour").replace(/[^a-z0-9_.-]/gi, '_');
      const filename = `${safeTourTitle}_stops_export_${new Date().toISOString().split('T')[0]}.csv`;

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`Successfully exported ${tourStops.length} stops to CSV with full import compatibility`);
      
    } catch (error) {
      console.error("Error exporting tour stops:", error);
      alert("Failed to export tour stops. Please try again.");
    } finally {
      setExportingCsv(false);
    }
  };
  
  const handleTourChange = (field, value) => {
    setTour(prev => {
      if (field.includes('.')) {
        const parts = field.split('.');
        let current = prev;
        const newPrev = { ...prev }; // Create a mutable copy
        let currentMutable = newPrev;

        for (let i = 0; i < parts.length - 1; i++) {
          if (!currentMutable[parts[i]]) {
            currentMutable[parts[i]] = {}; // Initialize if undefined
          }
          currentMutable = currentMutable[parts[i]];
        }
        currentMutable[parts[parts.length - 1]] = value;
        return newPrev;
      }
      return { ...prev, [field]: value };
    });
  };
  
  const handleStopChange = (index, field, value) => {
    const newStops = [...stops];
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!newStops[index][parent]) {
        newStops[index][parent] = {}; // Initialize if undefined
      }
      newStops[index][parent][child] = value;
    } else {
      newStops[index][field] = value;
    }
    
    setStops(newStops);
  };
  
  const handleAudioChange = (stopIndex, audioIndex, field, value) => {
    const newStops = [...stops];
    newStops[stopIndex].audio_tracks[audioIndex][field] = value;
    console.log(`Updated audio ${field} for stop ${stopIndex}, track ${audioIndex}:`, value);
    setStops(newStops);
  };

  const handleGalleryChange = (stopIndex, newGallery) => {
    const newStops = [...stops];
    newStops[stopIndex].gallery = newGallery;
    setStops(newStops);
  };
  
  const addStop = () => {
    const newStop = {
      title: "",
      description: "",
      position: stops.length,
      location: {
        latitude: currentPosition ? currentPosition.latitude : null,
        longitude: currentPosition ? currentPosition.longitude : null,
        address: ""
      },
      trigger_radius: 50,
      preview_image: "",
      estimated_time: 5,
      audio_tracks: [
        {
          language: "English",
          audio_url: "",
          transcript: "",
          duration: 0
        }
      ],
      gallery: []
    };
    
    setStops([...stops, newStop]);
  };
  
  const removeStop = (index) => {
    if (stops.length <= 1) {
      return;
    }
    
    const newStops = [...stops];
    newStops.splice(index, 1);
    
    newStops.forEach((stop, i) => {
      stop.position = i;
    });
    
    setStops(newStops);
  };
  
  const addAudioTrack = (stopIndex, language) => {
    const newStops = [...stops];
    
    const exists = newStops[stopIndex].audio_tracks.some(
      track => track.language === language
    );
    
    if (!exists) {
      newStops[stopIndex].audio_tracks.push({
        language,
        audio_url: "",
        transcript: "",
        duration: 0
      });
      
      setStops(newStops);
    }
  };
  
  const removeAudioTrack = (stopIndex, audioIndex) => {
    const newStops = [...stops];
    
    if (newStops[stopIndex].audio_tracks.length <= 1) {
      return;
    }
    
    newStops[stopIndex].audio_tracks.splice(audioIndex, 1);
    setStops(newStops);
  };
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    items.forEach((stop, i) => {
      stop.position = i;
    });
    
    setStops(items);
  };
  
  const handleUploadTourImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setPreviewImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file));
      
      setIsSubmitting(true);
      
      const result = await UploadFile(file);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      setTour(prev => ({
        ...prev,
        preview_image: result.url
      }));
      
      // Update the preview URL to the uploaded URL
      setPreviewImageUrl(result.url);
      
      console.log("Image uploaded successfully:", result.url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadStopImage = async (e, stopIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log(`Uploading image for stop #${stopIndex + 1}:`, file);
    
    try {
      const result = await UploadFile(file);
      
      if (!result.success) {
        throw new Error(result.error || 'Stop image upload failed');
      }
      
      console.log("Image uploaded successfully, URL:", result.url);
      
      const newStops = [...stops];
      newStops[stopIndex].preview_image = result.url;
      setStops(newStops);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    }
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!tour.title.trim()) {
        alert("Please enter a tour title.");
        setActiveTab("details"); // Go back to details tab
        setIsSubmitting(false);
        return;
      }

      if (!tour.description.trim()) {
        alert("Please enter a tour description.");
        setActiveTab("details"); // Go back to details tab
        setIsSubmitting(false);
        return;
      }

      if (stops.length === 0) {
        alert("Please add at least one stop to your tour.");
        setActiveTab("stops"); // Go to stops tab
        setIsSubmitting(false);
        return;
      }

      // Validate stops have required fields
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        if (!stop.title.trim()) {
          alert(`Please enter a title for stop #${i + 1}.`);
          setActiveTab("stops");
          setIsSubmitting(false);
          return;
        }
        if (!stop.description.trim()) {
          alert(`Please enter a description for stop #${i + 1}.`);
          setActiveTab("stops");
          setIsSubmitting(false);
          return;
        }
      }

      console.log("Starting tour submission...");
      console.log("Tour data:", tour);
      console.log("Stops data:", stops);
      
      // Prepare tour data for submission
      const tourData = {
        ...tour,
        duration: parseInt(tour.duration) || 60,
        distance: parseFloat(tour.distance) || 1,
        accessibility: Array.isArray(tour.accessibility) ? tour.accessibility : [],
        languages: Array.isArray(tour.languages) ? tour.languages : ["English"],
        location: {
          city: tour.location.city || "",
          country: tour.location.country || "",
          start_point: {
            latitude: tour.location.start_point.latitude ? parseFloat(tour.location.start_point.latitude) : null,
            longitude: tour.location.start_point.longitude ? parseFloat(tour.location.start_point.longitude) : null,
            address: tour.location.start_point.address || ""
          }
        },
        financials: {
          price_per_tourist: parseFloat(tour.financials?.price_per_tourist) || 0,
          costs: {
            driver_fee: parseFloat(tour.financials?.costs?.driver_fee) || 0,
            fuel_cost: parseFloat(tour.financials?.costs?.fuel_cost) || 0,
            food_cost_per_tourist: parseFloat(tour.financials?.costs?.food_cost_per_tourist) || 0,
            other_costs: parseFloat(tour.financials?.costs?.other_costs) || 0,
          },
          min_tourists: parseInt(tour.financials?.min_tourists) || 1,
          max_tourists: parseInt(tour.financials?.max_tourists) || 10,
        }
      };

      let tourResult;
      
      if (isEditMode && tourId) {
        console.log("Updating existing tour with ID:", tourId);
        tourResult = await Tour.update(tourId, tourData);
        console.log("Tour updated successfully:", tourResult);
        
        // Delete existing stops and audio tracks before creating new ones
        try {
          const existingStops = await TourStop.filter({ tour_id: tourId });
          console.log("Found existing stops to delete:", existingStops.length);
          
          for (const stop of existingStops) {
            const existingTracks = await AudioTrack.filter({ stop_id: stop.id });
            for (const track of existingTracks) {
              await AudioTrack.delete(track.id);
            }
            await TourStop.delete(stop.id);
          }
          console.log("Deleted existing stops and audio tracks for tour ID:", tourId);
        } catch (deleteError) {
          console.warn("Error deleting existing stops and audio tracks:", deleteError);
          // Continue anyway, as the main goal is to create/update the tour
        }
      } else {
        console.log("Creating new tour");
        tourResult = await Tour.create(tourData);
        console.log("Tour created successfully:", tourResult);
      }

      if (!tourResult || !tourResult.id) {
        throw new Error("Failed to create/update tour - no ID returned from the server.");
      }

      // Create stops
      console.log("Creating/Recreating stops...");
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        
        const stopData = {
          tour_id: tourResult.id,
          title: stop.title.trim(),
          description: stop.description.trim(),
          position: i, // Use index as position to ensure correct order
          location: {
            latitude: stop.location.latitude ? parseFloat(stop.location.latitude) : null,
            longitude: stop.location.longitude ? parseFloat(stop.location.longitude) : null,
            address: stop.location.address || ""
          },
          trigger_radius: parseInt(stop.trigger_radius) || 50,
          preview_image: stop.preview_image || "",
          estimated_time: parseInt(stop.estimated_time) || 5,
          gallery: Array.isArray(stop.gallery) ? stop.gallery : []
        };

        console.log(`Creating stop ${i + 1}:`, stopData);
        
        try {
          const createdStop = await TourStop.create(stopData);
          console.log(`Stop ${i + 1} created successfully with ID:`, createdStop.id);
          
          // Create audio tracks for this stop
          if (stop.audio_tracks && Array.isArray(stop.audio_tracks)) {
            console.log(`Creating ${stop.audio_tracks.length} audio tracks for stop ${i + 1}`);
            
            for (let j = 0; j < stop.audio_tracks.length; j++) {
              const track = stop.audio_tracks[j];
              
              // Only create audio track if it has an audio URL or transcript
              if (track.language && (track.audio_url || track.transcript.trim())) {
                const audioData = {
                  tour_id: tourResult.id,
                  stop_id: createdStop.id,
                  language: track.language,
                  audio_url: track.audio_url || "",
                  transcript: track.transcript || "",
                  duration: parseInt(track.duration) || 0
                };
                
                console.log(`Creating audio track ${j + 1} for stop ${i + 1}:`, audioData);
                
                try {
                  await AudioTrack.create(audioData);
                  console.log(`Audio track ${j + 1} created.`);
                } catch (audioError) {
                  console.error(`Error creating audio track ${j + 1} for stop ${i + 1}:`, audioError);
                  // Continue with other tracks even if one fails
                }
              } else {
                console.log(`Skipping empty audio track ${j + 1} for stop ${i + 1}.`);
              }
            }
          }
        } catch (stopError) {
          console.error(`Error creating stop ${i + 1}:`, stopError);
          throw new Error(`Failed to create stop #${i + 1}: ${stopError.message}`);
        }
      }
      
      console.log("Tour creation/update completed successfully.");
      
      // Navigate to tour details
      navigate(createPageUrl(`TourDetails?id=${tourResult.id}`));
      
    } catch (error) {
      console.error("Error creating/updating tour:", error);
      alert(`An error occurred while saving the tour: ${error.message}. Please check all required fields and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = (inputId) => {
    document.getElementById(inputId)?.click();
  };

  const calculateProfit = (touristCount) => {
    const revenue = (tour.financials?.price_per_tourist || 0) * touristCount;
    const costs = {
      driver: tour.financials?.costs?.driver_fee || 0,
      fuel: tour.financials?.costs?.fuel_cost || 0,
      food: (tour.financials?.costs?.food_cost_per_tourist || 0) * touristCount,
      other: (tour.financials?.costs?.other_costs || 0)
    };
    const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
    return (revenue - totalCosts).toFixed(2);
  };
  
  if (loadingTour && isEditMode) {
    return (
        <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Loading tour data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? t('create.editTour') : t('create.createTour')}
        </h1>
        <p className="text-gray-500">
          {isEditMode ? t('create.updateExisting') : t('create.createAndPublish')}
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="details">{t('create.details')}</TabsTrigger>
            <TabsTrigger value="stops">
              {t('create.stopsCount', { count: stops.length })}
            </TabsTrigger>
            <TabsTrigger value="preview">{t('create.preview')}</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            {isEditMode && (
                <Button 
                  variant="outline" 
                  onClick={handleExportStops}
                  disabled={exportingCsv}
                  className="gap-2"
                >
                  {exportingCsv ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      {t('create.exporting')}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {t('create.exportStops')}
                    </>
                  )}
                </Button>
            )}
            <Button 
              variant="outline"
              disabled={isSubmitting}
              onClick={() => navigate(isEditMode ? createPageUrl(`TourDetails?id=${tourId}`) : createPageUrl("Home"))}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !tour.title || stops.length === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  {isEditMode ? t('create.updating') : t('create.creating')}
                </>
              ) : (
                isEditMode ? t('create.editTour') : t('create.createTour')
              )}
            </Button>
          </div>
        </div>
        
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('create.tourInfo')}</CardTitle>
              <CardDescription>
                {t('create.basicDetails')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('create.tourTitle')} *</Label>
                  <Input
                    id="title"
                    placeholder={t('create.enterTourTitle')}
                    value={tour.title}
                    onChange={(e) => handleTourChange("title", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="theme">{t('tours.theme')}</Label>
                  <Select 
                    value={tour.theme} 
                    onValueChange={(value) => handleTourChange("theme", value)}
                  >
                    <SelectTrigger id="theme">
                      <SelectValue placeholder={t('create.selectTheme')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cultural">{t('tours.cultural')}</SelectItem>
                      <SelectItem value="historical">{t('tours.historical')}</SelectItem>
                      <SelectItem value="nature">{t('tours.nature')}</SelectItem>
                      <SelectItem value="culinary">{t('tours.culinary')}</SelectItem>
                      <SelectItem value="adventure">{t('tours.adventure')}</SelectItem>
                      <SelectItem value="architectural">{t('tours.architectural')}</SelectItem>
                      <SelectItem value="art">{t('tours.art')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">{t('create.description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('create.describeTour')}
                  className="min-h-32"
                  value={tour.description}
                  onChange={(e) => handleTourChange("description", e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('create.city')}</Label>
                  <Input
                    id="city"
                    placeholder={t('create.city')}
                    value={tour.location.city}
                    onChange={(e) => handleTourChange("location.city", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">{t('create.country')}</Label>
                  <Input
                    id="country"
                    placeholder={t('create.country')}
                    value={tour.location.country}
                    onChange={(e) => handleTourChange("location.country", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">{t('create.estDuration')}</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    placeholder={t('create.durationMinutes')}
                    value={tour.duration}
                    onChange={(e) => handleTourChange("duration", parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">{t('create.difficultyLevel')}</Label>
                  <Select 
                    value={tour.difficulty} 
                    onValueChange={(value) => handleTourChange("difficulty", value)}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder={t('create.selectDifficulty')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">{t('tours.easy')}</SelectItem>
                      <SelectItem value="moderate">{t('tours.moderate')}</SelectItem>
                      <SelectItem value="challenging">{t('tours.challenging')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transportation">{t('create.transportMethod')}</Label>
                  <Select 
                    value={tour.transportation} 
                    onValueChange={(value) => handleTourChange("transportation", value)}
                  >
                    <SelectTrigger id="transportation">
                      <SelectValue placeholder={t('create.selectMethod')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walking">{t('tours.walking')}</SelectItem>
                      <SelectItem value="driving">{t('tours.driving')}</SelectItem>
                      <SelectItem value="cycling">{t('tours.cycling')}</SelectItem>
                      <SelectItem value="public_transport">{t('tours.publicTransport')}</SelectItem>
                      <SelectItem value="mixed">{t('tours.mixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('create.accessibilityFeatures')}</Label>
                <AccessibilityPicker
                  selected={tour.accessibility}
                  onChange={(value) => handleTourChange("accessibility", value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('create.languagesAvailable')}</Label>
                <div className="flex flex-wrap gap-2">
                  {["English", "Spanish", "French", "German", "Bosnian", "Turkish", "Arabic", "Italian", "Japanese", "Chinese"].map(language => (
                    <Badge
                      key={language}
                      variant={tour.languages.includes(language) ? "default" : "outline"}
                      className={`px-3 py-1 cursor-pointer ${
                        tour.languages.includes(language) ? "bg-indigo-600 hover:bg-indigo-700" : ""
                      }`}
                      onClick={() => {
                        if (tour.languages.includes(language)) {
                          if (tour.languages.length > 1) {
                            handleTourChange("languages", tour.languages.filter(l => l !== language));
                          }
                        } else {
                          handleTourChange("languages", [...tour.languages, language]);
                        }
                      }}
                    >
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('create.financialDetails')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('create.pricePerTourist')}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-9"
                        value={tour.financials?.price_per_tourist || ''}
                        onChange={(e) => handleTourChange("financials.price_per_tourist", parseFloat(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="driverFee">{t('create.driverFee')}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="driverFee"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-9"
                        value={tour.financials?.costs?.driver_fee || ''}
                        onChange={(e) => handleTourChange("financials.costs.driver_fee", parseFloat(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuelCost">{t('create.fuelCost')}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="fuelCost"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-9"
                        value={tour.financials?.costs?.fuel_cost || ''}
                        onChange={(e) => handleTourChange("financials.costs.fuel_cost", parseFloat(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="foodCost">{t('create.foodCostPerTourist')}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="foodCost"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-9"
                        value={tour.financials?.costs?.food_cost_per_tourist || ''}
                        onChange={(e) => handleTourChange("financials.costs.food_cost_per_tourist", parseFloat(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minTourists">{t('create.minTourists')}</Label>
                    <Input
                      id="minTourists"
                      type="number"
                      min="1"
                      value={tour.financials?.min_tourists || ''}
                      onChange={(e) => handleTourChange("financials.min_tourists", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTourists">{t('create.maxTourists')}</Label>
                    <Input
                      id="maxTourists"
                      type="number"
                      min="1"
                      value={tour.financials?.max_tourists || ''}
                      onChange={(e) => handleTourChange("financials.max_tourists", parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">{t('create.profitProjection')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t('create.minProfit')}:</span>
                      <span className="font-medium ml-2">
                        ${calculateProfit(tour.financials?.min_tourists || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('create.maxProfit')}:</span>
                      <span className="font-medium ml-2">
                        ${calculateProfit(tour.financials?.max_tourists || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('create.tourPreviewImage')}</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {previewImageUrl ? (
                    <div className="space-y-3">
                      <div className="relative mx-auto w-full h-48 rounded-lg overflow-hidden">
                        <img
                          src={previewImageUrl}
                          alt="Tour preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => {
                            setPreviewImageFile(null);
                            setPreviewImageUrl("");
                            setTour(prev => ({
                              ...prev,
                              preview_image: ""
                            }));
                          }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      {tour.preview_image ? (
                        <p className="text-xs text-green-600 flex items-center justify-center">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {t('create.imageUploaded')}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 flex items-center justify-center">
                          <span className="mr-1 h-3 w-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin"></span>
                          {t('create.uploading')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <div className="text-sm text-gray-500 mb-3">
                        {t('create.dragAndDrop')}
                      </div>
                      <input
                        id="tour-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadTourImage}
                      />
                      <Button 
                        variant="outline" 
                        type="button"
                        onClick={() => document.getElementById('tour-image').click()}
                      >
                        {t('create.chooseImage')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={tour.is_public}
                  onCheckedChange={(checked) => handleTourChange("is_public", checked)}
                />
                <Label htmlFor="isPublic">{t('create.makePublic')}</Label>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('create.startLocation')}</CardTitle>
              <CardDescription>{t('create.setStartPoint')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] mb-4 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <TourMap
                  stops={[
                    {
                      position: 0,
                      location: tour.location.start_point
                    }
                  ]}
                  onLocationChange={(lat, lng) => {
                    handleTourChange("location.start_point.latitude", lat);
                    handleTourChange("location.start_point.longitude", lng);
                  }}
                  currentPosition={currentPosition}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startAddress">{t('create.startAddress')}</Label>
                <Input
                  id="startAddress"
                  placeholder={t('create.enterStartAddress')}
                  value={tour.location.start_point.address}
                  onChange={(e) => handleTourChange("location.start_point.address", e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  {t('create.dragMarkerTip')}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={() => setActiveTab("stops")}>
              {t('common.continue')} {t('create.stops')}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="stops">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('create.tourStops')}</CardTitle>
              <CardDescription>
                {t('create.addAndOrganize')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* CSV Upload Section */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5" />
                  {t('create.bulkImport')}
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  {t('create.uploadCsvDescription')}
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={downloadCsvTemplate}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t('create.downloadTemplate')}
                  </Button>
                  
                  <div className="relative">
                    <Button
                      variant="default"
                      disabled={csvUploadLoading}
                      onClick={() => document.getElementById('csv-upload').click()}
                      className="gap-2"
                    >
                      {csvUploadLoading ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                          {t('create.processingCsv')}
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          {t('create.uploadCsv')}
                        </>
                      )}
                    </Button>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCsvUpload}
                      disabled={csvUploadLoading}
                    />
                  </div>
                </div>

                {csvUploadError && (
                  <Alert className="mt-4 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {csvUploadError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 text-sm text-blue-600">
                  <p className="font-medium mb-1">{t('create.csvFormatHelp')}</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>title</strong>: {t('create.csvTitleDesc')}</li>
                    <li><strong>description</strong>: {t('create.csvDescriptionDesc')}</li>
                    <li><strong>address</strong>: {t('create.csvAddressDesc')}</li>
                    <li><strong>latitude/longitude</strong>: {t('create.csvCoordinatesDesc')}</li>
                    <li><strong>duration_minutes</strong>: {t('create.csvTimeDesc')}</li>
                    <li><strong>order_in_tour</strong>: Order/sequence of the stop in the tour</li>
                    <li><strong>preview_image_url</strong>: {t('create.csvImageDesc')}</li>
                    <li><strong>gallery_images</strong>: {t('create.csvGalleryImagesDesc')}</li>
                    <li><strong>gallery_videos</strong>: {t('create.csvGalleryVideosDesc')}</li>
                    <li><strong>audio_[language]_url</strong>: {t('create.csvAudioUrlDesc')}</li>
                    <li><strong>audio_[language]_transcript</strong>: {t('create.csvAudioTranscriptDesc')}</li>
                  </ul>
                </div>
              </div>

              <div className="h-[400px] mb-6 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <TourMap
                  stops={stops}
                  onLocationChange={(lat, lng, stopIndex) => {
                    const newStops = [...stops];
                    if (newStops[stopIndex]) {
                      if (!newStops[stopIndex].location) {
                        newStops[stopIndex].location = {};
                      }
                      newStops[stopIndex].location.latitude = lat;
                      newStops[stopIndex].location.longitude = lng;
                      setStops(newStops);
                    }
                  }}
                  startLocation={tour.location.start_point}
                  currentPosition={currentPosition}
                />
              </div>
            </CardContent>
          </Card>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stops">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                  {stops.map((stop, index) => (
                    <Draggable key={index} draggableId={`stop-${index}`} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border-l-4"
                          style={{
                            borderLeftColor: `hsl(${(index * 60) % 360}, 80%, 60%)`,
                            ...provided.draggableProps.style
                          }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 cursor-grab"
                                >
                                  <GripVertical size={14} />
                                </div>
                                <div>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <span className="text-gray-400">#{index + 1}</span>
                                    <Input
                                      placeholder={t('create.stopTitle')}
                                      value={stop.title}
                                      onChange={(e) => handleStopChange(index, "title", e.target.value)}
                                      className="h-7 border-0 border-b p-0 text-base rounded-none focus-visible:ring-0 focus-visible:border-indigo-600"
                                    />
                                  </CardTitle>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeStop(index)}
                                disabled={stops.length <= 1}
                                className="h-7 w-7 rounded-full text-gray-400 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <AlignLeft size={16} />
                                    {t('create.description')}
                                  </Label>
                                  <Textarea
                                    placeholder={t('create.describeStop')}
                                    value={stop.description}
                                    onChange={(e) => handleStopChange(index, "description", e.target.value)}
                                    className="min-h-24"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    {t('create.location')}
                                  </Label>
                                  
                                  <div className="flex items-center gap-2">
                                    <Input
                                      placeholder={t('create.address')}
                                      value={stop.location.address}
                                      onChange={(e) => handleStopChange(index, "location.address", e.target.value)}
                                    />
                                    
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      type="button"
                                      className="shrink-0"
                                      onClick={() => {
                                        if (navigator.geolocation) {
                                          navigator.geolocation.getCurrentPosition((position) => {
                                            const { latitude, longitude } = position.coords;
                                            handleStopChange(index, "location.latitude", latitude);
                                            handleStopChange(index, "location.longitude", longitude);
                                          });
                                        }
                                      }}
                                    >
                                      <LocateFixed size={16} />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <Label htmlFor={`stop-${index}-lat`} className="text-xs">{t('create.latitude')}</Label>
                                      <Input
                                        id={`stop-${index}-lat`}
                                        placeholder={t('create.latitude')}
                                        value={stop.location.latitude || ""}
                                        onChange={(e) => handleStopChange(index, "location.latitude", parseFloat(e.target.value))}
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label htmlFor={`stop-${index}-lng`} className="text-xs">{t('create.longitude')}</Label>
                                      <Input
                                        id={`stop-${index}-lng`}
                                        placeholder={t('create.longitude')}
                                        value={stop.location.longitude || ""}
                                        onChange={(e) => handleStopChange(index, "location.longitude", parseFloat(e.target.value))}
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label htmlFor={`stop-${index}-radius`} className="text-xs">{t('create.triggerRadius')}</Label>
                                      <Input
                                        id={`stop-${index}-radius`}
                                        type="number"
                                        min="10"
                                        max="200"
                                        placeholder={t('create.radiusMeters')}
                                        value={stop.trigger_radius}
                                        onChange={(e) => handleStopChange(index, "trigger_radius", parseInt(e.target.value))}
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`stop-${index}-time`} className="flex items-center gap-2">
                                    <Clock size={16} />
                                    {t('create.estTimeMinutes')}
                                  </Label>
                                  <Input
                                    id={`stop-${index}-time`}
                                    type="number"
                                    min="1"
                                    placeholder={t('create.timeMinutes')}
                                    value={stop.estimated_time}
                                    onChange={(e) => handleStopChange(index, "estimated_time", parseInt(e.target.value))}
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    {t('create.stopImage')}
                                  </Label>
                                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                    {stop.preview_image ? (
                                      <div className="space-y-3">
                                        <div className="relative mx-auto w-full h-40 rounded-lg overflow-hidden">
                                          <img
                                            src={stop.preview_image}
                                            alt="Stop preview"
                                            className="w-full h-full object-cover"
                                          />
                                          <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7"
                                            onClick={() => handleStopChange(index, "preview_image", "")}
                                          >
                                            <X size={14} />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <UploadCloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <div className="text-xs text-gray-500 mb-2">
                                          {t('create.addImageForStop')}
                                        </div>
                                        <input
                                          id={`stop-${index}-image`}
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleUploadStopImage(e, index)}
                                        />
                                        <Button 
                                          variant="outline" 
                                          type="button"
                                          size="sm"
                                          onClick={() => triggerFileInput(`stop-${index}-image`)}
                                        >
                                          {t('create.chooseImage')}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <Volume2 size={16} />
                                    {t('create.audioTracks')}
                                  </Label>
                                  
                                  <ScrollArea className="h-[180px] rounded-md border p-2">
                                    <div className="space-y-3">
                                      {stop.audio_tracks && stop.audio_tracks.map((track, audioIndex) => (
                                        <div
                                          key={audioIndex}
                                          className="p-3 border rounded-md"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <Badge>{track.language}</Badge>
                                              {track.duration > 0 && (
                                                <span className="text-xs text-gray-500">
                                                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                                                </span>
                                              )}
                                            </div>
                                            
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-gray-400 hover:text-red-500"
                                              onClick={() => removeAudioTrack(index, audioIndex)}
                                              disabled={stop.audio_tracks.length <= 1}
                                            >
                                              <X size={14} />
                                            </Button>
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <AudioRecorder
                                              stopIndex={index}
                                              audioIndex={audioIndex}
                                              audio={track}
                                              onAudioChange={handleAudioChange}
                                            />
                                            
                                            <Textarea
                                              placeholder={t('create.transcriptOptional')}
                                              value={track.transcript}
                                              onChange={(e) => handleAudioChange(index, audioIndex, "transcript", e.target.value)}
                                              className="min-h-16 text-xs"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                      
                                      {tour.languages.length > stop.audio_tracks.length && (
                                        <div className="pt-2">
                                          <Select
                                            onValueChange={(language) => addAudioTrack(index, language)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder={t('create.addLanguage')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {tour.languages.filter(
                                                lang => !stop.audio_tracks.some(track => track.language === lang)
                                              ).map(lang => (
                                                <SelectItem key={lang} value={lang}>
                                                  {lang}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                    </div>
                                  </ScrollArea>
                                </div>
                              </div>
                            </div>
                            
                            {/* New Media Gallery Section */}
                            <div className="border-t pt-6">
                              <StopMediaUploader
                                stopIndex={index}
                                gallery={stop.gallery || []}
                                onGalleryChange={handleGalleryChange}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          <Button 
            onClick={addStop}
            className="w-full mt-6 py-6 border-2 border-dashed bg-gray-50 hover:bg-gray-100 text-gray-700"
            variant="outline"
          >
            <PlusCircle className="mr-2" />
            {t('create.addAnotherStop')}
          </Button>
          
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setActiveTab("details")}>
              {t('common.back')} {t('create.details')}
            </Button>
            <Button onClick={() => setActiveTab("preview")}>
              {t('common.continue')} {t('create.preview')}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>{t('create.tourPreview')}</CardTitle>
              <CardDescription>
                {t('create.reviewTour')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl overflow-hidden border">
                <div className="h-48 bg-indigo-100 flex items-center justify-center">
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-indigo-300 text-lg">{t('create.noPreviewImage')}</div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{tour.title || t('create.untitledTour')}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">{t(`tours.${tour.theme}`)}</Badge>
                    <Badge variant="secondary">{t(`tours.${tour.difficulty}`)}</Badge>
                    <Badge variant="secondary">{t(`tours.${tour.transportation}`)}</Badge>
                    <Badge variant="secondary">{tour.duration} {t('create.minutes')}</Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    {tour.description || t('create.noDescriptionProvided')}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2">
                      <MapPin size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium">{t('create.startingPoint')}</div>
                        <div className="text-gray-500 text-sm">
                          {tour.location.start_point.address || 
                            `${tour.location.start_point.latitude?.toFixed(6)}, 
                             ${tour.location.start_point.longitude?.toFixed(6)}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Volume2 size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium">{t('create.languages')}</div>
                        <div className="text-gray-500 text-sm">
                          {tour.languages.join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">{t('create.stopsCount', {count: stops.length})}</h4>
                    
                    <div className="space-y-4">
                      {stops.map((stop, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          
                          <div>
                            <h5 className="font-medium">{stop.title || `${t('create.stop')} ${index + 1}`}</h5>
                            <p className="text-sm text-gray-500 mb-1">
                              {stop.description ? 
                                `${stop.description.substring(0, 100)}${stop.description.length > 100 ? '...' : ''}` : 
                                t('create.noDescriptionProvided')}
                            </p>
                            <div className="flex gap-2">
                              {stop.audio_tracks && stop.audio_tracks.map((track, i) => (
                                <Badge key={i} variant="outline" className="text-xs py-0 h-5">
                                  {track.language}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("stops")}>
                {t('common.back')} {t('create.stops')}
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !tour.title || stops.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                    {isEditMode ? t('create.updating') : t('create.publishTour')}
                  </>
                ) : (
                  isEditMode ? t('create.editTour') : t('create.publishTour')
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
