import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Package, UserPlus, Activity, TrendingUp, ShoppingCart, Star, MapPin, AlertTriangle, Calendar, Clock, Eye, LogOut, AlertCircle, RefreshCw, Database, ChartBar } from 'lucide-react';
import supabase from '../lib/supabase';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    users: {
      total: 0,
      active: 0,
      newToday: 0,
      recentSignups: []
    },
    products: {
      total: 0,
      available: 0,
      soldOut: 0,
      categories: []
    },
    activity: {
      ratings: 0,
      contacts: 0,
      avgRating: 0
    },
    charts: {
      userGrowth: [],
      productsByCategory: [],
      dailyActivity: []
    },
    debug: {
      authUsers: 0,
      profilesUsers: 0,
      tablesFound: []
    }
  });

  //adminpass
  const ADMIN_CODE = 'admin';
  //admins
  const ADMIN_EMAILS = ['adminjanri0255@gmail.com', "kath@gmail.com", "ashleyadmin@gmail.com"];

  useEffect(() => {
    checkAdminAuth();
  }, []);

  //set up real-time subscription for profile changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Setting up real-time subscriptions...');
      
      const profileSubscription = supabase
        .channel('profiles_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            console.log('Profile change detected:', payload);
            //refresh data when profiles change
            fetchDashboardData();
          }
        )
        .subscribe();

      const productSubscription = supabase
        .channel('products_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products'
          },
          (payload) => {
            console.log('Product change detected:', payload);
            fetchDashboardData();
          }
        )
        .subscribe();

      return () => {
        console.log('Cleaning up subscriptions...');
        profileSubscription.unsubscribe();
        productSubscription.unsubscribe();
      };
    }
  }, [isAuthenticated]);

  const checkAdminAuth = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Checking admin authentication...');
      
      const isLocallyAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
      console.log('Local admin auth status:', isLocallyAuthenticated);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('Current user:', user?.email || 'No user');
      console.log('User error:', userError?.message || 'None');
      
      setDebugInfo({
        hasLocalAuth: isLocallyAuthenticated,
        currentUser: user?.email || null,
        userError: userError?.message || null,
        isAdminEmail: user ? ADMIN_EMAILS.includes(user.email) : false,
        hasAdminRole: user?.user_metadata?.role === 'admin'
      });
      
      if (!user || userError) {
        console.log('No valid user session');
        localStorage.removeItem('admin_authenticated');
        setIsAuthenticated(false);
        if (!user) {
          setError('You must be logged in to access the admin dashboard. Please login to your regular account first.');
        }
        return;
      }
      
      if (isLocallyAuthenticated) {
        const isAdminEmail = ADMIN_EMAILS.includes(user.email);
        const hasAdminRole = user.user_metadata?.role === 'admin';
        
        console.log('Admin check - Email:', isAdminEmail, 'Role:', hasAdminRole);
        
        if (isAdminEmail || hasAdminRole) {
          console.log('Admin access granted');
          setIsAuthenticated(true);
          await fetchDashboardData();
        } else {
          console.log('User not authorized as admin');
          localStorage.removeItem('admin_authenticated');
          setIsAuthenticated(false);
          setError(`Access denied. User ${user.email} is not authorized as an admin.`);
        }
      } else {
        console.log('No local admin auth, showing login form');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Authentication error: ' + error.message);
      setIsAuthenticated(false);
      localStorage.removeItem('admin_authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Attempting admin login...');
      
      if (adminCode !== ADMIN_CODE) {
        setError('Invalid admin code');
        setAdminCode('');
        setLoading(false);
        return;
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('User during login:', user?.email || 'No user');
      
      if (userError || !user) {
        setError('You need to be logged in to access the admin dashboard. Please login to your regular account first.');
        setLoading(false);
        return;
      }

      const isAdminEmail = ADMIN_EMAILS.includes(user.email);
      const hasAdminRole = user.user_metadata?.role === 'admin';
      
      console.log('Admin login check - Email:', isAdminEmail, 'Role:', hasAdminRole);
      
      if (isAdminEmail || hasAdminRole) {
        console.log('Admin login successful');
        localStorage.setItem('admin_authenticated', 'true');
        setIsAuthenticated(true);
        await fetchDashboardData();
      } else {
        setError(`Access denied. User ${user.email} is not authorized as an admin.`);
        console.log('Admin login failed - unauthorized user');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Error during admin authentication: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      console.log('Fetching dashboard data...');
      
      //check what tables exist first
      const { data: tablesData } = await supabase.rpc('get_table_names');
      console.log('Available tables:', tablesData);
      
      //check the auth.users count
      const { count: authUsersCount } = await supabase.auth.admin.listUsers();
      console.log('Auth users count:', authUsersCount);
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      //get all the users from profiles table
      console.log('Fetching profiles...');
      const { data: allUsers, error: usersError, count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      console.log('Profiles query result:', {
        data: allUsers?.length || 0,
        error: usersError?.message || 'None',
        count: profilesCount
      });

      if (usersError) {
        console.error('Users fetch error:', usersError);
      }

      let authUsers = [];
      if (!allUsers || allUsers.length === 0) {
        console.log('Trying to fetch from auth.users...');
        try {
          const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
          if (!authError) {
            authUsers = authData.users || [];
            console.log('Found users in auth.users:', authUsers.length);
          }
        } catch (authErr) {
          console.log('Cannot access auth.users (normal if not service key)');
        }
      }

      //get recent users in last 7 days
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Recent users:', recentUsers?.length || 0);

      //get all products
      console.log('Fetching products...');
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('*');

      console.log('Products:', allProducts?.length || 0, 'Error:', productsError?.message || 'None');

      if (productsError) {
        console.error('Products fetch error:', productsError);
      }

      //get available products
      const { data: availableProducts } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'Available');

      //get ratings
      console.log('Fetching ratings...');
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('*');

      console.log('Ratings:', ratings?.length || 0, 'Error:', ratingsError?.message || 'None');

      if (ratingsError) {
        console.error('Ratings fetch error:', ratingsError);
      }

      //get saved contacts
      console.log('Fetching contacts...');
      const { data: contacts, error: contactsError } = await supabase
        .from('saved_contacts')
        .select('*');

      console.log('Contacts:', contacts?.length || 0, 'Error:', contactsError?.message || 'None');

      if (contactsError) {
        console.error('Contacts fetch error:', contactsError);
      }

      const usersData = allUsers && allUsers.length > 0 ? allUsers : authUsers;
      
      //process data for the charts
      const userGrowthData = processUserGrowthData(usersData || []);
      const categoryData = processCategoryData(allProducts || []);
      const activityData = processActivityData(usersData || [], allProducts || [], ratings || []);

      //calculates the metrics
      const todayUsers = (usersData || []).filter(u => {
        const createdAt = u.created_at || u.created_at;
        return new Date(createdAt) >= yesterday;
      }).length;

      const activeUsers = (usersData || []).filter(u => {
        const lastActive = new Date(u.updated_at || u.last_sign_in_at || u.created_at);
        const dayAgo = new Date();
        dayAgo.setHours(dayAgo.getHours() - 24);
        return lastActive >= dayAgo;
      }).length;

      const avgRating = (ratings || []).length > 0 
        ? ((ratings || []).reduce((acc, r) => acc + r.rating, 0) / (ratings || []).length).toFixed(1)
        : 0;

      console.log('Dashboard data processed successfully');
      console.log('Metrics:', {
        totalUsers: (usersData || []).length,
        todayUsers,
        activeUsers,
        totalProducts: (allProducts || []).length,
        availableProducts: (availableProducts || []).length
      });

      setDashboardData({
        users: {
          total: (usersData || []).length,
          active: activeUsers,
          newToday: todayUsers,
          recentSignups: recentUsers || usersData?.slice(0, 10) || []
        },
        products: {
          total: (allProducts || []).length,
          available: (availableProducts || []).length,
          soldOut: ((allProducts || []).length) - ((availableProducts || []).length),
          categories: categoryData
        },
        activity: {
          ratings: (ratings || []).length,
          contacts: (contacts || []).length,
          avgRating: avgRating
        },
        charts: {
          userGrowth: userGrowthData,
          productsByCategory: categoryData,
          dailyActivity: activityData
        },
        debug: {
          authUsers: authUsers.length,
          profilesUsers: (allUsers || []).length,
          tablesFound: tablesData || []
        }
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error loading dashboard data: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const processUserGrowthData = (users) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        users: 0,
        cumulative: 0
      };
    });

    users.forEach(user => {
      const userDate = new Date(user.created_at).toISOString().split('T')[0];
      const dayIndex = last30Days.findIndex(day => day.date === userDate);
      if (dayIndex !== -1) {
        last30Days[dayIndex].users++;
      }
    });

    //calculate the cumulative
    let cumulative = 0;
    return last30Days.map(day => {
      cumulative += day.users;
      return { ...day, cumulative };
    });
  };

  const processCategoryData = (products) => {
    const categories = {};
    products.forEach(product => {
      const categoryName = product.category === 'HerbsAndSpices' ? 'Herbs & Spices' : product.category;
      categories[categoryName] = (categories[categoryName] || 0) + 1;
    });
    
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
    return Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const processActivityData = (users, products, ratings) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        users: 0,
        products: 0,
        ratings: 0
      };
    });

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(today);
      dayStart.setDate(today.getDate() - (6 - i));
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      last7Days[i].users = users.filter(u => {
        const createdAt = new Date(u.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;
      
      last7Days[i].products = products.filter(p => {
        const createdAt = new Date(p.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;
      
      last7Days[i].ratings = ratings.filter(r => {
        const createdAt = new Date(r.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;
    }

    return last7Days;
  };

  const handleLogout = () => {
    console.log('Admin logout');
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setAdminCode('');
    setError('');
    setDebugInfo(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Access</h2>
            <p className="text-gray-600">Enter admin code to access dashboard</p>
            <p className="text-sm text-red-600 mt-2">
              If you're not an admin, you don't have access to this page. Return to the homepage.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Admin Code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full bg-green-700 text-white py-3 px-4 rounded-lg hover:bg-green-800 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Access Dashboard'}
            </button>
          </div>
          
          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>This dashboard is restricted to authorized administrators only.</p>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, change, color = "green" }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-800' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{change >= 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">AniSave Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-700">{lastRefresh.toLocaleString()}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* debug info */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" />
            Debug Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Profiles Table:</span>
              <span className="ml-2 font-medium">{dashboardData.debug.profilesUsers} users</span>
            </div>
            <div>
              <span className="text-gray-500">Auth Users:</span>
              <span className="ml-2 font-medium">{dashboardData.debug.authUsers} users</span>
            </div>
            <div>
              <span className="text-gray-500">Real-time:</span>
              <span className="ml-2 font-medium text-green-600">Active</span>
            </div>
            <div>
              <span className="text-gray-500">Last Refresh:</span>
              <span className="ml-2 font-medium">{lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={dashboardData.users.total}
            icon={Users}
            change={12}
          />
          <StatCard
            title="Active Products"
            value={dashboardData.products.available}
            icon={Package}
            change={8}
            color="blue"
          />
          <StatCard
            title="New Users Today"
            value={dashboardData.users.newToday}
            icon={UserPlus}
            change={25}
            color="purple"
          />
          <StatCard
            title="Average Rating"
            value={dashboardData.activity.avgRating || "N/A"}
            icon={Star}
            color="yellow"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* user growth chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-800" />
              User Growth (30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  stroke="#666"
                />
                <YAxis stroke="#666" />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value, name) => [value, name === 'users' ? 'New Users' : 'Total Users']}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  name="Total Users"
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#13833cff" 
                  fill="#16A34A" 
                  fillOpacity={0.6}
                  name="New Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* products by categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Products by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.charts.productsByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardData.charts.productsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* activity overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Weekly Activity Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.charts.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#16A34A" name="New Users" />
              <Bar dataKey="products" fill="#1c63d5ff" name="New Products" />
              <Bar dataKey="ratings" fill="#db941bff" name="New Ratings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* recent signups */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Recent Signups
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {dashboardData.users.recentSignups.length > 0 ? (
                dashboardData.users.recentSignups.slice(0, 10).map((user, index) => (
                  <div key={user.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.full_name || user.username || user.email?.split('@')[0]}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      {user.address && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.address.split(',')[0]}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent signups found</p>
                  <p className="text-sm mt-1">New users will appear here when they sign up</p>
                </div>
              )}
            </div>
          </div>

          {/* quick stats and system health */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ChartBar  className="w-5 h-5 text-green-800" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-semibold text-green-600">{dashboardData.users.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Products</span>
                  <span className="font-semibold text-blue-600">{dashboardData.products.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sold Out</span>
                  <span className="font-semibold text-red-600">{dashboardData.products.soldOut}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Ratings</span>
                  <span className="font-semibold text-yellow-600">{dashboardData.activity.ratings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Saved Contacts</span>
                  <span className="font-semibold text-purple-600">{dashboardData.activity.contacts}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                System Health
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">API Response</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Fast</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Real-time Updates</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Storage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}