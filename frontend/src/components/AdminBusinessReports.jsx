import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  BookOpen,
  CreditCard,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Award,
  AlertTriangle,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBusinessReports = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState(null);

  // Fetch financial data from API
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `http://localhost:5001/api/analytics/admin/financial?timeRange=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setFinancialData(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch financial data');
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">No financial data available</p>
        <button
          onClick={fetchFinancialData}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const { 
    financialSummary, 
    monthlyData, 
    revenueByCategory, 
    expensesByCategory, 
    topPerformingCourses, 
    lossAreas 
  } = financialData;

  const getMaxValue = (data) => {
    const values = data.map(d => Math.max(d.revenue, d.expenses));
    return Math.max(...values);
  };

  const maxValue = getMaxValue(monthlyData);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Reports</h2>
            <p className="text-gray-600">Financial analytics and performance metrics</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            
            <button 
              onClick={fetchFinancialData}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <DollarSign className="w-7 h-7" />
            </div>
            <div className="flex items-center space-x-1 text-sm bg-white/20 px-2 py-1 rounded">
              <TrendingUp className="w-4 h-4" />
              <span>+{financialSummary.revenueGrowth}%</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">${financialSummary.totalRevenue.toLocaleString()}</h3>
          <p className="text-green-100 text-sm">Total Revenue</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <CreditCard className="w-7 h-7" />
            </div>
            <div className="flex items-center space-x-1 text-sm bg-white/20 px-2 py-1 rounded">
              <TrendingUp className="w-4 h-4" />
              <span>+{financialSummary.expenseGrowth}%</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">${financialSummary.totalExpenses.toLocaleString()}</h3>
          <p className="text-red-100 text-sm">Total Expenses</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div className="flex items-center space-x-1 text-sm bg-white/20 px-2 py-1 rounded">
              <TrendingUp className="w-4 h-4" />
              <span>Profitable</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">${financialSummary.netProfit.toLocaleString()}</h3>
          <p className="text-blue-100 text-sm">Net Profit</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div className="flex items-center space-x-1 text-sm bg-white/20 px-2 py-1 rounded">
              <Target className="w-4 h-4" />
              <span>Healthy</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">{financialSummary.profitMargin}%</h3>
          <p className="text-purple-100 text-sm">Profit Margin</p>
        </motion.div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Revenue vs Expenses Trend</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Expenses</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Profit</span>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end space-x-4 h-64">
          {monthlyData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-2">
              <div className="w-full flex flex-col items-center space-y-1 flex-1 justify-end">
                {/* Revenue Bar */}
                <div className="w-full flex justify-center items-end space-x-1">
                  <div
                    className="w-1/3 bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer relative group"
                    style={{ height: `${(data.revenue / maxValue) * 100}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${data.revenue.toLocaleString()}
                    </div>
                  </div>
                  {/* Expenses Bar */}
                  <div
                    className="w-1/3 bg-red-500 rounded-t hover:bg-red-600 transition-colors cursor-pointer relative group"
                    style={{ height: `${(data.expenses / maxValue) * 100}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${data.expenses.toLocaleString()}
                    </div>
                  </div>
                  {/* Profit Bar */}
                  <div
                    className="w-1/3 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                    style={{ height: `${(data.profit / maxValue) * 100}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${data.profit.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600">{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Breakdown and Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <PieChart className="w-6 h-6 text-green-600" />
            <span>Revenue by Category</span>
          </h3>
          
          <div className="space-y-4">
            {revenueByCategory.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-bold">${item.amount.toLocaleString()}</span>
                    <span className={`text-xs flex items-center ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(item.growth)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-12 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Activity className="w-6 h-6 text-red-600" />
            <span>Expenses by Category</span>
          </h3>
          
          <div className="space-y-4">
            {expensesByCategory.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-bold">${item.amount.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.trend === 'up' ? 'bg-red-100 text-red-800' :
                      item.trend === 'down' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.trend}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-12 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Courses */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Award className="w-6 h-6 text-yellow-600" />
          <span>Top Performing Courses</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enrollments</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Profit</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topPerformingCourses.map((course, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{course.name}</td>
                  <td className="px-6 py-4 text-green-600 font-bold">${course.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-900">{course.enrollments}</td>
                  <td className="px-6 py-4 text-blue-600 font-bold">${course.profit.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-600">Excellent</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loss Areas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <span>Areas of Loss & Improvement Opportunities</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lossAreas.map((item, index) => (
            <div key={index} className="p-4 border-2 border-red-200 rounded-xl hover:border-red-400 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-gray-900">{item.area}</h4>
                <div className="flex items-center space-x-1 text-red-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-bold">{item.percentage}%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600 mb-2">${Math.abs(item.impact).toLocaleString()}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
              <button className="mt-3 w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminBusinessReports;
