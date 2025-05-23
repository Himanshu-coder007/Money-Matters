import React, { useState, useEffect } from "react";
import { FiDownload, FiFilter, FiSearch, FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiEdit } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import AddTransactionModal from "../components/AddTransactionModal";
import EditTransactionModal from "../components/EditTransactionModal";
import { LOCAL_STORAGE_KEYS } from "../utils/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Transactions = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ limit: 100, offset: 0, total: 0 });
  const [clientPagination, setClientPagination] = useState({ limit: 10, offset: 0 });
  const [totals, setTotals] = useState({ credit: 0, debit: 0 });
  const [last7DaysTotals, setLast7DaysTotals] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID) || 1;
  const API_BASE_URL = import.meta.env.VITE_HASURA_API_URL;
  const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Extract unique categories for filter
  const categories = [...new Set(transactions.map(t => t.category))];

  const filteredTransactions = transactions
    .filter(transaction => {
      if (activeTab === "all") return true;
      return transaction.type === activeTab;
    })
    .filter(transaction => {
      if (!searchTerm) return true;
      return (
        transaction.transaction_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.amount.toString().includes(searchTerm) ||
        formatDate(transaction.date).toLowerCase().includes(searchTerm.toLowerCase()
      ));
    })
    .filter(transaction => {
      if (selectedCategories.length === 0) return true;
      return selectedCategories.includes(transaction.category);
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
      const url = `${API_BASE_URL}/all-transactions?limit=${pagination.limit}&offset=${pagination.offset}`;
      console.log("API Request URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
          "x-hasura-role": "user",
          "x-hasura-user-id": userId.toString(),
        },
      });

      const responseText = await response.text();
      console.log("API Response:", responseText);

      try {
        const data = JSON.parse(responseText);
        
        if (!response.ok) {
          throw new Error(data.message || `API request failed with status ${response.status}`);
        }

        if (!data.transactions) {
          throw new Error("No transactions data found in response");
        }

        setTransactions(data.transactions);
        setPagination(prev => ({ 
          ...prev, 
          total: data.total || data.transactions.length 
        }));
        calculateTotals(data.transactions);
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
    } catch (err) {
      setError(err.message);
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLast7DaysTotals = async () => {
    try {
      const url = `${API_BASE_URL}/all-transactions?days=7`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
          "x-hasura-role": "user",
          "x-hasura-user-id": userId.toString(),
        },
      });

      const responseText = await response.text();
      const data = JSON.parse(responseText);
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch last 7 days totals: ${response.status}`);
      }

      const processedData = data.transactions?.map(t => ({
        date: t.date,
        sum: t.amount,
        type: t.type
      })) || [];
      
      setLast7DaysTotals(processedData);
    } catch (err) {
      console.error("Error fetching last 7 days totals:", err);
      setLast7DaysTotals([]);
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

  const deleteTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/delete-transaction`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
          "x-hasura-role": "user",
          "x-hasura-user-id": userId.toString(),
        },
        body: JSON.stringify({ id: transactionId.toString() }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete transaction: ${response.status}`);
      }

      // Refresh transactions after deletion
      await fetchTransactions();
      await fetchLast7DaysTotals();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const updateTransaction = async (updatedTransaction) => {
    try {
      const now = new Date();
      const currentDateTime = now.toISOString();
      
      const response = await fetch(`${API_BASE_URL}/update-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
          "x-hasura-role": "user",
          "x-hasura-user-id": userId.toString(),
        },
        body: JSON.stringify({
          id: updatedTransaction.id,
          name: updatedTransaction.transaction_name,
          type: updatedTransaction.type,
          category: updatedTransaction.category,
          amount: updatedTransaction.amount,
          date: currentDateTime,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update transaction: ${response.status}`);
      }

      await fetchTransactions();
      await fetchLast7DaysTotals();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating transaction:", err);
      alert("Failed to update transaction. Please try again.");
    }
  };

  const toggleCategoryFilter = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  // Function to export data to CSV
  const exportToCSV = () => {
    // Prepare CSV content
    const headers = ["Name", "Category", "Type", "Amount", "Date"];
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    filteredTransactions.forEach(transaction => {
      const row = [
        `"${transaction.transaction_name.replace(/"/g, '""')}"`,
        `"${transaction.category.replace(/"/g, '""')}"`,
        `"${transaction.type}"`,
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
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTransactions();
        await fetchLast7DaysTotals();
      } catch (err) {
        setError(err.message);
      }
    };
    
    fetchData();
  }, [pagination.offset, pagination.limit]);

  // Reset client pagination when filters change
  useEffect(() => {
    setClientPagination({ limit: 10, offset: 0 });
  }, [activeTab, searchTerm, selectedCategories, sortConfig]);

  // Prepare data for the chart
  const chartData = last7DaysTotals.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    
    if (existing) {
      existing[item.type] = (existing[item.type] || 0) + item.sum;
    } else {
      const newItem = { date };
      newItem[item.type] = item.sum;
      acc.push(newItem);
    }
    
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
          <p className="text-gray-500">Manage and track your financial transactions</p>
        </div>
        <div className="flex items-center space-x-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
            onClick={() => setIsModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Transaction
          </motion.button>
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
          <div className="mt-4 text-sm text-green-600">
            <span className="font-medium">↑ 12%</span> from last month
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
          <div className="mt-4 text-sm text-red-600">
            <span className="font-medium">↑ 8%</span> from last month
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-sm text-indigo-600">
            <span className="font-medium">↑ 4%</span> from last month
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
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                  >
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                      <div className="space-y-2">
                        {categories.map(category => (
                          <div key={category} className="flex items-center">
                            <input
                              id={`filter-${category}`}
                              type="checkbox"
                              checked={selectedCategories.includes(category)}
                              onChange={() => toggleCategoryFilter(category)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`filter-${category}`} className="ml-2 text-sm text-gray-700">
                              {category}
                            </label>
                          </div>
                        ))}
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
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-red-500">
                    Error loading transactions: {error}
                  </td>
                </tr>
              ) : currentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
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
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${transaction.type === "credit" ? "bg-green-500" : "bg-red-500"}`}></div>
                          <div className="ml-1">
                            <div className="text-sm font-medium text-gray-900">{transaction.transaction_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(transaction.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            transaction.type === "credit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
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

      {/* Modals */}
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={() => {
          fetchTransactions();
          fetchLast7DaysTotals();
        }}
      />

      {selectedTransaction && (
        <EditTransactionModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          transaction={selectedTransaction}
          onSave={updateTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;