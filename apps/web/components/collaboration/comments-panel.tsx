"use client"

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { MessageSquare, Send } from "lucide-react";

interface Comment {
    id: string;
    text: string;
    userName: string;
    userColor: string;
    createdAt: any;
}

interface Props {
    dashboardId: string;
    userName: string;
    userColor: string;
}

export function CommentsPanel({ dashboardId, userName, userColor }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [inputText, setInputText] = useState("");

    useEffect(() => {
        const commentsRef = collection(db, "dashboards", dashboardId, "comments");
        const q = query(commentsRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Comment[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    text: data.text || "",
                    userName: data.userName || "Anonymous",
                    userColor: data.userColor || "#6366f1",
                    createdAt: data.createdAt
                });
            });
            setComments(list);
        });

        return unsubscribe;
    }, [dashboardId]);

    async function handleSendComment(e: React.FormEvent) {
        e.preventDefault();
        if (!inputText.trim()) return;

        const commentsRef = collection(db, "dashboards", dashboardId, "comments");
        await addDoc(commentsRef, {
            text: inputText,
            userName,
            userColor,
            createdAt: serverTimestamp()
        });

        setInputText("");
    }

    return (
        <>
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3.5 rounded-full shadow-2xl hover:bg-indigo-700 transition-all z-40 flex items-center justify-center border border-indigo-500/25 cursor-pointer"
                title="Open Team Discussion"
            >
                <MessageSquare className="w-6 h-6 text-white" />
            </button>

            {/* Sidebar */}
            {isOpen && (
                <div className="fixed inset-y-0 right-0 w-80 bg-card border-l border-border shadow-2xl z-40 flex flex-col pt-16">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
                        <span className="font-semibold text-sm text-foreground">Team Discussion</span>
                        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">✕</button>
                    </div>

                    {/* Thread History */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic text-center mt-8">No comments yet. Start the conversation!</p>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.userColor }} />
                                        <span className="text-xs font-semibold text-foreground">{c.userName}</span>
                                    </div>
                                    <div className="bg-muted p-2 rounded-xl text-xs pl-4 pr-3 max-w-[90%] inline-block text-foreground">
                                        {c.text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendComment} className="p-4 border-t border-border flex gap-2">
                        <input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type comment..."
                            className="flex-1 border border-border rounded-xl px-3 py-1.5 text-xs bg-background text-foreground outline-none focus:border-indigo-500"
                        />
                        <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shrink-0 cursor-pointer">
                            <Send className="w-3.5 h-3.5 text-white" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
