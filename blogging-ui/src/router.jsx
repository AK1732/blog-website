
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './routeGuards/ProtectedRoute';


import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';

import DashboardAdmin from './pages/admin/DashboardAdmin';


import AddBlogAdmin from './pages/admin/AddBlogAdmin';
import BlogManagementAdmin from './pages/admin/BlogManagementAdmin';

import CategoriesAdmin from './pages/admin/CategoriesAdmin';
import CommentsAdmin from './pages/admin/CommentsAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';

import Blogs from './pages/Blogs';
import BlogDetails from './pages/BlogDetails';
import NotFound from './pages/NotFound';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />

          {/* Protected admin routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/blogs"
            element={
              <ProtectedRoute>
                <BlogManagementAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/blogs/add"
            element={
              <ProtectedRoute>
                <AddBlogAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/blogs/:id/edit"
            element={
              <ProtectedRoute>
                <AddBlogAdmin />
              </ProtectedRoute>
            }
          />


          <Route
            path="dashboard/categories"
            element={
              <ProtectedRoute>
                <CategoriesAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/comments"
            element={
              <ProtectedRoute>
                <CommentsAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsAdmin />
              </ProtectedRoute>
            }
          />



          {/* Public blog routes (already scaffolded) */}
          <Route path="blogs" element={<Blogs />} />
          <Route path="blogs/:id" element={<BlogDetails />} />


          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}



