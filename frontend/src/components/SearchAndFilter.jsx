import React, { useState } from "react";

const SearchAndFilter = ({
  onSearch,
  onFilterChange,
  onSortChange,
  onPriceRangeChange,
  categories = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleCategoryToggle = (category) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
    onFilterChange({ categories: updated, priceRange, sortBy });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    onSortChange(value);
  };

  const handlePriceRangeChange = (type, value) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
    onPriceRangeChange(newRange);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSortBy("newest");
    setPriceRange({ min: 0, max: 1000 });
    setSearchTerm("");
    onFilterChange({
      categories: [],
      priceRange: { min: 0, max: 1000 },
      sortBy: "newest",
    });
    onSearch("");
  };

  return (
    <div className="w-full mb-8">
      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stickers by name, description, or tags..."
              className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all duration-300"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* ... keep your filter/sort UI here ... */}
    </div>
  );
};

export default SearchAndFilter;
