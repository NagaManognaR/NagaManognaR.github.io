/*
 * Site-wide content: who you are, where to find you, and the words on the home page.
 * Everything a visitor reads outside the lists (research, writing, journey, work)
 * lives here, so updating copy never means touching a component.
 *
 * A social link with an empty `url` still shows its icon, dimmed and not clickable,
 * until you fill it in.
 */

export const site = {
  name: 'Manogna Rayasam',
  fullName: 'Naga Manogna Rayasam',
  role: 'Data Scientist',
  company: 'Microsoft',
  domain: 'https://manogna-rayasam.me',
  description:
    'Manogna Rayasam is a Data Scientist at Microsoft working across analytics, machine learning, AI and human behaviour, and writing about data and AI as The Data Girl Journal.',
  footerLine: 'Built around data, curiosity, and a lot of learning.',
};

export const links = {
  topmate: 'https://topmate.io/manogna_rn',
  askMeAnything: 'https://topmate.io/manogna_rn/2103634', // free Topmate session
  instagram: 'https://www.instagram.com/thedatagirljournal',
  linkedin: 'https://www.linkedin.com/in/rn-manogna/',
  medium: 'https://medium.com/@rn.manogna',
  substack: 'https://substack.com/@thedatagirljournal/posts',
};

// Order here is the order the icons appear in the header, footer and contact section.
export const socials = [
  { id: 'instagram', label: 'Instagram', url: links.instagram },
  { id: 'linkedin', label: 'LinkedIn', url: links.linkedin },
  { id: 'medium', label: 'Medium', url: links.medium },
  { id: 'substack', label: 'Substack', url: links.substack },
];

// Seasonal touches. When autumn is over: theme: null, leaves: false.
export const seasonal = {
  theme: 'fall', // warmer palette (see :root[data-season='fall'] in src/index.css)
  leaves: true, // falling leaves on every page
};

// Date-triggered greetings. Each shows only on its day, in the visitor's own
// time zone (month is 1–12). Preview any of them on any day with
// ?occasion=<id> in the address, e.g. http://localhost:5173/?occasion=halloween
export const occasions = [
  {
    id: 'halloween',
    month: 10,
    day: 31,
    emoji: '🎃',
    title: 'Happy Halloween!',
    text: 'Hope your day is more treat than trick.',
  },
];

// Each entry is its own page.
export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Research', href: '/research' },
  { label: 'Writing', href: '/writing' },
  { label: 'Journey', href: '/journey' },
  { label: 'Contact', href: '/contact' },
];

export const hero = {
  greeting: 'Hi, I’m',
  headline: ['Data Scientist.', 'Researcher.', 'Storyteller.'],
  bio: 'Data Scientist at Microsoft, turning data into insights, research and stories.',
  actions: [
    { label: 'View My Research', href: '/research', variant: 'solid' },
    { label: 'Read My Writing', href: '/writing', variant: 'glass' },
    { label: 'Book a Conversation', href: links.topmate, variant: 'glass', external: true },
  ],
};

// Wrap words in **double asterisks** to make them bold.
export const about = {
  title: 'Hi, I’m *Manogna* 👋',
  story: [
    'In 2020, fresh out of undergrad, I opened my first dataset with no idea where it would take me.',
    'A data project at **Cognizant** is where it all clicked. That led to a Master’s, two research papers (one won a **Best Paper Award** ✨), two internships, and more interviews than I’d like to admit.',
    'Then one April, the email came: **Microsoft.**',
    'Looking back, I wish someone had been there to guide me. **So I’m creating the space I wish I had.**',
    'Here you’ll find the tips, lessons and honest advice I needed when I was starting out. Take what helps, and visit often. This space grows as I do. 🌱💌',
  ],
  // the last line, and where "Let me know" points
  ask: {
    text: 'Got a question or a topic you’d like me to cover?',
    link: 'Ask me anything',
    rest: ' (it’s free!), and I’ll help however I can.',
    href: links.askMeAnything,
  },
};

// The Writing page: one place for each kind of story.
export const writing = {
  title: 'Three ways to *follow along*',
  description: 'Essays on Medium, a weekly interview series on Substack, and visual notes on Instagram.',
  channels: [
    {
      id: 'medium',
      name: 'Medium',
      kind: 'Ideas & essays',
      text: 'Longer thoughts when something is on my mind: data, AI, careers, and whatever I can’t stop thinking about.',
      cta: 'Read on Medium',
      url: links.medium,
    },
    {
      id: 'substack',
      name: 'Substack',
      kind: 'The Interview Series',
      badge: 'Weekly',
      text: 'Every week, a conversation with a working data scientist: how they got in, what they actually do, and what they wish they’d known.',
      cta: 'Subscribe on Substack',
      url: links.substack,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      kind: 'Visual notes',
      text: 'Bite-sized tips, frameworks and behind-the-scenes from The Data Girl Journal.',
      cta: 'Follow @thedatagirljournal',
      url: links.instagram,
    },
  ],
};

export const contact = {
  headline: 'Let’s talk data, research, careers, or ideas.',
  cta: 'Book a Conversation',
};
