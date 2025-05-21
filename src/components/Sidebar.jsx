import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiHome, FiPieChart, FiUser, FiSettings, FiLogOut } from "react-icons/fi";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove userId from localStorage
    localStorage.removeItem('userId');
    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white h-screen shadow-lg fixed">
      <div className="p-6 flex justify-center">
        <img 
          src="/logo.png" 
          alt="Money Matters Logo" 
          className="h-12 object-contain" 
        />
      </div>
      <nav className="mt-10 px-6">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors duration-200 ${
              isActive ? "bg-gray-100 text-purple-600" : "text-gray-600 hover:bg-gray-100 hover:text-purple-600"
            }`
          }
        >
          <FiHome className="mr-3" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors duration-200 ${
              isActive ? "bg-gray-100 text-purple-600" : "text-gray-600 hover:bg-gray-100 hover:text-purple-600"
            }`
          }
        >
          <FiPieChart className="mr-3" />
          <span>Transactions</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors duration-200 ${
              isActive ? "bg-gray-100 text-purple-600" : "text-gray-600 hover:bg-gray-100 hover:text-purple-600"
            }`
          }
        >
          <FiUser className="mr-3" />
          <span>Profile</span>
        </NavLink>
        <div className="border-t border-gray-200 mt-6 pt-6">
          <button className="flex items-center w-full py-3 px-4 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-purple-600 transition-colors duration-200">
            <FiSettings className="mr-3" />
            <span>Settings</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full py-3 px-4 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-purple-600 transition-colors duration-200"
          >
            <FiLogOut className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;