// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Button,
//   Text,
//   StyleSheet,
//   Alert,
//   Platform,
//   PermissionsAndroid,
// } from "react-native";
// import {
//   Camera,
//   useCameraDevice,
//   useCameraPermission,
// } from "react-native-vision-camera";
// import LiveAudioStream from "react-native-live-audio-stream";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av"; // Import expo-av for audio playback
// import VideoScreen from "../audioVideo";
// // Constants for audio processing
// const BUFFER_SIZE = 1024; // Size of the audio buffer
// const SAMPLE_RATE = 44100; // Sample rate for audio recording (44.1 kHz)
// const THRESHOLD_MULTIPLIER = 5; // Multiplier for peak detection threshold
// const GLOBAL_AUDIO_ARRAY_SIZE = 44100 * 60 * 10; // Pre-allocate space for 10 minutes of audio
// const GLOBAL_AUDIO = new Int16Array(GLOBAL_AUDIO_ARRAY_SIZE); // Global array to store audio data
// // Function to decode base64 PCM data into Int16Array format for audio processing
// const decodePCMData = (pcmDataBase64) => {
//   const binaryString = atob(pcmDataBase64); // Decode base64 into a binary string
//   const pcm = new Int16Array(binaryString.length / 2); // Allocate space for PCM samples (16-bit samples)
//   let sum = 0;
//   for (let i = 0, idx = 0; i + 2 <= binaryString.length; i += 2, idx++) {
//     const sample =
//       ((binaryString.charCodeAt(i) | (binaryString.charCodeAt(i + 1) << 8)) <<
//         16) >>
//       16; // Combine 2 bytes into a 16-bit signed integer
//     pcm[idx] = sample;
//     sum += Math.abs(sample); // Sum absolute values for peak detection
//   }
//   return [pcm, sum]; // Return the PCM data and the sum of absolute values
// };
// // Function to calculate a rough median of an array
// const calculateRoughMedian = (arr) => {
//   if (arr.length === 0) return 0; // Return 0 if the array is empty
//   const sorted = [...arr].sort((a, b) => a - b); // Sort the array
//   const mid = Math.floor(sorted.length / 2); // Find the middle index
//   return sorted[mid]; // Return the median value
// };
// const Index = () => {
//   // Refs and state variables
//   const camera = useRef(null); // Reference to the camera component
//   const [isRecording, setIsRecording] = useState(false); // State to track video recording
//   const [timeLeft, setTimeLeft] = useState(300); // State to track recording time left
//   const [warningShown, setWarningShown] = useState(false); // State to track if warning is shown
//   const [isStreaming, setIsStreaming] = useState(false); // State to track audio streaming
//   const [chartData, setChartData] = useState([]); // State to store audio data for visualization
//   const [videouri, SetVideoUri] = useState([]); // State to store the first peak time
//   const [secondPeakTime, setSecondPeakTime] = useState(null); // State to store the second peak time
//   const sumChunkList = []; // Array to store sum values for each audio chunk
//   const chunkTimeList = []; // Array to store timestamps for each audio chunk
//   const audioBuffer = []; // Buffer to store incoming audio chunks
//   const globalVideoStore = []; // Array to store recorded video paths
//   let firstChunkReadTime = null; // Timestamp of the first audio chunk
//   let gap = null; // Gap between pressing start and first chunk
//   let pressedStartTime = null; // Timestamp when start is pressed
//   const [recordedvideouri, setRecordedUri] = useState(null);
//   const [url, setUrl] = useState(null);
//   // Camera and permissions
//   const device = useCameraDevice("back"); // Get the back camera device
//   const { hasPermission, requestPermission } = useCameraPermission(); // Camera permission hook
//   const router = useRouter(); // Router for navigation
//   // Request camera and microphone permissions on mount
//   useEffect(() => {
//     const requestPermissions = async () => {
//       if (!hasPermission) {
//         const permissionGranted = await requestPermission();
//         if (!permissionGranted) {
//           Alert.alert(
//             "Permission Required",
//             "Camera and Microphone permissions are needed to record video."
//           );
//         }
//       }
//     };
//     requestPermissions();
//   }, [hasPermission, requestPermission]);
//   // Timer logic for video recording
//   useEffect(() => {
//     let timerInterval;
//     if (isRecording && timeLeft > 0) {
//       timerInterval = setInterval(() => {
//         setTimeLeft((prev) => prev - 1); // Decrease time left by 1 second
//         if (timeLeft === 10 && !warningShown) {
//           setWarningShown(true); // Show warning when 10 seconds are left
//         }
//         if (timeLeft <= 0) {
//           stopRecording(); // Stop recording when time is up
//           clearInterval(timerInterval);
//         }
//       }, 1000); // Update timer every second
//     }
//     return () => clearInterval(timerInterval); // Cleanup interval on unmount
//   }, [isRecording, timeLeft]);
//   // Function to start video recording
//   const startRecording = async () => {
//     if (!camera.current) {
//       Alert.alert("Error", "Camera is not ready.");
//       return;
//     }
//     try {
//       // Start recording
//       await camera.current.startRecording({
//         onRecordingFinished: async (video) => {
//           const path = video.path; // Get the path of the recorded video; // Log the path
//           if (path) {
//             console.log("Recorded Video Path:", path);
//             router.push({
//               pathname: "/audioVideo",
//               params: { path }, // Pass the recorded video URI as a query parameter
//             });
//           } else {
//             console.log("No video path found");
//           }

//           // Notify user that recording is finished
//           Alert.alert("Recording Finished", "Your video has been saved.");
//           shareJsonFile(path); // Share the video file if needed
//         },
//         onRecordingError: (error) => {
//           console.error("Recording error:", error);
//           Alert.alert("Recording Error", "An error occurred while recording.");
//         },
//       });
//       // Set recording state to true and reset other states
//       setIsRecording(true);
//       setTimeLeft(300); // Reset time left to 5 minutes
//       setWarningShown(false); // Reset warning state
//     } catch (error) {
//       Alert.alert("Recording Error", "Failed to start recording.");
//       console.error(error);
//     }
//   };
//   useEffect(() => {
//     console.log("Updated videoUrissssss:", videouri);
//   }, [videouri]);
//   console.log("Url:", videouri);
//   // Function to stop video recording
//   const stopRecording = async () => {
//     if (!camera.current) {
//       Alert.alert("Error", "Camera is not ready.");
//       return;
//     }
//     try {
//       await camera.current.stopRecording();
//       setIsRecording(false);
//       setTimeLeft(300);
//       setWarningShown(false);
//       playAudio();
//     } catch (error) {
//       Alert.alert("Recording Error", "Failed to stop recording.");
//       console.error(error);
//     }
//   };
//   console.log("videoUri", videouri);
//   // Function to request microphone permission (Android only)
//   const requestMicrophonePermission = async () => {
//     if (Platform.OS === "android") {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
//         );
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           Alert.alert("Permission Denied", "Microphone access is required.");
//           return false;
//         }
//       } catch (error) {
//         console.error("Permission request error:", error);
//         return false;
//       }
//     }
//     return true;
//   };
//   // Function to start audio streaming
//   const startStreaming = async () => {
//     pressedStartTime = Date.now(); // Record the start time
//     const hasPermission = await requestMicrophonePermission();
//     if (!hasPermission) return;
//     sumChunkList.length = 0; // Clear previous audio data
//     setChartData([]); // Reset chart data
//     const options = {
//       sampleRate: SAMPLE_RATE,
//       channels: 1,
//       bitsPerSample: 16,
//       audioSource: 10,
//       bufferSize: BUFFER_SIZE / 2,
//     };
//     try {
//       LiveAudioStream.init(options); // Initialize audio streaming
//       LiveAudioStream.on("data", (data) => handleAudioData(data)); // Handle incoming audio data
//       LiveAudioStream.start(); // Start streaming
//       setIsStreaming(true); // Set streaming state to true
//     } catch (error) {
//       console.error("Streaming start error:", error);
//     }
//   };

//   // Function to handle incoming audio data
//   const handleAudioData = (data) => {
//     try {
//       if (firstChunkReadTime === null) {
//         firstChunkReadTime = Date.now(); // Record the time of the first chunk
//         gap = firstChunkReadTime - pressedStartTime; // Calculate the gap
//         console.log("Gap between pressing start and first chunk:", gap, "ms");
//       }
//       const [chunk, sum] = decodePCMData(data); // Decode PCM data
//       console.log("sum", sum);
//       audioBuffer.push(...chunk); // Add chunk to the audio buffer
//       const chunkEndIndex = audioBuffer.length;
//       GLOBAL_AUDIO.set(chunk, chunkEndIndex - chunk.length); // Store chunk in global audio array
//       chunkTimeList.push(Date.now() - firstChunkReadTime); // Record timestamp
//       sumChunkList.push(sum); // Add sum to the list
//       setChartData([...sumChunkList]); // Update chart data
//     } catch (error) {
//       console.error("Audio processing error:", error);
//     }
//   };

//   // Function to save audio data to a file
//   const saveDataToFile = async () => {
//     try {
//       const jsonData = JSON.stringify({
//         data: Array.from(audioBuffer), // Convert Int16Array to a regular array
//         sampleRate: SAMPLE_RATE,
//       });
//       const fileUri = `${FileSystem.documentDirectory}audioData.json`;
//       await FileSystem.writeAsStringAsync(fileUri, jsonData); // Save as JSON file
//     } catch (error) {
//       console.error("Error saving audio data:", error);
//     }
//   };
//   // Function to stop audio streaming
//   const stopStreaming = async () => {
//     try {
//       LiveAudioStream.stop(); // Stop streaming
//       setIsStreaming(false); // Set streaming state to false
//       await saveDataToFile(); // Save audio data to a file
//       detectPeaks(); // Detect peaks in the audio data
//     } catch (error) {
//       console.error("Error stopping stream:", error);
//     }
//   };

//   // Function to detect peaks in the audio data
//   const detectPeaks = () => {
//     if (sumChunkList.length === 0) {
//       return; // Exit if no data is available
//     }
//     const median = calculateRoughMedian(sumChunkList); // Calculate the median
//     const threshold = median * THRESHOLD_MULTIPLIER; // Set the threshold
//     const peaks = sumChunkList
//       .map((value, index) => (value > threshold ? index : null)) // Find peaks above the threshold
//       .filter((index) => index !== null); // Filter out null values
//     if (peaks.length < 2) {
//       Alert.alert(
//         "No clear peaks detected",
//         "Ensure the taps were loud and distinct."
//       );
//       return;
//     }
//     const firstPeakIndex = peaks[0]; // Index of the first peak
//     const secondPeakIndex = peaks[1]; // Index of the second peak
//     const twoPeakGapInMs =
//       chunkTimeList[secondPeakIndex] - chunkTimeList[firstPeakIndex]; // Calculate the gap between peaks
//     Alert.alert("Gap between two peaks:", twoPeakGapInMs, "ms"); // Show the gap
//   };
//   // Function to play the saved audio file
//   const playAudio = async () => {
//     try {
//       const wavFileUri = `${FileSystem.cacheDirectory}audio.wav`; // Path to the WAV file
//       const fileInfo = await FileSystem.getInfoAsync(wavFileUri); // Check if the file exists
//       if (!fileInfo.exists) {
//         console.error("Audio file does not exist:", wavFileUri);
//         return;
//       }
//       console.log("WAV File Info:", fileInfo);
//       // Load and play the audio file
//       // const { sound } = await Audio.Sound.createAsync(
//       //   { uri: wavFileUri }, // URI of the audio file
//       //   { shouldPlay: true } // Automatically play the audio
//       // );

//       // console.log("Audio loaded, playing now...");
//       // Set up a callback for when playback finishes
//       // sound.setOnPlaybackStatusUpdate(async (status) => {
//       //   if (status.didJustFinish) {
//       //     console.log("Playback finished, unloading...");
//       //     await sound.unloadAsync(); // Unload the sound to free up resources
//       //   }
//       // });
//     } catch (error) {
//       console.error("Error playing audio:", error);
//     }
//   };
//   // Function to share the saved file
//   const shareJsonFile = async (fileUri) => {
//     try {
//       if (!(await Sharing.isAvailableAsync())) {
//         console.error("Sharing is not available on this device");
//         return;
//       }
//       await Sharing.shareAsync(fileUri); // Share the file
//     } catch (error) {
//       console.error("Error sharing file:", error);
//     }
//   };

//   // Handle case when no camera device is available
//   if (device == null) {
//     return <Text>No camera device available</Text>;
//   }

//   // Handle case when permission is denied
//   if (!hasPermission) {
//     return (
//       <Text>
//         Camera and Microphone permissions are required to record video.
//       </Text>
//     );
//   }

//   // Render the UI
//   return (
//     <View style={styles.container}>
//       <Camera
//         ref={camera}
//         style={StyleSheet.absoluteFill}
//         device={device}
//         isActive={true}
//         video={true}
//         audio={false} // Disable audio in camera
//       />
//       <View style={styles.overlay}>
//         <Button title="Back-to-Audio-record" onPress={() => router.back()} />
//         <Text
//           style={[
//             styles.timerText,
//             { color: timeLeft <= 10 ? "red" : "white" },
//           ]}
//         >
//           Time Left: {timeLeft} seconds
//         </Text>
//         {!isRecording ? (
//           <Button
//             title="Start Recording"
//             onPress={() => {
//               startRecording();
//               startStreaming();
//             }}
//           />
//         ) : (
//           <Button
//             title="Stop Recording"
//             onPress={() => {
//               stopRecording();
//               stopStreaming();
//             }}
//           />
//         )}
//         <Button title="Play Audio" onPress={playAudio} />
//       </View>
//     </View>
//   );
// };

// // Styles for the component
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "white",
//     borderWidth: 1,
//   },
//   overlay: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     bottom: 100,
//     justifyContent: "flex-end",
//     alignItems: "center",
//     zIndex: 1,
//   },
//   timerText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "white",
//     marginBottom: 20,
//   },
// });
// export default Index;
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
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";

// Constants for audio processing
const BUFFER_SIZE = 1024; // Size of the audio buffer
const SAMPLE_RATE = 44100; // Sample rate for audio recording (44.1 kHz)
const THRESHOLD_MULTIPLIER = 5; // Multiplier for peak detection threshold
const GLOBAL_AUDIO_ARRAY_SIZE = 44100 * 60 * 10; // Pre-allocate space for 10 minutes of audio
const GLOBAL_AUDIO = new Int16Array(GLOBAL_AUDIO_ARRAY_SIZE); // Global array to store audio data

// Function to decode base64 PCM data into Int16Array format for audio processing
const decodePCMData = (pcmDataBase64) => {
  const binaryString = atob(pcmDataBase64); // Decode base64 into a binary string
  const pcm = new Int16Array(binaryString.length / 2); // Allocate space for PCM samples (16-bit samples)
  let sum = 0;
  for (let i = 0, idx = 0; i + 2 <= binaryString.length; i += 2, idx++) {
    const sample =
      ((binaryString.charCodeAt(i) | (binaryString.charCodeAt(i + 1) << 8)) <<
        16) >>
      16; // Combine 2 bytes into a 16-bit signed integer
    pcm[idx] = sample;
    sum += Math.abs(sample); // Sum absolute values for peak detection
  }
  return [pcm, sum]; // Return the PCM data and the sum of absolute values
};

// Function to calculate a rough median of an array
const calculateRoughMedian = (arr) => {
  if (arr.length === 0) return 0; // Return 0 if the array is empty
  const sorted = [...arr].sort((a, b) => a - b); // Sort the array
  const mid = Math.floor(sorted.length / 2); // Find the middle index
  return sorted[mid]; // Return the median value
};

const Index = () => {
  // Refs and state variables
  const videoEndTimeRef = useRef(null); // ✅ Store videoEndTime globally
  const stopTimeRef = useRef(null); // ✅ Store stopTime globally
  const camera = useRef(null); // Reference to the camera component
  const [isRecording, setIsRecording] = useState(false); // State to track video recording
  const [timeLeft, setTimeLeft] = useState(300); // State to track recording time left
  const [warningShown, setWarningShown] = useState(false); // State to track if warning is shown
  const [isStreaming, setIsStreaming] = useState(false); // State to track audio streaming
  const [chartData, setChartData] = useState([]); // State to store audio data for visualization
  const [videoUri, setVideoUri] = useState(null); // State to store the recorded video URI
  const [secondPeakTime, setSecondPeakTime] = useState(null); // State to store the second peak time
  const sumChunkList = []; // Array to store sum values for each audio chunk
  const chunkTimeList = []; // Array to store timestamps for each audio chunk
  const audioBuffer = []; // Buffer to store incoming audio chunks
  const globalVideoStore = []; // Array to store recorded video paths
  let firstChunkReadTime = null; // Timestamp of the first audio chunk
  let gap = null; // Gap between pressing start and first chunk
  let pressedStartTime = null; // Timestamp when start is pressed

  // Camera and permissions
  const device = useCameraDevice("back"); // Get the back camera device
  const { hasPermission, requestPermission } = useCameraPermission(); // Camera permission hook
  const router = useRouter(); // Router for navigation

  // Request camera and microphone permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (!hasPermission) {
        const permissionGranted = await requestPermission();
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
      }, 1000); // Update timer every second
    }
    return () => clearInterval(timerInterval); // Cleanup interval on unmount
  }, [isRecording, timeLeft]);

  // Function to start video recording
  const startRecording = async () => {
    if (!camera.current) {
      Alert.alert("Error", "Camera is not ready.");
      return;
    }
    try {
      // Start recording
      await camera.current.startRecording({
        onRecordingFinished: async (video) => {
          const path = video.path; // Get the path of the recorded video
          if (path) {
            const videoUriTime = Date.now(); // Capture when video URI is generated
            videoEndTimeRef.current = videoUriTime; // ✅ Store videoEndTime globally
            console.log("Video URI generated at:", videoUriTime, "ms");

            const videoProcessingTime = videoUriTime - stopTimeRef.current;
            console.log(
              "Time taken to generate video URI after stop:",
              videoProcessingTime,
              "ms"
            );

            setVideoUri(path); // Update videoUri state
            globalVideoStore.push(path); // Store in global video store
            router.push({
              pathname: "/audioVideo",
              params: { path }, // Pass the recorded video URI as a query parameter
            });

            // If audio is also completed, log both times
            if (audioEndTime !== null) {
              console.log(
                "Total time taken:\n",
                `Video: ${videoProcessingTime}ms\n`,
                `Audio: ${audioEndTime - stopTimeRef.current}ms`
              );
            }
          } else {
            console.log("No video path found");
          }
          Alert.alert("Recording Finished", "Your video has been saved.");
          shareJsonFile(path); // Share the video file if needed
        },
        onRecordingError: (error) => {
          console.error("Recording error:", error);
          Alert.alert("Recording Error", "An error occurred while recording.");
        },
      });
      setIsRecording(true); // Set recording state to true
      setTimeLeft(300); // Reset time left to 5 minutes
      setWarningShown(false); // Reset warning state
    } catch (error) {
      Alert.alert("Recording Error", "Failed to start recording.");
      console.error(error);
    }
  };
  // Function to stop video recording
  const stopRecording = async () => {
    if (!camera.current) {
      Alert.alert("Error", "Camera is not ready.");
      return;
    }
    stopTimeRef.current = Date.now(); // ✅ Store stop time globally

    try {
      await camera.current.stopRecording();
      setIsRecording(false);
      setTimeLeft(300);
      setWarningShown(false);

      const videoGeneratedTime = Date.now();
      console.log(
        "📹 Video URI generated after",
        videoGeneratedTime - stopTimeRef.current,
        "ms"
      );

      const audioGeneratedTime = Date.now();
      console.log(
        "🎵 Audio chunks processed after",
        audioGeneratedTime - stopTimeRef.current,
        "ms"
      );

      playAudio();
    } catch (error) {
      Alert.alert("Recording Error", "Failed to stop recording.");
      console.error(error);
    }
  };
  // Function to request microphone permission (Android only)
  const requestMicrophonePermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied", "Microphone access is required.");
          return false;
        }
      } catch (error) {
        console.error("Permission request error:", error);
        return false;
      }
    }
    return true;
  };

  // Function to start audio streaming
  const startStreaming = async () => {
    pressedStartTime = Date.now(); // Record the start time
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;
    sumChunkList.length = 0; // Clear previous audio data
    setChartData([]); // Reset chart data
    const options = {
      sampleRate: SAMPLE_RATE,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 10,
      bufferSize: BUFFER_SIZE / 2,
    };
    try {
      LiveAudioStream.init(options); // Initialize audio streaming
      LiveAudioStream.on("data", (data) => handleAudioData(data)); // Handle incoming audio data
      LiveAudioStream.start(); // Start streaming
      setIsStreaming(true); // Set streaming state to true
    } catch (error) {
      console.error("Streaming start error:", error);
    }
  };

  let chunkCounter = 0; // Track the total number of chunks
  let lastChunkTime = null; // Store timestamp of the last processed chunk

  // Function to handle incoming audio data
  const handleAudioData = (data) => {
    try {
      if (firstChunkReadTime === null) {
        firstChunkReadTime = Date.now(); // Record the time of the first chunk
        gap = firstChunkReadTime - pressedStartTime; // Calculate the gap
        console.log("Gap between pressing start and first chunk:", gap, "ms");
      }
      const [chunk, sum] = decodePCMData(data); // Decode PCM data
      audioBuffer.push(...chunk); // Add chunk to the audio buffer
      const chunkEndIndex = audioBuffer.length;
      GLOBAL_AUDIO.set(chunk, chunkEndIndex - chunk.length); // Store chunk in global audio array
      chunkTimeList.push(Date.now() - firstChunkReadTime); // Record timestamp
      sumChunkList.push(new Int16Array(sum)); // Add sum to the list
      setChartData([...sumChunkList]); // Update chart data

      // Track chunk count
      chunkCounter++;

      // Track time between chunks
      const currentChunkTime = Date.now();

      if (lastChunkTime !== null) {
        const timeBetweenChunks = currentChunkTime - lastChunkTime;
        console.log(
          `Time between chunk ${
            chunkCounter - 1
          } and chunk ${chunkCounter}: ${timeBetweenChunks} ms`
        );
      }

      lastChunkTime = currentChunkTime; // Update last chunk time

      // Update the last audio chunk timestamp
      audioEndTime = Date.now();
      console.log("Last audio chunk processed at:", audioEndTime, "ms");

      if (stopTimeRef.current !== null) {
        const audioProcessingTime = audioEndTime - stopTimeRef.current;
        console.log(
          "Time taken to process last audio chunk after stop:",
          audioProcessingTime,
          "ms"
        );
      }

      console.log(`Total Chunks Generated: ${chunkCounter}`);

      // If video has also completed, log both times
      if (videoEndTimeRef.current !== null) {
        console.log(
          "Total time taken:\n",
          `Video: ${videoEndTimeRef.current - stopTimeRef.current}ms\n`,
          `Audio: ${audioProcessingTime}ms`
        );
      }
    } catch (error) {
      console.error("Audio processing error:", error);
    }
  };

  // Function to save audio data to a file
  const saveDataToFile = async () => {
    try {
      const jsonData = JSON.stringify({
        data: Array.from(audioBuffer), // Convert Int16Array to a regular array
        sampleRate: SAMPLE_RATE,
      });
      const fileUri = `${FileSystem.documentDirectory}audioData.json`;
      await FileSystem.writeAsStringAsync(fileUri, jsonData); // Save as JSON file
    } catch (error) {
      console.error("Error saving audio data:", error);
    }
  };

  // Function to stop audio streaming
  const stopStreaming = async () => {
    try {
      LiveAudioStream.stop(); // Stop streaming
      setIsStreaming(false); // Set streaming state to false
      await saveDataToFile(); // Save audio data to a file
      detectPeaks(); // Detect peaks in the audio data
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
  };

  // Function to detect peaks in the audio data
  const detectPeaks = () => {
    if (sumChunkList.length === 0) {
      return; // Exit if no data is available
    }
    const median = calculateRoughMedian(sumChunkList); // Calculate the median
    const threshold = median * THRESHOLD_MULTIPLIER; // Set the threshold
    const peaks = sumChunkList
      .map((value, index) => (value > threshold ? index : null)) // Find peaks above the threshold
      .filter((index) => index !== null); // Filter out null values
    if (peaks.length < 2) {
      Alert.alert(
        "No clear peaks detected",
        "Ensure the taps were loud and distinct."
      );
      return;
    }
    const firstPeakIndex = peaks[0]; // Index of the first peak
    const secondPeakIndex = peaks[1]; // Index of the second peak
    const twoPeakGapInMs =
      chunkTimeList[secondPeakIndex] - chunkTimeList[firstPeakIndex]; // Calculate the gap between peaks
    Alert.alert("Gap between two peaks:", twoPeakGapInMs, "ms"); // Show the gap
  };

  const encodeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // WAV Header
    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    writeString(view, 0, "RIFF"); // ChunkID
    view.setUint32(4, 36 + samples.length * 2, true); // ChunkSize
    writeString(view, 8, "WAVE"); // Format
    writeString(view, 12, "fmt "); // Subchunk1ID
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(view, 36, "data"); // Subchunk2ID
    view.setUint32(40, samples.length * 2, true); // Subchunk2Size

    // Write PCM data
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      view.setInt16(offset, samples[i], true);
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  // Function to play the saved audio file
  const playAudio = async () => {
    if (sumChunkList.length === 0) {
      console.warn("No audio chunks to play.");
      return;
    }
    console.log(`🎵 Playing ${audioChunks.length} audio chunks...`);

    const wavBlob = encodeWAV(
      Int16Array.from(sumChunkList.flat()),
      SAMPLE_RATE
    );
    const audioURL = URL.createObjectURL(wavBlob);
    const audio = new Audio(audioURL);

    audio.play();

    audio.onended = () => {
      console.log("✅ Finished playing recorded chunks.");
    };

    // try {
    //   const wavFileUri = `${FileSystem.cacheDirectory}audio.wav`; // Path to the WAV file
    //   console.log("AudioWavFormat", wavFileUri);
    //   const fileInfo = await FileSystem.getInfoAsync(wavFileUri); // Check if the file exists
    //   if (!fileInfo.exists) {
    //     console.error("Audio file does not exist:", wavFileUri);
    //     return;
    //   }
    //   console.log("WAV File Info:", fileInfo);
    //   const { sound } = await Audio.Sound.createAsync(
    //     { uri: wavFileUri }, // URI of the audio file
    //     { shouldPlay: true } // Automatically play the audio
    //   );
    //   console.log("Audio loaded, playing now...");
    //   sound.setOnPlaybackStatusUpdate(async (status) => {
    //     if (status.didJustFinish) {
    //       console.log("Playback finished, unloading...");
    //       await sound.unloadAsync(); // Unload the sound to free up resources
    //     }
    //   });
    // } catch (error) {
    //   console.error("Error playing audio:", error);
    // }
  };

  // Function to share the saved file
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

  // Handle case when no camera device is available
  if (device == null) {
    return <Text>No camera device available</Text>;
  }

  // Handle case when permission is denied
  if (!hasPermission) {
    return (
      <Text>
        Camera and Microphone permissions are required to record video.
      </Text>
    );
  }

  // Render the UI
  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={false} // Disable audio in camera
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
          <Button
            title="Start Recording"
            onPress={() => {
              startRecording();
              startStreaming();
            }}
          />
        ) : (
          <Button
            title="Stop Recording"
            onPress={() => {
              stopRecording();
              stopStreaming();
            }}
          />
        )}
        <Button title="Play Audio" onPress={playAudio} />
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
