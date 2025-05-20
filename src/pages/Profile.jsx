import React, { useState } from "react";
import { FiEdit, FiPlus } from "react-icons/fi";
import AddTransactionModal from "../components/AddTransactionModal";

const Profile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userData = {
    name: "Charlene Reed",
    email: "charlenereed@gmail.com",
    dob: "25 January 1990",
    username: "Charlene Reed",
    presentAddress: "San Jose, California, USA",
    permanentAddress: "San Jose, California, USA",
    city: "San Jose",
    postalCode: "45982",
    country: "USA"
  };

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
        <div className="p-6 border-b border-gray-200">
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