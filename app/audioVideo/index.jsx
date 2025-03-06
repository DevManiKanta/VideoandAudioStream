import React, { useEffect, useState } from "react";
import { StyleSheet, View, Button, Text } from "react-native";
import { Video } from "expo-av";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
const videoSource =
  "file:///private/var/mobile/Containers/Data/Application/41407F9F-668B-4620-ACB7-9467809F4B95/tmp/81D5F14A-576F-464E-9126-CE8CF474D2F7.mov";
export default function VideoScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUri, setVideoUri] = useState(videoSource);
  const params = useLocalSearchParams();
  const [status, setStatus] = useState({});
  const router = useRouter();
  const { path } = useLocalSearchParams();
  useEffect(() => {
    if (path) {
      setVideoUri(path);
    }
  }, []);
  const togglePlayPause = () => {
    setIsPlaying((prevState) => !prevState);
  };
  return (
    <View style={styles.contentContainer}>
      {/* Video component from expo-av */}
      <Video
        source={{ uri: videoUri }} // Video source URL
        rate={1.0} // Speed of the video
        volume={1.0} // Volume of the video
        isMuted={false} // Mute option
        shouldPlay={isPlaying} // Control playback with the state
        resizeMode="fill" // How the video should be resized
        isLooping={true} // Loop the video
        onPlaybackStatusUpdate={(status) => setStatus(status)} // Handle playback updates
        style={styles.video}
      />
      <View style={styles.controlsContainer}>
        {/* Button to toggle play/pause */}
        <Button
          title={isPlaying ? "Pause" : "Play"}
          onPress={togglePlayPause}
        />
      </View>
      <Button title={"Back-to-VideoRecord"} onPress={() => router.back()} />
      {/* Display the playback status */}
      <Text>Status: {status.isPlaying ? "Playing" : "Paused"}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: "100%",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
    backgroundColor: "white",
  },
  video: {
    width: "100%",
    height: "50%",
  },
  controlsContainer: {
    padding: 10,
  },
});
// import { useEffect, useState } from "react";
// import { View, StyleSheet, Button, Alert } from "react-native";
// import { Audio } from "expo-av";

// export default function App() {
//   const [sound, setSound] = useState();

//   async function playSound() {
//     console.log("Loading Sound");
//     const soundUri =
//       "file:///var/mobile/Containers/Data/Application/41407F9F-668B-4620-ACB7-9467809F4B95/Library/Caches/audio.wav"; // Path to the audio file

//     try {
//       // Check if the sound is already loaded
//       if (sound) {
//         await sound.unloadAsync(); // Unload the existing sound
//       }

//       // Load the sound
//       const { sound: newSound } = await Audio.Sound.createAsync({
//         uri: soundUri,
//       });
//       setSound(newSound); // Save the sound object to state
//       console.log("Sound Loaded");

//       // Play the sound
//       await newSound.playAsync();
//       console.log("Sound Playing");
//     } catch (error) {
//       console.error("Error playing sound:", error);
//       Alert.alert(
//         "Error",
//         "Failed to play sound. Please check the file format and URI."
//       );
//     }
//   }

//   useEffect(() => {
//     return () => {
//       if (sound) {
//         console.log("Unloading Sound");
//         sound.unloadAsync(); // Unload the sound when the component unmounts
//       }
//     };
//   }, [sound]);

//   return (
//     <View style={styles.container}>
//       <Button title="Play Sound" onPress={playSound} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     backgroundColor: "#ecf0f1",
//     padding: 10,
//   },
// });
