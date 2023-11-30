import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, TextInput } from "react-native";
import { Camera, getSupportedRatiosAsync } from "expo-camera";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
} from "react-native-gesture-handler";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [socket, setSocket] = useState(null);
  const [webSocketURL, setWebSocketURL] = useState('localhost:8000')

  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      initializeWebSocket()
    })();
  }, []);

  const initializeWebSocket = () => {
    Alert.alert(webSocketURL)
    const ws = new WebSocket(
      `ws://${webSocketURL}/ws/1`,
    ); // Replace with your WebSocket server URL
    setSocket(ws);

    ws.onopen = () => {
      Alert.alert('webSocketURL connected!')
    };
    // Listen for messages
    ws.onmessage = (event) => {
      const message = event.data;
      console.log(message);
      alert(message);
    };

    // Connection closed
    ws.onclose = () => {
      console.log("<p>WebSocket connection closed</p>");
    };

    // Connection error
    ws.onerror = () => {
      console.log("<p>Error in WebSocket connection</p>");
    };
  }


  const handleCapture = async () => {
    if (cameraRef.current) {
      let photo = await cameraRef.current.takePictureAsync({
        ratio: "19:9",
        quality: 0,
        type: "jpg",
        base64: true,
      });
      if (socket) {
        const manipResult = await manipulateAsync(
          photo.localUri || photo.uri,
          [{ resize: { width: 1280, height: 720 } }],
          { base64: true, compress: 0, format: SaveFormat.JPEG },
        );

        alert("Loading...");
        await socket.send(`data:image/jpeg;base64,${manipResult.base64}`);
      }
    }
  };

  const handleZoom = (event) => {
    // Handle pinch gesture for zoomingprompt
    // You can customize this based on your requirements
    // Check the event.nativeEvent.scale for pinch scale value
  };


  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* <View style={{ padding: 10, marginTop: 30 }}>
        <TextInput onChangeText={url => { setWebSocketURL(url) }}></TextInput>
        <TouchableOpacity onPress={() => initializeWebSocket()}>
          <Text style={{ color: 'black' }}>Change WebSocket URL</Text>
        </TouchableOpacity>
      </View> */}

      <Camera style={{ flex: 1 }} type={cameraType} ref={cameraRef}>
        <PinchGestureHandler onGestureEvent={handleZoom}>
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{ marginBottom: 30 }}
              onPress={handleCapture}
            >
              <View
                style={{
                  borderWidth: 2,
                  borderRadius: 50,
                  borderColor: "white",
                  height: 50,
                  width: 50,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    borderWidth: 2,
                    borderRadius: 50,
                    borderColor: "white",
                    height: 40,
                    width: 40,
                    backgroundColor: "white",
                  }}
                />
              </View>
            </TouchableOpacity>
          </View>
        </PinchGestureHandler>
      </Camera>
    </GestureHandlerRootView>
  );
}
