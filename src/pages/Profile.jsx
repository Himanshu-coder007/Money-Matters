import React, { useState, useEffect } from "react";
import { FiEdit, FiPlus } from "react-icons/fi";
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
            username: user.name, // Assuming username is same as name
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
      <div className="ml-64 p-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-64 p-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="ml-64 p-8">
        <div className="flex justify-center items-center h-64">
          <p>No user data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
        <button 
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          onClick={() => setIsModalOpen(true)}
        >
          <FiPlus className="mr-2" />
          Add Transaction
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold mr-4">
            {getInitial()}
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Your Name</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">{userData.name}</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">{userData.email}</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">{userData.dob}</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">{userData.username}</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Password</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">***********</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Present Address</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">{userData.presentAddress}</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Permanent Address</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">{userData.permanentAddress}</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">{userData.city}</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Postal Code</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">{userData.postalCode}</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
              <div className="flex items-center justify-between">
                <p className="text-gray-800">{userData.country}</p>
                <button className="text-indigo-600 hover:text-indigo-800">
                  <FiEdit />
                </button>
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