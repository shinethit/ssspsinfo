# ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း — Info Sharing Web App

ဤအပလီကေးရှင်းသည် ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း၏ အတွင်းပိုင်း သတင်းအချက်အလက် မျှဝေရေး ပလပ်ဖောင်းတစ်ခု ဖြစ်သည်။

---

## စနစ် စတင်တပ်ဆင်ခြင်းနှင့် လုံခြုံရေး လမ်းညွှန် (Setup & Security Guide)

### ၁။ Firebase Project & Environment Variables
အပလီကေးရှင်းသည် တစ်ခုတည်းသော Production Firebase Project ဖြစ်သည့် `southernshanstatepsinfo` (Default Firestore Database: `(default)`) ကို အသုံးပြုပါသည်။

`.env.example` ဖိုင်ကို အခြေခံ၍ သက်ဆိုင်ရာ Environment Variables များကို သတ်မှတ်ပေးပါ-
```bash
VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="southernshanstatepsinfo.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="southernshanstatepsinfo"
VITE_FIREBASE_STORAGE_BUCKET="southernshanstatepsinfo.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_APP_ID"

# Cloudinary Setup (Optional)
VITE_CLOUDINARY_CLOUD_NAME="YOUR_CLOUDINARY_CLOUD_NAME"
VITE_CLOUDINARY_UPLOAD_PRESET="YOUR_CLOUDINARY_UPLOAD_PRESET"
VITE_CLOUDINARY_FOLDER="ssspsinfo"
```

### ၂။ Firebase Authentication (Email/Password) ဖွင့်လှစ်ခြင်း
1. Firebase Console သို့ ဝင်ရောက်ပါ။
2. **Build** > **Authentication** > **Sign-in method** သို့ သွားပါ။
3. **Email/Password** provider ကို ရွေးချယ်ပြီး **Enable** ပြုလုပ်၍ Save နှိပ်ပါ။

### ၃။ ပထမဆုံး Super Admin အကောင့် ဖန်တီးပုံ (First Super Admin Setup)
1. Firebase Console ၏ **Authentication** > **Users** တွင် **Add user** ကို နှိပ်၍ ပင်မ Super Admin အီးမေးလ်နှင့် စကားဝှက်ကို ထည့်သွင်းဖန်တီးပါ။
2. ဖန်တီးပြီးသော User ၏ **User UID** ကို ကူးယူပါ (ဥပမာ - `xK9L2...`)။
3. **Firestore Database** သို့ သွားပြီး `admins` collection အောက်တွင် အဆိုပါ **UID** ကို Document ID အဖြစ် ထည့်သွင်း၍ Document အသစ်တစ်ခု ဖန်တီးပါ:
   ```json
   {
     "uid": "<USER_UID>",
     "email": "khunthanshwe@gmail.com",
     "name": "Super Admin",
     "role": "super_admin",
     "createdAt": "2026-10-09T00:00:00.000Z"
   }
   ```
4. ထို့နောက် `/login` စာမျက်နှာတွင် အဆိုပါ အီးမေးလ်နှင့် စကားဝှက်ဖြင့် Admin Portal ထဲသို့ တိုက်ရိုက် လုံခြုံစွာ ဝင်ရောက်နိုင်ပါပြီ။
5. အခြားသော Admin/Editor များကို Portal ထဲရှိ **အက်ဒမင်များ (Admins)** tab မှတစ်ဆင့် Super Admin မှ စိတ်ကြိုက် အသစ်ခန့်အပ်ခြင်း/ဖယ်ရှားခြင်းများ ဆောင်ရွက်နိုင်ပါသည်။

### ၄။ Firestore & Storage Security Rules Deploy ပြုလုပ်ခြင်း
- **Firestore Rules**: `firestore.rules` ဖိုင်တွင် ပါရှိသော Rules များကို Firebase Console ၏ **Firestore Database** > **Rules** တွင် ထည့်သွင်းပြီး **Publish** ပြုလုပ်ပါ (သို့မဟုတ် `firebase deploy --only firestore:rules`)။
- **Storage Rules**: `storage.rules` ဖိုင်တွင် ပါရှိသော Rules များကို **Cloud Storage** > **Rules** တွင် ထည့်သွင်းပြီး **Publish** ပြုလုပ်ပါ (သို့မဟုတ် `firebase deploy --only storage`)။

### ၅။ Development Server စတင်လည်ပတ်ခြင်း
```bash
npm install
npm run dev
```
