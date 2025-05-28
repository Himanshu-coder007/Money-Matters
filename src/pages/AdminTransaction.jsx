import React, { useState, useEffect } from "react";
import { FiDownload, FiFilter, FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminTransactions = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ limit: 500, offset: 0, total: 0 });
  const [clientPagination, setClientPagination] = useState({ limit: 10, offset: 0 });
  const [totals, setTotals] = useState({ credit: 0, debit: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userProfiles, setUserProfiles] = useState({}); // Stores user profiles by ID

  const API_BASE_URL = `${import.meta.env.VITE_HASURA_API_URL}/all-transactions`;
  const PROFILE_API_URL = `${import.meta.env.VITE_HASURA_API_URL}/profile`;
  const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Fetch user profiles for all unique user IDs in transactions
  const fetchUserProfiles = async (userIds) => {
    try {
      const profiles = {};
      
      // Fetch profiles for each user in parallel
      await Promise.all(userIds.map(async (userId) => {
        const response = await fetch(PROFILE_API_URL, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            "x-hasura-admin-secret": ADMIN_SECRET,
            "x-hasura-role": "user",
            "x-hasura-user-id": userId.toString()
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.users && data.users.length > 0) {
            profiles[userId] = data.users[0].name || `User ${userId}`;
          } else {
            profiles[userId] = `User ${userId}`;
          }
        } else {
          profiles[userId] = `User ${userId}`;
        }
      }));

      setUserProfiles(profiles);
    } catch (err) {
      console.error("Error fetching user profiles:", err);
      // If there's an error, just use default user IDs as names
      const defaultProfiles = {};
      userIds.forEach(id => {
        defaultProfiles[id] = `User ${id}`;
      });
      setUserProfiles(defaultProfiles);
    }
  };

  // Extract unique categories and users for filter
  const categories = [...new Set(transactions.map(t => t.category))].filter(Boolean);
  const users = [...new Set(transactions.map(t => t.user_id))].sort((a, b) => a - b);

  const filteredTransactions = transactions
    .filter(transaction => {
      if (activeTab === "all") return true;
      return transaction.type === activeTab;
    })
    .filter(transaction => {
      if (!searchTerm) return true;
      const userName = userProfiles[transaction.user_id] || `User ${transaction.user_id}`;
      return (
        transaction.transaction_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.amount?.toString().includes(searchTerm) ||
        formatDate(transaction.date).toLowerCase().includes(searchTerm.toLowerCase()) ||
        userName.toLowerCase().includes(searchTerm.toLowerCase())
    )})
    .filter(transaction => {
      if (selectedCategories.length === 0) return true;
      return selectedCategories.includes(transaction.category);
    })
    .filter(transaction => {
      if (selectedUsers.length === 0) return true;
      return selectedUsers.includes(transaction.user_id);
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  // Get current transactions for the current page
  const currentTransactions = filteredTransactions.slice(
    clientPagination.offset,
    clientPagination.offset + clientPagination.limit
  );

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? (
      <FiChevronUp className="ml-1" />
    ) : (
      <FiChevronDown className="ml-1" />
    );
  };

  const handlePagination = (direction) => {
    if (direction === "next") {
      setClientPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    } else {
      setClientPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }));
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}?limit=${pagination.limit}&offset=${pagination.offset}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
          "x-hasura-role": "admin",
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.transactions) {
        throw new Error("No transactions data found in response");
      }

      setTransactions(data.transactions);
      setPagination(prev => ({ 
        ...prev, 
        total: data.total || data.transactions.length 
      }));
      calculateTotals(data.transactions);
      
      // Extract unique user IDs and fetch their profiles
      const userIds = [...new Set(data.transactions.map(t => t.user_id))];
      fetchUserProfiles(userIds);
    } catch (err) {
      setError(err.message);
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = (transactions) => {
    const creditTotal = transactions
      .filter(t => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const debitTotal = transactions
      .filter(t => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);
      
    setTotals({ credit: creditTotal, debit: debitTotal });
  };

  const toggleCategoryFilter = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const toggleUserFilter = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(u => u !== userId) 
        : [...prev, userId]
    );
  };

  // Function to export data to CSV
  const exportToCSV = () => {
    // Prepare CSV content
    const headers = ["User", "Name", "Category", "Type", "Amount", "Date"];
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    filteredTransactions.forEach(transaction => {
      const userName = userProfiles[transaction.user_id] || `User ${transaction.user_id}`;
      const row = [
        `"${userName.replace(/"/g, '""')}"`,
        `"${transaction.transaction_name?.replace(/"/g, '""') || ''}"`,
        `"${transaction.category?.replace(/"/g, '""') || ''}"`,
        `"${transaction.type || ''}"`,
        transaction.amount,
        `"${formatDate(transaction.date)}"`
      ];
      csvRows.push(row.join(','));
    });
    
    // Create CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `admin_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchTransactions();
  }, [pagination.offset, pagination.limit]);

  // Reset client pagination when filters change
  useEffect(() => {
    setClientPagination({ limit: 10, offset: 0 });
  }, [activeTab, searchTerm, selectedCategories, selectedUsers, sortConfig]);

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Transactions</h1>
          <p className="text-gray-500">View all user transactions</p>
        </div>
      </div>

      {/* Summary Cards with animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-500">Total Credit</h3>
              <p className="text-2xl font-bold text-green-600">
                ${totals.credit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-500">Total Debit</h3>
              <p className="text-2xl font-bold text-red-600">
                ${totals.debit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-500">Net Balance</h3>
              <p className="text-2xl font-bold text-gray-800">
                ${(totals.credit - totals.debit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction Table Section */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Header with Tabs and Search */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("all")}
            >
              All Transactions
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "debit" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("debit")}
            >
              Debit
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "credit" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("credit")}
            >
              Credit
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <FiFilter className="mr-2 text-gray-500" />
                <span className="text-sm">Filter</span>
              </button>
              
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                  >
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {categories.map(category => (
                            <div key={category} className="flex items-center">
                              <input
                                id={`filter-cat-${category}`}
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={() => toggleCategoryFilter(category)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`filter-cat-${category}`} className="ml-2 text-sm text-gray-700">
                                {category}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToCSV}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-all"
              disabled={filteredTransactions.length === 0}
            >
              <FiDownload className="mr-2 text-gray-500" />
              <span className="text-sm">Export CSV</span>
            </motion.button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => requestSort("user_id")}
                >
                  <div className="flex items-center">
                    User
                    {getSortIcon("user_id")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => requestSort("transaction_name")}
                >
                  <div className="flex items-center">
                    Transaction Name
                    {getSortIcon("transaction_name")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => requestSort("category")}
                >
                  <div className="flex items-center">
                    Category
                    {getSortIcon("category")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => requestSort("type")}
                >
                  <div className="flex items-center">
                    Type
                    {getSortIcon("type")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => requestSort("date")}
                >
                  <div className="flex items-center">
                    Date
                    {getSortIcon("date")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => requestSort("amount")}
                >
                  <div className="flex items-center">
                    Amount
                    {getSortIcon("amount")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-red-500">
                    Error loading transactions: {error}
                  </td>
                </tr>
              ) : currentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg">No transactions found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {currentTransactions.map((transaction) => (
                    <motion.tr 
                      key={`${transaction.id}-${transaction.user_id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                            {userProfiles[transaction.user_id]?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {userProfiles[transaction.user_id] || `User ${transaction.user_id}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${transaction.type === "credit" ? "bg-green-500" : "bg-red-500"}`}></div>
                          <div className="ml-1">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.transaction_name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.category ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                            {transaction.category}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transaction.type === "credit" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {transaction.type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {transaction.date ? formatDate(transaction.date) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            transaction.type === "credit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}${Math.abs(transaction.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between items-center">
            <button
              onClick={() => handlePagination("prev")}
              disabled={clientPagination.offset === 0}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md transition-all ${
                clientPagination.offset === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm"
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{clientPagination.offset + 1}</span> to{" "}
              <span className="font-medium">{Math.min(clientPagination.offset + clientPagination.limit, filteredTransactions.length)}</span> of{" "}
              <span className="font-medium">{filteredTransactions.length}</span> results
            </span>
            <button
              onClick={() => handlePagination("next")}
              disabled={clientPagination.offset + clientPagination.limit >= filteredTransactions.length}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md transition-all ${
                clientPagination.offset + clientPagination.limit >= filteredTransactions.length ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;