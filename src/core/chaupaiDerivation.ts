import { getAnswerById, totalSquares, type Answer } from "../data/dataset";

export const MIN_SQUARE = 1;
export const MAX_SQUARE = totalSquares; // 225

export function isValidSquare(square: number): boolean {
  return Number.isInteger(square) && square >= MIN_SQUARE && square <= MAX_SQUARE;
}

// Ram Shalaka trace: every 9th letter from the chosen square cycles to one of
// 9 answer lanes. lane = ((N - 1) mod 9) + 1.
export function answerIdForSquare(square: number): number {
  return ((square - 1) % 9) + 1;
}

export function deriveAnswer(square: number): Answer {
  if (!isValidSquare(square)) {
    throw new RangeError(`square out of range: ${square}`);
  }
  const answerId = answerIdForSquare(square);
  const answer = getAnswerById(answerId);
  if (!answer) {
    throw new Error(`no answer for id ${answerId} (square ${square})`);
  }
  return answer;
}
