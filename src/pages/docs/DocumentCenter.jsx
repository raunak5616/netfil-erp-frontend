import React, { useState } from 'react';
import { useGetDocumentHubAssetsQuery } from '../../features/docs/docsApi';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import {
  FolderTree,
  FileText,
  Image as ImageIcon,
  Search,
  RefreshCw,
  ExternalLink,
  Download,
  Filter,
  Eye,
  X,
  Layers,
  FileCheck,
  CheckCircle,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'DRAWINGS', label: 'Filter & Holes Drawings' },
  { id: 'SALES_ORDERS', label: 'Sales Order Attachments' },
  { id: 'WORK_ORDERS', label: 'Work Order Attachments' },
  { id: 'ITEMS', label: 'Product Catalog Images' },
];

const DocumentCenter = () => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewAsset, setPreviewAsset] = useState(null);

  const { data: responseData, isLoading, isError, refetch } = useGetDocumentHubAssetsQuery({
    category: selectedCategory,
    search: searchTerm || undefined,
    limit: 60,
  });

  const assets = responseData?.data || [];
  const totalCount = responseData?.pagination?.total || assets.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Center & Media Hub"
        subtitle="Centralized media repository for engineering drawings, customer orders, work instructions, and catalog media."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh Hub
          </Button>
        }
      />

      {/* Category Pills & Search */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search documents by code, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {isError && (
        <Alert
          variant="error"
          message="Failed to load document media. Ensure backend is running and you have access permissions."
        />
      )}

      {/* Media Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8">
          <FolderTree className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            No documents found
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Try adjusting your search filters or category selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div
              key={asset._id}
              className="group relative flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {/* Asset Preview / Thumbnail */}
              <div
                className="relative h-44 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => setPreviewAsset(asset)}
              >
                {asset.fileType === 'image' && asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.title}
                    className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-400">
                    <FileText className="h-14 w-14 mb-1 text-primary-500" />
                    <span className="text-xs uppercase font-bold tracking-wider">
                      {asset.subType || 'Document'}
                    </span>
                  </div>
                )}

                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-900/80 text-white backdrop-blur-sm">
                    {asset.entityCode || asset.entityType}
                  </span>
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <span className="p-2 bg-white/90 rounded-full text-neutral-800 hover:bg-white shadow">
                    <Eye className="h-4 w-4" />
                  </span>
                </div>
              </div>

              {/* Asset Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-primary-600 block">
                    {asset.category}
                  </span>
                  <h4
                    className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 mt-0.5"
                    title={asset.title}
                  >
                    {asset.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 text-[11px] font-mono">{asset.subType}</span>
                  <a
                    href={asset.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-xs"
                    onClick={(e) => {
                      if (asset.fileType === 'image') {
                        e.preventDefault();
                        setPreviewAsset(asset);
                      }
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image / Drawing Lightbox Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                  {previewAsset.title}
                </h3>
                <span className="text-xs text-neutral-500 font-mono">{previewAsset.entityCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAsset.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center bg-neutral-950 max-h-[75vh] overflow-auto">
              {previewAsset.fileType === 'image' ? (
                <img
                  src={previewAsset.fileUrl}
                  alt={previewAsset.title}
                  className="max-h-[70vh] object-contain rounded"
                />
              ) : (
                <div className="py-12 text-center text-neutral-300">
                  <FileText className="h-16 w-16 mx-auto mb-2 text-primary-500" />
                  <p className="text-sm font-semibold">Document: {previewAsset.title}</p>
                  <a
                    href={previewAsset.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium"
                  >
                    Open Document in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
