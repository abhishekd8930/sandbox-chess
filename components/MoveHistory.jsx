import React, { useRef, useEffect } from 'react';
import { ScrollText, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function MoveHistory({ moveHistory }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moveHistory]);

  if (!moveHistory) return null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 border border-slate-200 rounded-2xl p-4 shadow-md flex flex-col space-y-2 text-slate-800 backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
        <ScrollText className="w-4 h-4 text-blue-600" /> Activity Feed & Challenge Logs
      </div>

      <div ref={scrollRef} className="h-32 overflow-y-auto space-y-1.5 pr-2 text-xs font-mono">
        {moveHistory.length === 0 ? (
          <div className="text-slate-400 text-center py-8 italic">No moves recorded yet. Make a move or bluff your opponent!</div>
        ) : (
          moveHistory.map((item) => {
            if (item.type === 'MOVE') {
              return (
                <div key={item.id} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color === 'w' ? 'bg-blue-600' : 'bg-emerald-600'}`} />
                    <span className="font-bold">{item.color.toUpperCase()}:</span>
                    <span>
                      {item.piece.toUpperCase()} move ({item.from.row},{item.from.col}) → ({item.to.row},{item.to.col})
                    </span>
                    {item.captured && <span className="text-rose-600 font-bold">x {item.captured.toUpperCase()}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.challenged && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 font-bold">CHALLENGED</span>
                    )}
                    <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                  </div>
                </div>
              );
            } else if (item.type === 'CHALLENGE') {
              return (
                <div
                  key={item.id}
                  className={`p-2 rounded font-sans text-xs border flex items-center gap-2 ${
                    item.successful
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {item.successful ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span className="font-semibold">{item.message}</span>
                </div>
              );
            } else {
              return (
                <div key={item.id} className="p-1.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-xs">
                  {item.message}
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
