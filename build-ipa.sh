#!/usr/bin/env bash
#
# build-ipa.sh — produce an UNSIGNED Vision Trainer .ipa for AltStore sideloading.
#
# Run this on a Mac with full Xcode + CocoaPods installed (NOT the headless MBA).
# A free Apple ID is enough — AltStore re-signs the app on install, so no paid
# Apple Developer account and no EAS cloud build are needed.
#
# Prereqs (one-time on the MBP):
#   xcode-select -p            # must point at /Applications/Xcode.app/...
#   xcodebuild -version        # Xcode present
#   pod --version || brew install cocoapods
#
# Usage:
#   ./build-ipa.sh
# Output:
#   ./VisionTrainer.ipa   →  drop into AltStore (My Apps → +) to install.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/VisionTrainer.ipa"
cd "$ROOT"

echo "▸ 1/4  Installing JS dependencies (npm install)…"
npm install

echo "▸ 2/4  Generating native iOS project (expo prebuild + pod install)…"
npx expo prebuild --platform ios --clean

echo "▸ 3/4  Building unsigned Release .app (xcodebuild)…"
cd "$ROOT/ios"
WS="$(ls -d ./*.xcworkspace | head -1)"
# The app scheme matches the workspace name (e.g. VisionTrainer), NOT schemes[0]
# which is an alphabetically-first CocoaPods scheme (EXApplication, …).
SCHEME="$(basename "$WS" .xcworkspace)"
echo "   workspace=$WS  scheme=$SCHEME"
xcodebuild \
  -workspace "$WS" \
  -scheme "$SCHEME" \
  -configuration Release \
  -sdk iphoneos \
  -derivedDataPath "$ROOT/ios/build" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  | tail -n 25

echo "▸ 4/4  Packaging .ipa…"
PROD="$ROOT/ios/build/Build/Products/Release-iphoneos"
APP="$(ls -d "$PROD"/*.app | head -1)"
echo "   app bundle: $APP"
rm -rf "$PROD/Payload" "$OUT"
mkdir "$PROD/Payload"
cp -R "$APP" "$PROD/Payload/"
( cd "$PROD" && zip -qry "$OUT" Payload )

echo ""
echo "✅ Done →  $OUT"
echo "   Open AltStore on the Mac (or AltServer), My Apps → + → pick VisionTrainer.ipa."
echo "   AltStore re-signs with your free Apple ID and installs to the iPhone (7-day refresh)."
