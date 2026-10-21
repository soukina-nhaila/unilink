"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Search, Phone, Video, Info, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { messagesAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { timeAgo } from "@/lib/utils";

interface Msg {
  id: string; content: string;
  senderId: string; receiverId: string;
  read: boolean; createdAt: string;
}
interface Conv {
  id: string; participant: any;
  lastMessage: any; unreadCount: number;
}

export default function MessagesPage() {
  const { user }     = useAuth();
  const searchParams = useSearchParams();
  const withUserId   = searchParams.get("with");

  const [convs,    setConvs]    = useState<Conv[]>([]);
  const [active,   setActive]   = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text,     setText]     = useState("");
  const [loadingC, setLoadingC] = useState(true);
  const [loadingM, setLoadingM] = useState(false);
  const [sending,  setSending]  = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef  = useRef(0);
  const pollRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef        = useRef<Conv | null>(null);

  useEffect(() => { activeRef.current = active; }, [active]);

  const scrollToBottom = (force = false) => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (force || isAtBottom) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    const newCount = messages.length;
    const wasEmpty = prevMsgCountRef.current === 0;
    const hasNew   = newCount > prevMsgCountRef.current;
    prevMsgCountRef.current = newCount;
    if (wasEmpty || hasNew) scrollToBottom(wasEmpty);
  }, [messages]);

  const loadConversations = useCallback(async () => {
    try {
      const res  = await messagesAPI.getConversations();
      const list: Conv[] = res.data.conversations ?? [];
      setConvs(list);
      return list;
    } catch {
      return [];
    } finally {
      setLoadingC(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const list = await loadConversations();

      if (withUserId) {
        // Conversation existante → la sélectionner
        const existing = list.find((c) => c.participant.id === withUserId);
        if (existing) { setActive(existing); return; }

        // Nouvelle conversation → charger le profil et créer conv virtuelle
        try {
          const uRes   = await usersAPI.getProfile(withUserId);
          const partner = uRes.data;
          const virtualConv: Conv = {
            id: `new_${withUserId}`,
            participant: partner,
            lastMessage: null,
            unreadCount: 0,
          };
          setConvs((prev) => {
            const exists = prev.find((c) => c.participant.id === withUserId);
            return exists ? prev : [virtualConv, ...prev];
          });
          setActive(virtualConv);
        } catch {}
        return;
      }

      // Pas de ?with= : sélectionner la première conv
      if (list.length > 0 && !activeRef.current) setActive(list[0]);
    })();
  }, [withUserId, loadConversations]);

  const loadMessages = useCallback(async (partnerId: string, isPolling = false) => {
    try {
      const res     = await messagesAPI.getMessages(partnerId);
      const newMsgs: Msg[] = res.data.messages ?? [];
      setMessages((prev) => {
        if (isPolling && prev.length === newMsgs.length) return prev;
        return newMsgs;
      });
      setConvs((prev) =>
          prev.map((c) => c.participant.id === partnerId ? { ...c, unreadCount: 0 } : c)
      );
    } catch {}
  }, []);

  useEffect(() => {
    if (!active) return;
    setMessages([]);
    prevMsgCountRef.current = 0;
    setLoadingM(true);
    loadMessages(active.participant.id).finally(() => setLoadingM(false));

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      const cur = activeRef.current;
      if (cur) loadMessages(cur.participant.id, true);
    }, 4000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [active?.participant.id, loadMessages]);

  const handleSend = async () => {
    if (!text.trim() || !active || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);

    const tempMsg: Msg = {
      id: `temp_${Date.now()}`,
      senderId: user!.id, receiverId: active.participant.id,
      content, read: false, createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res      = await messagesAPI.send(active.participant.id, content);
      const realMsg: Msg = res.data;
      setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? realMsg : m));
      setConvs((prev) => {
        const updated = { ...active, id: `conv_${active.participant.id}`, lastMessage: realMsg };
        const exists  = prev.find((c) => c.participant.id === active.participant.id);
        return exists
            ? prev.map((c) => c.participant.id === active.participant.id ? updated : c)
            : [updated, ...prev];
      });
      setActive((prev) => prev ? { ...prev, id: `conv_${active.participant.id}`, lastMessage: realMsg } : prev);
    } catch {
      setText(content);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleSelectConv = (conv: Conv) => {
    if (active?.participant.id === conv.participant.id) return;
    setActive(conv);
  };

  return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-1 mb-5">Messages 💬</h1>

        <div className="card p-0 overflow-hidden"
             style={{ height: "calc(100vh - 160px)", display: "grid", gridTemplateColumns: "280px 1fr" }}>

          {/* ── Liste conversations ── */}
          <div style={{ borderRight: "1px solid #E8E5FF", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ padding: 12, borderBottom: "1px solid #E8E5FF", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A09DBF" }} />
                <input type="text" placeholder="Rechercher..."
                       style={{ width: "100%", border: "1px solid #E8E5FF", borderRadius: 8, padding: "7px 10px 7px 28px", fontSize: 12, fontFamily: "Sora, sans-serif", outline: "none" }} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {loadingC ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Spinner /></div>
              ) : convs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "#A09DBF", fontSize: 12 }}>
                    <MessageCircle size={28} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                    <p>Aucune conversation</p>
                    <p style={{ marginTop: 4 }}>Visite un profil pour envoyer un message</p>
                  </div>
              ) : convs.map((conv) => {
                const isAct = active?.participant.id === conv.participant.id;
                return (
                    <div key={conv.id} onClick={() => handleSelectConv(conv)}
                         style={{
                           display: "flex", alignItems: "center", gap: 10,
                           padding: 12, cursor: "pointer",
                           borderBottom: "1px solid #F1EFF8",
                           background: isAct ? "#EDE9FE" : "transparent",
                           transition: "background 150ms",
                         }}
                         onMouseEnter={(e) => { if (!isAct) (e.currentTarget as HTMLElement).style.background = "#F8F7FF"; }}
                         onMouseLeave={(e) => { if (!isAct) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar user={conv.participant} size="sm" />
                        {conv.participant.isOnline && (
                            <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#34D399", borderRadius: "50%", border: "2px solid white" }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: isAct ? "#6C4FF6" : "#1A1333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {conv.participant.firstName} {conv.participant.lastName}
                          </p>
                          {conv.lastMessage && (
                              <p style={{ fontSize: 10, color: "#A09DBF", fontFamily: "monospace", flexShrink: 0, marginLeft: 4 }}>
                                {timeAgo(conv.lastMessage.createdAt)}
                              </p>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "#A09DBF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                          {conv.lastMessage?.content ?? "Nouvelle conversation..."}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                          <span style={{ background: "#6C4FF6", color: "white", fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {conv.unreadCount}
                    </span>
                      )}
                    </div>
                );
              })}
            </div>
          </div>

          {/* ── Zone chat ── */}
          {active ? (
              <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #E8E5FF", background: "white", flexShrink: 0 }}>
                  <div style={{ position: "relative" }}>
                    <Avatar user={active.participant} size="sm" />
                    {active.participant.isOnline && (
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#34D399", borderRadius: "50%", border: "2px solid white" }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1333" }}>
                      {active.participant.firstName} {active.participant.lastName}
                    </p>
                    <p style={{ fontSize: 11, color: active.participant.isOnline ? "#34D399" : "#A09DBF", fontWeight: 600 }}>
                      {active.participant.isOnline ? "En ligne" : "Hors ligne"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[Phone, Video, Info].map((Icon, i) => (
                        <button key={i}
                                style={{ padding: 8, borderRadius: 8, color: "#A09DBF", background: "none", border: "none", cursor: "pointer" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F8F7FF"; (e.currentTarget as HTMLElement).style.color = "#6C4FF6"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "#A09DBF"; }}>
                          <Icon size={16} />
                        </button>
                    ))}
                  </div>
                </div>

                <div ref={chatContainerRef}
                     style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {loadingM ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Spinner /></div>
                  ) : messages.length === 0 ? (
                      <div style={{ textAlign: "center", margin: "auto", color: "#A09DBF" }}>
                        <p style={{ fontSize: 32, marginBottom: 8 }}>👋</p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1333" }}>
                          Début de la conversation avec {active.participant.firstName}
                        </p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>Envoie ton premier message !</p>
                      </div>
                  ) : messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                          {!isMe && <Avatar user={active.participant} size="xs" />}
                          <div style={{
                            maxWidth: "70%", padding: "10px 14px",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: isMe ? "#6C4FF6" : "#F1EFF8",
                            color: isMe ? "white" : "#1A1333",
                          }}>
                            <p style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.content}</p>
                            <p style={{ fontSize: 10, marginTop: 4, opacity: 0.7, fontFamily: "monospace", textAlign: "right" }}>
                              {timeAgo(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                    );
                  })}
                </div>

                <div style={{ padding: "12px 16px", borderTop: "1px solid #E8E5FF", background: "white", display: "flex", gap: 8, flexShrink: 0 }}>
                  <input type="text" value={text}
                         onChange={(e) => setText(e.target.value)}
                         onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                         placeholder={`Message à ${active.participant.firstName}...`}
                         style={{ flex: 1, border: "1px solid #E8E5FF", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "Sora, sans-serif", outline: "none" }}
                         onFocus={(e) => (e.target.style.borderColor = "#6C4FF6")}
                         onBlur={(e)  => (e.target.style.borderColor = "#E8E5FF")}
                  />
                  <button onClick={handleSend} disabled={!text.trim() || sending}
                          style={{
                            padding: "10px 16px", borderRadius: 10, border: "none",
                            cursor: text.trim() && !sending ? "pointer" : "not-allowed",
                            background: text.trim() && !sending ? "#6C4FF6" : "#E8E5FF",
                            color: text.trim() && !sending ? "white" : "#A09DBF",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 150ms",
                          }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
          ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#A09DBF" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 40, marginBottom: 8 }}>💬</p>
                  <p style={{ fontWeight: 600, color: "#1A1333" }}>Sélectionne une conversation</p>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}