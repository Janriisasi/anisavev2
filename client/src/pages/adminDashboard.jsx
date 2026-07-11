import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Package,
  UserPlus,
  Activity,
  RotateCw,
  TrendingUp,
  Star,
  MapPin,
  AlertTriangle,
  LogOut,
  AlertCircle,
  Database,
  ChartBar,
  Tag,
  HardDrive,
  ImageIcon,
  MessageSquare,
} from "lucide-react";
import supabase from "../lib/supabase";
import PriceManagement from "../components/admin/priceManagement";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  const [systemHealth, setSystemHealth] = useState({
    database: { status: "checking", latency: null },
    realtime: { status: "checking" },
    storage: { status: "checking" },
  });
  const [bucketSizes, setBucketSizes] = useState({
    loading: true,
    error: null,
    buckets: [],
  });
  const [dashboardData, setDashboardData] = useState({
    users: {
      total: 0,
      active: 0,
      newToday: 0,
      recentSignups: [],
    },
    products: {
      total: 0,
      available: 0,
      soldOut: 0,
      categories: [],
    },
    activity: {
      ratings: 0,
      contacts: 0,
      avgRating: 0,
    },
    charts: {
      userGrowth: [],
      productsByCategory: [],
      dailyActivity: [],
    },
    debug: {
      authUsers: 0,
      profilesUsers: 0,
      tablesFound: [],
    },
  });

  useEffect(() => {
    checkAdminAuth();
  }, []);

  //set up real-time subscription for profile changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Setting up real-time subscriptions...");

      const profileSubscription = supabase
        .channel("profiles_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
          },
          (payload) => {
            console.log("Profile change detected:", payload);
            //refresh data when profiles change
            fetchDashboardData();
          },
        )
        .subscribe();

      const productSubscription = supabase
        .channel("products_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "products",
          },
          (payload) => {
            console.log("Product change detected:", payload);
            fetchDashboardData();
          },
        )
        .subscribe();

      return () => {
        console.log("Cleaning up subscriptions...");
        profileSubscription.unsubscribe();
        productSubscription.unsubscribe();
      };
    }
  }, [isAuthenticated]);

  // AdminGate (Routes.jsx) already verified this session against the
  // server-side is_admin() RPC before this component was ever mounted.
  // This second check is defense-in-depth only — it re-confirms with the
  // database rather than trusting any client-held flag, and protects
  // against someone bookmarking the dashboard URL after their admin
  // access is later revoked (admin_roles row deleted) but their browser
  // session is still alive.
  const checkAdminAuth = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user || userError) {
        setIsAuthenticated(false);
        setError("You must be logged in to access the admin dashboard.");
        return;
      }

      const { data: isAdmin, error: rpcError } = await supabase.rpc(
        "is_admin",
      );

      setDebugInfo({
        currentUser: user.email,
        isAdmin: !!isAdmin,
        rpcError: rpcError?.message || null,
      });

      if (rpcError || !isAdmin) {
        setIsAuthenticated(false);
        setError("Access denied.");
        return;
      }

      setIsAuthenticated(true);
      await Promise.all([
        fetchDashboardData(),
        checkSystemHealth(),
        fetchBucketSizes(),
      ]);
    } catch (error) {
      console.error("Auth error:", error);
      setError("Authentication error: " + error.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      console.log("Fetching dashboard data...");

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      //get all the users from profiles table
      console.log("Fetching profiles...");
      const {
        data: allUsers,
        error: usersError,
        count: profilesCount,
      } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      console.log("Profiles query result:", {
        data: allUsers?.length || 0,
        error: usersError?.message || "None",
        count: profilesCount,
      });

      if (usersError) {
        console.error("Users fetch error:", usersError);
      }

      let authUsers = [];
      if (!allUsers || allUsers.length === 0) {
        console.log("Trying to fetch from auth.users...");
        try {
          const { data: authData, error: authError } =
            await supabase.auth.admin.listUsers();
          if (!authError) {
            authUsers = authData.users || [];
            console.log("Found users in auth.users:", authUsers.length);
          }
        } catch (authErr) {
          console.log("Cannot access auth.users (normal if not service key)");
        }
      }

      //get recent users in last 7 days
      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("*")
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      console.log("Recent users:", recentUsers?.length || 0);

      //get all products
      console.log("Fetching products...");
      const { data: allProducts, error: productsError } = await supabase
        .from("products")
        .select("*");

      console.log(
        "Products:",
        allProducts?.length || 0,
        "Error:",
        productsError?.message || "None",
      );

      if (productsError) {
        console.error("Products fetch error:", productsError);
      }

      //get available products
      const { data: availableProducts } = await supabase
        .from("products")
        .select("*")
        .eq("status", "Available");

      //get ratings
      console.log("Fetching ratings...");
      const { data: ratings, error: ratingsError } = await supabase
        .from("ratings")
        .select("*");

      console.log(
        "Ratings:",
        ratings?.length || 0,
        "Error:",
        ratingsError?.message || "None",
      );

      if (ratingsError) {
        console.error("Ratings fetch error:", ratingsError);
      }

      //get saved contacts
      console.log("Fetching contacts...");
      const { data: contacts, error: contactsError } = await supabase
        .from("saved_contacts")
        .select("*");

      console.log(
        "Contacts:",
        contacts?.length || 0,
        "Error:",
        contactsError?.message || "None",
      );

      if (contactsError) {
        console.error("Contacts fetch error:", contactsError);
      }

      const usersData = allUsers && allUsers.length > 0 ? allUsers : authUsers;

      //process data for the charts
      const userGrowthData = processUserGrowthData(usersData || []);
      const categoryData = processCategoryData(allProducts || []);
      const activityData = processActivityData(
        usersData || [],
        allProducts || [],
        ratings || [],
      );

      //calculates the metrics
      const todayUsers = (usersData || []).filter((u) => {
        const createdAt = u.created_at || u.created_at;
        return new Date(createdAt) >= yesterday;
      }).length;

      const activeUsers = (usersData || []).filter((u) => {
        const lastActive = new Date(
          u.updated_at || u.last_sign_in_at || u.created_at,
        );
        const dayAgo = new Date();
        dayAgo.setHours(dayAgo.getHours() - 24);
        return lastActive >= dayAgo;
      }).length;

      const avgRating =
        (ratings || []).length > 0
          ? (
              (ratings || []).reduce((acc, r) => acc + r.rating, 0) /
              (ratings || []).length
            ).toFixed(1)
          : 0;

      console.log("Dashboard data processed successfully");
      console.log("Metrics:", {
        totalUsers: (usersData || []).length,
        todayUsers,
        activeUsers,
        totalProducts: (allProducts || []).length,
        availableProducts: (availableProducts || []).length,
      });

      setDashboardData({
        users: {
          total: (usersData || []).length,
          active: activeUsers,
          newToday: todayUsers,
          recentSignups: recentUsers || usersData?.slice(0, 10) || [],
        },
        products: {
          total: (allProducts || []).length,
          available: (availableProducts || []).length,
          soldOut:
            (allProducts || []).length - (availableProducts || []).length,
          categories: categoryData,
        },
        activity: {
          ratings: (ratings || []).length,
          contacts: (contacts || []).length,
          avgRating: avgRating,
        },
        charts: {
          userGrowth: userGrowthData,
          productsByCategory: categoryData,
          dailyActivity: activityData,
        },
        debug: {
          authUsers: authUsers.length,
          profilesUsers: (allUsers || []).length,
        },
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Error loading dashboard data: " + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const processUserGrowthData = (users) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split("T")[0],
        users: 0,
        cumulative: 0,
      };
    });

    users.forEach((user) => {
      const userDate = new Date(user.created_at).toISOString().split("T")[0];
      const dayIndex = last30Days.findIndex((day) => day.date === userDate);
      if (dayIndex !== -1) {
        last30Days[dayIndex].users++;
      }
    });

    //calculate the cumulative
    let cumulative = 0;
    return last30Days.map((day) => {
      cumulative += day.users;
      return { ...day, cumulative };
    });
  };

  const processCategoryData = (products) => {
    const categories = {};
    products.forEach((product) => {
      const categoryName =
        product.category === "HerbsAndSpices"
          ? "Herbs & Spices"
          : product.category;
      categories[categoryName] = (categories[categoryName] || 0) + 1;
    });

    const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];
    return Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  };

  const processActivityData = (users, products, ratings) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: date.toLocaleDateString("en", { weekday: "short" }),
        users: 0,
        products: 0,
        ratings: 0,
      };
    });

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(today);
      dayStart.setDate(today.getDate() - (6 - i));
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      last7Days[i].users = users.filter((u) => {
        const createdAt = new Date(u.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;

      last7Days[i].products = products.filter((p) => {
        const createdAt = new Date(p.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;

      last7Days[i].ratings = ratings.filter((r) => {
        const createdAt = new Date(r.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;
    }

    return last7Days;
  };

  const handleLogout = () => {
    // This exits the admin view only — it does NOT sign you out of your
    // Supabase account. You're still logged in as yourself, just no
    // longer viewing /admin. Ending the whole site session isn't needed
    // here: the honeypot key isn't stored anywhere, so getting back into
    // /admin later still requires re-entering the ?k= URL, and is_admin()
    // still governs access either way.
    navigate("/homepage");
  };

  const handleRefresh = async () => {
    await Promise.all([fetchDashboardData(), checkSystemHealth(), fetchBucketSizes()]);
  };

  const fetchBucketSizes = async () => {
    setBucketSizes((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.rpc("get_bucket_sizes");
      if (error) throw error;

      const BUCKET_META = {
        "product-images": { label: "Product Images", icon: "package" },
        avatars:          { label: "Avatars",         icon: "users"   },
        "chat-images":    { label: "Chat Images",     icon: "message" },
      };

      const ALL_BUCKETS = ["product-images", "avatars", "chat-images"];
      const buckets = ALL_BUCKETS.map((id) => {
        const row = (data || []).find((r) => r.bucket_id === id);
        return {
          id,
          label: BUCKET_META[id]?.label ?? id,
          icon:  BUCKET_META[id]?.icon  ?? "package",
          size:  row ? Number(row.total_size) : 0,
          count: row ? Number(row.file_count) : 0,
        };
      });

      setBucketSizes({ loading: false, error: null, buckets });
    } catch (err) {
      setBucketSizes({ loading: false, error: err.message, buckets: [] });
    }
  };

  const checkSystemHealth = async () => {
    // --- Database check: timed query to profiles ---
    const dbStart = performance.now();
    try {
      const { error: dbError } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      const latency = Math.round(performance.now() - dbStart);
      setSystemHealth((prev) => ({
        ...prev,
        database: {
          status: dbError ? "error" : latency < 500 ? "healthy" : "slow",
          latency,
        },
      }));
    } catch {
      setSystemHealth((prev) => ({
        ...prev,
        database: { status: "error", latency: null },
      }));
    }

    // --- Realtime check: inspect channel subscription state ---
    try {
      const channels = supabase.getChannels();
      const hasActiveChannel = channels.some(
        (ch) => ch.state === "joined" || ch.state === "joining"
      );
      setSystemHealth((prev) => ({
        ...prev,
        realtime: { status: hasActiveChannel ? "active" : "inactive" },
      }));
    } catch {
      setSystemHealth((prev) => ({
        ...prev,
        realtime: { status: "error" },
      }));
    }

    // --- Storage check: list root of product-images bucket ---
    try {
      const { error: storageError } = await supabase.storage
        .from("product-images")
        .list("", { limit: 1 });
      setSystemHealth((prev) => ({
        ...prev,
        storage: { status: storageError ? "error" : "available" },
      }));
    } catch {
      setSystemHealth((prev) => ({
        ...prev,
        storage: { status: "error" },
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-sm md:text-base text-gray-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // No login form here on purpose. Anyone who reaches this component at all
    // already passed AdminGate's checks once — if we land here it's a revoked
    // admin_roles row or an expired session. Either way, showing a form or an
    // "access denied" message only confirms an admin panel exists at this URL.
    // Bounce silently to a route that looks like any other 404.
    return <Navigate to="/404" replace />;
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const BUCKET_COLORS = {
    "product-images": { bar: "bg-blue-500",   text: "text-blue-600"  },
    avatars:          { bar: "bg-green-500",  text: "text-green-600" },
    "chat-images":    { bar: "bg-purple-500", text: "text-purple-600"},
  };

  const StatCard = ({ title, value, icon: Icon, change, color = "green" }) => (
    <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm text-gray-600 font-medium">
            {title}
          </p>
          <p className="text-lg md:text-2xl font-bold text-gray-800 mt-0.5 md:mt-1">
            {value}
          </p>
          {change !== undefined && (
            <div
              className={`flex items-center mt-1 md:mt-2 text-xs md:text-sm ${change >= 0 ? "text-green-800" : "text-red-600"}`}
            >
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
              <span>
                {change >= 0 ? "+" : ""}
                {change}%
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-8 h-8 md:w-12 md:h-12 bg-${color}-100 rounded-lg md:rounded-xl flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 md:w-6 md:h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* header and nav */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                Admin Dashboard
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                Platform Overview & Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "overview"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-600 hover:text-green-700 hover:bg-gray-200/50"
                }`}
              >
                <RotateCw className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </button>
              <button
                onClick={() => setActiveTab("prices")}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "prices"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-600 hover:text-green-700 hover:bg-gray-200/50"
                }`}
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Prices</span>
              </button>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors flex-shrink-0"
              title="Refresh Data"
            >
              <RotateCw
                className={`w-5 h-5 ${refreshing ? "animate-spin text-green-600" : ""}`}
              />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            {/* debug info */}
            <div className="mb-4 md:mb-6 bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <h3 className="text-xs md:text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1 md:gap-2">
                <Database className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                Debug Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Profiles Table:</span>
                  <span className="ml-1 md:ml-2 font-medium">
                    {dashboardData.debug.profilesUsers} users
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Auth Users:</span>
                  <span className="ml-1 md:ml-2 font-medium">
                    {dashboardData.debug.authUsers} users
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Real-time:</span>
                  <span className="ml-1 md:ml-2 font-medium text-green-600">
                    Active
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Last Refresh:</span>
                  <span className="ml-1 md:ml-2 font-medium">
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* key metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
          {/* user growth chart */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-1 md:gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-800" />
              User Growth (30 Days)
            </h3>
            <ResponsiveContainer
              width="100%"
              height={200}
              className="md:hidden"
            >
              <AreaChart data={dashboardData.charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).getDate()}
                  stroke="#666"
                  tick={{ fontSize: 10 }}
                />
                <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value, name) => [
                    value,
                    name === "users" ? "New" : "Total",
                  ]}
                  contentStyle={{ fontSize: "12px" }}
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
            <ResponsiveContainer
              width="100%"
              height={300}
              className="hidden md:block"
            >
              <AreaChart data={dashboardData.charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  stroke="#666"
                />
                <YAxis stroke="#666" />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value, name) => [
                    value,
                    name === "users" ? "New Users" : "Total Users",
                  ]}
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
          <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-1 md:gap-2">
              <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              Products by Category
            </h3>
            <ResponsiveContainer
              width="100%"
              height={200}
              className="md:hidden"
            >
              <PieChart>
                <Pie
                  data={dashboardData.charts.productsByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelStyle={{ fontSize: "10px" }}
                >
                  {dashboardData.charts.productsByCategory.map(
                    (entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ),
                  )}
                </Pie>
                <Tooltip contentStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer
              width="100%"
              height={300}
              className="hidden md:block"
            >
              <PieChart>
                <Pie
                  data={dashboardData.charts.productsByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {dashboardData.charts.productsByCategory.map(
                    (entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ),
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* activity overview */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6 mb-4 md:mb-8">
          <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-1 md:gap-2">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            Weekly Activity Overview
          </h3>
          <ResponsiveContainer width="100%" height={200} className="md:hidden">
            <BarChart data={dashboardData.charts.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#666" tick={{ fontSize: 10 }} />
              <YAxis stroke="#666" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: "12px" }} />
              <Bar dataKey="users" fill="#16A34A" name="Users" />
              <Bar dataKey="products" fill="#1c63d5ff" name="Products" />
              <Bar dataKey="ratings" fill="#db941bff" name="Ratings" />
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer
            width="100%"
            height={300}
            className="hidden md:block"
          >
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* recent signups */}
          <div className="lg:col-span-2 bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-1 md:gap-2">
              <UserPlus className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              Recent Signups
            </h3>
            <div className="space-y-3 md:space-y-4 max-h-64 md:max-h-96 overflow-y-auto">
              {dashboardData.users.recentSignups.length > 0 ? (
                dashboardData.users.recentSignups
                  .slice(0, 10)
                  .map((user, index) => (
                    <div
                      key={user.id || index}
                      className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-xs md:text-base text-gray-800">
                            {user.full_name ||
                              user.username ||
                              user.email?.split("@")[0]}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs md:text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        {user.address && (
                          <p className="text-xs text-gray-400 flex items-center gap-0.5 md:gap-1">
                            <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            {user.address.split(",")[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 md:py-8 text-gray-500">
                  <Users className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                  <p className="text-sm md:text-base">
                    No recent signups found
                  </p>
                  <p className="text-xs md:text-sm mt-1">
                    New users will appear here when they sign up
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* quick stats and system health */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6">
              <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-1 md:gap-2">
                <ChartBar className="w-4 h-4 md:w-5 md:h-5 text-green-800" />
                Quick Stats
              </h3>
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-base text-gray-600">
                    Active Users
                  </span>
                  <span className="font-semibold text-xs md:text-base text-green-600">
                    {dashboardData.users.active}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-base text-gray-600">
                    Total Products
                  </span>
                  <span className="font-semibold text-xs md:text-base text-blue-600">
                    {dashboardData.products.total}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-base text-gray-600">
                    Sold Out
                  </span>
                  <span className="font-semibold text-xs md:text-base text-red-600">
                    {dashboardData.products.soldOut}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-base text-gray-600">
                    Total Ratings
                  </span>
                  <span className="font-semibold text-xs md:text-base text-yellow-600">
                    {dashboardData.activity.ratings}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-base text-gray-600">
                    Saved Contacts
                  </span>
                  <span className="font-semibold text-xs md:text-base text-purple-600">
                    {dashboardData.activity.contacts}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6">
              <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-1 md:gap-2">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                System Health
              </h3>
              <div className="space-y-2.5 md:space-y-3">
                {/* Database */}
                {(() => {
                  const { status, latency } = systemHealth.database;
                  const isChecking = status === "checking";
                  const isHealthy = status === "healthy";
                  const isSlow = status === "slow";
                  const dotColor = isChecking
                    ? "bg-gray-400 animate-pulse"
                    : isHealthy
                    ? "bg-green-500"
                    : isSlow
                    ? "bg-yellow-500"
                    : "bg-red-500";
                  const textColor = isChecking
                    ? "text-gray-400"
                    : isHealthy
                    ? "text-green-600"
                    : isSlow
                    ? "text-yellow-600"
                    : "text-red-600";
                  const label = isChecking
                    ? "Checking..."
                    : isHealthy
                    ? `Healthy${latency != null ? ` · ${latency}ms` : ""}`
                    : isSlow
                    ? `Slow · ${latency}ms`
                    : "Unreachable";
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-base text-gray-600">Database</span>
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${dotColor}`} />
                        <span className={`text-xs md:text-sm ${textColor}`}>{label}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Real-time */}
                {(() => {
                  const { status } = systemHealth.realtime;
                  const isChecking = status === "checking";
                  const isActive = status === "active";
                  const dotColor = isChecking
                    ? "bg-gray-400 animate-pulse"
                    : isActive
                    ? "bg-green-500"
                    : status === "inactive"
                    ? "bg-yellow-500"
                    : "bg-red-500";
                  const textColor = isChecking
                    ? "text-gray-400"
                    : isActive
                    ? "text-green-600"
                    : status === "inactive"
                    ? "text-yellow-600"
                    : "text-red-600";
                  const label = isChecking
                    ? "Checking..."
                    : isActive
                    ? "Active"
                    : status === "inactive"
                    ? "No Channels"
                    : "Error";
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-base text-gray-600">Real-time Updates</span>
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${dotColor}`} />
                        <span className={`text-xs md:text-sm ${textColor}`}>{label}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Storage */}
                {(() => {
                  const { status } = systemHealth.storage;
                  const isChecking = status === "checking";
                  const isOk = status === "available";
                  const totalMB = bucketSizes.buckets.reduce((acc, b) => acc + b.size, 0);
                  const dotColor = isChecking
                    ? "bg-gray-400 animate-pulse"
                    : isOk
                    ? "bg-green-500"
                    : "bg-red-500";
                  const textColor = isChecking
                    ? "text-gray-400"
                    : isOk
                    ? "text-green-600"
                    : "text-red-600";
                  const label = isChecking
                    ? "Checking..."
                    : isOk
                    ? `Available · ${formatBytes(totalMB)}`
                    : "Unreachable";
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-base text-gray-600">Storage</span>
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${dotColor}`} />
                        <span className={`text-xs md:text-sm ${textColor}`}>{label}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
        {/* Storage panel */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6 mt-4 md:mt-8">
          <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-3 md:mb-5 flex items-center gap-1 md:gap-2">
            <HardDrive className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            Storage Usage
          </h3>

          {bucketSizes.loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <RotateCw className="w-4 h-4 animate-spin" />
              Loading bucket data...
            </div>
          ) : bucketSizes.error ? (
            <div className="flex items-center gap-2 text-sm text-red-500 py-4">
              <AlertCircle className="w-4 h-4" />
              Failed to load: {bucketSizes.error}
            </div>
          ) : (() => {
            const totalBytes = bucketSizes.buckets.reduce((acc, b) => acc + b.size, 0);
            return (
              <div className="space-y-4 md:space-y-5">
                {/* total summary row */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs md:text-sm text-gray-500 font-medium">Total used</span>
                  <span className="text-sm md:text-base font-bold text-gray-800">
                    {formatBytes(totalBytes)}
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      across {bucketSizes.buckets.reduce((acc, b) => acc + b.count, 0)} files
                    </span>
                  </span>
                </div>

                {/* per-bucket rows */}
                {bucketSizes.buckets.map((bucket) => {
                  const pct = totalBytes > 0 ? (bucket.size / totalBytes) * 100 : 0;
                  const colors = BUCKET_COLORS[bucket.id] ?? { bar: "bg-gray-400", text: "text-gray-600" };
                  const BucketIcon =
                    bucket.icon === "users"   ? Users         :
                    bucket.icon === "message" ? MessageSquare :
                    ImageIcon;
                  return (
                    <div key={bucket.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <BucketIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${colors.text}`} />
                          <span className="text-xs md:text-sm font-medium text-gray-700">
                            {bucket.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({bucket.count} {bucket.count === 1 ? "file" : "files"})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs md:text-sm font-semibold ${colors.text}`}>
                            {formatBytes(bucket.size)}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">
                            ({pct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      {/* progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-1.5 md:h-2">
                        <div
                          className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${colors.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
        </>
        )}

        {activeTab === "prices" && (
          <PriceManagement />
        )}

      </div>
    </div>
  );
}