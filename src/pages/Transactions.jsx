import React, { useState } from "react";
import { FiDownload, FiFilter, FiSearch, FiChevronDown, FiChevronUp, FiPlus } from "react-icons/fi";
import AddTransactionModal from "../components/AddTransactionModal";

const Transactions = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const transactions = [
    {
      id: 1,
      name: "Spotify Subscription",
      category: "Shopping",
      date: "28 Jan, 12.30 AM",
      amount: 2500,
      type: "credit"
    },
    {
      id: 2,
      name: "Mobile Service",
      category: "Service",
      date: "20 Jan, 10.40 PM",
      amount: 150,
      type: "credit"
    },
    {
      id: 3,
      name: "Wilson",
      category: "-",
      date: "15 Jan, 03.29 PM",
      amount: 1050,
      type: "credit"
    },
    {
      id: 4,
      name: "Netflix Subscription",
      category: "Transfer",
      date: "13 Jan, 10.40 PM",
      amount: 840,
      type: "credit"
    },
    {
      id: 5,
      name: "Manasa",
      category: "Transfer",
      date: "09 Jan, 10.40 PM",
      amount: 840,
      type: "credit"
    },
    {
      id: 6,
      name: "Electricity Bill",
      category: "Utility",
      date: "05 Jan, 09.15 AM",
      amount: -120,
      type: "debit"
    },
    {
      id: 7,
      name: "Grocery Shopping",
      category: "Shopping",
      date: "02 Jan, 04.30 PM",
      amount: -85,
      type: "debit"
    }
  ];

  const filteredTransactions = transactions
    .filter(transaction => {
      if (activeTab === "all") return true;
      return transaction.type === activeTab;
    })
    .filter(transaction => {
      if (!searchTerm) return true;
      return (
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortConfig.key === "date") {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.key === "amount") {
        return sortConfig.direction === "asc" ? a.amount - b.amount : b.amount - a.amount;
      } else {
        return 0;
      }
    });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />;
  };

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
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <FiDownload className="mr-2" />
            Export
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <FiFilter className="mr-2" />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  <div className="flex items-center">
                    Transaction Name
                    {getSortIcon("name")}
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
                        <div className="text-sm font-medium text-gray-900">{transaction.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{transaction.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{transaction.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-medium ${
                        transaction.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No transactions found matching your criteria
          </div>
        )}
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Transactions;