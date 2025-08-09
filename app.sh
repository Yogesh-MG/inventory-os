echo "Starting to execute the Android commands"
cd app
npm run build
npx cap sync android
npx cap run android

