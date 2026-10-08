/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Announcements from './pages/Announcements';
import AnnouncementDetail from './pages/AnnouncementDetail';
import Contacts from './pages/Contacts';
import SchoolDetail from './pages/SchoolDetail';
import Associations from './pages/Associations';
import Dashboard from './pages/Dashboard';
import VersionHistory from './pages/VersionHistory';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="announcements" element={<Announcements />} />
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
      </DataProvider>
    </BrowserRouter>
  );
}
