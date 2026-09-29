# Exploratory ranking diagnostics

**Post-result analysis.** These examples explain where the frozen development-selected rule missed. They did not select or modify the rule, and they are not confirmatory evidence. Reproduce with `node --import tsx app/core/scripts/diagnose-ranking-misses.ts` from the repo root.

## 23_24 to 24_25

Source advanced CSV SHA-256: `444b307d0b39684d8af93208b0f9067584f67916588d594b372daf677e9e6819`.

### Lowest future value among the selected rule’s top 50

- Rank 48: Grayson Allen, future value -0.32, source games 75, BPM 1.3, WS 6.9.
- Rank 50: Alex Caruso, future value 0.75, source games 71, BPM 2.5, WS 4.9.
- Rank 46: CJ McCollum, future value 0.96, source games 66, BPM 3.1, WS 5.9.
- Rank 41: Dejounte Murray, future value 1.37, source games 78, BPM 1.7, WS 4.9.
- Rank 8: Joel Embiid, future value 1.48, source games 39, BPM 11.6, WS 7.5.

### Highest future value outside the selected rule’s top 156

- Rank 190: Dyson Daniels, future value 5.64, source games 61, BPM 0.6, WS 2.9.
- Rank 263: Christian Braun, future value 4.48, source games 82, BPM -1.9, WS 3.4.
- Rank 177: Jaden McDaniels, future value 2.87, source games 72, BPM -2.6, WS 3.4.
- Rank 169: Payton Pritchard, future value 2.80, source games 82, BPM 1.0, WS 6.1.
- Rank 167: Tari Eason, future value 2.58, source games 22, BPM 1.6, WS 1.3.

These descriptive advanced values can suggest hypotheses for a future protocol. They cannot establish that BPM or WS would improve a ranking without a new holdout.

## 24_25 to 25_26

Source advanced CSV SHA-256: `73b804a33eaf1ea073995641904d93e89a5e5e2087e672ce3f5605a64accaf77`.

### Lowest future value among the selected rule’s top 50

- Rank 42: Brook Lopez, future value -0.68, source games 80, BPM 0.8, WS 6.6.
- Rank 45: Christian Braun, future value -0.01, source games 79, BPM 0.3, WS 8.0.
- Rank 5: Tyrese Haliburton, future value 0.00, source games 73, BPM 5.8, WS 10.4.
- Rank 10: Damian Lillard, future value 0.00, source games 58, BPM 4.0, WS 7.6.
- Rank 24: Kyrie Irving, future value 0.00, source games 50, BPM 3.4, WS 4.6.

### Highest future value outside the selected rule’s top 156

- Rank 202: Nickeil Alexander-Walker, future value 5.12, source games 82, BPM -0.4, WS 4.3.
- Rank 177: Keyonte George, future value 3.66, source games 67, BPM -2.7, WS 1.1.
- Rank 274: Ryan Rollins, future value 3.20, source games 56, BPM -0.5, WS 1.7.
- Rank 219: Kevin Porter Jr., future value 3.08, source games 75, BPM -0.6, WS 2.2.
- Rank 273: Neemias Queta, future value 3.02, source games 62, BPM -0.7, WS 3.2.

These descriptive advanced values can suggest hypotheses for a future protocol. They cannot establish that BPM or WS would improve a ranking without a new holdout.
