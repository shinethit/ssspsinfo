# ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း — Info Sharing Web App

ဤအပလီကေးရှင်းသည် ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း၏ အတွင်းပိုင်း သတင်းအချက်အလက် မျှဝေရေး ပလပ်ဖောင်းတစ်ခု ဖြစ်သည်။

## စတင်အသုံးပြုပုံ (Setup Steps)

1.  **Firebase ပရောဂျက်တစ်ခု ဖန်တီးပါ**: Firebase Console သို့သွား၍ ပရောဂျက်အသစ်တစ်ခု ဖန်တီးပါ။
2.  **ဝန်ဆောင်မှုများဖွင့်ပါ**:
    *   Authentication (Email/Password)
    *   Firestore Database
    *   Cloud Storage
3.  **Config ထည့်သွင်းပါ**: `.env.example` ဖိုင်ကို `.env` အဖြစ် ကူးယူပြီး Firebase config တန်ဖိုးများကို ထည့်သွင်းပါ။
4.  **Dependencies များသွင်းပါ**:
    ```bash
    npm install
    ```
5.  **App ကိုစတင်ပါ**:
    ```bash
    npm run dev
    ```
6.  **Admin အသုံးပြုသူ ဖန်တီးပုံ**: Firestore ၏ `admins` collection တွင် သင်၏ User UID ကို document အဖြစ် ထည့်သွင်းပေးပါ။
