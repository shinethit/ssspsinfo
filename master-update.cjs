// D:\ssspsinfo-main\master-update.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 စတင်ဆောင်ရွက်နေပါသည်...');

// 1. App.tsx ကို Lazy Loading ဖြင့် ပြင်ဆင်ခြင်း
const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');
if (!appContent.includes('lazy')) {
  const optimizedApp = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { VersionUpdateModal } from './components/VersionUpdateModal';

const Home = lazy(() => import('./pages/Home'));
const Announcements = lazy(() => import('./pages/Announcements'));
const AnnouncementDetail = lazy(() => import('./pages/AnnouncementDetail'));
const Contacts = lazy(() => import('./pages/Contacts'));
const SchoolDetail = lazy(() => import('./pages/SchoolDetail'));
const Associations = lazy(() => import('./pages/Associations'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const VersionHistory = lazy(() => import('./pages/VersionHistory'));
const Sports = lazy(() => import('./pages/Sports'));
const Documents = lazy(() => import('./pages/Documents'));
const Events = lazy(() => import('./pages/Events'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Receipt = lazy(() => import('./pages/Receipt'));
const SchoolLogin = lazy(() => import('./pages/SchoolLogin'));
const SchoolPortal = lazy(() => import('./pages/SchoolPortal'));
const MedalTally = lazy(() => import('./pages/MedalTally'));
const Chat = lazy(() => import('./pages/Chat'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <VersionUpdateModal />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="sports" element={<Sports />} />
              <Route path="medals" element={<MedalTally />} />
              <Route path="documents" element={<Documents />} />
              <Route path="events" element={<Events />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="receipt/:id" element={<Receipt />} />
              <Route path="school-login" element={<SchoolLogin />} />
              <Route path="school-portal" element={<SchoolPortal />} />
              <Route path="announcements/:id" element={<AnnouncementDetail />} />
              <Route path="associations" element={<Associations />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="schools/:id" element={<SchoolDetail />} />
              <Route path="chat" element={<Chat />} />
              <Route path="versions" element={<VersionHistory />} />
              <Route path="login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route path="admin" element={<Admin />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </DataProvider>
    </BrowserRouter>
  );
}
`;
  fs.writeFileSync(appPath, optimizedApp);
  console.log('✅ App.tsx ကို Lazy Loading ဖြင့် ပြင်ဆင်ပြီးပါပြီ။');
}

// 2. sw.js Cache Version မြှင့်တင်ခြင်း
const swPath = path.join(__dirname, 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  if (swContent.includes('ssspsinfo-live-v1')) {
    swContent = swContent.replace(/ssspsinfo-live-v1/g, 'ssspsinfo-live-v2');
    fs.writeFileSync(swPath, swContent);
    console.log('✅ sw.js ရဲ့ Cache Version ကို v2 သို့ မြှင့်တင်ပြီးပါပြီ။');
  }
}

// 3. Build လုပ်ပြီး Error စစ်ဆေးခြင်း (Rule 4)
console.log('🔨 Build လုပ်ပြီး Error စစ်ဆေးနေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။ Error မရှိပါ။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။ Error ရှိနေလို့ Commit မလုပ်တော့ပါ။');
  process.exit(1);
}

// 4. Commit နှင့် Push လုပ်ခြင်း (Rule 4)
console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat: performance optimization - lazy loading and cache bump"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 5. မလိုအပ်တဲ့ ဖိုင်များ ရှင်းလင်းခြင်း (Rule 5)
console.log('🧹 ယာယီဖိုင်များ ရှင်းလင်းနေပါသည်...');
try {
  if (fs.existsSync(path.join(__dirname, 'fix-lag-app.cjs'))) fs.unlinkSync(path.join(__dirname, 'fix-lag-app.cjs'));
  if (fs.existsSync(path.join(__dirname, 'fix-sw.cjs'))) fs.unlinkSync(path.join(__dirname, 'fix-sw.cjs'));
  fs.unlinkSync(__filename); // ဒီ Script ကိုယ်တိုင်ကို ဖျက်ခြင်း
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}