"use client";

import { useState, useTransition } from "react";
import { updateRatingDirectAction } from "@/lib/actions/games";
import type { Game } from "@/lib/db/types";

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-auto max-w-[20px]" aria-hidden="true">
      <path
        d={STAR_PATH}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className={filled ? "text-amber-400" : "text-muted-foreground/30"}
      />
    </svg>
  );
}

interface RatingEditorProps {
  game: Game;
}

export function RatingEditor({ game }: RatingEditorProps) {
  const initialRating =
    game.user_rating !== null && game.user_rating !== undefined
      ? Number(game.user_rating)
      : null;

  const [savedRating, setSavedRating] = useState<number | null>(initialRating);
  const [hovered, setHovered] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayValue = hovered ?? savedRating ?? 0;

  function save(rating: number | null) {
    startTransition(async () => {
      const result = await updateRatingDirectAction(game.id, rating);
      if (result.message) setErrorMsg(result.message);
      else setErrorMsg(null);
    });
  }

  function handleClick(starValue: number) {
    setSavedRating(starValue);
    save(starValue);
  }

  const numericLabel =
    hovered !== null
      ? `${hovered} / 10`
      : savedRating !== null
        ? `${savedRating} / 10`
        : "—";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Your Rating</span>
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">
          {isPending ? <span className="text-xs">Saving…</span> : numericLabel}
        </span>
      </div>

      <div
        className="flex items-center w-full py-1 -my-1"
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: 10 }, (_, i) => {
          const starValue = i + 1;
          return (
            <button
              key={i}
              type="button"
              disabled={isPending}
              className="flex flex-1 min-w-0 justify-center transition-transform duration-100 hover:scale-110 cursor-pointer disabled:cursor-not-allowed"
              onMouseEnter={() => setHovered(starValue)}
              onClick={() => handleClick(starValue)}
              aria-label={`Rate ${starValue} out of 10`}
            >
              <StarIcon filled={displayValue >= starValue} />
            </button>
          );
        })}
      </div>

      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
    </div>
  );
}
