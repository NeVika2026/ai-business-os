export const FIND_CLIENTS_SECTION_HEADERS = [
  'IDEAL CUSTOMER',
  'WHERE TO REACH THEM',
  'THIS WEEK',
  'OUTREACH DRAFT',
] as const;

export type FindClientsSectionId =
  | 'ideal-customer'
  | 'where-to-reach'
  | 'this-week'
  | 'outreach-draft';

export type FindClientsSection = {
  id: FindClientsSectionId;
  title: string;
  body: string;
  copyable: boolean;
};

export type FindClientsDeliverable = {
  keyOutcome: string;
  sections: FindClientsSection[];
  outreachDraft: string | null;
  rawText: string;
};

const SECTION_ID_BY_HEADER: Record<string, FindClientsSectionId> = {
  'IDEAL CUSTOMER': 'ideal-customer',
  'WHERE TO REACH THEM': 'where-to-reach',
  'THIS WEEK': 'this-week',
  'OUTREACH DRAFT': 'outreach-draft',
};

export function buildFindClientsRuntimeInstructions(): string {
  return [
    'You are preparing a client acquisition result for a business owner.',
    'Write in clear, direct English. No jargon about AI, agents, or software.',
    'Use exactly these markdown section headers in order:',
    '## KEY OUTCOME',
    '## IDEAL CUSTOMER',
    '## WHERE TO REACH THEM',
    '## THIS WEEK',
    '## OUTREACH DRAFT',
    'KEY OUTCOME must be one sentence naming who to reach and the best channel this week.',
    'IDEAL CUSTOMER must describe a specific buyer with role, pain, and buying trigger.',
    'WHERE TO REACH THEM must list 2-3 concrete channels.',
    'THIS WEEK must be a Mon-Fri checklist with 5 actionable items.',
    'OUTREACH DRAFT must be a complete message the owner can send today.',
  ].join('\n');
}

export function buildFindClientsRuntimePrompt(userPrompt: string, businessDescription: string): string {
  return [
    buildFindClientsRuntimeInstructions(),
    '',
    'Business context:',
    businessDescription.trim() || userPrompt.trim(),
    '',
    'Owner request:',
    userPrompt.trim(),
  ].join('\n');
}

export function buildFindClientsFallbackDeliverable(
  userPrompt: string,
  businessDescription: string,
): string {
  const context = businessDescription.trim() || userPrompt.trim() || 'your business';

  return `## KEY OUTCOME
Reach decision-makers who need what you offer through personalized outreach this week.

## IDEAL CUSTOMER
- Runs or influences buying decisions at a company that matches: ${context}
- Feels the problem you solve often enough to prioritize a conversation
- Can respond to a short, specific message within a week

## WHERE TO REACH THEM
- LinkedIn messages to prospects with a clear fit
- Warm introductions from clients, partners, or peers
- Communities where your buyers already ask for help

## THIS WEEK
- Monday: Write your ideal customer profile in five bullets
- Tuesday: Build a list of 20 prospects
- Wednesday: Send 5 personalized outreach messages
- Thursday: Follow up on non-replies with one new detail
- Friday: Book at least one discovery conversation

## OUTREACH DRAFT
Subject: Quick question about your priorities

Hi [Name],

I work with businesses like yours on ${context.toLowerCase()}. I noticed [one specific observation about their work].

If improving this is on your radar, I can share a short plan you can use this week.

Open to a 15-minute call?

Best,
[Your name]`;
}

function normalizeHeader(line: string): string | null {
  const match = line.match(/^#{1,3}\s+(.+?)\s*$/);

  if (!match?.[1]) {
    return null;
  }

  return match[1].trim().toUpperCase();
}

export function parseFindClientsDeliverable(text: string): FindClientsDeliverable {
  const lines = text.split('\n');
  const sections = new Map<string, string[]>();
  let currentHeader: string | null = null;

  for (const line of lines) {
    const header = normalizeHeader(line);

    if (header) {
      currentHeader = header;
      if (!sections.has(currentHeader)) {
        sections.set(currentHeader, []);
      }
      continue;
    }

    if (currentHeader) {
      sections.get(currentHeader)?.push(line);
    }
  }

  const keyOutcome = (sections.get('KEY OUTCOME') ?? []).join('\n').trim();
  const outreachBody = (sections.get('OUTREACH DRAFT') ?? []).join('\n').trim();

  const parsedSections: FindClientsSection[] = FIND_CLIENTS_SECTION_HEADERS.map((header) => {
    const id = SECTION_ID_BY_HEADER[header];
    const body = (sections.get(header) ?? []).join('\n').trim();

    return {
      id,
      title: header
        .split(' ')
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' '),
      body,
      copyable: header === 'OUTREACH DRAFT',
    };
  }).filter((section) => section.body.length > 0);

  return {
    keyOutcome:
      keyOutcome ||
      parsedSections[0]?.body.split('\n')[0]?.trim() ||
      'Reach your ideal customers through focused outreach this week.',
    sections: parsedSections,
    outreachDraft: outreachBody || null,
    rawText: text.trim(),
  };
}
