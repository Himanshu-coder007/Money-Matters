import React, { useState, useEffect } from "react";
import { FiArrowUp, FiArrowDown, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiDollarSign } from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { format, subDays } from "date-fns";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AdminDashboard = () => {
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [creditTotal, setCreditTotal] = useState(0);
  const [debitTotal, setDebitTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const COLORS = ["#4FD1C5", "#F6AD55", "#FC8181", "#90CDF4", "#9F7AEA", "#68D391"];
  const API_URL = import.meta.env.VITE_HASURA_API_URL;
  const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

  // Mock data generator for demonstration
  const generateMockData = (days = 30) => {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const credit = Math.floor(Math.random() * 5000) + 1000;
      const debit = Math.floor(Math.random() * 3000) + 500;
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        day: format(date, 'EEE'),
        credit,
        debit,
        net: credit - debit,
      });
    }
    return data;
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch credit and debit totals for admin
      const totalsResponse = await fetch(`${API_URL}/transaction-totals-admin`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
          "x-hasura-role": "admin",
        },
      });

      const totalsData = await totalsResponse.json();
      const creditData = totalsData.transaction_totals_admin?.find(
        (t) => t.type === "credit"
      );
      const debitData = totalsData.transaction_totals_admin?.find(
        (t) => t.type === "debit"
      );

      const creditSum = creditData?.sum || 0;
      const debitSum = debitData?.sum || 0;

      setCreditTotal(creditSum);
      setDebitTotal(debitSum);

      setPieData([
        { name: "Credit", value: creditSum },
        { name: "Debit", value: debitSum },
      ]);

      // Fetch last 7 days transactions for admin
      const weekResponse = await fetch(`${API_URL}/daywise-totals-last-7-days-admin`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
          "x-hasura-role": "admin",
        },
      });

      const weekTransactionsData = await weekResponse.json();

      // Initialize empty object for grouped data
      const groupedByDay = {
        Mon: { credit: 0, debit: 0 },
        Tue: { credit: 0, debit: 0 },
        Wed: { credit: 0, debit: 0 },
        Thu: { credit: 0, debit: 0 },
        Fri: { credit: 0, debit: 0 },
        Sat: { credit: 0, debit: 0 },
        Sun: { credit: 0, debit: 0 },
      };

      // Process transactions if they exist
      const transactions = weekTransactionsData.last_7_days_transactions_totals_admin || [];
      transactions.forEach((transaction) => {
        const date = new Date(transaction.date);
        const day = format(date, "EEE"); // Short day name (Mon, Tue, etc.)

        if (transaction.type === "credit") {
          groupedByDay[day].credit += transaction.sum || 0;
        } else {
          groupedByDay[day].debit += transaction.sum || 0;
        }
      });

      // Convert to array format for the chart
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const completeBarData = daysOfWeek.map((day) => ({
        name: day,
        credit: groupedByDay[day]?.credit || 0,
        debit: groupedByDay[day]?.debit || 0,
      }));

      setBarData(completeBarData);

      // Generate mock data for line chart (replace with actual API call)
      const mockLineData = generateMockData(30);
      setLineData(mockLineData);

      // Generate stats data
      const netProfit = creditSum - debitSum;
      const profitPercentage = creditSum > 0 ? ((netProfit / creditSum) * 100).toFixed(2) : 0;
      
      setStatsData([
        {
          title: "Total Transactions",
          value: (creditSum + debitTotal).toLocaleString(),
          isPositive: true,
          icon: <FiDollarSign className="text-blue-500" />,
        },
        {
          title: "Profit Margin",
          value: `${profitPercentage}%`,
          
          isPositive: profitPercentage >= 0,
          icon: netProfit >= 0 ? <FiTrendingUp className="text-green-500" /> : <FiTrendingDown className="text-red-500" />,
        },
        {
          title: "Avg. Daily Credit",
          value: `$${(creditSum / 30).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        
          isPositive: true,
          icon: <FiArrowUp className="text-teal-500" />,
        },
        {
          title: "Avg. Daily Debit",
          value: `$${(debitSum / 30).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
       
          isPositive: false,
          icon: <FiArrowDown className="text-orange-500" />,
        },
      ]);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [API_URL, ADMIN_SECRET]);

  // Set up polling for auto-refresh
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(pollingInterval);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <div className="ml-0 md:ml-64 p-6">
        <div className="flex justify-between items-center mb-8">
          <Skeleton width={200} height={40} />
          <Skeleton width={180} height={48} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((item) => (
            <div key={item} className="bg-white p-6 rounded-2xl shadow-lg">
              <Skeleton count={3} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow lg:col-span-2 h-96">
            <Skeleton height={300} />
          </div>
          <div className="bg-white p-6 rounded-2xl shadow h-96">
            <Skeleton height={300} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-0 md:ml-64 p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
                <button
                  onClick={fetchData}
                  className="ml-2 text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline transition ease-in-out duration-150"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-0 md:ml-64 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of all transactions across the platform
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <span className="text-sm text-gray-500">
            Last updated: {format(lastUpdated, "MMM d, h:mm a")}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 cursor-pointer ${
              refreshing
                ? "bg-gray-200 text-gray-500"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiRefreshCw
              className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-800 mt-1">
                  {stat.value}
                </p>
                <div className="flex items-center mt-2">
                 
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Credit Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold">Total Credit</h2>
              <p className="text-green-100 text-opacity-80">
                All incoming funds across all users
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white bg-opacity-20">
              <FiArrowUp className="text-xl" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold">
              $
              {creditTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="w-16 h-16 flex items-center justify-center bg-white bg-opacity-20 rounded-full">
              <img
                src="/credit.png"
                alt="Credit Card"
                className="h-10 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Debit Card */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold">Total Debit</h2>
              <p className="text-red-100 text-opacity-80">
                All outgoing funds across all users
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white bg-opacity-20">
              <FiArrowDown className="text-xl" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold">
              $
              {debitTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="w-16 h-16 flex items-center justify-center bg-white bg-opacity-20 rounded-full">
              <img
                src="/debit.png"
                alt="Debit Card"
                className="h-10 object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Transaction Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Weekly Transaction Overview
              </h2>
              <p className="text-gray-600">Debit vs Credit trends across all users</p>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-teal-400 mr-2"></div>
                <span className="text-sm text-gray-600">Credit</span>
              </div>
              <div className="flex items-center ml-3">
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                <span className="text-sm text-gray-600">Debit</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280" }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    border: "none",
                  }}
                  formatter={(value) => [
                    `$${value.toLocaleString()}`,
                  ]}
                  labelStyle={{ fontWeight: "bold", color: "#374151" }}
                />
                <Bar
                  dataKey="credit"
                  fill="#4FD1C5"
                  radius={[4, 4, 0, 0]}
                  name="Credit"
                />
                <Bar
                  dataKey="debit"
                  fill="#F6AD55"
                  radius={[4, 4, 0, 0]}
                  name="Debit"
                />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Balance Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Balance Distribution
          </h2>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `$${value.toLocaleString()}`,
                    pieData.find((d) => d.value === value)?.name,
                  ]}
                />
                <Legend
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {pieData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold">
                  $
                  {item.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Net Balance</span>
                <span
                  className={`font-bold text-lg ${
                    creditTotal - debitTotal >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  $
                  {Math.abs(creditTotal - debitTotal).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {creditTotal - debitTotal >= 0 ? " (Profit)" : " (Loss)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                30-Day Transaction Trend
              </h2>
              <p className="text-gray-600">Daily net balance over the last month</p>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
              <span className="text-sm text-gray-600">Net Balance</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280" }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    border: "none",
                  }}
                  formatter={(value) => [
                    `$${value.toLocaleString()}`,
                    "Net Balance",
                  ]}
                  labelStyle={{ fontWeight: "bold", color: "#374151" }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#667EEA"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6, stroke: "#667EEA", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credit vs Debit Area Chart */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Credit vs Debit Trend
              </h2>
              <p className="text-gray-600">Daily comparison over the last month</p>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-teal-400 mr-2"></div>
                <span className="text-sm text-gray-600">Credit</span>
              </div>
              <div className="flex items-center ml-3">
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                <span className="text-sm text-gray-600">Debit</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280" }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    border: "none",
                  }}
                  formatter={(value) => [
                    `$${value.toLocaleString()}`,
                  ]}
                  labelStyle={{ fontWeight: "bold", color: "#374151" }}
                />
                <Area
                  type="monotone"
                  dataKey="credit"
                  stroke="#4FD1C5"
                  fill="#4FD1C5"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="debit"
                  stroke="#F6AD55"
                  fill="#F6AD55"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;