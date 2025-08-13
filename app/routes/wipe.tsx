import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "~/lib/store";
import {
  useFsReadirQuery,
  useFsDeleteMutation,
  useKvFlushMutation,
} from "~/lib/puterApiSlice";

const WipeApp = () => {
  const navigate = useNavigate();
  const { auth, puterReady } = useSelector((state: RootState) => state.puter);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");

  // Query to load files from root directory (note: using the correct hook name from your API)
  const {
    data: files = [],
    isLoading: isLoadingFiles,
    error: filesError,
    refetch: refetchFiles,
  } = useFsReadirQuery("./", {
    skip: !auth.isAuthenticated, // Only fetch when authenticated
  });

  // Mutations for delete operations
  const [fsDelete] = useFsDeleteMutation();
  const [kvFlush] = useKvFlushMutation();

  // Handle authentication redirect
  useEffect(() => {
    if (puterReady && !auth.isAuthenticated) {
      navigate("/auth?next=/wipe");
    }
  }, [puterReady, auth.isAuthenticated, navigate]);

  const handleDelete = async () => {
    if (!files.length) {
      setDeleteStatus("No files to delete");
      return;
    }

    setIsDeleting(true);
    setDeleteStatus("Deleting files...");

    try {
      // Delete all files sequentially to avoid overwhelming the system
      for (const file of files) {
        setDeleteStatus(`Deleting ${file.name}...`);
        try {
          await fsDelete(file.path).unwrap();
        } catch (error) {
          console.error(`Failed to delete ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      // Flush KV store
      setDeleteStatus("Clearing key-value store...");
      await kvFlush().unwrap();

      setDeleteStatus("Refreshing file list...");
      // Refetch files to update the UI
      await refetchFiles();

      setDeleteStatus("App data wiped successfully!");
      setTimeout(() => setDeleteStatus(""), 3000);
    } catch (error) {
      console.error("Error during deletion:", error);
      setDeleteStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state (only show loading if puter is not ready or files are loading)
  if (!puterReady || isLoadingFiles) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Error state
  if (filesError) {
    return (
      <div className="p-8">
        <div className="text-red-600">
          Error: {(filesError as any)?.message || 'Failed to load files'}
        </div>
        <button
          onClick={() => refetchFiles()}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">App Data Management</h1>
        <p className="text-gray-600">
          Authenticated as: <span className="font-semibold">{auth.user?.username}</span>
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Existing files ({files.length}):
        </h2>
        {files.length === 0 ? (
          <p className="text-gray-500 italic">No files found</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto border rounded-md p-4">
            {files.map((file) => (
              <div key={file.id} className="flex flex-row justify-between items-center p-2 border-b last:border-b-0">
                <div className="flex flex-col">
                  <span className="font-medium">{file.name}</span>
                  <span className="text-sm text-gray-500">{file.path}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {file.size ? `${Math.round(file.size / 1024)}KB` : 'Directory'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status message */}
      {deleteStatus && (
        <div className={`mb-4 p-3 rounded-md ${
          deleteStatus.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : deleteStatus.includes('successfully')
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {deleteStatus}
        </div>
      )}

      <div className="space-x-4">
        <button
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            isDeleting || files.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          onClick={handleDelete}
          disabled={isDeleting || files.length === 0}
        >
          {isDeleting ? 'Deleting...' : 'Wipe App Data'}
        </button>

        <button
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          onClick={() => refetchFiles()}
          disabled={isDeleting}
        >
          Refresh Files
        </button>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>

      {/* Confirmation warning */}
      {files.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
          <p className="text-yellow-800 text-sm">
            ⚠️ <strong>Warning:</strong> This action will permanently delete all your uploaded files and stored data. This cannot be undone.
          </p>
        </div>
      )}
    </div>
  );
};

export default WipeApp;