import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/ui/Navbar";
import ParticleComponent from "@/components/ui/Particles";

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const streamRef = useRef(null);

  // Webcam feed
  useEffect(() => {
    async function getCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true // Enable audio recording
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Prefer MP4 format for better OpenCV compatibility
        const mimeTypes = [
          'video/mp4',
          'video/webm;codecs=h264,opus',
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm'
        ];
        
        // Find the first supported mime type
        const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
        
        if (!supportedMimeType) {
          throw new Error("No supported media recording MIME type found");
        }
        
        console.log("Using MIME type:", supportedMimeType);
        
        // Set up media recorder with the supported type
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: supportedMimeType,
          videoBitsPerSecond: 2500000 // 2.5 Mbps for better quality
        });
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunks.current.push(e.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          try {
            // Get the mime type that was actually used
            const actualMimeType = mediaRecorderRef.current?.mimeType || 'video/mp4';
            
            const blob = new Blob(recordedChunks.current, { type: actualMimeType });
            setVideoBlob(blob);
            
            // Create a URL for preview if needed
            const videoURL = URL.createObjectURL(blob);
            if (videoRef.current) {
              videoRef.current.srcObject = null;
              videoRef.current.src = videoURL;
              videoRef.current.controls = true;
            }
          } catch (err) {
            console.error("Error processing recording:", err);
          }
        };
      } catch (err) {
        console.error("Camera error:", err);
        alert("Unable to access camera. Please check your permissions.");
      }
    }

    getCamera();

    return () => {
      // Clean up on unmount - stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    let timer = null;

    if (isRecording) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
      if (timer) clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Format elapsed time as MM:SS
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Start/Stop recording
  const handleStartStopRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      
      // When stopping, let's also stop the live camera to show the recording
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } else {
      // If we have a previous recording shown, we need to restart the camera
      if (!streamRef.current) {
        getCamera();
        return; // getCamera will recall this function after setting up
      }
      
      recordedChunks.current = []; // Clear previous recording
      mediaRecorderRef.current?.start(1000); // Collect data every second
      setIsRecording(true);
      setUploadStatus(null); // Reset upload status
      setVideoBlob(null);
    }
  };
  
  // Helper function to get camera again (for restart)
  const getCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.controls = false;
      }
      
      // Try to use MP4 for better OpenCV compatibility
      const mimeTypes = [
        'video/mp4',
        'video/webm;codecs=h264,opus',
        'video/webm'
      ];
      
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: supportedMimeType
      });
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: supportedMimeType });
        setVideoBlob(blob);
        
        // Create a URL for preview
        const videoURL = URL.createObjectURL(blob);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = videoURL;
          videoRef.current.controls = true;
        }
      };
      
      // Now that everything is set up, start recording
      recordedChunks.current = [];
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. Please check your permissions.");
    }
  };

  // Upload video
  const handleUpload = async () => {
    if (!videoBlob) {
      alert("No video to upload");
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    
    // Always create file as session.mp4 for OpenCV processing
    const file = new File([videoBlob], "session.mp4", { 
      type: mediaRecorderRef.current?.mimeType || 'video/mp4' 
    });
    
    const formData = new FormData();
    formData.append("video", file);

    try {
      console.log("Uploading file:", file.name, "Type:", file.type, "Size:", file.size);
      
      // Add a query parameter to indicate we want to save with the opencv script
      const response = await fetch("http://localhost:5000/upload_video?save_with_opencv=true", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Upload response:", result);
      
      setUploadStatus("success");
      alert("Video uploaded successfully and ready for data processing!");
    } catch (error) {
      console.error("Error uploading video:", error);
      setUploadStatus("error");
      alert(`Error uploading video: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
      window.location.href = "report";
    }
  };

  return (
    <div className="flex flex-col bg-white text-blue-900 min-h-screen w-full relative">
      <div className="absolute inset-0 z-10 blur-xs">
        {!isRecording ? <ParticleComponent/> : <></>}
      </div>

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center gap-12 px-4 md:px-8 py-16 z-10">
        <div className="flex items-center gap-6 mt-10">
          <div className="flex items-center gap-3">
            <div
              className={`h-4 w-4 rounded-full transition-all duration-300 shadow-md ${
                isRecording ? "bg-red-500 animate-pulse" : videoBlob ? "bg-blue-500" : "bg-green-400"
              }`}
            />
            <span className="text-2xl font-extrabold tracking-wide text-gray-700 font-theme">
              {isRecording ? "Recording" : videoBlob ? "Recorded" : "Ready"}
              {isUploading && " (Uploading...)"}
            </span>
          </div>
          {isRecording && (
            <span className="text-lg font-mono text-gray-600">
              ⏱ {formatTime(elapsedTime)}
            </span>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden shadow-xl border-blue-700 bg-black max-w-[800px] w-full h-[500px]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isRecording} // Only mute during recording to prevent feedback
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-row gap-4 items-center">
          <button
            onClick={handleStartStopRecording}
            disabled={isUploading}
            className={`py-3 px-8 text-lg font-semibold rounded-xl shadow-md transition duration-300 ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : videoBlob
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isRecording ? "Stop Recording" : videoBlob ? "Record Again" : "Start Recording"}
          </button>

          {/* Upload Button */}
          {!isRecording && videoBlob && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`py-3 px-8 text-lg font-semibold rounded-xl shadow-md transition-colors ${
                isUploading ? "bg-yellow-500" : uploadStatus === "success" ? "bg-green-600" : uploadStatus === "error" ? "bg-red-600" : "bg-green-600"
              } text-white hover:${
                uploadStatus === "error" ? "bg-red-700" : "bg-green-700"
              } ${isUploading ? "opacity-70 cursor-wait" : ""}`}
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}