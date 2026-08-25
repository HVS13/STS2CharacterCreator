# BLANK Combat Proof

Audit date: **2026-08-25**

Status: **PASS**

## Combat proof

- enemy: Nibbit
- HP before: 44
- Block before: 0, none visible
- relevant modifiers: none visible; no Weak, Vulnerable, Strength, or other relevant modifier
- Runtime Strike cost: 1
- HP after: 33
- calculated damage: 44 - 33 = 11
- expected damage: 11, from the card's `damage: 11` definition
- pass/fail: PASS
- card execution errors: none observed. The log recorded `Player 1 playing card BLANKTHESPIRE-FORGED_CLASS01_CARD01` targeting Nibbit, with no post-play BLANK/runtime error or exception.

## Rollback

- restored successfully: yes
- all 294 user-data hashes matched the verified backup, with no extra files
- BaseLib removed
- BLANK removed
- the three pre-existing `UnifiedSavePath` file hashes matched
- all 53 Workshop directory IDs matched
- the STS2 process was absent
- delayed settings and profile hashes remained stable after 10 seconds