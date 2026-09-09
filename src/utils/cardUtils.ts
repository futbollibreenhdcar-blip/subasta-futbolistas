/**
 * Helper utilities for FC Mobile signed / signature cards.
 *
 * In FC Mobile "Signature" and "Moments" events, the player's dynamic photo
 * and golden autograph are baked into the card artwork.
 *
 * During auctions (!isRevealed):
 * - The card background is replaced with a clean background (player removed)
 * - The player's cutout is rendered as a solid black silhouette on top.
 *
 * When revealed (isRevealed):
 * - The silhouette disappears ("se va")
 * - The original signed card background with the authentic player photo and signature is displayed.
 */

export function isSignedCard(cardBgUrl?: string): boolean {
  if (!cardBgUrl) return false;
  return (
    cardBgUrl.includes('_STATIC_L3.png') ||
    cardBgUrl.includes('SIGNATURE_') ||
    (cardBgUrl.includes('TWG26_ICON_') && cardBgUrl.includes('_L3'))
  );
}

export function getAuctionBackgroundUrl(cardBgUrl?: string): string | undefined {
  if (!cardBgUrl || !isSignedCard(cardBgUrl)) return cardBgUrl;

  const baseUrl = cardBgUrl.substring(0, cardBgUrl.lastIndexOf('/') + 1);

  // 1. Club signature cards (RMA, FCB, LFC, MCI, CHE)
  if (cardBgUrl.includes('SIGNATURE_')) {
    return cardBgUrl.replace('SIGNATURE_', 'ICON_');
  }

  // 2. National team signature icons (The World Game Moments / Icons)
  if (cardBgUrl.includes('ARGENTINA')) {
    return `${baseUrl}bg_23_backgrounds_twg26_TWG26_ICON_ARGENTINA_STATIC_L2.png`;
  }
  if (cardBgUrl.includes('SPAIN')) {
    return `${baseUrl}bg_23_backgrounds_twg26_TWG26_ICON_SPAIN_STATIC_L2.png`;
  }
  if (cardBgUrl.includes('ENGLAND')) {
    return `${baseUrl}bg_23_backgrounds_twg26_TWG26_ICON_ENGLAND_STATIC_L2.png`;
  }
  if (cardBgUrl.includes('NETHERLANDS')) {
    return `${baseUrl}bg_23_backgrounds_twg26_TWG26_ICON_NETHERLANDS_STATIC_L2.png`;
  }
  if (cardBgUrl.includes('MEXICO')) {
    return `${baseUrl}bg_23_backgrounds_twg26_TWG26_ICON_MEXICO_STATIC_L2.png`;
  }
  if (cardBgUrl.includes('PORTUGAL')) {
    return `${baseUrl}bg_23_backgrounds_twg26_TWG26_ICON_PORTUGAL_STATIC_L2.png`;
  }

  // Fallback to official clean Prime Icon background for nations without dedicated L2
  return `${baseUrl}bg_23_B_BASE_PRIMEICON_STATIC.png`;
}
