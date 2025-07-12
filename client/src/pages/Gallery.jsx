import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PhotoIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    caption: '',
    classTags: []
  });
  
  // Filter options
  const [classes, setClasses] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImages, setTotalImages] = useState(0);

  useEffect(() => {
    fetchImages();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchImages();
  }, [currentPage, searchTerm, selectedClass]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE_URL}/gallery?page=${currentPage}&limit=12`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (selectedClass) {
        url += `&classId=${selectedClass}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setImages(response.data.images || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalImages(response.data.pagination?.total || 0);
    } catch (error) {
      toast.error('Failed to fetch images');
      console.error('Fetch images error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      setLoadingFilters(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/gallery/filters/options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file size (5MB limit)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Some files are too large. Maximum size is 5MB per file.');
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Only image files are allowed.');
      return;
    }

    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      toast.error('Please select at least one image');
      return;
    }

    if (!uploadForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add files
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });
      
      // Add form data
      formData.append('title', uploadForm.title);
      formData.append('caption', uploadForm.caption);
      formData.append('classTags', JSON.stringify(uploadForm.classTags));

      await axios.post(`${API_BASE_URL}/gallery/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(`${selectedFiles.length} image(s) uploaded successfully`);
      setSelectedFiles([]);
      setUploadForm({
        title: '',
        caption: '',
        classTags: []
      });
      setShowUploadModal(false);
      fetchImages();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload images';
      toast.error(message);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/gallery/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Image deleted successfully');
      fetchImages();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete image';
      toast.error(message);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClass('');
    setCurrentPage(1);
  };

  const hasFilters = searchTerm || selectedClass;

  const openImage = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      caption: '',
      classTags: []
    });
    setSelectedFiles([]);
  };

  if (loading && currentPage === 1) {
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
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="mt-2 text-base text-gray-600">
            View and manage student photos and activities
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="mt-4 lg:mt-0 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Upload Photos</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasFilters && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {totalImages} results
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search photos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loadingFilters}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            disabled={!hasFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Images Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <PhotoIcon className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Photos ({totalImages})
              </h3>
            </div>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="p-6">
            <div className="text-center py-12">
              <PhotoIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No photos found
              </h3>
              <p className="text-gray-500 mb-6">
                {hasFilters ? 'Try adjusting your filters.' : 'Upload your first photo to get started.'}
              </p>
              {!hasFilters && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Upload Photo</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image) => (
                <div key={image._id} className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
                      {image.title}
                    </h4>
                    {image.caption && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {image.caption}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {image.classTags?.map((cls) => (
                        <span
                          key={cls._id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          <AcademicCapIcon className="w-3 h-3 mr-1" />
                          {cls.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openImage(image.imageUrl)}
                      className="p-1.5 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                      title="View Photo"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(image._id)}
                      className="p-1.5 bg-white text-red-600 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                      title="Delete Photo"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${
                      page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Photos</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Photos
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, GIF up to 5MB each
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Selected: {selectedFiles.length} file(s)
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFiles.map((file, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter photo title"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  value={uploadForm.caption}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, caption: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter photo caption"
                />
              </div>

              {/* Class Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Classes
                </label>
                <select
                  multiple
                  value={uploadForm.classTags}
                  onChange={(e) => setUploadForm(prev => ({ 
                    ...prev, 
                    classTags: Array.from(e.target.selectedOptions, option => option.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  size={6}
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple classes
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFiles.length || !uploadForm.title.trim() || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-4 h-4" />
                      <span>Upload Photos</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery; 