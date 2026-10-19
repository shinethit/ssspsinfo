import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { MessageSquare, Send, UserCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [user] = useAuthState(auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        text: text.trim(),
        senderUid: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'အသင်းဝင်',
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full">
      {/* Top Action Bar with Back Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs"
          title="နောက်သို့ (Back)"
        >
          <ArrowLeft className="w-4 h-4 text-sky-800" />
          <span>နောက်သို့ (Back)</span>
        </button>

        <Link
          to="/"
          className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
        >
          ပင်မစာမျက်နှာ ➔
        </Link>
      </div>

      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-sky-950 flex items-center gap-2.5">
          <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-sky-600 shrink-0" />
          <span>အသင်းဝင် ဆွေးနွေးခန်း (Chat Room)</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများအကြား သတင်းစကားများ ဖလှယ်နိုင်သော အချိန်နှင့်တစ်ပြေးညီ စကားပြောခန်း
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[65vh] min-h-[420px] max-h-[700px] overflow-hidden w-full">
        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 w-full">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-sm">မက်ဆေ့ခ်ျ မရှိသေးပါ</p>
              <p className="text-xs">ပထမဆုံး မက်ဆေ့ခ်ျကို စတင်ပေးပို့လိုက်ပါ။</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderUid === user?.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col w-full ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[11px] text-slate-400 px-1 mb-1 font-medium">
                    {msg.senderName || 'အသင်းဝင်'}
                  </span>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-3 sm:p-3.5 rounded-2xl text-sm leading-relaxed break-words shadow-2xs ${
                      isMine
                        ? 'bg-sky-900 text-white rounded-tr-xs'
                        : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200">
          {!user ? (
            <div className="text-center py-2 text-xs sm:text-sm text-slate-600">
              မက်ဆေ့ခ်ျ ပေးပို့ရန် ကျေးဇူးပြု၍{' '}
              <Link to="/login" className="text-sky-800 font-bold underline">
                အကောင့်ဝင်ပါ (Login)
              </Link>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="မက်ဆေ့ခ်ျ ရိုက်ထည့်ပါ..."
                className="flex-1 min-w-0 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-300 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-hidden"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="bg-sky-900 text-white px-4 py-2.5 sm:py-3 rounded-xl text-sm font-semibold hover:bg-sky-800 transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">ပို့မည်</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
