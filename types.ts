
export type Verdict = 'True' | 'Mostly True' | 'Mixed' | 'Misleading' | 'False' | 'Unverified';

export interface Source {
  title: string;
  url: string;
}

export interface VerificationResult {
  id: string;
  timestamp: number;
  content: string;
  image?: string;
  verdict: Verdict;
  score: number; // 0 to 100
  explanation: string;
  sources: Source[];
}

export interface SearchGroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}
