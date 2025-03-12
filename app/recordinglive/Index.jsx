import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Button,
  Text,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import LiveAudioStream from "react-native-live-audio-stream";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";

// Constants for audio processing
const SAMPLE_RATE = 44100; // Sample rate for audio recording (44.1 kHz)

// Function to encode audio data into WAV format
const encodeWAV = (samples, sampleRate) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2); // Create a buffer for the WAV file
  const view = new DataView(buffer); // Create a DataView to write binary data

  // Helper function to write strings to the buffer
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i)); // Write each character as a byte
    }
  };

  // Write the WAV header
  writeString(view, 0, "RIFF"); // Chunk ID
  view.setUint32(4, 36 + samples.length * 2, true); // Chunk size
  writeString(view, 8, "WAVE"); // Format
  writeString(view, 12, "fmt "); // Subchunk1 ID
  view.setUint32(16, 16, true); // Subchunk1 size
  view.setUint16(20, 1, true); // Audio format (1 = PCM)
  view.setUint16(22, 1, true); // Number of channels (1 = mono)
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(view, 36, "data"); // Subchunk2 ID
  view.setUint32(40, samples.length * 2, true); // Subchunk2 size

  // Write the PCM audio data
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true); // Write each sample as a 16-bit integer
  }

  return Buffer.from(new Uint8Array(buffer)).toString("base64"); // Return the WAV file as a base64 string
};

const Index = () => {
  // Refs and state variables
  const videoEndTimeRef = useRef(null); // Ref to store the timestamp when video URI is generated
  const stopTimeRef = useRef(null); // Ref to store the timestamp when recording is stopped
  const camera = useRef(null); // Ref to the camera component
  const [isRecording, setIsRecording] = useState(false); // State to track if video is recording
  const [timeLeft, setTimeLeft] = useState(300); // State to track the remaining recording time
  const [warningShown, setWarningShown] = useState(false); // State to track if the 10-second warning is shown
  const [isStreaming, setIsStreaming] = useState(false); // State to track if audio is streaming
  const [videoUri, setVideoUri] = useState(null); // State to store the video file URI
  const [audioData, setAudioData] = useState([]); // State to store raw audio data
  const [filePath, setFilePath] = useState(null); // State to store the audio file URI
  const [sound, setSound] = useState(null); // State to manage audio playback

  // Camera and permissions
  const device = useCameraDevice("back"); // Get the back camera device
  const { hasPermission, requestPermission } = useCameraPermission(); // Hook to manage camera permissions
  const router = useRouter(); // Router for navigation

  // Request camera and microphone permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (!hasPermission) {
        const permissionGranted = await requestPermission(); // Request camera permission
        if (!permissionGranted) {
          Alert.alert(
            "Permission Required",
            "Camera and Microphone permissions are needed to record video."
          );
        }
      }
    };
    requestPermissions();
  }, [hasPermission, requestPermission]);

  // Timer logic for video recording
  useEffect(() => {
    let timerInterval;
    if (isRecording && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => prev - 1); // Decrease time left by 1 second
        if (timeLeft === 10 && !warningShown) {
          setWarningShown(true); // Show warning when 10 seconds are left
        }
        if (timeLeft <= 0) {
          stopRecording(); // Stop recording when time is up
          clearInterval(timerInterval);
        }
      }, 1000); // Update every second
    }
    return () => clearInterval(timerInterval); // Cleanup interval on unmount
  }, [isRecording, timeLeft]);

  // Function to start video and audio recording
  const startRecording = async () => {
    if (!camera.current) {
      Alert.alert("Error", "Camera is not ready.");
      return;
    }
    try {
      // Start video recording
      await camera.current.startRecording({
        onRecordingFinished: async (video) => {
          const path = video.path; // Get the path of the recorded video
          if (path) {
            const videoUriTime = Date.now(); // Capture the current time
            videoEndTimeRef.current = videoUriTime; // Store the timestamp
            console.log("Video URI generated at:", videoUriTime, "ms"); // Log the timing
            console.log("VideoUri", path); // Log the video URI
            setVideoUri(path); // Update the video URI state
            Alert.alert("Recording Finished", "Your video has been saved.");
            shareJsonFile(path); // Share the video file
          } else {
            console.log("No video path found");
          }
        },
        onRecordingError: (error) => {
          console.error("Recording error:", error);
          Alert.alert("Recording Error", "An error occurred while recording.");
        },
      });

      // Start audio recording
      setAudioData([]); // Clear previous audio data
      setIsStreaming(true); // Set streaming state to true

      LiveAudioStream.init({
        sampleRate: SAMPLE_RATE, // Set sample rate
        channels: 1, // Mono audio
        bitsPerSample: 16, // 16-bit audio
        bufferSize: 4096, // Buffer size for audio chunks
      });

      LiveAudioStream.on("data", (data) => {
        const chunk = Buffer.from(data, "base64"); // Decode base64 audio data
        const int16Array = new Int16Array(chunk.buffer); // Convert to Int16Array
        setAudioData((prev) => [...prev, ...int16Array]); // Append to audio data state
      });

      LiveAudioStream.start(); // Start audio streaming
      setIsRecording(true); // Set recording state to true
      setTimeLeft(300); // Reset time left to 5 minutes
      setWarningShown(false); // Reset warning state
    } catch (error) {
      Alert.alert("Recording Error", "Failed to start recording.");
      console.error(error);
    }
  };

  // Function to stop video and audio recording
  const stopRecording = async () => {
    if (!camera.current) {
      Alert.alert("Error", "Camera is not ready.");
      return;
    }

    stopTimeRef.current = Date.now(); // Capture the stop time

    try {
      // Stop video recording
      await camera.current.stopRecording();
      setIsRecording(false); // Set recording state to false
      setTimeLeft(300); // Reset time left
      setWarningShown(false); // Reset warning state

      // Stop audio recording
      LiveAudioStream.stop();
      setIsStreaming(false); // Set streaming state to false

      // Save audio data to a WAV file
      if (audioData.length > 0) {
        const wavBase64 = encodeWAV(audioData, SAMPLE_RATE); // Encode audio data to WAV
        const path = `${FileSystem.documentDirectory}live_audio.wav`; // Define file path

        await FileSystem.writeAsStringAsync(path, wavBase64, {
          encoding: FileSystem.EncodingType.Base64, // Save as base64
        });
        const audioUriTime = Date.now(); // Capture the current time
        console.log("Audio URI generated at:", audioUriTime, "ms"); // Log the timing
        console.log("Audio Uri", path); // Log the audio URI

        // Log the time difference between video and audio URI generation
        if (videoEndTimeRef.current) {
          const timeDifference = audioUriTime - videoEndTimeRef.current;
          console.log(
            "Time difference between video and audio URI generation:",
            timeDifference,
            "ms"
          );
        }
        setFilePath(path); // Update the audio file path state
        Alert.alert("Audio Saved", `Saved at: ${path}`);
      }

      // Navigate to the next screen with video and audio URIs
      // router.push({
      //   pathname: "/audioVideo",
      //   params: { videoUri: videoUri, audioUri: filePath },
      // });
    } catch (error) {
      Alert.alert("Recording Error", "Failed to stop recording.");
      console.error(error);
    }
  };

  // Function to play the saved audio file
  const playAudio = async () => {
    if (!filePath) {
      Alert.alert("Error", "No file generated yet!");
      return;
    }

    try {
      const { sound: playbackSound } = await Audio.Sound.createAsync(
        { uri: filePath }, // Load the audio file
        { shouldPlay: true } // Automatically play the audio
      );
      setSound(playbackSound); // Set the sound state
      await playbackSound.playAsync(); // Play the audio
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  // Function to share the saved video file
  const shareJsonFile = async (fileUri) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        console.error("Sharing is not available on this device");
        return;
      }
      await Sharing.shareAsync(fileUri); // Share the file
    } catch (error) {
      console.error("Error sharing file:", error);
    }
  };

  // Function to download the recorded audio file
  const downloadAudio = async () => {
    if (!filePath) {
      Alert.alert("Error", "No file available for download!");
      return;
    }
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }
      await Sharing.shareAsync(filePath); // Share the audio file
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  // Handle case when no camera device is available
  if (device == null) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text>No camera device available</Text>
      </View>
    );
  }

  // Handle case when permission is denied
  if (!hasPermission) {
    return (
      <Text>
        Camera and Microphone permissions are required to record video.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
      />
      <View style={styles.overlay}>
        <Button title="Back-to-Audio-record" onPress={() => router.back()} />
        <Text
          style={[
            styles.timerText,
            { color: timeLeft <= 10 ? "red" : "white" },
          ]}
        >
          Time Left: {timeLeft} seconds
        </Text>
        {!isRecording ? (
          <Button title="Start Video  Recording" onPress={startRecording} />
        ) : (
          <Button title="Stop Video Recording" onPress={stopRecording} />
        )}
        <Button
          title="Play Recorded Audio"
          onPress={playAudio}
          disabled={!filePath}
        />
        <Button
          title="Download Recorded Audio"
          onPress={downloadAudio}
          disabled={!filePath}
        />
      </View>
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 100,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 1,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
});

export default Index;
