import React, { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { Camera } from "expo-camera"
import {
  GestureHandlerRootView,
  PinchGestureHandler,
} from "react-native-gesture-handler"
import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
import * as Speech from "expo-speech"

export default function App() {
  const [hasPermission, setHasPermission] = useState(null)
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back)
  const [text, setText] = useState("Scan")

  const cameraRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")
    })()
  }, [])

  const handleCapture = async () => {
    if (cameraRef.current) {
      let photo = await cameraRef.current.takePictureAsync({
        type: "png",
      })
      const manipResult = await manipulateAsync(
        photo.localUri || photo.uri,
        [],
        { compress: 0.65, format: SaveFormat.JPEG }
      )
      const localUri = manipResult.uri
      let filename = localUri.split("/").pop()

      // Infer the type of the image
      let match = /\.(\w+)$/.exec(filename)
      let type = match ? `image/${match[1]}` : `image`

      // Upload the image using the fetch and FormData APIs
      let formData = new FormData()
      // Assume "photo" is the name of the form field the server expects
      formData.append("image", { uri: localUri, name: filename, type })
      fetch("http://192.168.0.106:8000/", {
        method: "POST",
        headers: {
          "content-type": "multipart/form-data",
        },
        body: formData,
      })
        .then((res) => res.text())
        .then((data) => {
          setText(data)
          Speech.speak(data)
        })
        .finally(() => {
          setTimeout(()=>setText("Scan"), 3000)
        })
        .catch((err) => {
          console.log(err)
        })
      setText("Scanning...")
      Speech.speak("Scanning...")
    }
  }

  const handleZoom = (event) => {
    // Handle pinch gesture for zoomingprompt
    // You can customize this based on your requirements
    // Check the event.nativeEvent.scale for pinch scale value
  }

  if (hasPermission === null) {
    return <View />
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={cameraType} ref={cameraRef}>
        <PinchGestureHandler onGestureEvent={handleZoom}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
            }}
          >
            <TouchableOpacity onPress={handleCapture}>
              <View
                style={{
                  height: 999,
                  width: 999,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}
              >
                <Text style={{fontSize: 30, color: 'white'}}>{text}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </PinchGestureHandler>
      </Camera>
    </GestureHandlerRootView>
  )
}
