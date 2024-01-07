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
import { PropagateLoader } from "react-spinners"

export default function App() {
  const [loading, setLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(null)
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back)
  const [text, setText] = useState()
  const [titleShown, setTitleShown] = useState(true)

  const cameraRef = useRef(null)

  useEffect(() => {
    ; (async () => {
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
    Speech.stop()
    if (loading) return
    if (cameraRef.current) {
      setLoading(true)
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
      // fetch("http://192.168.0.253:8000", {
      fetch("https://mnv2.onrender.com", {
        method: "POST",
        headers: {
          "content-type": "multipart/form-data",
        },
        body: formData,
      })
        .then((res) => res.text())
        .then((data) => {
          setLoading(false)
          let result = data.replace("\rloading Roboflow workspace...\n\rloading Roboflow project...\n", "")
          setText(result)
        })
        .finally(() => {
          setTimeout(() => { setTimeout(() => setLoading(false), 500); setText("Tap anywhere to start detection") }, 2000)
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  const onPanGestureEvent = (event) => {
    Speech.stop()
    const { translationX: x, translationY: y } = event.nativeEvent
    console.log(`x: ${x}, y: ${y}`)

    if (Math.abs(x) > 50 || Math.abs(y) > 50) {
      if (y < -100 && Math.abs(x) < 100) {
        setTitleShown(false)
        setText("Tap anywhere to start detection")
        return
      }

      if (x < 0 && x < 100 && Math.abs(y) < 100) {
        setText("Left")
        return
      }

      if (x > 0 && x > 100 && Math.abs(y) < 100) {
        setText("Right")
        return
      }

      if (hasPermission === null) {
        return <View />
      }
      if (hasPermission === false) {
        return <Text>No access to camera</Text>
      }
    }
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
            colors={["#0008C3", "#006AB7", "#89CFF0"]}
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
                style={{ fontSize: 32, textAlign: "center", color: "white" }}
              >
                Fake Money Detector
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  textAlign: "center",
                  color: "white",
                  bottom: 80,
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
                {
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

                    <Text style={{ fontSize: 20, color: "white" }}>{text}</Text>
                  </View>
                }
              </TouchableOpacity>
            </View>
          </Camera>
        )}
      </PanGestureHandler>
    </GestureHandlerRootView>
  )
}
