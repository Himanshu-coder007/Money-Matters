import React, { useState, useEffect } from "react";
import { FiArrowUp, FiArrowDown, FiPlus, FiRefreshCw } from "react-icons/fi";
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
} from "recharts";
import AddTransactionModal from "../components/AddTransactionModal";
import { format, parseISO } from "date-fns";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [creditTotal, setCreditTotal] = useState(0);
  const [debitTotal, setDebitTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const COLORS = ["#4FD1C5", "#F6AD55", "#FC8181", "#90CDF4"];
  const API_URL = import.meta.env.VITE_HASURA_API_URL;
  const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;
  const userId = localStorage.getItem("userId") || 1;

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setRefreshing(true);
      // Fetch credit and debit totals
      const totalsResponse = await fetch(`${API_URL}/credit-debit-totals`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
          "x-hasura-role": "user",
          "x-hasura-user-id": userId.toString(),
        },
      });

      const totalsData = await totalsResponse.json();
      const creditData = totalsData.totals_credit_debit_transactions.find(
        (t) => t.type === "credit"
      );
      const debitData = totalsData.totals_credit_debit_transactions.find(
        (t) => t.type === "debit"
      );

      setCreditTotal(creditData?.sum || 0);
      setDebitTotal(debitData?.sum || 0);

      setPieData([
        { name: "Credit", value: creditData?.sum || 0 },
        { name: "Debit", value: debitData?.sum || 0 },
      ]);

      // Fetch last 7 days transactions
      const weekResponse = await fetch(`${API_URL}/daywise-totals-7-days`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
          "x-hasura-role": "user",
          "x-hasura-user-id": userId.toString(),
        },
      });

      const weekTransactionsData = await weekResponse.json();

      // Group by day and calculate totals
      const groupedByDay = {};
      weekTransactionsData.last_7_days_transactions_credit_debit_totals.forEach(
        (transaction) => {
          const date = new Date(transaction.date);
          const day = format(date, "EEE"); // Short day name (Mon, Tue, etc.)

          if (!groupedByDay[day]) {
            groupedByDay[day] = { credit: 0, debit: 0 };
          }

          if (transaction.type === "credit") {
            groupedByDay[day].credit += transaction.sum;
          } else {
            groupedByDay[day].debit += transaction.sum;
          }
        }
      );

      // Fill in missing days with zeros
      const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const completeBarData = daysOfWeek.map((day) => ({
        name: day,
        credit: groupedByDay[day]?.credit || 0,
        debit: groupedByDay[day]?.debit || 0,
      }));

      setBarData(completeBarData);

      // Fetch all transactions
      const transactionsResponse = await fetch(
        `${API_URL}/all-transactions?limit=100&offset=0`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": ADMIN_SECRET,
            "x-hasura-role": "user",
            "x-hasura-user-id": userId.toString(),
          },
        }
      );

      const transactionsData = await transactionsResponse.json();

      // Sort transactions by date and time in descending order (most recent first)
      const sortedTransactions = [
        ...(transactionsData.transactions || []),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(sortedTransactions);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL, ADMIN_SECRET, userId]);

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

        <div className="bg-white p-6 rounded-2xl shadow">
          <Skeleton height={400} />
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
          <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your financial overview
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
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
          <button
            className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Credit Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold">Total Credit</h2>
              <p className="text-green-100 text-opacity-80">
                All incoming funds
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
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <p className="text-sm text-green-100 text-opacity-80">
              Last updated: {format(new Date(), "MMM d, h:mm a")}
            </p>
          </div>
        </div>

        {/* Debit Card */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold">Total Debit</h2>
              <p className="text-red-100 text-opacity-80">All outgoing funds</p>
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
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <p className="text-sm text-red-100 text-opacity-80">
              Last updated: {format(new Date(), "MMM d, h:mm a")}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Weekly Transaction Overview
              </h2>
              <p className="text-gray-600">Debit vs Credit trends</p>
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
                    value === "credit" ? "Credit" : "Debit",
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
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

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

      {/* Transactions Table */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Transactions
            </h2>
            <p className="text-gray-600">Your latest financial activities</p>
          </div>
          <button
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            onClick={() => navigate("/transactions")}
          >
            View All Transactions
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date & Time
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                              transaction.type === "credit"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {transaction.type === "credit" ? (
                              <FiArrowUp className="h-5 w-5" />
                            ) : (
                              <FiArrowDown className="h-5 w-5" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.transaction_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.type === "credit"
                                ? "Incoming"
                                : "Outgoing"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {transaction.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(parseISO(transaction.date), "MMM d, yyyy")}
                          <div className="text-xs text-gray-400">
                            {format(parseISO(transaction.date), "h:mm a")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div
                          className={`text-sm font-medium ${
                            transaction.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}$
                          {transaction.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          No transactions
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by adding a new transaction.
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                            New Transaction
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={fetchData}
      />
    </div>
  );
};

export default Dashboard;
