import React from "react";
import styles from "./search-input.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  label?: string;
  showLabel?: boolean;
  variant?: "default" | "rounded";
  className?: string;
  fullWidth?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  id = "searchInput",
  label = "Search",
  showLabel = true,
  variant = "default",
  className = "",
  fullWidth = false,
}) => {
  const handleClear = () => {
    onChange("");
  };

  const containerClass = `${styles.searchInputContainer} ${styles[variant]} ${
    fullWidth ? styles.fullWidth : ""
  } ${className}`;
  const inputClass = `${styles.searchInput} ${styles[variant]}`;

  return (
    <div className={`${styles.searchGroup} ${fullWidth ? styles.searchGroupFull : ""}`}>
      {showLabel && (
        <label htmlFor={id} className={styles.searchLabel}>
          {label}:
        </label>
      )}
      <div className={containerClass}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.searchIcon}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {value && (
          <button
            className={styles.searchClear}
            onClick={handleClear}
            type="button"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
