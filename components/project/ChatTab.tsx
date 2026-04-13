"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, Pencil, Trash2, X, Check, ChevronUp } from "lucide-react";
import { getSocket } from "@/lib/socket";

interface Sender {
  id: string;
  name: string | null;
  role: string;
  image: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  isEdited: boolean;
  createdAt: string;
  sender: Sender;
}

export default function ChatTab({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";
  const bottomRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  const loadMessages = useCallback(async (cursor?: string) => {
    const url = `/api/chat/${projectId}${cursor ? `?cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      if (cursor) {
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
      setNextCursor(data.nextCursor);
    }
  }, [projectId]);

  // Join room + load history on mount
  useEffect(() => {
    console.log("USER ID:", userId);
    if (!userId || !projectId) return;
    socket.emit("join_project", { projectId, userId });
    loadMessages();
    return () => { socket.emit("leave_project", { projectId }); };
  }, [projectId, userId, socket, loadMessages]);

  // Socket listeners
  useEffect(() => {
    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    socket.on("message_edited", (updated: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    });
    socket.on("message_deleted", ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });
    socket.on("message_error", ({ message }: { message: string }) => setError(message));
    return () => {
      socket.off("receive_message");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("message_error");
    };
  }, [socket]);

  const sendMessage = () => {
    if (!input.trim() || !userId) return;
    setError(null);
    socket.emit("send_message", { projectId, senderId: userId, content: input.trim() });
    setInput("");
  };

  const submitEdit = (messageId: string) => {
    if (!editContent.trim() || !userId) return;
    setError(null);
    socket.emit("edit_message", { messageId, senderId: userId, content: editContent.trim() });
    setEditingId(null);
  };

  const deleteMessage = (messageId: string) => {
    if (!userId) return;
    socket.emit("delete_message", { messageId, senderId: userId });
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    await loadMessages(nextCursor);
    setLoadingMore(false);
  };

  const initials = (name: string | null) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col bg-white border border-[var(--border)]" style={{ height: "calc(100vh - 220px)" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {nextCursor && (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-1 text-xs font-inter text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              <ChevronUp size={14} />
              {loadingMore ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs font-inter text-[var(--text-muted)]">No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === userId;
          return (
            <div key={msg.id} className={`flex gap-2.5 group ${isOwn ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 shrink-0 flex items-center justify-center bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-bold font-id overflow-hidden">
                {msg.sender.image
                  ? <img src={msg.sender.image} className="w-7 h-7 object-cover" alt="" />
                  : initials(msg.sender.name)
                }
              </div>

              <div className={`max-w-[65%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] font-inter text-[var(--text-muted)]">{msg.sender.name ?? "Unknown"}</span>
                  <span className="text-[10px] font-inter text-[var(--text-muted)]">{formatTime(msg.createdAt)}</span>
                  {msg.isEdited && <span className="text-[9px] font-inter text-[var(--text-muted)] italic">edited</span>}
                </div>

                {editingId === msg.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitEdit(msg.id)}
                      className="text-xs font-inter border border-[var(--border)] px-2 py-1.5 outline-none focus:border-[var(--primary)] w-48 text-gray-900"
                      autoFocus
                    />
                    <button onClick={() => submitEdit(msg.id)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  </div>
                ) : (
                  <div className={`relative px-3 py-2 text-xs font-inter leading-relaxed
                    ${isOwn ? "bg-[var(--primary)] text-white" : "bg-gray-100 text-[var(--text-primary)]"}`}
                  >
                    {msg.content}
                    {isOwn && (
                      <div className="absolute -top-5 right-0 hidden group-hover:flex items-center gap-1 bg-white border border-[var(--border)] shadow-sm px-1.5 py-0.5">
                        <button onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }} className="text-gray-400 hover:text-[var(--primary)] transition-colors">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => deleteMessage(msg.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-2 px-3 py-2 bg-red-50 border border-red-200 flex items-center justify-between">
          <p className="text-xs font-inter text-red-600">{error}</p>
          <button onClick={() => setError(null)}><X size={13} className="text-red-400" /></button>
        </div>
      )}


      {/* // In the input section at the bottom: */}
      {!isAdmin && (
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 text-gray-900 text-sm font-inter border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)] transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-9 h-9 bg-[var(--primary)] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#f09d3e] transition-colors shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="px-5 py-3 border-t border-[var(--border)]">
          <p className="text-xs font-inter text-[var(--text-muted)] text-center">
            You are viewing this chat as an admin (read-only)
          </p>
        </div>
      )}
    </div>
  );
}
