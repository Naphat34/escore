import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TimeoutTimerModal = ({ isOpen, onClose }) => {
    const [seconds, setSeconds] = useState(30);

    useEffect(() => {
        let interval;
        if (isOpen) {
            setSeconds(30);
            interval = setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
            <div className="relative flex flex-col items-center">
                <button onClick={onClose} className="absolute -top-12 right-0 text-white/50 hover:text-white">
                    <X size={32} />
                </button>
                <h2 className="text-3xl font-bold text-white uppercase tracking-widest mb-4 animate-pulse">Timeout</h2>
                <div className={`text-[12rem] font-black leading-none tabular-nums transition-colors duration-500 ${seconds <= 5 ? 'text-red-500' : 'text-white'}`}>
                    {seconds}
                </div>
                <div className="text-slate-400 text-xl font-bold mt-2">SECONDS REMAINING</div>
                {seconds === 0 && (
                    <button onClick={onClose} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition">
                        Resume Match
                    </button>
                )}
            </div>
        </div>
    );
};

export default TimeoutTimerModal;