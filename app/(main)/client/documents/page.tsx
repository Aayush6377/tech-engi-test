'use client';

import { useState, useEffect } from 'react';
import { Download, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '@/components/common/Loading';

interface DocumentItem {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  Projects: {
    id: string;
    name: string;
  };
  User: {
    name: string;
  }
}

interface ProjectItem {
  id: string;
  name: string;
}

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingPro, setLoadingPro] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [newDoc, setNewDoc] = useState<{ title: string; file: File | null; projectId: string }>({ 
    title: "", 
    file: null, 
    projectId: "all" 
  });


  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/client/documents?userOnly=true');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async () => {
    if (!newDoc.title || !newDoc.file) {
      toast.error('Please fill all fields');
      return;
    }

    const formData = new FormData();
    formData.append('title', newDoc.title);
    formData.append('file', newDoc.file);
    formData.append('projectId', newDoc.projectId);

    try {
      setLoadingPro(true);
      const res = await fetch('/api/client/documents', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        toast.success('Document uploaded successfully');
        setAddModal(false);
        setNewDoc({ title: "", file: null, projectId: "" });
        fetchDocuments();
      }
    } catch (error) {
      toast.error('Failed to upload document');
    }
    finally {
      setLoadingPro(false);
    }
  };

  const handleDownload = (imageUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Certificate downloaded successfully');
  };

  const fetchProjects = async () => {
    try {
      setLoadingPro(true);
      const res = await fetch('/api/project?userOnly=true');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects');
    }
    finally {
      setLoadingPro(false);
    }
  };


  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);


  const filterDocument = documents.filter(v => v.Projects.id === newDoc.projectId)
  if (loading) {
    return (
      <div className="h-[80vh] flex justify-center items-center bg-gray-50 dark:bg-gray-900 w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 relative">
      {addModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-[9999]">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-lg">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Document
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Document Title</label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full p-3 mt-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter document title"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Select Project</label>
                <select
                  value={newDoc.projectId}
                  onChange={(e) => setNewDoc({ ...newDoc, projectId: e.target.value })}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  <option value="" disabled={loading}>{loading ? "Loading..." : "Select project"}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Upload File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files?.[0] || null })}
                  className="w-full p-3 mt-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Supported: PDF, DOC, DOCX, JPG, PNG, TXT</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setAddModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>

              <button
                onClick={isLoadingPro ? () => { } : addDocument}
                disabled={!newDoc.title || !newDoc.file || !newDoc.projectId || isLoadingPro}
                className={`px-4 py-2 rounded-lg text-sm text-white ${!newDoc.title || !newDoc.file
                    ? "bg-[var(--primary)] cursor-not-allowed"
                    : "bg-[var(--primary-light)] hover:bg-[var(--primary)]"
                  }`}
              >
                {isLoadingPro ? "Uploading..." : "Add Document"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="w-full items-center flex justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Documents
            </h1>
            <div className="flex justify-between items-center gap-4">
              <select
                value={newDoc.projectId}
                onChange={(e) => setNewDoc({ ...newDoc, projectId: e.target.value })}
                className="w-full py-2 px-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="all" disabled={loading}>{loading ? "Loading..." : "Select project"}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAddModal(true)}
                className="px-4 w-fit py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-light)] hover:text-[var(--text-primary)] cursor-pointer text-white text-sm flex items-center gap-2"
              >
                <Plus size={18} /> <p>Add</p>
              </button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Download and View Your Documents Regarding Ptojects.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No documents available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Documents will appear here when they are available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(newDoc.projectId !== "all" ? filterDocument : documents).map((cert) => (
              <div key={cert.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-4">
                  {cert.Projects && (
                    <div className="flex justify-between items-center">
                      <p className="text-blue-400 dark:text-blue-400 text-sm line-clamp-2">
                        {cert.Projects.name}
                      </p>

                      <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">
                        {new Date(cert.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>

                    </div>
                  )}
                  <h3 className="font-semibold text-lg dark:text-white line-clamp-1">
                    {cert.title}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Uploaded By: {cert.User.name}
                  </span>
                  <button
                    onClick={() => handleDownload(cert.fileUrl, cert.title)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}