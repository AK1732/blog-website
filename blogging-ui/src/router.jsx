
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './routeGuards/ProtectedRoute';


import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

import DashboardAdmin from './pages/admin/DashboardAdmin';


import AddBlogAdmin from './pages/admin/AddBlogAdmin';
import BlogManagementAdmin from './pages/admin/BlogManagementAdmin';

import CategoriesAdmin from './pages/admin/CategoriesAdmin';
import CommentsAdmin from './pages/admin/CommentsAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import WritersAdmin from './pages/admin/WritersAdmin';
import WriterBlogs from './pages/writer/WriterBlogs';
import WriterDashboard from './pages/writer/WriterDashboard';
import WriterProfile from './pages/writer/WriterProfile';

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
          <Route path="signup" element={<Signup />} />

          {/* Protected admin routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/blogs"
            element={
              <ProtectedRoute roles={['admin']}>
                <BlogManagementAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/blogs/add"
            element={
              <ProtectedRoute roles={['admin']}>
                <AddBlogAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/blogs/:id/edit"
            element={
              <ProtectedRoute roles={['admin']}>
                <AddBlogAdmin />
              </ProtectedRoute>
            }
          />


          <Route
            path="dashboard/categories"
            element={
              <ProtectedRoute roles={['admin']}>
                <CategoriesAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/comments"
            element={
              <ProtectedRoute roles={['admin']}>
                <CommentsAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/writers"
            element={
              <ProtectedRoute roles={['admin']}>
                <WritersAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/analytics"
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/settings"
            element={
              <ProtectedRoute roles={['admin']}>
                <SettingsAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="writer"
            element={
              <ProtectedRoute roles={['writer']}>
                <WriterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="writer/blogs"
            element={
              <ProtectedRoute roles={['writer']}>
                <WriterBlogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="writer/drafts"
            element={
              <ProtectedRoute roles={['writer']}>
                <WriterBlogs draftsOnly />
              </ProtectedRoute>
            }
          />
          <Route
            path="writer/blogs/add"
            element={
              <ProtectedRoute roles={['writer']}>
                <AddBlogAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="writer/blogs/:id/edit"
            element={
              <ProtectedRoute roles={['writer']}>
                <AddBlogAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="writer/profile"
            element={
              <ProtectedRoute roles={['writer']}>
                <WriterProfile />
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



