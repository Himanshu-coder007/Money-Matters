import React, { useState, useEffect } from "react";
import { FiArrowUp, FiArrowDown, FiPlus } from "react-icons/fi";
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
} from "recharts";
import AddTransactionModal from "../components/AddTransactionModal";
import { format, parseISO } from "date-fns";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [creditTotal, setCreditTotal] = useState(0);
  const [debitTotal, setDebitTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ["#FC9826", "#05939E"];
  const API_URL = import.meta.env.VITE_HASURA_API_URL;
  const ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;
  const userId = localStorage.getItem("userId") || 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        // Fetch last 3 transactions
        const transactionsResponse = await fetch(
          `${API_URL}/all-transactions?limit=3&offset=2`,
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

        // Reverse the transactions array to show newest first
        const reversedTransactions = [
          ...(transactionsData.transactions || []),
        ].reverse();
        setTransactions(reversedTransactions);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL, ADMIN_SECRET, userId]);

  if (loading) {
    return (
      <div className="ml-64 p-8 flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-64 p-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-8 bg-[#F5F7FA]">
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
          <p className="text-3xl font-bold text-gray-800">
            ${creditTotal.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Debit</h2>
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <FiArrowDown />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${debitTotal.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Debit & Credit Overview
          </h2>
          <p className="text-gray-600 mb-6">
            <span className="font-semibold text-red-500">
              $
              {barData
                .reduce((sum, day) => sum + day.debit, 0)
                .toLocaleString()}
            </span>{" "}
            Debited &{" "}
            <span className="font-semibold text-green-500">
              $
              {barData
                .reduce((sum, day) => sum + day.credit, 0)
                .toLocaleString()}
            </span>{" "}
            Credited in this Week
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="credit" fill="#FC9826" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debit" fill="#05939E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Balance Distribution
          </h2>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `$${value.toLocaleString()}`,
                    pieData.find((d) => d.value === value)?.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
              <span className="text-gray-600">Credit</span>
              <span className="ml-auto font-semibold">
                ${creditTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
              <span className="text-gray-600">Debit</span>
              <span className="ml-auto font-semibold">
                ${debitTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">
          Last Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Transaction
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
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.transaction_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {transaction.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(parseISO(transaction.date), "dd MMM, hh:mm a")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          transaction.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}$
                        {transaction.amount.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
