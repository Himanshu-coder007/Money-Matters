import React, { useState, useEffect } from "react";
import { FiDownload, FiFilter, FiSearch, FiChevronDown, FiChevronUp, FiPlus } from "react-icons/fi";
import AddTransactionModal from "../components/AddTransactionModal";
import { LOCAL_STORAGE_KEYS } from "../utils/constants";

const Transactions = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ limit: 100, offset: 0, total: 0 });
  const [totals, setTotals] = useState({ credit: 0, debit: 0 });
  const [last7DaysTotals, setLast7DaysTotals] = useState([]);

  const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID) || 1;
  const API_BASE_URL = import.meta.env.VITE_HASURA_API_URL;
  const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

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
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

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
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    } else {
      setPagination(prev => ({
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
      console.log("API Request URL:", url); // Debug log

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
      console.log("API Response:", responseText); // Debug log

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

  return (
    <div className="ml-64 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            onClick={() => setIsModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Total Credit</h3>
          <p className="text-2xl font-bold text-green-600">
            ${totals.credit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Total Debit</h3>
          <p className="text-2xl font-bold text-red-600">
            ${totals.debit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Total Balance</h3>
          <p className="text-2xl font-bold text-gray-800">
            ${(totals.credit - totals.debit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-4 font-medium ${activeTab === "all" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("all")}
          >
            All Transactions
          </button>
          <button
            className={`px-6 py-4 font-medium ${activeTab === "debit" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("debit")}
          >
            Debit
          </button>
          <button
            className={`px-6 py-4 font-medium ${activeTab === "credit" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("credit")}
          >
            Credit
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("transaction_name")}
                >
                  <div className="flex items-center">
                    Transaction Name
                    {getSortIcon("transaction_name")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("category")}
                >
                  <div className="flex items-center">
                    Category
                    {getSortIcon("category")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("date")}
                >
                  <div className="flex items-center">
                    Date
                    {getSortIcon("date")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{transaction.transaction_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{transaction.category}</div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && !isLoading && (
          <div className="p-8 text-center text-gray-500">
            No transactions found matching your criteria
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between items-center">
            <button
              onClick={() => handlePagination("prev")}
              disabled={pagination.offset === 0}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.offset === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{pagination.offset + 1}</span> to{" "}
              <span className="font-medium">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span> of{" "}
              <span className="font-medium">{pagination.total}</span>
            </span>
            <button
              onClick={() => handlePagination("next")}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.offset + pagination.limit >= pagination.total ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={() => {
          fetchTransactions();
          fetchLast7DaysTotals();
        }}
      />
    </div>
  );
};

export default Transactions;