/*
 * The site follows the calendar (in each visitor's own time zone):
 *   • every month has a season: its colours (see :root[data-season] in
 *     src/index.css) and what falls from the sky
 *   • every month has a greeting, shown once per month as a small pill
 *   • special days have their own greeting, shown on that day instead
 *
 * Preview without waiting:
 *   ?month=12              that month's season and greeting
 *   ?date=2026-11-26       everything as it will look on that date
 *   ?occasion=halloween    one special day's greeting
 *
 * Turn things off with the switches below.
 */

export const seasonSettings = {
  colors: true, // seasonal palettes
  particles: true, // leaves, snow, petals
  greetings: true, // monthly and special-day greetings
};

// season: 'winter' | 'spring' | 'summer' | 'fall'
// particles: 'snow' | 'petals' | 'leaves' | null
// accent: optional colour override for that month
export const months = [
  {
    month: 1,
    season: 'winter',
    particles: 'snow',
    greeting: {
      emoji: '❄️',
      title: 'New year, new questions',
      text: 'January is for fresh starts. What are you learning this year?',
    },
  },
  {
    month: 2,
    season: 'winter',
    particles: 'snow',
    accent: '#c0406a',
    greeting: { emoji: '💌', title: 'Valentine’s month', text: 'Fall in love with a good dataset.' },
  },
  {
    month: 3,
    season: 'spring',
    particles: 'petals',
    greeting: {
      emoji: '🌸',
      title: 'Cherry blossom season',
      text: 'Seattle’s blossoms are out, and so are fresh ideas.',
    },
  },
  {
    month: 4,
    season: 'spring',
    particles: 'petals',
    greeting: { emoji: '🌷', title: 'Spring is here', text: 'A good month to plant a new habit.' },
  },
  {
    month: 5,
    season: 'spring',
    particles: 'petals',
    greeting: {
      emoji: '🎓',
      title: 'Graduation season',
      text: 'Congratulations to everyone finishing up. You did it!',
    },
  },
  {
    month: 6,
    season: 'summer',
    particles: null,
    greeting: { emoji: '☀️', title: 'Hello, summer', text: 'Long days, long reads.' },
  },
  {
    month: 7,
    season: 'summer',
    particles: null,
    greeting: { emoji: '🍉', title: 'Happy July', text: 'Halfway through the year. How’s it going?' },
  },
  {
    month: 8,
    season: 'summer',
    particles: null,
    greeting: { emoji: '🌻', title: 'Late-summer days', text: 'Perfect time for a side project.' },
  },
  {
    month: 9,
    season: 'fall',
    particles: 'leaves',
    greeting: { emoji: '🍎', title: 'Back to school', text: 'New semester energy. Keep learning.' },
  },
  {
    month: 10,
    season: 'fall',
    particles: 'leaves',
    greeting: { emoji: '🎃', title: 'It’s Halloween month', text: 'Spooky season, data style.' },
  },
  {
    month: 11,
    season: 'fall',
    particles: 'leaves',
    greeting: {
      emoji: '🦃',
      title: 'Thanksgiving month',
      text: 'Grateful for everyone who reads, asks and shares.',
    },
  },
  {
    month: 12,
    season: 'winter',
    particles: 'snow',
    accent: '#b0293b',
    greeting: { emoji: '🎄', title: 'It’s Christmas month', text: 'Wishing you a cozy, joyful December.' },
  },
];

// US Thanksgiving: the fourth Thursday of November
const thanksgiving = (year) => {
  const first = new Date(year, 10, 1).getDay(); // 0 = Sunday
  return 1 + ((4 - first + 7) % 7) + 21;
};

// Special days. `day` is a number, or a function of the year for moving dates.
export const occasions = [
  {
    id: 'newyear',
    month: 1,
    day: 1,
    emoji: '🎉',
    title: 'Happy New Year!',
    text: 'Here’s to good data and better questions.',
  },
  {
    id: 'valentines',
    month: 2,
    day: 14,
    emoji: '💝',
    title: 'Happy Valentine’s Day!',
    text: 'Sending a little love your way.',
  },
  {
    id: 'july4',
    month: 7,
    day: 4,
    emoji: '🎆',
    title: 'Happy Fourth of July!',
    text: 'Enjoy the fireworks.',
  },
  {
    id: 'halloween',
    month: 10,
    day: 31,
    emoji: '🎃',
    title: 'Happy Halloween!',
    text: 'Hope your day is more treat than trick.',
  },
  {
    id: 'thanksgiving',
    month: 11,
    day: thanksgiving,
    emoji: '🦃',
    title: 'Happy Thanksgiving!',
    text: 'Thankful for you. Enjoy the feast.',
  },
  {
    id: 'christmas',
    month: 12,
    day: 25,
    emoji: '🎄',
    title: 'Merry Christmas!',
    text: 'Wishing you a warm and happy holiday.',
  },
  {
    id: 'nye',
    month: 12,
    day: 31,
    emoji: '✨',
    title: 'Happy New Year’s Eve!',
    text: 'See you in the new year.',
  },
];
