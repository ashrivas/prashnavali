import { test } from "node:test";
import assert from "node:assert/strict";
import {
  answerIdForSquare,
  deriveAnswer,
  isValidSquare,
} from "./chaupaiDerivation";

test("lane formula maps squares to answers 1-9 cyclically", () => {
  assert.equal(answerIdForSquare(1), 1);
  assert.equal(answerIdForSquare(9), 9);
  assert.equal(answerIdForSquare(10), 1);
  assert.equal(answerIdForSquare(108), 9);
  assert.equal(answerIdForSquare(225), 9);
});

test("square validation bounds 1..225", () => {
  assert.equal(isValidSquare(1), true);
  assert.equal(isValidSquare(225), true);
  assert.equal(isValidSquare(0), false);
  assert.equal(isValidSquare(226), false);
  assert.equal(isValidSquare(1.5), false);
});

test("every valid square resolves to a real answer", () => {
  for (let square = 1; square <= 225; square++) {
    const answer = deriveAnswer(square);
    assert.ok(answer.answer_line_devanagari.length > 0);
    assert.equal(answer.answer_id, answerIdForSquare(square));
  }
});
