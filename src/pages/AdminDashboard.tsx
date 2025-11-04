import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  Bell, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Star,
  Phone,
  Mail,
  User,
  Shield,
  Home,
  Plus,
  FileText,
  Activity,
  DollarSign,
  Target,
  Award,
  Zap,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { propertyService, Property } from '../lib/propertyService';
import AdminPopularDestinationManagement from './AdminPopularDestinationManagement';
import AdminPropertyLimits from '../components/AdminPropertyLimits';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the admin dashboard.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname;

  const sidebarItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/properties', label: 'Property Management', icon: Building2 },
    { path: '/admin/tours', label: 'Tour Management', icon: MapPin },
    { path: '/admin/popular-destinations', label: 'Popular Destinations', icon: MapPin },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
    { path: '/admin/property-limits', label: 'Property Limits', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user.name}</p>
            </div>
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/properties" element={<PropertyManagement />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/popular-destinations" element={<AdminPopularDestinationManagement />} />
            <Route path="/property-limits" element={<AdminPropertyLimits />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    pendingVerifications: 0,
    activeProperties: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [usersResult, propertiesResult] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('properties').select('*')
      ]);

      // Handle users data
      const users = usersResult.data || [];
      const totalUsers = users.length;

      // Handle properties data
      const properties = propertiesResult.data || [];
      const totalProperties = properties.length;
      const pendingVerifications = properties.filter(p => p.status === 'pending').length;
      const activeProperties = properties.filter(p => p.status === 'approved' && p.is_active).length;

      // Calculate monthly growth (mock calculation)
      const currentMonth = new Date().getMonth();
      const currentMonthUsers = users.filter(u => 
        new Date(u.created_at).getMonth() === currentMonth
      ).length;
      const lastMonthUsers = users.filter(u => 
        new Date(u.created_at).getMonth() === currentMonth - 1
      ).length;
      const monthlyGrowth = lastMonthUsers > 0 ? 
        Math.round(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0;

      // Calculate estimated revenue (mock)
      const totalRevenue = properties
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + (p.price_per_night * 30 * 0.1), 0); // 10% commission estimate

      setStats({
        totalUsers,
        totalProperties,
        pendingVerifications,
        activeProperties,
        totalRevenue: Math.round(totalRevenue),
        monthlyGrowth
      });

      // Generate recent activity from real data
      const activity = [];
      
      // Add recent user signups
      const recentUsers = users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
      
      recentUsers.forEach(user => {
        activity.push({
          id: `user-${user.id}`,
          type: 'user_signup',
          message: `New user ${user.name} signed up`,
          time: user.created_at,
          icon: Users,
          color: 'text-green-600'
        });
      });

      // Add recent property submissions
      const recentProperties = properties
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
      
      recentProperties.forEach(property => {
        activity.push({
          id: `property-${property.id}`,
          type: 'property_submission',
          message: `New property "${property.name}" submitted`,
          time: property.created_at,
          icon: Building2,
          color: 'text-blue-600'
        });
      });

      // Sort activity by time
      activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activity.slice(0, 8));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                {stats.monthlyGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(stats.monthlyGrowth)}% this month
                </span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProperties.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-2">{stats.activeProperties} active</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications.toLocaleString()}</p>
              <p className="text-sm text-orange-600 mt-2">Needs attention</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Est. Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-2">Monthly estimate</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full bg-gray-100`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Zap className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Manage Users</p>
                <p className="text-sm text-blue-700">View and manage user accounts</p>
              </div>
            </Link>
            
            <Link
              to="/admin/properties"
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Building2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Review Properties</p>
                <p className="text-sm text-green-700">Approve pending property listings</p>
              </div>
            </Link>
            
            <Link
              to="/admin/tours"
              className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <MapPin className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Manage Tours</p>
                <p className="text-sm text-orange-700">Create and manage tour packages</p>
              </div>
            </Link>

            <Link
              to="/admin/popular-destinations"
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <MapPin className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Popular Destinations</p>
                <p className="text-sm text-purple-700">Create and manage popular destinations</p>
              </div>
            </Link>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">View Site</p>
                <p className="text-sm text-gray-700">Go to main website</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      alert('User role updated successfully');
    } catch (err: any) {
      console.error('Error updating user role:', err);
      alert(`Failed to update user role: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={fetchUsers}
          className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="host">Hosts</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Users ({filteredUsers.length})
          </h3>
        </div>
        
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'host' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="host">Host</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">No users match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Property Management Component
const PropertyManagement: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await propertyService.getAllProperties();
      
      if (result.success && result.properties) {
        setProperties(result.properties);
      } else {
        throw new Error(result.error || 'Failed to fetch properties');
      }
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setError(err.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const updatePropertyStatus = async (propertyId: string, status: string, notes?: string) => {
    try {
      const result = await propertyService.updatePropertyStatus(propertyId, status as any, notes);
      
      if (result.success) {
        // Refresh properties list
        await fetchProperties();
        alert('Property status updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update property status');
      }
    } catch (err: any) {
      console.error('Error updating property status:', err);
      alert(`Failed to update property status: ${err.message}`);
    }
  };

  const toggleFeaturedStatus = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_featured: !currentStatus })
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      // Update local state
      setProperties(properties.map(prop => 
        prop.id === propertyId ? { ...prop, is_featured: !currentStatus } : prop
      ));
      
      alert(`Property ${!currentStatus ? 'added to' : 'removed from'} featured listings`);
    } catch (err: any) {
      console.error('Error updating featured status:', err);
      alert(`Failed to update featured status: ${err.message}`);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Properties</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProperties}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Management</h2>
          <p className="text-gray-600 mt-1">Review and manage property listings</p>
        </div>
        <button
          onClick={fetchProperties}
          className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search properties by name or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProperties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="relative">
                <img
                  src={property.images[0] || 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'}
                  alt={property.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    property.status === 'approved' ? 'bg-green-100 text-green-800' :
                    property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    property.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {property.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {property.is_featured && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{property.name}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.location}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Owner: {property.user?.name || 'Unknown'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">₹{property.price_per_night.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">per night</div>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{property.description}</p>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {property.max_guests} guests • {property.bedrooms} beds • {property.bathrooms} baths
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(property.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  <div className="flex space-x-2">
                    {property.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            const notes = prompt('Approval notes (optional):');
                            updatePropertyStatus(property.id, 'approved', notes || undefined);
                          }}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Rejection reason:');
                            if (notes) updatePropertyStatus(property.id, 'rejected', notes);
                          }}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {property.status === 'approved' && (
                      <button
                        onClick={() => {
                          const notes = prompt('Review notes:');
                          if (notes) updatePropertyStatus(property.id, 'under_review', notes);
                        }}
                        className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                      >
                        Review Again
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedProperty(property);
                        setShowDetailsModal(true);
                      }}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                  
                  {/* Featured Toggle Button */}
                  <button
                    onClick={() => toggleFeaturedStatus(property.id, property.is_featured || false)}
                    className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors text-sm font-medium ${
                      property.is_featured
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${property.is_featured ? 'fill-current' : ''}`} />
                    <span>{property.is_featured ? 'Remove from Featured' : 'Mark as Featured'}</span>
                  </button>
                </div>

                {property.admin_notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Admin Notes:</strong> {property.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">No properties match your current filters</p>
        </div>
      )}

      {/* Property Details Modal */}
      {showDetailsModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Property Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProperty(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Property Images */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedProperty.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${selectedProperty.name} - ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>

              {/* Property Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedProperty.name}</h4>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{selectedProperty.location}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{selectedProperty.max_guests} guests</span>
                    <span>•</span>
                    <span>{selectedProperty.bedrooms} bedrooms</span>
                    <span>•</span>
                    <span>{selectedProperty.bathrooms} bathrooms</span>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                  <p className="text-gray-700">{selectedProperty.description}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Pricing</h5>
                  <p className="text-2xl font-bold text-gray-900">₹{selectedProperty.price_per_night.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">per night</p>
                </div>

                {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Amenities</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedProperty.amenities.map((amenity, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Owner Information</h5>
                    <p className="text-gray-700">{selectedProperty.user?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{selectedProperty.user?.email || 'No email'}</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Status</h5>
                    <div className="flex flex-col gap-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedProperty.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedProperty.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedProperty.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedProperty.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {selectedProperty.is_featured && (
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 flex items-center gap-1 w-fit">
                          <Star className="h-3 w-3 fill-current" />
                          Featured Property
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedProperty.admin_notes && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Admin Notes</h5>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{selectedProperty.admin_notes}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Timestamps</h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Created: {new Date(selectedProperty.created_at).toLocaleString()}</p>
                    <p>Updated: {new Date(selectedProperty.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3 pt-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  {selectedProperty.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          const notes = prompt('Approval notes (optional):');
                          updatePropertyStatus(selectedProperty.id, 'approved', notes || undefined);
                          setShowDetailsModal(false);
                        }}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Approve Property
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Rejection reason:');
                          if (notes) {
                            updatePropertyStatus(selectedProperty.id, 'rejected', notes);
                            setShowDetailsModal(false);
                          }
                        }}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Reject Property
                      </button>
                    </>
                  )}
                  {selectedProperty.status === 'approved' && (
                    <button
                      onClick={() => {
                        const notes = prompt('Review notes:');
                        if (notes) {
                          updatePropertyStatus(selectedProperty.id, 'under_review', notes);
                          setShowDetailsModal(false);
                        }
                      }}
                      className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Review Again
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedProperty(null);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
                
                {/* Featured Toggle in Modal */}
                <button
                  onClick={() => {
                    toggleFeaturedStatus(selectedProperty.id, selectedProperty.is_featured || false);
                    setSelectedProperty({
                      ...selectedProperty,
                      is_featured: !selectedProperty.is_featured
                    });
                  }}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors font-medium ${
                    selectedProperty.is_featured
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  <Star className={`h-5 w-5 ${selectedProperty.is_featured ? 'fill-current' : ''}`} />
                  <span>{selectedProperty.is_featured ? 'Remove from Featured Listings' : 'Mark as Featured Property'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Admin Settings Component
const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage platform settings and configurations</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Send email notifications for new bookings</p>
            </div>
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-approve Properties</h4>
              <p className="text-sm text-gray-600">Automatically approve properties from verified hosts</p>
            </div>
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
              <p className="text-sm text-gray-600">Put the platform in maintenance mode</p>
            </div>
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform Commission (%)</label>
            <input
              type="number"
              min="0"
              max="30"
              defaultValue="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Processing Fee (%)</label>
            <input
              type="number"
              min="0"
              max="5"
              defaultValue="2.9"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;