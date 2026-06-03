"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./email-autocomplete.module.css";

interface EmailAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  role: "tutor" | "lecturer";
  hasError?: boolean;
  required?: boolean;
}

const EMAIL_SUGGESTIONS = [
  "candidate.edu.au",
  "lecturer.edu.au"
];

export default function EmailAutocomplete({
  value,
  onChange,
  placeholder = "Email Address",
  className = "",
  role,
  hasError = false,
  required = false,
}: EmailAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const prevRoleRef = useRef<string>(role);

  // Handle click outside effect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle role change effect
  useEffect(() => {
    if (prevRoleRef.current !== role && value.includes("@")) {
      const [localPart] = value.split("@");
      const newDomain = role === "tutor" ? "candidate.edu.au" : "lecturer.edu.au";
      const newEmail = `${localPart}@${newDomain}`;
      onChange(newEmail);
    }
    prevRoleRef.current = role;
  }, [role, value, onChange]);

  const getFilteredSuggestions = (emailValue: string): string[] => {
    if (!emailValue.includes("@")) return [];
    
    const [localPart, domainPart] = emailValue.split("@");
    if (!localPart.trim()) return [];

    // Prioritize domain based on role
    const prioritizedSuggestions = [...EMAIL_SUGGESTIONS];
    const roleSpecificDomain = role === "tutor" ? "candidate.edu.au" : "lecturer.edu.au";
    
    // Move role-specific domain to the top
    const roleIndex = prioritizedSuggestions.indexOf(roleSpecificDomain);
    if (roleIndex > -1) {
      prioritizedSuggestions.splice(roleIndex, 1);
      prioritizedSuggestions.unshift(roleSpecificDomain);
    }

    if (!domainPart) {
      // If only @ exists, show all suggestions
      return prioritizedSuggestions.map(domain => `${localPart}@${domain}`);
    }

    // Filter suggestions based on typed domain
    return prioritizedSuggestions
      .filter(domain => domain.toLowerCase().startsWith(domainPart.toLowerCase()))
      .map(domain => `${localPart}@${domain}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Auto-fill domain when user types "@"
    if (newValue.endsWith("@") && !value.includes("@")) {
      const domain = role === "tutor" ? "candidate.edu.au" : "lecturer.edu.au";
      const autoFilledValue = `${newValue}${domain}`;
      onChange(autoFilledValue);
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    onChange(newValue);

    if (newValue.includes("@")) {
      const filtered = getFilteredSuggestions(newValue);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          onChange(suggestions[selectedIndex]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case "Tab":
        if (selectedIndex >= 0) {
          e.preventDefault();
          onChange(suggestions[selectedIndex]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.emailAutocompleteContainer}>
      <input
        ref={inputRef}
        type="email"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="email"
        required={required}
        aria-required={required}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className={styles.suggestionsDropdown}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`${styles.suggestionItem} ${
                index === selectedIndex ? styles.suggestionSelected : ""
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 