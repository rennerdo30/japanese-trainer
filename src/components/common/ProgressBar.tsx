'use client'

interface ProgressBarProps {
    progress: number;
    showText?: boolean;
    className?: string;
}

export default function ProgressBar({ progress, showText = true, className = '' }: ProgressBarProps) {
    return (
        <div className={`module-progress ${className}`}>
            <div className="progress-bar">
                <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
            {showText && (
                <span className="progress-text">{progress}%</span>
            )}
        </div>
    );
}
