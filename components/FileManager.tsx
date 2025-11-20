

import React, { useState, useMemo, useCallback, useRef } from 'react';
import type { ManagedFile } from '../types';
import { FileType, Role } from '../types';
import { useAuth } from '../hooks/useAuth';

// Corrected: Use computed property names with the FileType enum for keys.
const ICONS: Record<FileType, string> = {
    [FileType.IMAGE]: 'fa-file-image text-blue-500',
    [FileType.DOC]: 'fa-file-word text-blue-700',
    [FileType.PDF]: 'fa-file-pdf text-red-500',
    [FileType.SPREADSHEET]: 'fa-file-excel text-green-600',
};

// --- Helper Functions ---
const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFileType = (fileName: string): FileType => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    // Corrected: Return FileType enum members instead of raw strings.
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) return FileType.IMAGE;
    if (['doc', 'docx', 'rtf', 'txt'].includes(extension)) return FileType.DOC;
    if (['pdf'].includes(extension)) return FileType.PDF;
    if (['xls', 'xlsx', 'csv'].includes(extension)) return FileType.SPREADSHEET;
    return FileType.DOC; // Default for unknown types
};

interface FileCardProps extends ManagedFile {
    onDelete: (id: string) => void;
    onDownload: (file: ManagedFile) => void;
    onCopyLink: (file: ManagedFile) => void;
    isAdmin: boolean;
}
const FileCard: React.FC<FileCardProps> = ({ id, name, size, date, type, onDelete, onDownload, onCopyLink, isAdmin }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg text-center hover:shadow-md transition">
        <div className="text-4xl mb-2">
            <i className={`fas ${ICONS[type]}`}></i>
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={name}>{name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{size} - {date}</p>
        <div className="mt-3 space-x-2">
            <button onClick={() => onDownload({ id, name, size, date, type })} className="text-primary hover:text-blue-800 text-sm" title="Download"><i className="fas fa-download"></i></button>
            <button onClick={() => onCopyLink({ id, name, size, date, type })} className="text-slate-600 hover:text-slate-800 text-sm" title="Copy Link"><i className="fas fa-link"></i></button>
            {isAdmin && (
                <button onClick={() => onDelete(id)} className="text-red-600 hover:text-red-800 text-sm" title="Delete"><i className="fas fa-trash"></i></button>
            )}
        </div>
    </div>
);

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    error?: string;
}

interface FileManagerProps {
    globalFilter: string;
    files: ManagedFile[];
    onFileAdd: (file: ManagedFile) => void;
    onFileDelete: (fileId: string) => void;
}

const FileManager: React.FC<FileManagerProps> = ({ globalFilter, files, onFileAdd, onFileDelete }) => {
    const { realUser } = useAuth();
    const isAdmin = realUser?.role === Role.ADMIN;

    const [isUploadVisible, setUploadVisible] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

    const filteredFiles = useMemo(() => {
        if (!globalFilter) return files;
        const lowercasedFilter = globalFilter.toLowerCase();
        return files.filter(file => file.name.toLowerCase().includes(lowercasedFilter));
    }, [globalFilter, files]);

    const stats = useMemo(() => {
        return {
            totalFiles: files.length,
            // Corrected: Compare against enum member for type safety.
            totalImages: files.filter(f => f.type === FileType.IMAGE).length,
            totalDocuments: files.filter(f => f.type !== FileType.IMAGE).length,
        }
    }, [files]);
    
    const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;
        if (!isUploadVisible) setUploadVisible(true);

        const processFile = (file: File) => {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert(`File "${file.name}" is too large (max 10MB) and will be skipped.`);
                return;
            }

            const id = `upload_${file.name}_${Date.now()}`;
            setUploadingFiles(prev => [...prev, { id, file, progress: 0 }]);

            const reader = new FileReader();

            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    setUploadingFiles(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
                }
            };

            reader.onload = () => {
                const newFile: ManagedFile = {
                    id: `FILE_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    name: file.name,
                    size: formatBytes(file.size),
                    date: new Date().toISOString().split('T')[0],
                    type: getFileType(file.name),
                };
                onFileAdd(newFile);
                setUploadingFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 100 } : f));
                setTimeout(() => {
                    setUploadingFiles(prev => prev.filter(f => f.id !== id));
                }, 2000);
            };

            reader.onerror = () => {
                console.error(`Failed to read file: ${file.name}`);
                setUploadingFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 100, error: 'Upload Failed' } : f));
            };

            reader.readAsArrayBuffer(file);
        };

        Array.from(selectedFiles).forEach(processFile);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onFileAdd, isUploadVisible]);
    
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const handleFileDownload = (file: ManagedFile) => {
        const dummyContent = `This is a simulated file download for:

Name: ${file.name}
Size: ${file.size}
Type: ${file.type}
Date: ${file.date}`;
        const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name.includes('.') ? file.name : `${file.name}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert(`Simulating download for "${file.name}"...`);
    };

    const handleCopyLink = (file: ManagedFile) => {
        const dummyUrl = `https://vistaran.in/files/${file.id}/${file.name}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(dummyUrl).then(() => {
                alert(`Link for "${file.name}" copied to clipboard!`);
            }, (err) => {
                console.error('Could not copy link: ', err);
                alert('Failed to copy link.');
            });
        } else {
             alert('Copy to clipboard is not supported in this browser or context.');
        }
    };
    
    const handleExportList = () => {
        if (files.length === 0) {
            alert("There are no files to export.");
            return;
        }

        const headers = ['ID', 'Name', 'Size', 'Type', 'Date'];
        const rows = files.map(file => 
            [
                file.id,
                `"${file.name.replace(/"/g, '""')}"`,
                file.size,
                file.type,
                file.date
            ].join(',')
        );
        const csvContent = [headers.join(','), ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'file-manager-export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`File list has started downloading.`);
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">File Manager</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setUploadVisible(p => !p)} className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center gap-2">
                        <i className="fas fa-upload"></i> Upload Files
                    </button>
                     <button onClick={handleExportList} className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                        <i className="fas fa-file-csv"></i> Export List
                    </button>
                    <button onClick={() => alert("Refreshing files...")} className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition flex items-center gap-2">
                        <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </header>
            
            {isUploadVisible && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Upload Files</h3>
                     <div 
                        className={`p-8 text-center rounded-lg transition-colors duration-300 border-2 border-dashed ${isDragging ? 'bg-primary-light dark:dark:bg-primary-light-dark border-primary' : 'border-slate-300 dark:border-slate-700'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                     >
                        <i className="fas fa-cloud-upload-alt text-4xl text-slate-400"></i>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">Drag & drop files here or <span className="font-semibold text-primary cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>browse</span></p>
                        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files)} />
                        <small className="text-slate-400">Max file size: 10MB</small>
                     </div>
                     {uploadingFiles.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">Uploads in Progress</h4>
                            {uploadingFiles.map(upload => (
                                <div key={upload.id}>
                                    <div className="flex justify-between items-center text-sm">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">{upload.file.name}</p>
                                        {upload.error ? (
                                            <p className="text-red-500 font-bold">{upload.error}</p>
                                        ) : (
                                            <p className="text-slate-500 dark:text-slate-400">{upload.progress}%</p>
                                        )}
                                    </div>
                                    <div className="relative pt-1">
                                        <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-200 dark:bg-slate-700">
                                            <div style={{ width: `${upload.progress}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-300 ${
                                                upload.error ? 'bg-red-500' : upload.progress === 100 ? 'bg-green-500' : 'bg-primary'
                                            }`}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                    <div><h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalFiles}</h4><p className="text-sm text-slate-500 dark:text-slate-400">Total Files</p></div>
                    <div><h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalImages}</h4><p className="text-sm text-slate-500 dark:text-slate-400">Images</p></div>
                    <div><h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalDocuments}</h4><p className="text-sm text-slate-500 dark:text-slate-400">Documents</p></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredFiles.map(file => (
                        <FileCard 
                            key={file.id} 
                            {...file} 
                            onDelete={onFileDelete} 
                            onDownload={handleFileDownload}
                            onCopyLink={handleCopyLink}
                            isAdmin={isAdmin} 
                        />
                    ))}
                </div>
                {files.length === 0 && (
                     <p className="text-center p-8 text-slate-500 dark:text-slate-400">
                        No files have been uploaded yet.
                    </p>
                )}
                {files.length > 0 && filteredFiles.length === 0 && (
                    <p className="text-center p-8 text-slate-500 dark:text-slate-400">
                        No files found for "{globalFilter}".
                    </p>
                )}
            </div>
        </div>
    );
};

export default FileManager;