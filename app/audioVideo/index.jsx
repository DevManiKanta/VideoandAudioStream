// import React, { useEffect, useState } from "react";
// import { StyleSheet, View, Button, Text } from "react-native";
// import { Video } from "expo-av";
// import { useRouter } from "expo-router";
// import { useLocalSearchParams } from "expo-router";
// const videoSource =
//   "file:///private/var/mobile/Containers/Data/Application/41407F9F-668B-4620-ACB7-9467809F4B95/tmp/81D5F14A-576F-464E-9126-CE8CF474D2F7.mov";
// export default function VideoScreen() {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [videoUri, setVideoUri] = useState(videoSource);
//   const params = useLocalSearchParams();
//   const [status, setStatus] = useState({});
//   const router = useRouter();
//   const { path } = useLocalSearchParams();
//   useEffect(() => {
//     if (path) {
//       setVideoUri(path);
//     }
//   }, []);
//   const togglePlayPause = () => {
//     setIsPlaying((prevState) => !prevState);
//   };
//   return (
//     <View style={styles.contentContainer}>
//       {/* Video component from expo-av */}
//       <Video
//         source={{ uri: videoUri }} // Video source URL
//         rate={1.0} // Speed of the video
//         volume={1.0} // Volume of the video
//         isMuted={false} // Mute option
//         shouldPlay={isPlaying} // Control playback with the state
//         resizeMode="fill" // How the video should be resized
//         isLooping={true} // Loop the video
//         onPlaybackStatusUpdate={(status) => setStatus(status)} // Handle playback updates
//         style={styles.video}
//       />
//       <View style={styles.controlsContainer}>
//         {/* Button to toggle play/pause */}
//         <Button
//           title={isPlaying ? "Pause" : "Play-Recorded-Video"}
//           onPress={togglePlayPause}
//         />
//         <Button title={"Play-Recorded-Audio"} />
//       </View>
//       <Button title={"Back-to-VideoRecord"} onPress={() => router.back()} />
//       {/* Display the playback status */}
//       <Text>Status: {status.isPlaying ? "Playing" : "Paused"}</Text>
//     </View>
//   );
// }
// const styles = StyleSheet.create({
//   contentContainer: {
//     flex: 1,
//     width: "100%",
//     padding: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 50,
//     backgroundColor: "white",
//   },
//   video: {
//     width: "100%",
//     height: "50%",
//   },
//   controlsContainer: {
//     padding: 10,
//   },
// });
// // import React, { useState } from "react";
// // import { View, Button, Alert, StyleSheet } from "react-native";
// // import * as FileSystem from "expo-file-system";
// // import { Audio } from "expo-av";

// // const audioSource =
// //   " file:///var/mobile/Containers/Data/Application/846A618A-A887-4078-A0A4-4B48509F9D2C/Documents/audioData.wav";
// // export default function AudioPlayer() {
// //   const [sound, setSound] = useState(null);

// //   const playAudio = async () => {
// //     try {
// //       console.log("🔹 Checking file existence...");
// //       const fileInfo = await FileSystem.getInfoAsync(audioSource);
// //       console.log("File Info:", fileInfo);

// //       if (!fileInfo.exists) {
// //         console.error("❌ File does not exist:", audioSource);
// //         Alert.alert("Error", "Audio file not found!");
// //         return;
// //       }

// //       console.log("✅ File exists, loading audio...");
// //       // Stop and unload previous sound if exists
// //       if (sound) {
// //         await sound.stopAsync();
// //         await sound.unloadAsync();
// //         setSound(null);
// //       }

// //       // Load and play the audio file
// //       const { sound: newSound } = await Audio.Sound.createAsync(
// //         { uri: audioSource },
// //         { shouldPlay: true }
// //       );

// //       setSound(newSound);
// //       console.log("🎵 Playing audio...");

// //       // Cleanup when audio finishes
// //       newSound.setOnPlaybackStatusUpdate(async (status) => {
// //         if (status.didJustFinish) {
// //           console.log("✅ Playback finished, unloading...");
// //           await newSound.unloadAsync();
// //           setSound(null);
// //         }
// //       });
// //     } catch (error) {
// //       console.error("❌ Error playing audio:", error);
// //       Alert.alert("Error", "Could not play audio!");
// //     }
// //   };
// //   return (
// //     <View style={styles.container}>
// //       <Button title="Play Audio" onPress={playAudio} />
// //     </View>
// //   );
// // }
// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     justifyContent: "center",
// //     alignItems: "center",
// //     backgroundColor: "#f5f5f5",
// //   },
// // });
import React, { useState, useEffect } from "react";
import { View, Button, Text, StyleSheet, Alert } from "react-native";
import { Video, Audio } from "expo-av";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";

const DEFAULT_VIDEO_URI =
  "file:///private/var/mobile/Containers/Data/Application/846A618A-A887-4078-A0A4-4B48509F9D2C/tmp/AE53735F-CF65-4E03-84C4-6BD90686ABB0.mov";

const PlaybackScreen = () => {
  const { videoUri, audioUri } = useLocalSearchParams();
  const [videoRef, setVideoRef] = useState(null);
  const [sound, setSound] = useState(null);
  const router = useRouter();

  // Play the video
  const playVideo = async () => {
    if (videoRef) {
      await videoRef.playAsync();
    }
  };
  // Play the audio
  const playAudio = async () => {
    if (audioUri) {
      const { sound: playbackSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      setSound(playbackSound);
      await playbackSound.playAsync();
    }
  };

  // Download the audio file
  const downloadAudio = async () => {
    if (!audioUri) {
      Alert.alert("Error", "No audio file available for download.");
      return;
    }
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "Sharing is not available on this device.");
        return;
      }
      await Sharing.shareAsync(audioUri);
    } catch (error) {
      console.error("Error downloading audio:", error);
      Alert.alert("Error", "Failed to download audio.");
    }
  };
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Playback Screen</Text>

      {(videoUri || DEFAULT_VIDEO_URI) && (
        <Video
          ref={(ref) => setVideoRef(ref)}
          source={{ uri: videoUri || DEFAULT_VIDEO_URI }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
        />
      )}
      <View style={styles.buttonsContainer}>
        <Button title="Play Video" onPress={playVideo} />
        <Button title="Play Audio" onPress={playAudio} />
        <Button title="Download Audio" onPress={downloadAudio} />
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  video: {
    width: 300,
    height: 200,
    marginBottom: 20,
  },
  buttonsContainer: {
    width: "80%",
    gap: 10,
  },
});

export default PlaybackScreen;
