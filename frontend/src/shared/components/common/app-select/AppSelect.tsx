"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import styles from "./AppSelect.module.css";

export interface AppSelectOption {
  value: string;
  label: string;
  /** Non-selectable default label shown at top of the list */
  isDefault?: boolean;
}

interface AppSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  className?: string;
  variant?: "default" | "pill";
  hasError?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

const AppSelect: React.FC<AppSelectProps> = ({
  id,
  value,
  onChange,
  options,
  className = "",
  variant = "default",
  hasError = false,
  disabled = false,
  "aria-label": ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.blur();
  };

  const selectableOptions = options.filter((option) => !option.isDefault);
  const selectedOption =
    options.find((option) => option.value === value) ??
    selectableOptions[0] ??
    options[0];
  const isDefaultValue = Boolean(
    options.find((option) => option.isDefault && option.value === value)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div
      className={`${styles.appSelect__root} ${open ? styles.appSelect__rootOpen : ""} ${className}`.trim()}
      ref={rootRef}
    >
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`${styles.appSelect__trigger} ${
          variant === "pill" ? styles.appSelect__triggerPill : ""
        } ${open && variant !== "pill" ? styles.appSelect__triggerOpen : ""} ${
          open && variant === "pill" ? styles.appSelect__triggerPillOpen : ""
        } ${isDefaultValue ? styles.appSelect__triggerDefault : ""} ${
          hasError ? styles.appSelect__triggerError : ""
        }`.trim()}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => {
            if (prev) {
              triggerRef.current?.blur();
            }
            return !prev;
          });
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={styles.appSelect__triggerLabel}>
          {selectedOption?.label ?? "Select…"}
        </span>
        <span className={styles.appSelect__chevron} aria-hidden />
      </button>

      {open && (
        <ul className={styles.appSelect__menu} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            if (option.isDefault) {
              return (
                <li key={option.value || "__default__"} role="presentation">
                  <span className={styles.appSelect__optionDefault}>{option.label}</span>
                </li>
              );
            }

            const optionSelected = option.value === value;

            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={optionSelected}
                  className={`${styles.appSelect__option} ${
                    optionSelected ? styles.appSelect__optionSelected : ""
                  }`.trim()}
                  onClick={() => {
                    onChange(option.value);
                    closeMenu();
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AppSelect;
