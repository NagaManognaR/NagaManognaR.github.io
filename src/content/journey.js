/*
 * "My Journey": the chapters of your story, in order.
 *
 * Fields
 *   id         unique
 *   period     short time marker, e.g. '2020' or 'Dec 2020 – Dec 2023'
 *   title      chapter title
 *   role       optional line under the title: where it happened
 *              (internships: 'Data Intern · …')
 *   story      one or two short lines, in your voice
 *   lesson     a note to your past self at that stage
 *   milestone  optional highlight chip, e.g. 'CSCW 2026 Best Paper'
 *   image      optional { src: '/images/journey/x.jpg', alt: '…' }. Personal photos work best.
 */

export const journey = [
  {
    id: 'undergrad',
    period: '2016 – 2020',
    title: 'Where It Started',
    role: 'B.Tech, Computer Science · Vidya Jyothi Institute of Technology',
    story:
      'Four years of code, late-night hackathons, and the first time I built a dashboard that people actually used.',
    lesson: 'Build things people use. That teaches you more than any grade.',
    milestone: 'Winner · Smart India Hackathon 2020',
  },
  {
    id: 'cognizant',
    period: 'Dec 2020 – Dec 2023',
    title: 'When It All Clicked',
    role: 'Cognizant',
    story:
      'My first real data projects. Watching numbers turn into business decisions, I knew this was it. Three years of a lot of growing up.',
    lesson: 'Say yes to the messy data project. That’s where you learn the most.',
  },
  {
    id: 'masters',
    period: 'Jan 2024',
    title: 'Going All In',
    role: 'Master’s in Data Science · UMBC',
    story: 'I packed my bags, moved to the US, and went back to school to go deeper.',
    lesson: 'You don’t need to know everything before you start. You need to start.',
  },
  {
    id: 'kenhal',
    period: 'Dec 2024 – May 2025',
    title: 'First Internship',
    role: 'Data Intern · Kenhal Consulting',
    story: 'Migrated six key dashboards from Superset to Tableau, and learned how real teams ship.',
    lesson: 'Nobody expects you to know it all. They expect you to ask good questions.',
  },
  {
    id: 'research',
    period: 'Jan – Dec 2025',
    title: 'Finding Research',
    role: 'UMBC, with Prof. Sanorita Dey',
    story:
      'Built InsightAI, an AI interviewer platform (GPT-4o, Whisper), and studied how people actually experience talking to AI. Two papers came out of it.',
    lesson: 'The most interesting AI problems aren’t always about better models. They’re about people.',
    milestone: 'CSCW 2026 Best Paper · AIED 2026',
  },
  {
    id: 'student-affairs',
    period: 'Jun 2025 – Apr 2026',
    title: 'Data for Students',
    role: 'Data Intern · UMBC Division of Student Affairs',
    story: 'Turned career-outcomes data into dashboards that helped the university make decisions.',
    lesson: 'If nobody understands your analysis, it can’t change a decision. Learn to explain it.',
    milestone: 'Azure AI Engineer Associate',
  },
  {
    id: 'graduation',
    period: 'Dec 2025',
    title: 'Graduation, and the Grind',
    role: 'M.S. Data Science · UMBC',
    story: 'Degree done. Then came interview after interview after interview.',
    lesson: 'Every rejection is data. Track what you’re asked, and improve one thing at a time.',
  },
  {
    id: 'microsoft',
    period: 'Apr 2026',
    title: 'The Email Came',
    role: 'Microsoft, Redmond',
    story: 'I joined Microsoft, working on some of the most meaningful and useful projects of my career.',
    lesson: 'It only takes one yes. Keep going until you get yours.',
  },
  {
    id: 'now',
    period: 'Now',
    title: 'Paying It Forward',
    role: 'The Data Girl Journal',
    story: 'Sharing the tips, lessons and honest advice I wish I’d had, for anyone growing in data.',
    lesson: 'Help someone who’s a few steps behind you. It’s the best way to keep learning.',
    milestone: '@thedatagirljournal',
  },
];
