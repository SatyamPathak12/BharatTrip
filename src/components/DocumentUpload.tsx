import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Download, Eye, FileText, Image, FileCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PropertyDocument {
  id: string;
  name: string;
  type: 'aadhar' | 'pan' | 'property_details' | 'bank_details' | 'gst' | 'other';
  file_path: string;
  file_size: number;
  uploaded_at: string;
  file_url?: string;
}

interface DocumentUploadProps {
  propertyId?: string;
  documents: PropertyDocument[];
  onDocumentsUpdate: (documents: PropertyDocument[]) => void;
  isReadOnly?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  propertyId,
  documents,
  onDocumentsUpdate,
  isReadOnly = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const documentTypes = [
    { 
      value: 'aadhar', 
      label: 'Aadhar Card', 
      required: true,
      description: 'Upload clear copy of your Aadhar Card (front and back)',
      icon: FileCheck
    },
    { 
      value: 'pan', 
      label: 'PAN Card', 
      required: true,
      description: 'Upload clear copy of your PAN Card',
      icon: FileCheck
    },
    { 
      value: 'property_details', 
      label: 'Property Details Document', 
      required: true,
      description: 'Property ownership documents, sale deed, or lease agreement',
      icon: FileText
    },
    { 
      value: 'bank_details', 
      label: 'Bank Details', 
      required: true,
      description: 'Bank account details, cancelled cheque, or bank statement',
      icon: FileCheck
    },
    { 
      value: 'gst', 
      label: 'GST Certificate', 
      required: false,
      description: 'GST registration certificate (if applicable)',
      icon: FileText
    },
    { 
      value: 'other', 
      label: 'Other Documents', 
      required: false,
      description: 'Any additional supporting documents',
      icon: File
    }
  ];

  const uploadDocument = async (file: File, documentType: string): Promise<PropertyDocument | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/jpg'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File ${file.name} has unsupported format. Please use PDF, DOC, DOCX, or image files.`);
      }

      // Create file path: userId/propertyId/documentType_timestamp.ext
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${timestamp}.${fileExt}`;
      const filePath = `${user.id}/temp/${fileName}`;

      console.log('Uploading document to path:', filePath);

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Document uploaded successfully:', uploadData);

      // Create document object
      const newDocument: PropertyDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: documentType as any,
        file_path: filePath,
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      };

      return newDocument;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const handleFileUpload = async (files: FileList | null, documentType: string) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadingType(documentType);

    try {
      const uploadPromises = Array.from(files).map(file => uploadDocument(file, documentType));
      const uploadedDocs = await Promise.all(uploadPromises);
      
      // Filter out null results and add to documents
      const validDocs = uploadedDocs.filter(doc => doc !== null) as PropertyDocument[];
      const updatedDocuments = [...documents, ...validDocs];
      
      onDocumentsUpdate(updatedDocuments);
      
      console.log(`Successfully uploaded ${validDocs.length} documents for type: ${documentType}`);
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert(`Upload failed: ${error}`);
    } finally {
      setUploading(false);
      setUploadingType(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const documentToDelete = documents.find(doc => doc.id === documentId);
      if (!documentToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-documents')
        .remove([documentToDelete.file_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Update documents list
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      onDocumentsUpdate(updatedDocuments);
      
      console.log('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleViewDocument = async (document: PropertyDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('property-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('Error getting document URL:', error);
        alert(`Failed to open document: ${error.message}`);
        return;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to open document');
    }
  };

  const getDocumentsByType = (type: string) => {
    return documents.filter(doc => doc.type === type);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, type: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      return <Image className="h-5 w-5 text-blue-600" />;
    } else if (extension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const getRequiredDocumentsCount = () => {
    const requiredTypes = documentTypes.filter(dt => dt.required).map(dt => dt.value);
    return requiredTypes.filter(type => getDocumentsByType(type).length > 0).length;
  };

  const getTotalRequiredCount = () => {
    return documentTypes.filter(dt => dt.required).length;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Property Documents</h3>
        <p className="text-gray-600 mb-4">
          Upload required documents for property verification
        </p>
        
        {/* Progress Indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-900">
              {getRequiredDocumentsCount()} of {getTotalRequiredCount()} required documents uploaded
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getRequiredDocumentsCount() / getTotalRequiredCount()) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {documentTypes.map((docType) => {
        const typeDocuments = getDocumentsByType(docType.value);
        const isUploading = uploadingType === docType.value;
        
        return (
          <div key={docType.value} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    typeDocuments.length > 0 ? 'bg-green-100' : docType.required ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <docType.icon className={`h-6 w-6 ${
                      typeDocuments.length > 0 ? 'text-green-600' : docType.required ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      {docType.label}
                      {docType.required && <span className="text-red-500 ml-1">*</span>}
                      {typeDocuments.length > 0 && (
                        <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">{docType.description}</p>
                  </div>
                </div>
                
                {!isReadOnly && (
                  <div className="flex items-center space-x-2">
                    <input
                      ref={(el) => fileInputRefs.current[docType.value] = el}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e.target.files, docType.value)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRefs.current[docType.value]?.click()}
                      disabled={uploading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-blue-800 font-medium">Uploading {docType.label}...</span>
                  </div>
                </div>
              )}

              {/* Documents List */}
              {typeDocuments.length > 0 ? (
                <div className="space-y-3">
                  {typeDocuments.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(document.name, document.type)}
                        <div>
                          <p className="font-medium text-gray-900">{document.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(document.file_size)} • Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDocument(document)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete document"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                  <File className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">
                    {docType.required ? 'Required document not uploaded' : 'No documents uploaded'}
                  </p>
                  {!isReadOnly && (
                    <button
                      onClick={() => fileInputRefs.current[docType.value]?.click()}
                      disabled={uploading}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Click to upload {docType.label.toLowerCase()}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Upload Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-2">Upload Guidelines</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Maximum file size: 10MB per document</li>
              <li>• Supported formats: PDF, DOC, DOCX, JPG, PNG, WEBP</li>
              <li>• Ensure documents are clear and readable</li>
              <li>• All required documents must be uploaded for verification</li>
              <li>• Documents are securely stored and only accessible to you and our verification team</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Document Checklist</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map((docType) => {
            const hasDocuments = getDocumentsByType(docType.value).length > 0;
            const isComplete = !docType.required || hasDocuments;
            
            return (
              <div key={docType.value} className="flex items-center space-x-3">
                {isComplete ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={`text-sm ${isComplete ? 'text-gray-900' : 'text-red-600'}`}>
                  {docType.label} {docType.required && '(Required)'}
                </span>
                {hasDocuments && (
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {getDocumentsByType(docType.value).length} uploaded
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Overall Status */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Verification Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              getRequiredDocumentsCount() === getTotalRequiredCount()
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {getRequiredDocumentsCount() === getTotalRequiredCount() 
                ? 'Ready for Review' 
                : `${getTotalRequiredCount() - getRequiredDocumentsCount()} required documents missing`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;