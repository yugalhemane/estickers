import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { stickerService, cartService } from "../../services/api";
import SearchAndFilter from "../../components/SearchAndFilter";
import { useAuth } from "../../contexts/AuthContext";
import StickerCard from "../../components/StickerCard";
import { toast } from "react-toastify";

const categories = [
  "All",
  "Trending",
  "New",
  "Animals",
  "Food",
  "Cute",
  "Funny",
];

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchStickers = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await stickerService.getAllStickers(selectedCategory, {
          page,
          limit: 24,
          sort: "createdAt:desc",
          ...(query ? { q: query } : {}),
        });
        const list = res.data || res.data?.data || res.data?.data || res.data; // tolerate shapes
        setStickers(Array.isArray(list) ? list : res.data || []);
        if (typeof res.totalPages === "number") setTotalPages(res.totalPages);
      } catch (err) {
        setError(err.message || "Failed to load stickers");
      } finally {
        setLoading(false);
      }
    };
    fetchStickers();
  }, [selectedCategory, page, query]);

  // Simulate trending/newly arrived
  const trending = stickers.slice(0, 6);
  const newlyArrived = stickers.slice(-6).reverse();

  // ✅ Proper category filtering
  const filteredStickers =
    selectedCategory === "All"
      ? stickers
      : stickers.filter(
          (s) =>
            s.category &&
            s.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  // Add to cart handler
  const handleAddToCart = async (sticker) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart!");
      return;
    }

    try {
      const res = await cartService.addToCart(sticker._id, 1);
      if (res.success) {
        toast.success(`Added '${sticker.title}' to cart!`);
      } else {
        toast.error("Failed to add item to cart.");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error("Error adding item to cart.");
    }
  };

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!stickers || stickers.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stickers.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [stickers]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-purple-900 via-pink-900 to-cyan-900 overflow-x-hidden relative pb-16">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-purple-900 via-pink-900 to-cyan-900 py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between mb-6 sm:mb-8 lg:mb-10 shadow-lg relative">
        <div className="flex-1 flex flex-col items-start z-10 text-center lg:text-left mb-6 lg:mb-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-4 drop-shadow-xl leading-tight">
            Stickers that{" "}
            <span className="bg-white bg-opacity-30 px-2 sm:px-3 rounded">
              Express You
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-4 sm:mb-6 max-w-lg drop-shadow leading-relaxed">
            Discover trending, cute, and unique stickers for every mood and
            moment. Shop the latest arrivals and best sellers!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-pink-600 font-bold text-base sm:text-lg shadow hover:bg-pink-100 transition-all duration-300 transform hover:scale-105 text-center"
                >
                  Dashboard
                </Link>
                <Link
                  to="/cart"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-pink-600 text-white font-bold text-base sm:text-lg shadow hover:bg-pink-700 transition-all duration-300 transform hover:scale-105 text-center"
                >
                  My Cart
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-pink-600 font-bold text-base sm:text-lg shadow hover:bg-pink-100 transition-all duration-300 transform hover:scale-105 text-center"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-pink-600 text-white font-bold text-base sm:text-lg shadow hover:bg-pink-700 transition-all duration-300 transform hover:scale-105 text-center"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center mt-6 lg:mt-0 z-10">
          <img
            src={
              stickers[currentIndex]?.imageUrl ||
              "https://cdn.pixabay.com/photo/2017/01/31/13/14/animal-2023924_1280.png"
            }
            alt="Featured Sticker"
            className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 
                   rounded-2xl shadow-2xl border-4 border-white bg-white/40 
                   transition-all duration-700 ease-in-out hover:scale-105"
          />
        </div>
      </section>

      {/* Welcome Message */}
      {isAuthenticated && user && (
        <div className="w-full max-w-5xl mb-6 sm:mb-8 px-4">
          <div className="bg-gradient-to-r from-green-200 via-blue-100 to-purple-100 rounded-xl shadow flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border border-green-300 gap-3 sm:gap-0">
            <span className="text-base sm:text-lg md:text-xl font-semibold text-green-700 text-center sm:text-left">
              🎉 Welcome back, {user.name}! Ready to shop for some awesome
              stickers?
            </span>
            <Link
              to="/cart"
              className="px-4 py-2 rounded-full bg-green-500 text-white font-bold shadow hover:bg-green-600 transition-all duration-300 transform hover:scale-105 text-sm whitespace-nowrap"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}

      {/* Promo Banner */}
      <div className="w-full max-w-5xl mb-6 sm:mb-8 px-4">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 gap-3 sm:gap-0">
          <span className="text-base sm:text-lg md:text-xl font-semibold text-white text-center sm:text-left">
            🎉 Summer Sale! Get 20% off on all stickers. Use code{" "}
            <span className="font-bold text-cyan-400">SUMMER20</span>
          </span>
          <button className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold shadow hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 text-sm whitespace-nowrap">
            Shop Now
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="w-full max-w-5xl mb-6 sm:mb-8 px-4">
      <SearchAndFilter initialQuery={query} onSearch={(q) => { setQuery(q); setPage(1); }} />
      </div>

      {/* Category Bar */}
      <div className="w-full max-w-5xl mb-6 sm:mb-8 px-4">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-3 sm:px-5 py-2 rounded-full border font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-transparent shadow-lg"
                  : "backdrop-blur-xl bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sticker Grid */}
      {loading ? (
        <div className="text-center text-gray-300 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-lg">Loading stickers...</div>
        </div>
      ) : error ? (
        <div className="text-center text-red-300 py-8">
          <div className="text-lg mb-2">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredStickers.length === 0 ? (
        <div className="text-gray-300 text-center py-8">
          <div className="text-lg mb-2">
            No stickers found for this category.
          </div>
          <div className="text-sm">
            Try selecting a different category or check back later!
          </div>
        </div>
      ) : (
        <div
          className="w-full px-4 sm:px-6 lg:px-8 
          grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 
          gap-4 sm:gap-6 lg:gap-8"
        >
          {filteredStickers.map((sticker) => (
            <div key={sticker._id} className="relative group">
              <Link to={`/product/${sticker._id}`}>
                <StickerCard sticker={sticker} onAddToCart={handleAddToCart} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
{/* Pagination Controls */}
{!loading && !error && totalPages > 1 && (
  <div className="w-full max-w-5xl mt-6 px-4 flex items-center justify-center gap-3">
    <button
      className="px-4 py-2 rounded-full bg-white/10 text-white border border-white/20 disabled:opacity-50"
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={page <= 1}
    >
      Prev
    </button>
    <span className="text-white/80">
      Page {page} of {totalPages}
    </span>
    <button
      className="px-4 py-2 rounded-full bg-white/10 text-white border border-white/20 disabled:opacity-50"
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      disabled={page >= totalPages}
    >
      Next
    </button>
  </div>
)}


      {/* Custom keyframes and scrollbar styles */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Home;
