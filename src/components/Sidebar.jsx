import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiHome, FiPieChart, FiUser, FiLogOut } from "react-icons/fi";
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

const Sidebar = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  const isAdmin = userId === '3';

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_ID);
    navigate('/login');
  };

  return (
    <div className="w-64 bg-gray-900 h-screen shadow-xl fixed flex flex-col">
      <div className="p-6 flex justify-center border-b border-gray-700">
        <img 
          src="/logo.png" 
          alt="Money Matters Logo" 
          className="h-12 object-contain" 
        />
      </div>
      <nav className="flex-1 flex flex-col justify-between px-4 py-6">
        <div>
          {isAdmin ? (
            <>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors duration-200 ${
                    isActive ? "bg-purple-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <FiHome className="mr-3 text-lg" />
                <span className="font-medium">Dashboard</span>
              </NavLink>
              <NavLink
                to="/admin/transactions"
                className={({ isActive }) =>
                  `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors duration-200 ${
                    isActive ? "bg-purple-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <FiPieChart className="mr-3 text-lg" />
                <span className="font-medium">Transactions</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors duration-200 ${
                    isActive ? "bg-purple-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <FiHome className="mr-3 text-lg" />
                <span className="font-medium">Dashboard</span>
              </NavLink>
              <NavLink
                to="/transactions"
                className={({ isActive }) =>
                  `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors duration-200 ${
                    isActive ? "bg-purple-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <FiPieChart className="mr-3 text-lg" />
                <span className="font-medium">Transactions</span>
              </NavLink>
            </>
          )}
          
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors duration-200 ${
                isActive ? "bg-purple-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <FiUser className="mr-3 text-lg" />
            <span className="font-medium">Profile</span>
          </NavLink>
        </div>
        <div className="border-t border-gray-700 pt-4">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full py-3 px-4 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200 mt-2"
          >
            <FiLogOut className="mr-3 text-lg" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;