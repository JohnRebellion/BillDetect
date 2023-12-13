import React, { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { Camera } from "expo-camera"
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PanGestureHandler,
} from "react-native-gesture-handler"
import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
import * as Speech from "expo-speech"
import { LinearGradient } from "expo-linear-gradient"

export default function App() {
  const [hasPermission, setHasPermission] = useState(null)
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back)
  const [text, setText] = useState()
  const [titleShown, setTitleShown] = useState(true)

  const cameraRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")

      if (status === "granted") {
        setText("Fake Money Detector")
      }
    })()
  }, [])

  useEffect(() => {
    if (text) {
      Speech.speak(text)

      if (text === "Fake Money Detector") {
        Speech.speak("swipe up")
      }
    }
  }, [text])

  const handleCapture = async () => {
    if (cameraRef.current) {
      setText("Scanning...")
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
        })
        .finally(() => {
          setTimeout(() => setText("Touch to scan"), 3000)
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  const onPanGestureEvent = (event) => {
    setTitleShown(false)
    setText("Touch to scan")
  }

  if (hasPermission === null) {
    return <View />
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={onPanGestureEvent}>
        {titleShown ? (
          <LinearGradient
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            colors={["#0008C3", "#006AB7"]}
          >
            <View
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 56, textAlign: "center", color: "white" }}
              >
                Fake Money Detector
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  textAlign: "center",
                  color: "white",
                  bottom: 10,
                  position: "absolute",
                }}
              >
                swipe up
              </Text>
            </View>
          </LinearGradient>
        ) : (
          <Camera style={{ flex: 1 }} type={cameraType} ref={cameraRef}>
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
                  <Text style={{ fontSize: 30, color: "white" }}>{text}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Camera>
        )}
      </PanGestureHandler>
    </GestureHandlerRootView>
  )
}
