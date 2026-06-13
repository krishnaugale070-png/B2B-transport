import React, { useState } from 'react';
import { Review } from '../types';
import { Star, MessageSquarePlus, MessageSquare } from 'lucide-react';

interface ReviewListProps {
  vehicleId: string;
  reviews: Review[];
  onAddReview: (rating: number, comment: string) => void;
  canReview: boolean;
}

export default function ReviewList({ vehicleId, reviews, onAddReview, canReview }: ReviewListProps) {
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddReview(ratingInput, commentInput);
    setCommentInput('');
    setRatingInput(5);
    setShowForm(false);
  };

  // Stats calculation
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const ratingsDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, pct };
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 font-display">
          <MessageSquare className="w-4 h-4 text-blue-600" /> Ratings & Professional Reviews
        </h3>
        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            id="btn-write-review"
            className="text-xs bg-blue-50 hover:bg-blue-105 text-blue-700 font-semibold py-1.5 px-3 rounded-lg border border-blue-200 transition-all flex items-center gap-1.5"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" /> Write Review
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Assign Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingInput(star)}
                  className="p-0.5 focus:outline-none"
                >
                  <Star
                    className={`w-5 h-5 transition-transform hover:scale-115 ${
                      star <= ratingInput ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 ml-1">({ratingInput} out of 5 stars)</span>
          </div>

          <div>
            <textarea
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="State details on transit speed, driver courtesy, cargo packaging security, or rate fairness..."
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-550 h-20 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold py-1 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-md transition-all shadow-xs"
            >
              Post Feedback
            </button>
          </div>
        </form>
      )}

      {/* Review Analytics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6 pb-6 border-b border-slate-100">
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <div className="text-3xl font-extrabold text-slate-800">{avgRating}</div>
          <div className="flex gap-0.5 my-1.5">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.round(Number(avgRating)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">({totalReviews} Verified Books)</span>
        </div>

        <div className="md:col-span-8 flex flex-col justify-center space-y-1.5">
          {ratingsDistribution.map(item => (
            <div key={item.stars} className="flex items-center gap-2.5 text-xs text-slate-600">
              <span className="w-3 text-right font-semibold">{item.stars}</span>
              <Star className="w-3 h-3 text-amber-450 fill-amber-450 flex-shrink-0" />
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full" 
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-slate-400 text-[10px]">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual review list elements */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400">
            No customer ratings exist yet for this truck. Be the first to catalog logistics feedback!
          </div>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="text-xs border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start gap-1">
                <div>
                  <h4 className="font-semibold text-slate-800">{r.companyName}</h4>
                  <div className="flex gap-0.5 my-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">{r.date}</span>
              </div>
              <p className="text-slate-600 mt-1 text-slate-650 leading-relaxed font-normal">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
