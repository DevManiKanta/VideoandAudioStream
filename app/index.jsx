import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform,
  Alert,
} from "react-native";
import LiveAudioStream from "react-native-live-audio-stream";
import ChartComponent from "../components/chartComponent";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import lamejs from "lamejs";
// Constants for audio processing
const bufferSize = 1024;
const sampleRate = 44100;
const thresholdMultiplier = 5; // Used for peak detection
const globalAudioArraySize = 44100 * 60 * 10; // Pre-allocate space for 10 minutes of audio (example)
const globalAudio = new Int16Array(globalAudioArraySize); // Pre-allocated global audio array
// Helper Functions
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
// Function to decode base64 PCM data into Int16Array format for audio processing
const NativeRecordReceivePCM = (pcmDataBase64) => {
  let bstr = atob(pcmDataBase64); // Decode base64 into a binary string
  let n = bstr.length;
  var pcm = new Int16Array(n / 2); // Allocate space for PCM samples (16-bit samples)
  var sum = 0;
  for (var idx = 0, s, i = 0; i + 2 <= n; idx++, i += 2) {
    s = ((bstr.charCodeAt(i) | (bstr.charCodeAt(i + 1) << 8)) << 16) >> 16; // Combine 2 bytes into a 16-bit signed integer
    pcm[idx] = s;
    sum += Math.abs(s); // Sum absolute values for peak detection
  }
  return [pcm, sum];
};
// Main Component
const Index = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [firstPeakTime, setFirstPeakTime] = useState(null);
  const [secondPeakTime, setSecondPeakTime] = useState(null);
  const sumChunkList = []; // To store sum values for each chunk
  const chunkTimeList = []; // To store timestamp for each chunk
  const audioBuffer = []; // A buffer to store the incoming audio chunks
  const router = useRouter();
  let firstChunkReadTime = null;
  let gap = null;
  let pressedStartTime = null;
  // Function to start the live audio stream
  const startStreaming = async () => {
    pressedStartTime = Date.now();
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;
    sumChunkList.length = 0; // Clear previous data
    setChartData([]); // Reset chart data
    const options = {
      sampleRate: sampleRate,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 10,
      bufferSize: bufferSize / 2, // Correct buffer size (bufferSize/2)
    };

    try {
      LiveAudioStream.init(options);
      LiveAudioStream.on("data", (data) => handleAudioData(data));
      LiveAudioStream.start();
      setIsStreaming(true);
    } catch (error) {
      console.error("Streaming start error:", error);
    }
  };

  // Handle the incoming audio data
  const handleAudioData = (data) => {
    try {
      if (firstChunkReadTime === null) {
        firstChunkReadTime = Date.now();
        gap = firstChunkReadTime - pressedStartTime;
        console.log("Gap between pressing start and first chunk:", gap, "ms");
      }
      const [chunk, sum] = NativeRecordReceivePCM(data);
      console.log("SUM", sum);
      audioBuffer.push(...chunk); // Push chunk to the local audio buffer
      // Efficiently insert chunk data into the global audio array
      const chunkEndIndex = audioBuffer.length;
      globalAudio.set(chunk, chunkEndIndex - chunk.length); // Efficient assignment to global audio
      chunkTimeList.push(Date.now() - firstChunkReadTime);
      sumChunkList.push(sum);
      // Update the chart data
      setChartData([...sumChunkList]);
    } catch (error) {
      console.error("Audio processing error:", error);
    }
  };

  // Function to stop streaming
  const stopStreaming = async () => {
    try {
      LiveAudioStream.stop();
      setIsStreaming(false);
      await saveDataToFile();
      detectPeaks();
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
  };

  // Function to detect peaks based on sumChunkList
  const detectPeaks = () => {
    if (sumChunkList.length === 0) {
      return;
    }
    const median = RoughMedian(sumChunkList);
    const threshold = median * thresholdMultiplier;
    const peaks = sumChunkList
      .map((value, index) => (value > threshold ? index : null))
      .filter((index) => index !== null);
    if (peaks.length < 2) {
      Alert.alert(
        "No clear peaks detected",
        "Ensure the taps were loud and distinct."
      );
      return;
    }
    const firstPeakIndex = peaks[0];
    const secondPeakIndex = peaks[1];
    // setFirstPeakTime(chunkTimeList[firstPeakIndex]);
    // setSecondPeakTime(chunkTimeList[secondPeakIndex]);
    const twoPeakGapInMs =
      chunkTimeList[secondPeakIndex] - chunkTimeList[firstPeakIndex];
    Alert.alert("Gap between two peaks:", twoPeakGapInMs, "ms");
  };
  // Save the audio data to a file
  const saveDataToFile = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}fullPCMAudioBuffer.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(audioBuffer));
      shareJsonFile(fileUri);
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };
  // Share the saved data file
  const shareJsonFile = async (fileUri) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        console.error("Sharing is not available on this device");
        return;
      }
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error("Error sharing file:", error);
    }
  };
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      const fakeChunk = new Uint8Array(bufferSize / 2).map(
        () => Math.random() * 255
      );
      const sum = fakeChunk.reduce((acc, val) => acc + val, 0);
      sumChunkList.push(sum);
    }, 100);
    return () => clearInterval(interval);
  }, [isStreaming]);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        {isStreaming ? "Streaming..." : "Press Start to Stream"}
      </Text>
      <Button
        title="Start Streaming"
        onPress={startStreaming}
        disabled={isStreaming}
      />
      <Button
        title="Stop Streaming"
        onPress={stopStreaming}
        disabled={!isStreaming}
      />
      <Button
        title="Video Recording"
        onPress={() => router.push("/recordinglive/Index")}
      />
      <ChartComponent data={chartData} />
    </View>
  );
};
export default Index;
