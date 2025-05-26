import React, { useState, useEffect } from "react";

const AddTransactionModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    category: "",
    amount: "",
    date: "",
    time: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    amount: ""
  });

  const categories = [
    { value: "", label: "Select" },
    { value: "shopping", label: "Shopping" },
    { value: "food", label: "Food" },
    { value: "transport", label: "Transport" },
    { value: "entertainment", label: "Entertainment" },
    { value: "transfer", label: "Transfer" },
    { value: "education", label: "Education" }
  ];

  useEffect(() => {
    if (isOpen) {
      // Set current date and time when modal opens
      const now = new Date();
      // Format the date for the input field (YYYY-MM-DD)
      const formattedDate = now.toISOString().split('T')[0];
      // Format the time for display (HH:MM)
      const formattedTime = now.toTimeString().substring(0, 5);
      
      setFormData(prev => ({
        ...prev,
        date: formattedDate,
        time: formattedTime
      }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate amount
    if (name === "amount") {
      const amountValue = parseFloat(value);
      if (amountValue < 0.01) {
        setErrors(prev => ({ ...prev, amount: "Amount must be at least 0.01" }));
      } else if (amountValue > 1000000) {
        setErrors(prev => ({ ...prev, amount: "Amount cannot exceed 1,000,000" }));
      } else {
        setErrors(prev => ({ ...prev, amount: "" }));
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (errors.amount) {
      alert("Please fix the errors before submitting");
      return;
    }
    
    const amountValue = parseFloat(formData.amount);
    if (amountValue < 0.01 || amountValue > 1000000) {
      setErrors(prev => ({
        ...prev,
        amount: amountValue < 0.01 
          ? "Amount must be at least 0.01" 
          : "Amount cannot exceed 1,000,000"
      }));
      return;
    }
    
    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem("userId") || 1; // Fallback to 1 if not found
      
      // Combine date and time for the API
      const transactionDateTime = formData.date && formData.time
        ? new Date(`${formData.date}T${formData.time}`).toISOString()
        : new Date().toISOString();

      const response = await fetch(
        `${import.meta.env.VITE_HASURA_API_URL}/add-transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": import.meta.env.VITE_HASURA_ADMIN_SECRET,
            "x-hasura-role": "user",
            "x-hasura-user-id": userId.toString(),
          },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            category: formData.category,
            amount: amountValue,
            date: transactionDateTime,
            user_id: userId
          }),
        }
      );

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to add transaction");
      }

      alert("Transaction added successfully!");
      onClose();
      // Reset form
      setFormData({
        name: "",
        type: "",
        category: "",
        amount: "",
        date: "",
        time: ""
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert(`Failed to add transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Add Transaction</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">Fill the below details carefully</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select 
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Transaction Type</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter Your Amount limit : $ 0.01 to $ 1000000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              min="0.01"
              max="1000000"
              step="0.01"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              disabled={isSubmitting || !!errors.amount}
            >
              {isSubmitting ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;