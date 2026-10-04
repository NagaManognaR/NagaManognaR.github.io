/*
 * Research papers, newest first.
 *
 * Fields
 *   title, venue, publisher, year   shown on the card
 *   award         optional ribbon, e.g. 'Best Paper Award'
 *   authors       your name is highlighted automatically (see `me`)
 *   summary       one or two sentences
 *   role          your role on the paper
 *   contribution  optional sentence about what you did, in your words
 *   areas         research areas, shown as small tags
 *   paperUrl      "Read Paper" (button is hidden while empty)
 *   learnMoreUrl  "Learn More" (optional)
 *
 * TIP: the lnkd.in links come from LinkedIn posts. Swap them for DOI links
 * (https://doi.org/...) once you have them.
 */

export const me = ['Naga Manogna Rayasam', 'Manogna Rayasam'];

export const papers = [
  {
    id: 'ai-interviewers',
    title:
      'Expecting Too Much, Getting Too Little: Exploring the Challenges and Design Opportunities of Asynchronous AI Interviewers',
    venue: 'ACM CSCW',
    publisher: 'ACM Conference on Computer-Supported Cooperative Work and Social Computing',
    year: 2026,
    award: 'Best Paper Award',
    authors: ['Md Nazmus Sakib', 'Naga Manogna Rayasam', 'Sanorita Dey'],
    summary: 'How people experience asynchronous AI interviewers, and how to design them better.',
    role: 'Co-author',
    contribution: '', // TODO: one sentence on what you did
    areas: ['Human–AI interaction', 'Conversational AI', 'HCI'],
    paperUrl: 'https://dl.acm.org/doi/10.1145/3816931',
    learnMoreUrl: 'https://lnkd.in/e_gwyRBp',
  },
  {
    id: 'reflected',
    title: 'ReflectEd: Evaluating Reflection-Driven Learning in an AI-Assisted System',
    venue: 'AIED',
    publisher: 'Artificial Intelligence in Education · Springer Nature (LNAI)',
    year: 2026,
    authors: ['Md Nazmus Sakib', 'Ishika Tarin', 'Naga Manogna Rayasam', 'Manas Gaur', 'Sanorita Dey'],
    summary:
      'An AI-assisted system that helps teams reflect between checkpoints, evaluated in a mixed-methods study.',
    role: 'Co-author',
    contribution: '', // TODO: one sentence on what you did
    areas: ['AI in education', 'Reflection', 'Mixed methods'],
    paperUrl: 'https://lnkd.in/gwidVNTs',
    learnMoreUrl: '',
  },
];
