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
    <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-lg flex flex-col" style={{ maxHeight: '80vh' }}>

      {/* Header — fixed, never scrolls */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-bold text-lg" style={{ color: '#1B2A4A' }}>
          Filters
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable content — stops before footer */}
      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-1">

        {/* ── Price Range ── */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between py-2 font-semibold"
            style={{ color: '#1B2A4A' }}
          >
            💰 Price Range
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200"
              style={{ transform: expandedSections.price ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {expandedSections.price && (
            <div className="space-y-3 pt-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Min (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    // FIX: use text representation so user can clear "0" freely
                    value={filters.minPriceText !== undefined ? filters.minPriceText : filters.minPrice === 0 ? '' : filters.minPrice}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Max (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Any"
                    value={filters.maxPriceText !== undefined ? filters.maxPriceText : filters.maxPrice >= 100000 ? '' : filters.maxPrice}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Condition (multi-select) ── */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('condition')}
            className="w-full flex items-center justify-between py-2 font-semibold"
            style={{ color: '#1B2A4A' }}
          >
            <span>
              👕 Condition
              {selectedConditions.length > 0 && (
                <span
                  className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: '#1877F2' }}
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
                    className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                    style={{
                      background: active ? '#1877F2' : '#F9FAFB',
                      borderColor: active ? '#1877F2' : '#D1D5DB',
                      color: active ? '#fff' : '#374151',
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
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between py-2 font-semibold"
            style={{ color: '#1B2A4A' }}
          >
            <span>
              📚 Category
              {selectedCategories.length > 0 && (
                <span
                  className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: '#1877F2' }}
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
                    className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                    style={{
                      background: active ? '#1877F2' : '#F9FAFB',
                      borderColor: active ? '#1877F2' : '#D1D5DB',
                      color: active ? '#fff' : '#374151',
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
            className="w-full flex items-center justify-between py-2 font-semibold"
            style={{ color: '#1B2A4A' }}
          >
            📊 Sort By
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200"
              style={{ transform: expandedSections.sort ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {expandedSections.sort && (
            <div className="flex flex-col gap-2 pt-3">
              {[
                { value: 'newest', label: '🕐 Newest First' },
                { value: 'price-low', label: '💰 Price: Low to High' },
                { value: 'price-high', label: '💰 Price: High to Low' },
              ].map((opt) => {
                const active = filters.sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSortChange(opt.value)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left"
                    style={{
                      background: active ? '#EFF6FF' : '#F9FAFB',
                      borderColor: active ? '#1877F2' : '#D1D5DB',
                      color: active ? '#1877F2' : '#374151',
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? '#1877F2' : '#9CA3AF' }}
                    >
                      {active && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: '#1877F2' }}
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
        className="flex-shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3 bg-white"
        style={{ paddingBottom: 'calc(1rem + 64px)' }}
      >
        <button
          type="button"
          onClick={onClear}
          className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 transition-colors hover:bg-gray-50"
          style={{ color: '#6B7280' }}
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-2 px-8 py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)', flex: 2 }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
      }
