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
      const response = await axios.get('/invoices');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (invoiceId, status) => {
    try {
      await axios.put(`/invoices/${invoiceId}/status`, { status });
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
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="mt-2 text-base text-gray-600">
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
            <FunnelIcon className="icon-md text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasFilters && (
              <span className="ml-2 badge badge-primary">{filteredInvoices.length} results</span>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select"
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
              className="form-select"
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
              <CreditCardIcon className="icon-md text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Invoices ({filteredInvoices.length})
              </h3>
            </div>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="card-body">
            <div className="text-center py-12">
              <DocumentTextIcon className="icon-xl mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-600 mb-6">
                {hasFilters 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No invoices have been generated yet.'
                }
              </p>
              {!hasFilters && (
                <button
                  onClick={() => toast.info('Invoice generation feature coming soon!')}
                  className="btn btn-primary"
                >
                  <PlusIcon className="icon-sm mr-2" />
                  Generate Invoice
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Student</th>
                    <th className="table-header-cell">Invoice Type</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Due Date</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center shadow-soft">
                            <span className="text-sm font-semibold text-white">
                              {invoice.student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{invoice.student.name}</div>
                            <div className="text-xs text-gray-500">{invoice.student.parentName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-primary capitalize">
                          {invoice.invoiceType}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-semibold text-gray-900">
                          ${invoice.totalAmount}
                        </div>
                        {invoice.remainingAmount > 0 && (
                          <div className="text-xs text-danger-600">
                            ${invoice.remainingAmount} remaining
                          </div>
                        )}
                      </td>
                      <td className="table-cell text-sm text-gray-900">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          {getStatusIcon(invoice.status)}
                          <span className={`ml-2 badge ${getStatusColor(invoice.status)}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toast.info('View invoice feature coming soon!')}
                            className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Invoice"
                          >
                            <EyeIcon className="icon-sm" />
                          </button>
                          {invoice.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(invoice._id, 'paid')}
                              className="p-2 text-success-600 hover:text-success-800 hover:bg-success-50 rounded-lg transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircleIcon className="icon-sm" />
                            </button>
                          )}
                          {invoice.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(invoice._id, 'overdue')}
                              className="p-2 text-danger-600 hover:text-danger-800 hover:bg-danger-50 rounded-lg transition-colors"
                              title="Mark as Overdue"
                            >
                              <XCircleIcon className="icon-sm" />
                            </button>
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
    </div>
  );
};

export default Payments; 