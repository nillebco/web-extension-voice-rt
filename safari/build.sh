xcrun safari-web-extension-converter ./dist/chrome \
 --project-location ./dist/safari --app-name "Speak with the Web Page" \
 --bundle-identifier com.nilleb.speakwiththewebpage --force --no-prompt --no-open
xcodebuild archive -project "./dist/safari/Speak with the Web Page/Speak with the Web Page.xcodeproj" \
 -scheme "Speak with the Web Page (macOS)" -configuration Release -archivePath "./dist/safari/Speak with the Web Page.xcarchive"
xcodebuild -exportArchive -archivePath "./dist/safari/Speak with the Web Page.xcarchive" \
 -exportOptionsPlist ./safari/export-options.plist -exportPath ./dist/safari
rm ./dist/safari/safari.dmg
appdmg ./safari/appdmg.json ./dist/safari/safari.dmg
