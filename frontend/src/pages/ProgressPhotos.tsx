import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Camera, Upload, X, Trash2, Calendar, TrendingDown, Image as ImageIcon, ArrowLeftRight } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';

interface ProgressPhoto {
  id: number;
  url: string;
  date: string;
  weight?: number;
  notes?: string;
  type: 'front' | 'side' | 'back' | 'other';
}

export default function ProgressPhotos({ embedded }: { embedded?: boolean }) {
  const { showToast } = useToast();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedPhoto1, setSelectedPhoto1] = useState<ProgressPhoto | null>(null);
  const [selectedPhoto2, setSelectedPhoto2] = useState<ProgressPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  
  const [newPhoto, setNewPhoto] = useState({
    file: null as File | null,
    preview: '',
    date: new Date().toISOString().split('T')[0],
    weight: '',
    notes: '',
    type: 'front' as 'front' | 'side' | 'back' | 'other'
  });

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const response = await client.get('/progress-photos');
      setPhotos(response.data.photos || []);
    } catch (error: any) {
      console.error('Failed to load progress photos:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'warning');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto({
          ...newPhoto,
          file,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!newPhoto.file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', newPhoto.file);
      formData.append('date', newPhoto.date);
      if (newPhoto.weight) formData.append('weight', newPhoto.weight);
      if (newPhoto.notes) formData.append('notes', newPhoto.notes);
      formData.append('type', newPhoto.type);

      const response = await client.post('/progress-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setPhotos([response.data.photo, ...photos]);
        setShowUploadModal(false);
        setNewPhoto({
          file: null,
          preview: '',
          date: new Date().toISOString().split('T')[0],
          weight: '',
          notes: '',
          type: 'front'
        });
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      showToast('Failed to upload photo. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this photo?')) return;
    
    try {
      const response = await client.delete(`/progress-photos/${id}`);
      if (response.data.success) {
        setPhotos(photos.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      showToast('Failed to delete photo.', 'error');
    }
  };

  const startComparison = (photo: ProgressPhoto) => {
    if (!selectedPhoto1) {
      setSelectedPhoto1(photo);
    } else if (!selectedPhoto2) {
      setSelectedPhoto2(photo);
      setShowCompareModal(true);
    }
  };

  const resetComparison = () => {
    setSelectedPhoto1(null);
    setSelectedPhoto2(null);
    setShowCompareModal(false);
  };

  const sortedPhotos = [...photos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (loading) {
    return (
      <div className={`${embedded ? 'py-12' : 'min-h-screen bg-[var(--bg-primary)]'} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const mainContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        {!embedded && (
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
              <Camera className="w-10 h-10 text-[var(--brand-primary)]" />
              Progress Photos
            </h1>
            <p className="text-[var(--text-muted)]">Track your transformation visually</p>
          </div>
        )}
        <div className="flex gap-3 ml-auto">
          {/* View Toggle */}
          <div className="flex gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                viewMode === 'grid' ? 'bg-[var(--brand-primary)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                viewMode === 'timeline' ? 'bg-[var(--brand-primary)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              Timeline
            </button>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--brand-primary)] hover:opacity-90 text-[var(--text-primary)] rounded-xl font-semibold transition"
          >
            <Upload className="w-5 h-5" />
            Upload Photo
          </button>
        </div>
      </div>

          {/* Stats Overview */}
          {photos.length > 0 && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-6">
                <ImageIcon className="w-6 h-6 text-[var(--brand-primary)] mb-2" />
                <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{photos.length}</p>
                <p className="text-sm text-[var(--text-muted)]">Total Photos</p>
              </div>
              
              <div className="bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-blue-900/50 rounded-xl p-6">
                <Calendar className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                  {Math.floor((new Date().getTime() - new Date(sortedPhotos[sortedPhotos.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))}
                </p>
                <p className="text-sm text-[var(--text-muted)]">Days Tracking</p>
              </div>
              
              {sortedPhotos[0]?.weight && sortedPhotos[sortedPhotos.length - 1]?.weight && (
                <div className="bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-purple-900/50 rounded-xl p-6">
                  <TrendingDown className="w-6 h-6 text-purple-400 mb-2" />
                  <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                    {(sortedPhotos[sortedPhotos.length - 1].weight! - sortedPhotos[0].weight!).toFixed(1)} kg
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">Weight Change</p>
                </div>
              )}
              
              <div className="bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-orange-900/50 rounded-xl p-6">
                <ArrowLeftRight className="w-6 h-6 text-orange-400 mb-2" />
                <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                  {selectedPhoto1 && selectedPhoto2 ? '2' : selectedPhoto1 ? '1' : '0'}
                </p>
                <p className="text-sm text-[var(--text-muted)]">Selected for Compare</p>
              </div>
            </div>
          )}

          {/* Compare Mode Banner */}
          {(selectedPhoto1 || selectedPhoto2) && (
            <div className="bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/50 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="w-5 h-5 text-[var(--brand-primary)]" />
                <span className="text-[var(--text-primary)] font-medium">
                  {selectedPhoto1 && !selectedPhoto2 ? 'Select another photo to compare' : 'Ready to compare!'}
                </span>
              </div>
              <button
                onClick={resetComparison}
                className="px-4 py-2 bg-white/10 hover:bg-[var(--bg-tertiary)] rounded-lg text-sm font-medium text-[var(--text-primary)] transition"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Photos Grid/Timeline */}
          {photos.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-12 text-center">
              <Camera className="w-16 h-16 text-[var(--brand-primary)] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No Photos Yet</h2>
              <p className="text-[var(--text-muted)] mb-4">Start tracking your transformation!</p>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-[var(--brand-primary)] hover:opacity-90 text-[var(--text-primary)] rounded-xl font-semibold transition"
              >
                Upload Your First Photo
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedPhotos.map((photo) => (
                <div 
                  key={photo.id} 
                  className={`bg-[var(--bg-secondary)]/50 backdrop-blur-sm border-2 rounded-xl overflow-hidden hover:scale-105 transition cursor-pointer ${
                    selectedPhoto1?.id === photo.id || selectedPhoto2?.id === photo.id
                      ? 'border-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/20'
                      : 'border-[var(--border-default)]'
                  }`}
                  onClick={() => (selectedPhoto1 || selectedPhoto2) && startComparison(photo)}
                >
                  <div className="relative aspect-[3/4] bg-[var(--bg-tertiary)]">
                    <img src={photo.url} alt={`Progress ${photo.date}`} className="w-full h-full object-cover" />
                    {(selectedPhoto1?.id === photo.id || selectedPhoto2?.id === photo.id) && (
                      <div className="absolute inset-0 bg-[var(--brand-primary)]/20 flex items-center justify-center">
                        <div className="bg-[var(--brand-primary)] text-[var(--text-primary)] px-4 py-2 rounded-lg font-bold">
                          Selected
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[var(--text-primary)] font-semibold">{new Date(photo.date).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo.id);
                        }}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                    {photo.weight && (
                      <p className="text-sm text-[var(--text-muted)] mb-1">{photo.weight} kg</p>
                    )}
                    {photo.notes && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{photo.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {sortedPhotos.map((photo, index) => (
                <div key={photo.id} className="flex gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[var(--brand-primary)]"></div>
                    {index < sortedPhotos.length - 1 && (
                      <div className="w-0.5 h-full min-h-[100px] bg-emerald-900/50"></div>
                    )}
                  </div>
                  <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-6 flex gap-6">
                    <div className="w-48 h-64 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden flex-shrink-0">
                      <img src={photo.url} alt={`Progress ${photo.date}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">{new Date(photo.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startComparison(photo)}
                            className="px-3 py-1.5 bg-[var(--brand-primary)] hover:opacity-90 text-[var(--text-primary)] text-sm rounded-lg font-medium transition"
                          >
                            Compare
                          </button>
                          <button
                            onClick={() => handleDelete(photo.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      </div>
                      {photo.weight && (
                        <div className="mb-3">
                          <span className="text-[var(--text-muted)] text-sm">Weight: </span>
                          <span className="text-[var(--text-primary)] font-semibold">{photo.weight} kg</span>
                        </div>
                      )}
                      {photo.notes && (
                        <p className="text-[var(--text-secondary)]">{photo.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Upload Progress Photo</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
                <X className="w-6 h-6 text-[var(--text-muted)]" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Photo</label>
                {newPhoto.preview ? (
                  <div className="relative">
                    <img src={newPhoto.preview} alt="Preview" className="w-full max-h-96 object-contain rounded-xl bg-[var(--bg-tertiary)]" />
                    <button
                      onClick={() => setNewPhoto({ ...newPhoto, file: null, preview: '' })}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg"
                    >
                      <X className="w-5 h-5 text-[var(--text-primary)]" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-[var(--border-default)] border-dashed rounded-xl cursor-pointer bg-[var(--bg-tertiary)]/30 hover:bg-[var(--bg-tertiary)] transition">
                    <Upload className="w-12 h-12 text-[var(--brand-primary)] mb-3" />
                    <p className="text-[var(--text-secondary)] font-medium mb-1">Click to upload</p>
                    <p className="text-[var(--text-muted)] text-sm">PNG, JPG up to 10MB</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                  </label>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Date</label>
                  <input
                    type="date"
                    value={newPhoto.date}
                    onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPhoto.weight}
                    onChange={(e) => setNewPhoto({ ...newPhoto, weight: e.target.value })}
                    placeholder="75.5"
                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['front', 'side', 'back', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewPhoto({ ...newPhoto, type })}
                      className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                        newPhoto.type === type
                          ? 'bg-[var(--brand-primary)] text-[var(--text-primary)]'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Notes (Optional)</label>
                <textarea
                  value={newPhoto.notes}
                  onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
                  placeholder="Feeling stronger than ever!"
                  rows={3}
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || !newPhoto.file}
                className="w-full py-3 bg-[var(--brand-primary)] hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed text-[var(--text-primary)] rounded-xl font-semibold transition"
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && selectedPhoto1 && selectedPhoto2 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="max-w-6xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-[var(--text-primary)]">Before & After Comparison</h2>
              <button onClick={resetComparison} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
                <X className="w-6 h-6 text-[var(--text-muted)]" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                  <img src={selectedPhoto2.url} alt="Before" className="w-full aspect-[3/4] object-cover" />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Before - {new Date(selectedPhoto2.date).toLocaleDateString()}</h3>
                    {selectedPhoto2.weight && <p className="text-[var(--text-secondary)]">Weight: {selectedPhoto2.weight} kg</p>}
                    {selectedPhoto2.notes && <p className="text-[var(--text-muted)] text-sm mt-2">{selectedPhoto2.notes}</p>}
                  </div>
                </div>
              </div>

              {/* After */}
              <div>
                <div className="bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-[var(--brand-primary)]/50 rounded-xl overflow-hidden">
                  <img src={selectedPhoto1.url} alt="After" className="w-full aspect-[3/4] object-cover" />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">After - {new Date(selectedPhoto1.date).toLocaleDateString()}</h3>
                    {selectedPhoto1.weight && <p className="text-[var(--text-secondary)]">Weight: {selectedPhoto1.weight} kg</p>}
                    {selectedPhoto1.notes && <p className="text-[var(--text-muted)] text-sm mt-2">{selectedPhoto1.notes}</p>}
                    
                    {/* Stats */}
                    {selectedPhoto1.weight && selectedPhoto2.weight && (
                      <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                        <p className="text-[var(--brand-primary)] font-bold text-lg">
                          {(selectedPhoto2.weight - selectedPhoto1.weight).toFixed(1)} kg difference
                        </p>
                        <p className="text-[var(--text-muted)] text-sm">
                          {Math.floor((new Date(selectedPhoto1.date).getTime() - new Date(selectedPhoto2.date).getTime()) / (1000 * 60 * 60 * 24))} days apart
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) return mainContent;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/progress-photos" />
      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-20 lg:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {mainContent}
        </main>
      </div>
    </div>
  );
}