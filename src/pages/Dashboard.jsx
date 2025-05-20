import React, { useState } from "react";
import { FiArrowUp, FiArrowDown, FiMoreVertical, FiPlus } from "react-icons/fi";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AddTransactionModal from "../components/AddTransactionModal";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Sample data for charts
  const pieData = [
    { name: "Credit", value: 12750 },
    { name: "Debit", value: 5600 },
  ];

  const barData = [
    { name: "Mon", credit: 4200, debit: 2400 },
    { name: "Tue", credit: 3000, debit: 1398 },
    { name: "Wed", credit: 2000, debit: 9800 },
    { name: "Thu", credit: 2780, debit: 3908 },
    { name: "Fri", credit: 1890, debit: 4800 },
    { name: "Sat", credit: 2390, debit: 3800 },
    { name: "Sun", credit: 3490, debit: 4300 },
  ];

  const transactions = [
    { id: 1, name: "Spotify Subscription", category: "Mobile Service", person: "Emilly Wilson", date: "28 Jan, 12.30 AM", amount: -150, checked: false },
    { id: 2, name: "Service", category: "Transfer", person: "", date: "25 Jan, 10.40 PM", amount: -150, checked: false },
    { id: 3, name: "Transfer", category: "", person: "", date: "20 Jan, 10.40 PM", amount: 780, checked: false },
  ];

  const COLORS = ["#4f46e5", "#f87171"];

  return (
    <div className="ml-64 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            onClick={() => setIsModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Transaction
          </button>
        
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Credit</h2>
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <FiArrowUp />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">$12,750</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Debit</h2>
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <FiArrowDown />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">$5,600</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Debit & Credit Overview</h2>
          <p className="text-gray-600 mb-6">
            <span className="font-semibold text-red-500">$7,560</span> Debited &{" "}
            <span className="font-semibold text-green-500">$5,420</span> Credited in this Week
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="credit" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debit" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Balance Distribution</h2>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
              <span className="text-gray-600">Credit</span>
              <span className="ml-auto font-semibold">$12,750</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
              <span className="text-gray-600">Debit</span>
              <span className="ml-auto font-semibold">$5,600</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Last Transaction</h2>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={transaction.checked}
                onChange={() => {}}
                className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-4"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">{transaction.name}</h3>
                <p className="text-sm text-gray-500">
                  {transaction.category} {transaction.person && `• ${transaction.person}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{transaction.date}</p>
                <p className={`font-medium ${transaction.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                  {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;