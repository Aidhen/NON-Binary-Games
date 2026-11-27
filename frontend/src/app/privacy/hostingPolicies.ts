// Next.js only lets a page file export the page itself: the list lives next to it.
export const HOSTING_POLICIES = [
  { name: 'Vercel', url: 'https://vercel.com/legal/privacy-policy' },
  { name: 'Render', url: 'https://render.com/privacy' },
  { name: 'GitHub', url: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement' },
] as const;
