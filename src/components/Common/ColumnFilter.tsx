"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, Check, ChevronDown, X, Circle } from "lucide-react";
import styles from "./ColumnFilter.module.css";

interface ColumnFilterProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onFilterChange: (selected: string[]) => void;
  onClear: () => void;
  align?: 'left' | 'right';
}

export default function ColumnFilter({
  label,
  options,
  selectedOptions,
  onFilterChange,
  onClear,
  align = 'right'
}: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  const isActive = selectedOptions.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selectedOptions.includes(option)) {
      onFilterChange(selectedOptions.filter((o) => o !== option));
    } else {
      onFilterChange([...selectedOptions, option]);
    }
  };

  const handleSelectAll = () => {
    onFilterChange(options);
  };

  const filteredOptions = options.filter(o => 
    (o || "Vazio").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={`${styles.filterBtn} ${isActive ? styles.filterBtnActive : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <Filter size={12} />
      </button>

      {isOpen && (
        <div 
          className={`${styles.dropdown} ${align === 'left' ? styles.dropdownLeft : ""}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Filtrar {label}</span>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <X size={14} />
            </button>
          </div>

          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>

          <div className={styles.optionsList}>
            {filteredOptions.length === 0 && (
              <div className={styles.noResults}>Nenhum valor encontrado</div>
            )}
            {filteredOptions.map((option, idx) => {
              const displayOption = option || "(Vazio)";
              const isSelected = selectedOptions.includes(option);
              return (
                <div 
                  key={`${option}-${idx}`} 
                  className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ""}`}
                  onClick={() => toggleOption(option)}
                >
                  <div className={styles.checkbox}>
                    {isSelected && <Check size={12} />}
                  </div>
                  <span className={styles.optionText}>{displayOption}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.footer}>
            <button className={styles.footerBtn} onClick={handleSelectAll}>Todos</button>
            <button className={styles.footerBtn} onClick={onClear}>Limpar</button>
          </div>
        </div>
      )}
    </div>
  );
}
