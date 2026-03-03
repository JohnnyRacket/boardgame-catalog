"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useQueryState, parseAsInteger } from "nuqs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GameDetailContent } from "@/components/catalog/GameDetailContent";
import type { Game } from "@/lib/db/types";

interface GameModalProps {
  game: Game;
}

export function GameModal({ game }: GameModalProps) {
  const router = useRouter();
  const [, setGame] = useQueryState(
    "game",
    parseAsInteger.withOptions({ shallow: false }),
  );

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) setGame(null);
      }}
    >
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{game.name}</DialogTitle>
        <button
          type="button"
          className="absolute top-4 left-4 z-10 inline-flex items-center justify-center rounded-md bg-background p-1.5 text-muted-foreground shadow-sm hover:text-foreground transition-colors"
          aria-label="Edit game"
          onClick={() => router.push(`/games/${game.id}/edit`)}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <GameDetailContent game={game} />
      </DialogContent>
    </Dialog>
  );
}
