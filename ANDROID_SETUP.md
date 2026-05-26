# ReelVault Android APK Packaging Guide (Capacitor)

This guide provides the exact steps and configurations required to wrap your ReelVault web application into a native Android APK using **Capacitor**, and configure **Android Share Intents** so that you can share Reels directly from the Instagram app to ReelVault!

---

## 🚀 Step 1: Initialize Capacitor in Workspace

Open your project terminal (or run via command prompt in `c:\Users\91897\Desktop\Reel Vault`) and install the Capacitor modules:

```bash
# Install core Capacitor packages & Android platform
npm install @capacitor/core @capacitor/cli @capacitor/android

# Sync configuration settings
npx cap sync
```

---

## 📦 Step 2: Build Web Assets & Scaffold Android

Compile the production React assets and generate the native Android Studio project container:

```bash
# 1. Compile React production web bundle
npm run build

# 2. Add native Android build folder
npx cap add android
```
This generates a fully functional native Android studio project folder under `android/` in your workspace.

---

## 📲 Step 3: Configure Android Share Intents (Instagram Sharing)

To make ReelVault show up in your phone's system "Share Menu" when you click share on an Instagram Reel:

### 1. Edit `AndroidManifest.xml`
Open the file located at:
`android/app/src/main/AndroidManifest.xml`

Find your main `<activity>` block and insert the following `<intent-filter>` right inside the `<activity>` tag:

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    ... >
    
    <!-- Intent Filter to Receive Text/URLs (Shared Instagram Links) -->
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
    </intent-filter>

</activity>
```
*Note: Ensure `android:exported="true"` is configured on the `MainActivity` so that the Android system is authorized to launch ReelVault from the share menu.*

### 2. Handle Intent on App Boot
We have already written the JavaScript listener inside **`src/App.jsx`** to listen for `sendIntentReceived` and auto-fill your capture fields! 

To bridge the Android intent values to JavaScript, you can install the standard Capacitor SendIntent plugin:
```bash
# Install Capacitor Send Intent plugin
npm install @pantrist/capacitor-share-target --save

# Sync changes to Android Container
npx cap sync android
```

---

## 🛠 Step 4: Compile and Run APK

1. Launch Android Studio and open the `android` folder generated in your workspace:
   ```bash
   npx cap open android
   ```
2. Wait for Gradle to finish indexing your dependencies.
3. Connect your Android phone via USB (with **USB Debugging** enabled in Developer Settings) or spin up a virtual device.
4. Click the green **Run (Play button)** at the top of Android Studio.
5. Android Studio will compile your code and install **ReelVault** on your phone!

---

## 🔄 Routine Update Commands
Whenever you edit your React code locally and want to push the updates to your phone:

```bash
# 1. Compile edits
npm run build

# 2. Copy compiled assets to Android project
npx cap copy android

# 3. Open Android Studio to build & run
npx cap open android
```
