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
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get('/photos');
      setPhotos(response.data.photos || []);
    } catch (error) {
      toast.error('Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size should be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('title', selectedFile.name);
      formData.append('description', '');

      await axios.post('/photos', formData);
      toast.success('Photo uploaded successfully');
      setSelectedFile(null);
      setShowUploadModal(false);
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      await axios.delete(`/photos/${photoId}`);
      toast.success('Photo deleted successfully');
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || photo.classAssociated === filterClass;
    
    return matchesSearch && matchesClass;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClass('');
  };

  const hasFilters = searchTerm || filterClass;

  const classes = [...new Set(photos.map(photo => photo.classAssociated).filter(Boolean))];

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
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="mt-2 text-base text-gray-600">
            View and manage student photos and activities
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="mt-4 lg:mt-0 btn btn-primary shadow-medium"
        >
          <PlusIcon className="icon-sm mr-2" />
          Upload Photo
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <FunnelIcon className="icon-md text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasFilters && (
              <span className="ml-2 badge badge-primary">{filteredPhotos.length} results</span>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-gray-400" />
              <input
                type="text"
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>

            {/* Class Filter */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="form-select"
            >
              <option value="">All Classes</option>
              {classes.map((className) => (
                <option key={className} value={className}>{className}</option>
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

      {/* Photos Grid */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <PhotoIcon className="icon-md text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Photos ({filteredPhotos.length})
              </h3>
            </div>
          </div>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="card-body">
            <div className="text-center py-12">
              <PhotoIcon className="icon-xl mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos found</h3>
              <p className="text-gray-600 mb-6">
                {hasFilters 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by uploading your first photo.'
                }
              </p>
              {!hasFilters && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn btn-primary"
                >
                  <PlusIcon className="icon-sm mr-2" />
                  Upload Photo
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPhotos.map((photo) => (
                <div key={photo._id} className="group relative card border border-gray-200 hover:shadow-lg transition-all duration-200">
                  <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  
                  <div className="card-body p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {photo.title}
                    </h4>
                    {photo.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {photo.description}
                      </p>
                    )}
                    {photo.classAssociated && (
                      <span className="badge badge-primary text-xs">
                        {photo.classAssociated}
                      </span>
                    )}
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(photo.uploadDate).toLocaleDateString()}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => window.open(photo.url, '_blank')}
                          className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition-colors"
                          title="View Photo"
                        >
                          <EyeIcon className="icon-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(photo._id)}
                          className="p-1 text-danger-600 hover:text-danger-800 hover:bg-danger-50 rounded transition-colors"
                          title="Delete Photo"
                        >
                          <TrashIcon className="icon-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CloudArrowUpIcon className="icon-md text-gray-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Upload Photo</h3>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="icon-md" />
                </button>
              </div>
            </div>
            
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="form-input"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum file size: 10MB
                  </p>
                </div>

                {selectedFile && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Photo'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery; 