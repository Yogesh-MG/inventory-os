# clone the repo 
```bash
git clone https://github.com/Yogesh-MG/inventory-os.git
```

#### For The app apk follow the below commands
```bash
cd app
```

```bash
npm install 
```

```bash
npm run build
```

```bash
npx cap sync android
```

### or run the folling it will do the above execution
```bash
./app.sh
```
### remove this from the <h5>android:usesCleartextTraffic="true"</h5> in production
```bash
app>android>app>src>main>AndroidManifest.xml
```

<p>the app.apk is in the below folder</p>

```bash
app>android>app>build>outputs>apk>debug>app-debug.apk
```

## For the Webapp view

```bash
cd frontend
```

```bash
npm install 
```

```bash
npm run build
```

```bash
npm run preview
```

## For the Backend 

