'use client';

import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

export default function FilterPanel({ filters, setFilters, onClose, onApply, onClear }) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    condition: false,
    category: false,
    sort: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePriceChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: parseInt(value) || 0,
    }));
  };

  const handleConditionChange = (condition) => {
    setFilters((prev) => ({
      ...prev,
      condition: prev.condition === condition ? '' : condition,
    }));
  };

  const handleCategoryChange = (category) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === category ? '' : category,
    }));
  };

  const handleSortChange = (sort) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sort,
    }));
  };

  return (
    <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-lg flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-bold text-lg" style={{ color: '#1B2A4A' }}>
          Filters
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable filter content */}
      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

        {/* Price Filter */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between py-2 font-semibold"
            style={{ color: '#1B2A4A' }}
          >
            💰 Price Range
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{ transform: expandedSections.price ? 'rotate(180deg)' : '' }}
            />
          </button>
          {expandedSections.price && (
            <div className="space-y-3 pt-3">
              <div>
                <label className="text-xs text-gray-600">Min Price (₹)</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Max Price (₹)</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                />
              </div>
              <div className="text-xs text-gray-500">
                ₹{filters.minPrice.toLocaleString()} - ₹{filters.maxPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Condition Filter */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('condition')}
            className="w-full flex items-center justify-between py-2 font-semibold"
            style={{ color: '#1B2A4A' }}
          >
            👕 Condition
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{ transform: expandedSections.condition ? 'rotate(180deg)' : '' }}
            />
          </button>
          {expandedSections.condition && (
            <div className="space-y-2 pt-3">
              {['Like New', 'Good', 'Used', 'Heavily Used'].map((cond) => (
                <label key={cond} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.condition === cond}
                    onChange={() => handleConditionChange(cond)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{cond}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between py-2 font-semibold"
            style={{ color: '#1B2A4A' }}
          >
            📚 Category
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{ transform: expandedSections.category ? 'rotate(180deg)' : '' }}
            />
          </button>
          {expandedSections.category && (
            <div className="space-y-2 pt-3">
              {[
                'Textbooks',
                'Handwritten Notes',
                'Study Guides',
                'Notebooks',
                'Lab Manuals',
                'Calculators/Tools',
              ].map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.category === cat}
                    onChange={() => handleCategoryChange(cat)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Sort Filter */}
        <div className="pb-2">
          <button
            onClick={() => toggleSection('sort')}
            className="w-full flex items-center justify-between py-2 font-semibold"
            style={{ color: '#1B2A4A' }}
          >
            📊 Sort By
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{ transform: expandedSections.sort ? 'rotate(180deg)' : '' }}
            />
          </button>
          {expandedSections.sort && (
            <div className="space-y-2 pt-3">
              {[
                { value: 'newest', label: '🕐 Newest First' },
                { value: 'price-low', label: '💰 Price: Low to High' },
                { value: 'price-high', label: '💰 Price: High to Low' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value={opt.value}
                    checked={filters.sortBy === opt.value}
                    onChange={() => handleSortChange(opt.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FIX 7: Sticky footer with Apply + Clear buttons */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3">
        <button
          onClick={onClear}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-gray-300"
          style={{ color: '#6B7280' }}
        >
          Clear
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
      }
