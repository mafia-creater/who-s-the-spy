import type { WordPair } from '../types.js';

// ─── Word Pairs Database ─────────────────────────────────────────────────────
// 85 curated word pairs grouped by category.
// Each pair has a `civilian` word (majority players) and an `undercover` word.

export const WORD_PAIRS: WordPair[] = [
  // ── Food & Drink (10) ───────────────────────────────────────────────────────
  { civilian: 'Coffee', spy: 'Tea' },
  { civilian: 'Pizza', spy: 'Burger' },
  { civilian: 'Chocolate', spy: 'Caramel' },
  { civilian: 'Beer', spy: 'Wine' },
  { civilian: 'Ice Cream', spy: 'Frozen Yogurt' },
  { civilian: 'Pancake', spy: 'Waffle' },
  { civilian: 'Sushi', spy: 'Sashimi' },
  { civilian: 'Butter', spy: 'Margarine' },
  { civilian: 'Ketchup', spy: 'Mustard' },
  { civilian: 'Lemonade', spy: 'Limeade' },

  // ── Animals (10) ────────────────────────────────────────────────────────────
  { civilian: 'Tiger', spy: 'Cat' },
  { civilian: 'Dolphin', spy: 'Whale' },
  { civilian: 'Eagle', spy: 'Hawk' },
  { civilian: 'Dog', spy: 'Wolf' },
  { civilian: 'Frog', spy: 'Toad' },
  { civilian: 'Monkey', spy: 'Ape' },
  { civilian: 'Alligator', spy: 'Crocodile' },
  { civilian: 'Butterfly', spy: 'Moth' },
  { civilian: 'Rabbit', spy: 'Hare' },
  { civilian: 'Turtle', spy: 'Tortoise' },

  // ── Objects (8) ─────────────────────────────────────────────────────────────
  { civilian: 'Umbrella', spy: 'Raincoat' },
  { civilian: 'Pen', spy: 'Pencil' },
  { civilian: 'Sofa', spy: 'Chair' },
  { civilian: 'Pillow', spy: 'Cushion' },
  { civilian: 'Mirror', spy: 'Window' },
  { civilian: 'Candle', spy: 'Lamp' },
  { civilian: 'Backpack', spy: 'Suitcase' },
  { civilian: 'Watch', spy: 'Clock' },

  // ── Places (8) ──────────────────────────────────────────────────────────────
  { civilian: 'Beach', spy: 'Pool' },
  { civilian: 'Library', spy: 'Bookstore' },
  { civilian: 'Mountain', spy: 'Hill' },
  { civilian: 'Hotel', spy: 'Motel' },
  { civilian: 'Restaurant', spy: 'Cafe' },
  { civilian: 'Museum', spy: 'Gallery' },
  { civilian: 'Airport', spy: 'Train Station' },
  { civilian: 'Gym', spy: 'Stadium' },

  // ── Activities (8) ──────────────────────────────────────────────────────────
  { civilian: 'Swimming', spy: 'Diving' },
  { civilian: 'Painting', spy: 'Drawing' },
  { civilian: 'Running', spy: 'Jogging' },
  { civilian: 'Skiing', spy: 'Snowboarding' },
  { civilian: 'Singing', spy: 'Humming' },
  { civilian: 'Cooking', spy: 'Baking' },
  { civilian: 'Camping', spy: 'Hiking' },
  { civilian: 'Dancing', spy: 'Ballet' },

  // ── Technology (7) ──────────────────────────────────────────────────────────
  { civilian: 'Laptop', spy: 'Tablet' },
  { civilian: 'Email', spy: 'Letter' },
  { civilian: 'Keyboard', spy: 'Piano' },
  { civilian: 'Camera', spy: 'Telescope' },
  { civilian: 'Headphones', spy: 'Speakers' },
  { civilian: 'Bluetooth', spy: 'WiFi' },
  { civilian: 'Printer', spy: 'Scanner' },

  // ── Entertainment (7) ───────────────────────────────────────────────────────
  { civilian: 'Movie', spy: 'Play' },
  { civilian: 'Guitar', spy: 'Ukulele' },
  { civilian: 'Concert', spy: 'Festival' },
  { civilian: 'Podcast', spy: 'Radio' },
  { civilian: 'Novel', spy: 'Short Story' },
  { civilian: 'Chess', spy: 'Checkers' },
  { civilian: 'Karaoke', spy: 'Concert' },

  // ── Nature (7) ──────────────────────────────────────────────────────────────
  { civilian: 'Rain', spy: 'Snow' },
  { civilian: 'Ocean', spy: 'Lake' },
  { civilian: 'Sunrise', spy: 'Sunset' },
  { civilian: 'Forest', spy: 'Jungle' },
  { civilian: 'River', spy: 'Stream' },
  { civilian: 'Volcano', spy: 'Geyser' },
  { civilian: 'Sand', spy: 'Gravel' },

  // ── Professions (7) ─────────────────────────────────────────────────────────
  { civilian: 'Doctor', spy: 'Nurse' },
  { civilian: 'Chef', spy: 'Baker' },
  { civilian: 'Pilot', spy: 'Driver' },
  { civilian: 'Teacher', spy: 'Tutor' },
  { civilian: 'Lawyer', spy: 'Judge' },
  { civilian: 'Detective', spy: 'Spy' },
  { civilian: 'Architect', spy: 'Engineer' },

  // ── Clothing (7) ────────────────────────────────────────────────────────────
  { civilian: 'Jacket', spy: 'Sweater' },
  { civilian: 'Sandals', spy: 'Flip-flops' },
  { civilian: 'Hat', spy: 'Cap' },
  { civilian: 'Gloves', spy: 'Mittens' },
  { civilian: 'Scarf', spy: 'Shawl' },
  { civilian: 'Boots', spy: 'Shoes' },
  { civilian: 'Tie', spy: 'Bow Tie' },

  { civilian: 'Tokyo', spy: 'Seoul' },
  { civilian: 'Barcelona', spy: 'Madrid' },
  { civilian: 'London', spy: 'Paris' },
  { civilian: 'Messi', spy: 'Ronaldo' },
  { civilian: 'MODI', spy: 'RAHUL GANDHI' },

  { civilian: 'Coca-Cola', spy: 'Pepsi' },
  { civilian: 'Nike', spy: 'Adidas' },
  { civilian: 'Netflix', spy: 'Disney+' },
  { civilian: 'iPhone', spy: 'Samsung Galaxy' },
  { civilian: "McDonald's", spy: "Burger King" },
  { civilian: 'Marvel', spy: 'DC' },
  { civilian: 'Star Wars', spy: 'Star Trek' },
  { civilian: 'PlayStation', spy: 'Xbox' },
  { civilian: 'Spotify', spy: 'Apple Music' },
  { civilian: 'Instagram', spy: 'TikTok' },

  // ── Bonus Pairs (6) — push us to 85 ────────────────────────────────────────
  { civilian: 'Couch', spy: 'Recliner' },
  { civilian: 'Skateboard', spy: 'Scooter' },
  { civilian: 'Map', spy: 'Compass' },
  { civilian: 'Diary', spy: 'Journal' },
  { civilian: 'Perfume', spy: 'Cologne' },
  { civilian: 'Hammock', spy: 'Swing' },
];

/**
 * Returns a random word pair from the curated list.
 *
 * There is a 50 % chance that the `civilian` and `undercover` words are
 * swapped, so the same pair can produce different game dynamics across rounds.
 */
export function getRandomWordPair(): WordPair {
  const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];

  // 50 % chance to swap civilian ↔ undercover
  if (Math.random() < 0.5) {
    return { civilian: pair.spy, spy: pair.civilian };
  }

  // Return a shallow copy so callers can't mutate the source array
  return { civilian: pair.civilian, spy: pair.spy };
}
