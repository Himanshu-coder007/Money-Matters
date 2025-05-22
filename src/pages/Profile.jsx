import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiUser, FiMail, FiCalendar, FiHome, FiMapPin, FiLock } from "react-icons/fi";
import AddTransactionModal from "../components/AddTransactionModal";
import { LOCAL_STORAGE_KEYS } from "../utils/constants";

const Profile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID) || "1";
        
        const response = await fetch(`${import.meta.env.VITE_HASURA_API_URL}/profile`, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            "x-hasura-admin-secret": import.meta.env.VITE_HASURA_ADMIN_SECRET,
            "x-hasura-role": "user",
            "x-hasura-user-id": userId
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.users && data.users.length > 0) {
          const user = data.users[0];
          setUserData({
            name: user.name,
            email: user.email,
            dob: formatDate(user.date_of_birth),
            username: user.name,
            presentAddress: user.present_address || "Not provided",
            permanentAddress: user.permanent_address || "Not provided",
            city: user.city || "Not provided",
            postalCode: user.postal_code || "Not provided",
            country: user.country || "Not provided"
          });
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getInitial = () => {
    if (!userData?.name) return "U";
    return userData.name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="ml-0 md:ml-64 p-4 md:p-8">
        <div className="flex justify-center items-center h-screen md:h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-0 md:ml-64 p-4 md:p-8">
        <div className="flex justify-center items-center h-screen md:h-64">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-md w-full">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">Error loading profile: {error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="ml-0 md:ml-64 p-4 md:p-8">
        <div className="flex justify-center items-center h-screen md:h-64">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No profile found</h3>
            <p className="mt-1 text-gray-500">We couldn't find any user data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-500 mt-1">Manage your personal information</p>
          </div>
          <button 
            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            onClick={() => setIsModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Transaction
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {getInitial()}
              </div>
              <h2 className="text-xl font-semibold text-white">{userData.name}</h2>
              <p className="text-indigo-100">{userData.email}</p>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-800">Personal Info</h3>
                <button className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm">
                  <FiEdit2 className="mr-1" /> Edit
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FiUser className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-sm text-gray-800">{userData.name}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FiMail className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-800">{userData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FiCalendar className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p className="text-sm text-gray-800">{userData.dob}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FiLock className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Password</p>
                    <p className="text-sm text-gray-800">•••••••••••</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-800">Address Information</h2>
                  <button className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm">
                    <FiEdit2 className="mr-1" /> Edit
                  </button>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start mb-2">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <FiHome className="h-4 w-4" />
                      </div>
                      <h3 className="ml-2 text-sm font-medium text-gray-500">Present Address</h3>
                    </div>
                    <p className="text-gray-800 pl-8">{userData.presentAddress}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-start mb-2">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <FiHome className="h-4 w-4" />
                      </div>
                      <h3 className="ml-2 text-sm font-medium text-gray-500">Permanent Address</h3>
                    </div>
                    <p className="text-gray-800 pl-8">{userData.permanentAddress}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start mb-2">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <FiMapPin className="h-4 w-4" />
                      </div>
                      <h3 className="ml-2 text-sm font-medium text-gray-500">City</h3>
                    </div>
                    <p className="text-gray-800 pl-8">{userData.city}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-start mb-2">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <FiMapPin className="h-4 w-4" />
                      </div>
                      <h3 className="ml-2 text-sm font-medium text-gray-500">Postal Code</h3>
                    </div>
                    <p className="text-gray-800 pl-8">{userData.postalCode}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-start mb-2">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <FiMapPin className="h-4 w-4" />
                      </div>
                      <h3 className="ml-2 text-sm font-medium text-gray-500">Country</h3>
                    </div>
                    <p className="text-gray-800 pl-8">{userData.country}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Section (can be used for other info) */}
            <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Account Details</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Member since</span>
                  <span className="text-gray-800">Jan 2023</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Last login</span>
                  <span className="text-gray-800">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-500">Account status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Profile;