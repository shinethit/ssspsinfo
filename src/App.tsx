/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { VersionUpdateModal } from './components/VersionUpdateModal';

// Lazy Loading ဖြင့် Page တစ်ခုချင်းစီကို ခွဲထုတ်ခြင်း (App ပိုမြန်လာမည်)
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
