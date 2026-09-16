"use client";

import React, { useState, useEffect, useRef } from "react";

interface InlineEditableTextProps {
  value: string;
  placeholder?: string;
  onChange: (newVal: string) => void;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
}

export default function InlineEditableText({
  value,
  placeholder = "Click to edit...",
  onChange,
  className = "",
  as: Tag = "span",
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  if (isEditing) {
    // Determine if we need a textarea (if it's a paragraph or large text)
    const isMultiline = Tag === "p" || Tag === "div" || value.includes("\n");
    
    const handleBlur = () => {
      setIsEditing(false);
      if (localVal.trim() !== value.trim()) {
        onChange(localVal);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isMultiline) {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === "Escape") {
        setLocalVal(value);
        setIsEditing(false);
      }
    };

    const inputClasses = `${className} bg-white/10 backdrop-blur-sm border-b-2 border-white/50 outline-none p-1 rounded-sm shadow-inner transition-all w-full text-center inline-block`;

    return isMultiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        autoFocus
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClasses}
        rows={Math.max(2, localVal.split('\n').length)}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        autoFocus
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClasses}
        size={Math.max(localVal.length, placeholder.length, 5)}
      />
    );
  }

  return (
    <Tag
      className={`${className} whitespace-pre-line cursor-text hover:opacity-80 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all border-b border-transparent hover:border-white/20`}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsEditing(true);
      }}
      title="Click to edit"
    >
      {value || placeholder}
    </Tag>
  );
}
