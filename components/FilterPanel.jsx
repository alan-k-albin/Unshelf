'use client';

import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

const CONDITIONS = ['Like New', 'Good', 'Used', 'Heavily Used'];
const CATEGORIES = [
  'Textbooks',
  'Handwritten Notes',
  'Study Guides',
  'Notebooks',
  'Lab Manuals',
  'Calculators/Tools',
  'Coaching Materials',
  'Other',
];

export default function FilterPanel({ filters, setFilters, onClose, onApply, onClear }) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    condition: true,
    category: false,
    sort: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // FIX: Price inputs use local string state so "0" can be fully cleared and retyped
  const handleMinPriceChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      minPriceText: value,
      minPrice: value === '' ? 0 : parseInt(value) || 0,
    }));
  };

  const handleMaxPriceChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      maxPriceText: value,
      maxPrice: value === '' ? 100000 : parseInt(value) || 100000,
    }));
  };

  // FIX: conditions is now an array — toggle item in/out
  const handleConditionToggle = (condition) => {
    setFilters((prev) => {
      const current = prev.conditions || [];
      const updated = current.includes(condition)
        ? current.filter((c) => c !== condition)
        : [...current, condition];
      return { ...prev, conditions: updated };
    });
  };

  // FIX: categories is now an array — toggle item in/out
  const handleCategoryToggle = (category) => {
    setFilters((prev) => {
      const current = prev.categories || [];
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...prev, categories: updated };
    });
  };

  const handleSortChange = (sort) => {
    setFilters((prev) => ({ ...prev, sortBy: sort }));
  };

  const selectedConditions = filters.conditions || [];
  const selectedCategories = filters.categories || [];

  return (
    <div className="bg-white rounded-t-2xl md:rounded-2xl border-2 border-[#EDE6D6] shadow-xl flex flex-col font-body" style={{ maxHeight: '80vh' }}>

      {/* Header — fixed, never scrolls */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE6D6] flex-shrink-0">
        <h3 className="font-display font-semibold text-lg text-[#1B2A4A]">
          Filters
        </h3>
        <button onClick={onClose} aria-label="Close filters" className="p-1 hover:bg-[#F3EFE4] rounded-lg transition text-[#1B2A4A]">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable content — stops before footer */}
      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-1">

        {/* ── Price Range ── */}
        <div className="border-b border-[#EDE6D6] pb-4">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between py-2 font-semibold text-[#1B2A4A]"
          >
            Price Range
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200"
              style={{ transform: expandedSections.price ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {expandedSections.price && (
            <div className="space-y-3 pt-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-[#5B5647] mb-1 block font-medium">Min (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={filters.minPriceText !== undefined ? filters.minPriceText : filters.minPrice === 0 ? '' : filters.minPrice}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#EDE6D6] rounded-xl text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 text-[#1B2A4A] min-h-[44px]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#5B5647] mb-1 block font-medium">Max (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Any"
                    value={filters.maxPriceText !== undefined ? filters.maxPriceText : filters.maxPrice >= 100000 ? '' : filters.maxPrice}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#EDE6D6] rounded-xl text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 text-[#1B2A4A] min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Condition (multi-select) ── */}
        <div className="border-b border-[#EDE6D6] pb-4">
          <button
            onClick={() => toggleSection('condition')}
            className="w-full flex items-center justify-between py-2 font-semibold text-[#1B2A4A]"
          >
            <span>
              Condition
              {selectedConditions.length > 0 && (
                <span
                  className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full text-white bg-[#27AE60]"
                >
                  {selectedConditions.length}
                </span>
              )}
            </span>
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200"
              style={{ transform: expandedSections.condition ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {expandedSections.condition && (
            <div className="flex flex-wrap gap-2 pt-3">
              {CONDITIONS.map((cond) => {
                const active = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => handleConditionToggle(cond)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      background: active ? '#1B2A4A' : '#FBF8F1',
                      borderColor: active ? '#1B2A4A' : '#EDE6D6',
                      color: active ? '#FFFFFF' : '#1B2A4A',
                    }}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Category (multi-select) ── */}
        <div className="border-b border-[#EDE6D6] pb-4">
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between py-2 font-semibold text-[#1B2A4A]"
          >
            <span>
              Category
              {selectedCategories.length > 0 && (
                <span
                  className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full text-white bg-[#27AE60]"
                >
                  {selectedCategories.length}
                </span>
              )}
            </span>
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200"
              style={{ transform: expandedSections.category ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {expandedSections.category && (
            <div className="flex flex-wrap gap-2 pt-3">
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryToggle(cat)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      background: active ? '#1B2A4A' : '#FBF8F1',
                      borderColor: active ? '#1B2A4A' : '#EDE6D6',
                      color: active ? '#FFFFFF' : '#1B2A4A',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sort By ── */}
        <div className="pb-2">
          <button
            onClick={() => toggleSection('sort')}
            className="w-full flex items-center justify-between py-2 font-semibold text-[#1B2A4A]"
          >
            Sort By
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200"
              style={{ transform: expandedSections.sort ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {expandedSections.sort && (
            <div className="flex flex-col gap-2 pt-3">
              {[
                { value: 'newest', label: 'Newest First' },
                { value: 'price-low', label: 'Price: Low to High' },
                { value: 'price-high', label: 'Price: High to Low' },
              ].map((opt) => {
                const active = filters.sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSortChange(opt.value)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all text-left"
                    style={{
                      background: active ? '#F3EFE4' : '#FBF8F1',
                      borderColor: active ? '#1B2A4A' : '#EDE6D6',
                      color: '#1B2A4A',
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? '#1B2A4A' : '#C9BFA8' }}
                    >
                      {active && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: '#1B2A4A' }}
                        />
                      )}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer — always visible above nav bar */}
      <div
        className="flex-shrink-0 px-5 py-4 border-t border-[#EDE6D6] flex gap-3 bg-white"
        style={{ paddingBottom: 'calc(1rem + 64px)' }}
      >
        <button
          type="button"
          onClick={onClear}
          className="flex-1 py-3 min-h-[44px] rounded-xl font-semibold text-sm border-2 border-[#EDE6D6] transition-colors hover:bg-[#F3EFE4] text-[#5B5647]"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-2 px-8 py-3 min-h-[44px] rounded-xl font-semibold text-base text-white transition-opacity hover:opacity-95 shadow-md"
          style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)', flex: 2 }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
      }
