import React, { useState, useEffect, useContext } from "react";
import { AppContent } from "../context/Context";
import { Star, ChevronDown } from "lucide-react";
import axios from "axios";

const ReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [displayCount, setDisplayCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const { backend_url } = useContext(AppContent);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      axios.defaults.withCredentials = true;
      const response = await axios.get(`${backend_url}/api/rating`);

      if (response.data.success) {
        const sortedReviews = response.data.data.sort(
          (a, b) => b.rating - a.rating
        );
        setReviews(sortedReviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMore = () => {
    setDisplayCount((prev) => prev + 3);
  };

  const displayedReviews = reviews.slice(0, displayCount);
  const hasMore = displayCount < reviews.length;

  if (loading) {
    return (
      <section className="relative z-10 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading reviews...</p>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="relative z-10 px-8 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            What Our Students Say
          </h2>
          <p className="text-xl text-gray-400">
            Real reviews from our learning community
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayedReviews.map((review) => (
            <div
              key={review._id}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:scale-105"
            >
              {/* Rating Stars */}

              {/* User Info */}
              <div className="flex items-center space-x-3 pt-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="font-bold text-sm">
                    {review.userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">
                    {review.userName}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
              {/* Comment */}
              <p className="text-gray-200 mt-5 mb-4 line-clamp-4 border-t border-white/10 pt-5">
                "{review.comment}"
              </p>
              {/* stars */}
              <div className="flex items-center mb-4  border-t border-white/10 p-2">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    className={`${
                      index < review.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-600"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-400 ">
                  {review.rating}/5
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={handleViewMore}
              className="group inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
            >
              <span>View More Reviews</span>
              <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </button>
            <p className="mt-3 text-gray-400 text-sm">
              Showing {displayedReviews.length} of {reviews.length} reviews
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
