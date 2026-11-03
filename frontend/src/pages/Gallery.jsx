import React, { useState, useEffect } from 'react';
import { Image, FileText, Download, Trash2, Filter, Eye, X, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import Sidebar from '../components/navigation/Sidebar';

export default function Gallery() {
  const [files, setFiles] = useState([]);
  const [filter, setFilter] = useState('');
  const [lightboxItem, setLightboxItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [filter]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await api.getGallery(filter);
      setFiles(res);
    } catch (err) {
      console.error("Failed to load gallery", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteFile(id);
      setFiles(files.filter(f => f.id !== id));
      if (lightboxItem?.id === id) setLightboxItem(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
              <Image className="w-4 h-4" />
              Document & Asset Storage (GridFS)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Media Gallery
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect uploaded documents, extracted RAG context chunks, and images.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {['', 'image', 'application/pdf'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === type
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {type === '' ? 'All Files' : type === 'image' ? 'Images' : 'PDFs'}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading stored files...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No uploads yet</h3>
            <p className="text-xs">Attach photos or documents in chat to see them stored here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative flex flex-col p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Thumbnail or File icon */}
                <div
                  onClick={() => setLightboxItem(file)}
                  className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  {file.mime?.startsWith('image/') ? (
                    <img
                      src={`/api/v1/files/${file.id}/content?thumbnail=true`}
                      alt={file.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                  )}
                </div>

                <div className="pt-2">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{file.filename}</h4>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {Math.round(file.size / 1024)} KB
                  </span>
                </div>

                {/* Hover overlay actions */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 p-1 rounded-xl backdrop-blur-md">
                  <a
                    href={`/api/v1/files/${file.id}/content`}
                    download={file.filename}
                    className="p-1.5 text-white hover:text-indigo-400 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 text-white hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="relative max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{lightboxItem.filename}</h3>
                <button onClick={() => setLightboxItem(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center">
                {lightboxItem.mime?.startsWith('image/') ? (
                  <img
                    src={`/api/v1/files/${lightboxItem.id}/content`}
                    alt={lightboxItem.filename}
                    className="max-h-[60vh] object-contain rounded-xl"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs font-mono whitespace-pre-wrap max-h-[60vh] overflow-y-auto leading-relaxed">
                    {lightboxItem.extracted_text || "Document binary content"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

