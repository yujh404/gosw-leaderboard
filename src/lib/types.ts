export const CLASSES = [
  {
    id: 1,
    name: "1반",
    department: "소프트웨어개발과",
    short: "SOFTWARE",
    color: "#7250ad",
    symbol: "code",
  },
  {
    id: 2,
    name: "2반",
    department: "소프트웨어개발과",
    short: "SOFTWARE",
    color: "#176b99",
    symbol: "terminal",
  },
  {
    id: 3,
    name: "3반",
    department: "임베디드학과",
    short: "EMBEDDED",
    color: "#42751f",
    symbol: "cpu",
  },
  {
    id: 4,
    name: "4반",
    department: "임베디드학과",
    short: "EMBEDDED",
    color: "#a45a19",
    symbol: "circuit",
  },
  {
    id: 5,
    name: "5반",
    department: "정보보안학과",
    short: "SECURITY",
    color: "#ad3968",
    symbol: "shield",
  },
] as const;

export type ClassId = (typeof CLASSES)[number]["id"];
export type Scores = Record<ClassId, number>;
export type EventStatus = "waiting" | "live" | "completed";
export const STATUS_LABELS: Record<EventStatus, string> = {
  waiting: "대기중",
  live: "진행중",
  completed: "완료",
};
export type SportEvent = {
  id: string;
  name: string;
  description: string;
  rules: string;
  status: EventStatus;
  photoId: string | null;
  position: number;
  version: number;
  scores: Scores;
};
export type BoardSnapshot = { events: SportEvent[]; updatedAt: string };
export type RankedClass = (typeof CLASSES)[number] & {
  score: number;
  rank: number;
};
export const emptyScores = (): Scores => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
