"use client";

import { useEffect, useState } from "react";
import { FileArchive, FileText, Plus, Loader2, LucideDownload, LucideScanEye, LucideTrash2, LucideImage, LucideLink, SquareArrowOutUpRight, LucideCopy, LucideCopyCheck, LucideLoader } from "lucide-react";
import toast from "react-hot-toast";

function AssetsCard({ imageLink, userImage, url, title, author, viewLink, handleDelete, type, createdAt }: any) {
  const [isCopied, setIsCopied] = useState(false);

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl; link.download = `${title}.jpg`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl);
      toast.success("Downloaded successfully");
    } catch { toast.error("Download failed"); }
  };

  const getIcon = (type: string) => {
    if (type === "image") return <LucideImage size={14} style={{ color: "var(--text-muted)" }} />;
    if (type === "zip") return <FileArchive size={14} style={{ color: "var(--text-muted)" }} />;
    if (type === "link") return <LucideLink size={14} style={{ color: "var(--text-muted)" }} />;
    return <FileText size={14} style={{ color: "var(--text-muted)" }} />;
  };

  const copyTextToClipboard = async (link: string) => {
    try { await navigator.clipboard.writeText(link); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }
    catch (err) { console.error("Failed to copy:", err); }
  };

  return (
    <div className="relative w-full rounded-2xl border border-[var(--border)] overflow-hidden bg-white" style={{ height: "320px" }}>
      <img src={type === "link" ? "/globe.svg" : imageLink} alt={title} className="w-full h-full object-cover" />
      <div className="absolute bottom-0 w-full" style={{ background: "linear-gradient(to top, rgba(5,10,48,0.95) 60%, transparent)" }}>
        <div className="px-5 py-4">
          <p className="flex items-center gap-1.5 text-xs font-inter mb-1" style={{ color: "var(--text-muted)" }}>{getIcon(type)} {type}</p>
          <p className="text-white font-semibold font-inter text-base">{title}</p>
          <p className="text-xs font-inter mt-0.5" style={{ color: "var(--text-muted)" }}>Uploaded: {createdAt?.split("T")[0]}</p>
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden border" style={{ background: "var(--primary-light)", borderColor: "#ffd9a8" }}>
                {userImage ? <img src={userImage} alt="Avatar" className="w-full h-full object-cover rounded-full" /> : <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{author?.charAt(0) || "A"}</span>}
              </div>
              <p className="text-xs font-inter text-white">{author || "ADMIN"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDelete} className="w-7 h-7 text-white hover:text-red-400 flex items-center justify-center transition-colors"><LucideTrash2 size={16} /></button>
              <button onClick={() => type === "link" ? copyTextToClipboard(url) : viewLink()} className="w-7 h-7 text-white hover:text-[var(--primary)] flex items-center justify-center transition-colors">
                {type === "link" ? (isCopied ? <LucideCopyCheck size={16} /> : <LucideCopy size={16} />) : <LucideScanEye size={16} />}
              </button>
              <button
                onClick={type === "link" ? () => { try { let u = url?.trim() || ""; if (u && !u.startsWith("http")) u = "https://" + u; if (u) { new URL(u); window.open(u, "_blank"); } } catch { if (url) window.open(url, "_blank"); } } : () => handleDownload(imageLink, title)}
                className="w-7 h-7 bg-white hover:scale-90 hover:bg-[var(--primary)] transition-all flex items-center justify-center rounded-full"
                style={{ color: "var(--text-primary)" }}
              >
                {type === "link" ? <SquareArrowOutUpRight size={12} /> : <LucideDownload size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetsTab({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [clientAssetsOpen, setClientAssetsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("image");
  const [clientAssetType, setClientAssetType] = useState("design");
  const [clientPreviewType, setClientPreviewType] = useState("image");
  const [title, setTitle] = useState("");
  const [clientTitle, setClientTitle] = useState("");
  const [clientFile, setClientFile] = useState<File | null>(null);
  const [clientLiveUrl, setClientLiveUrl] = useState("");
  const [user, setUser] = useState("");
  const [image, setImage] = useState("");
  const [url, setUrl] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);

  const checkUserRole = async () => {
    try {
      const data = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
      if (data && data.role.name === "ADMIN") { setImage(data.image); setUser(data.name); setIsAdmin(true); }
    } catch { }
  };

  useEffect(() => { checkUserRole(); fetchClientId(); fetchAssets(); }, [projectId]);

  const fetchClientId = async () => {
    try {
      const res = await fetch(`/api/project/${projectId}`);
      const data = await res.json();
      if (data.success && data.project.members) {
        const c = data.project.members.find((m: any) => m.user.role === "CLIENT");
        if (c) setClientId(c.user.id);
      }
    } catch { }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch(`/api/project/assets?projectId=${projectId}`);
      const data = await res.json();
      if (data.success) setAssets(data.assets);
    } catch { } finally { setLoading(false); }
  };

  const uploadAsset = async () => {
    if (!title) { toast.error("Please give a title"); return; }
    if (type === "link" && !url) { toast.error("Please provide a URL"); return; }
    if (type !== "link" && !file) { toast.error("Please select a file"); return; }
    const formData = new FormData();
    formData.append("projectId", projectId); formData.append("type", type); formData.append("title", title);
    formData.append("uploadedBy", user); formData.append("userImage", image);
    if (type === "link") formData.append("url", url);
    else { formData.append("file", file!); formData.append("url", ""); }
    try {
      setUploading(true);
      const res = await fetch("/api/project/assets", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) { setOpen(false); setFile(null); setTitle(""); setUrl(""); await fetchAssets(); toast.success("Asset uploaded!"); }
      else toast.error(data.message || "Upload failed");
    } catch { toast.error("Upload failed"); } finally { setUploading(false); }
  };

  const uploadClientAsset = async () => {
    if (!clientTitle) { toast.error("Please provide a title"); return; }
    if (clientPreviewType === "link" && !clientLiveUrl) { toast.error("Please provide a URL"); return; }
    if (clientPreviewType !== "link" && !clientFile) { toast.error("Please select a file"); return; }
    const formData = new FormData();
    formData.append("projectId", projectId); formData.append("type", clientAssetType);
    formData.append("previewType", clientPreviewType); formData.append("title", clientTitle); formData.append("uploadedBy", user);
    if (clientFile) formData.append("file", clientFile);
    if (clientLiveUrl) formData.append("liveUrl", clientLiveUrl);
    try {
      setUploading(true);
      const res = await fetch("/api/client/analytics/design-preview", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) { setClientAssetsOpen(false); setClientFile(null); setClientTitle(""); setClientLiveUrl(""); await fetchAssets(); toast.success("Client asset uploaded!"); }
      else toast.error(data.message || "Upload failed");
    } catch { toast.error("Upload failed"); } finally { setUploading(false); }
  };

  const deleteAsset = async (assetId: string) => {
    if (!confirm("Delete this asset?")) return;
    try {
      const res = await fetch("/api/project/assets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetId }) });
      const data = await res.json();
      if (data.success) { await fetchAssets(); toast.success("Asset deleted!"); }
      else toast.error(data.message || "Failed to delete");
    } catch { toast.error("Failed to delete asset"); }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white border border-[var(--border)] font-inter text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";
  const labelCls = "block text-sm font-medium font-inter mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-id" style={{ color: "var(--text-primary)" }}>Assets</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setOpen(true)} className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm" style={{ background: "var(--primary)" }}>
              <Plus size={16} /> Upload Asset
            </button>
            {clientId && (
              <button onClick={() => setClientAssetsOpen(true)} className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm bg-green-600 hover:bg-green-700">
                <Plus size={16} /> Client Assets
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="w-full h-[50vh] flex justify-center items-center">
          <LucideLoader className="animate-spin" style={{ color: "var(--primary)" }} size={40} />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 font-inter text-sm" style={{ color: "var(--text-muted)" }}>No assets uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {assets.map((a) => (
            <AssetsCard key={a.id} imageLink={a.url} author={a.uploadedBy} userImage={a.userImage} viewLink={() => window.open(a.url, "_blank")} title={a.title} handleDelete={() => deleteAsset(a.id)} type={a.type} createdAt={a.createdAt} url={a.url} />
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 text-black">
          <div className="bg-white p-6 rounded-xl max-w-md w-full border border-[var(--border)] shadow-lg">
            <h2 className="text-lg font-semibold font-inter mb-4" style={{ color: "var(--text-primary)" }}>Upload Asset</h2>
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputCls} mb-3`} />
            <label className={`${labelCls}`} style={{ color: "var(--text-secondary)" }}>Select Type</label>
            <select className={`${inputCls} mb-3`} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="image">Image</option>
              <option value="zip">Zip</option>
              <option value="document">Document</option>
              <option value="link">Link</option>
            </select>
            {type === "link"
              ? <input type="text" placeholder="Paste your URL" value={url} onChange={(e) => setUrl(e.target.value)} className={`${inputCls} mb-3`} />
              : <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-3 text-sm font-inter" style={{ color: "var(--text-secondary)" }} />
            }
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg font-inter text-sm" style={{ color: "var(--text-secondary)" }}>Cancel</button>
              <button disabled={uploading} onClick={uploadAsset} className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm disabled:opacity-40" style={{ background: "var(--primary)" }}>
                {uploading && <Loader2 className="animate-spin" size={14} />} Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {clientAssetsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full border border-[var(--border)] shadow-lg">
            <h2 className="text-lg font-semibold font-inter mb-4" style={{ color: "var(--text-primary)" }}>Upload Client Asset</h2>
            <input type="text" placeholder="Title" value={clientTitle} onChange={(e) => setClientTitle(e.target.value)} className={`${inputCls} mb-3`} />
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Asset Type</label>
            <select className={`${inputCls} mb-3`} value={clientAssetType} onChange={(e) => setClientAssetType(e.target.value)}>
              <option value="design">Design</option>
              <option value="preview">Live Preview</option>
            </select>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>{clientAssetType === "design" ? "Design Type" : "Preview Type"}</label>
            <select className={`${inputCls} mb-3`} value={clientPreviewType} onChange={(e) => setClientPreviewType(e.target.value)}>
              <option value="image">Image</option>
              <option value="figma">Figma</option>
              <option value="link">{clientAssetType === "design" ? "Design Link" : "Live Link"}</option>
            </select>
            {clientPreviewType === "link"
              ? <input type="text" placeholder="Live URL" value={clientLiveUrl} onChange={(e) => setClientLiveUrl(e.target.value)} className={`${inputCls} mb-3`} />
              : <input type="file" onChange={(e) => setClientFile(e.target.files?.[0] || null)} className="mb-3 text-sm font-inter" style={{ color: "var(--text-secondary)" }} />
            }
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setClientAssetsOpen(false)} className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg font-inter text-sm" style={{ color: "var(--text-secondary)" }}>Cancel</button>
              <button disabled={uploading} onClick={uploadClientAsset} className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-inter text-sm disabled:opacity-40 bg-green-600 hover:bg-green-700">
                {uploading && <Loader2 className="animate-spin" size={14} />} Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
