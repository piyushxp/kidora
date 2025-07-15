import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CreditCardIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import http from '../utils/http';

const Payments = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await http.get('/invoices');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (invoiceId, status) => {
    try {
      await http.put(`/invoices/${invoiceId}/status`, { status });
      toast.success('Payment status updated successfully');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.student.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || invoice.status === filterStatus;
    const matchesMonth = !filterMonth || 
                        new Date(invoice.dueDate).getMonth() === parseInt(filterMonth);
    
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterMonth('');
  };

  const hasFilters = searchTerm || filterStatus || filterMonth;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="icon-sm text-success-600" />;
      case 'pending':
        return <ClockIcon className="icon-sm text-warning-600" />;
      case 'overdue':
        return <XCircleIcon className="icon-sm text-danger-600" />;
      default:
        return <ClockIcon className="icon-sm text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'overdue':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payments</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Manage student invoices and payment tracking
          </p>
        </div>
        <button
          onClick={() => toast.info('Invoice generation feature coming soon!')}
          className="mt-4 lg:mt-0 btn btn-primary shadow-medium"
        >
          <PlusIcon className="icon-sm mr-2" />
          Generate Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <FunnelIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
            {hasFilters && (
              <span className="ml-2 badge badge-primary">{filteredInvoices.length} results</span>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Month Filter */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="form-select bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Months</option>
              {months.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              disabled={!hasFilters}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="icon-sm mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCardIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Invoices ({filteredInvoices.length})
              </h3>
            </div>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="card-body">
            <div className="text-center py-12">
              <CreditCardIcon className="icon-xl mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No invoices found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {hasFilters ? 'Try adjusting your filters.' : 'Generate your first invoice to get started.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {invoice.student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {invoice.student.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {invoice.student.parentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          ${invoice.amount?.toFixed(2) || '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(invoice.status)}
                          <span className={`ml-2 badge ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => toast.info('View invoice feature coming soon!')}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Invoice"
                          >
                            <EyeIcon className="icon-sm" />
                          </button>
                          <button
                            onClick={() => toast.info('Download invoice feature coming soon!')}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Download Invoice"
                          >
                            <DocumentTextIcon className="icon-sm" />
                          </button>
                          {invoice.status !== 'paid' && (
                            <select
                              value={invoice.status}
                              onChange={(e) => handleStatusUpdate(invoice._id, e.target.value)}
                              className="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <CheckCircleIcon className="icon-md text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">Paid</h4>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${filteredInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center">
            <ClockIcon className="icon-md text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">Pending</h4>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                ${filteredInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <XCircleIcon className="icon-md text-red-600 dark:text-red-400 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-red-800 dark:text-red-300">Overdue</h4>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                ${filteredInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments; 