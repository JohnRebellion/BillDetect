export default {
  name: "BillDetect",
  plugins: ["./fix.plugin.js"],
  android: {
    package: "com.johnrebellion.BillDetect",
  },
  ios: {
    bundleIdentifier: "com.johnrebellion.BillDetect",
  },
  extra: {
    eas: {
      projectId: "646d0886-d603-4886-8d1e-fa83ceab9924",
    },
  },
}
