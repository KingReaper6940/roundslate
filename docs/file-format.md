# Ledger and receipt formats

Editable ledgers use `roundslate-project-v1`, with exactly `schema`, `title`, `notes`, `direction`, `players`, `rounds`.

Direction is high or low. Player objects have exactly id and name. Player IDs p1–p999999 are unique and identify columns independently of names.

Round objects have exactly id, label, notes, status, scores. IDs r1–r999999 are unique within the current ledger. Status is draft or posted. Scores is an object with exactly one key for each player ID. Values are bounded integer deltas or null. Null means unset, never zero.

Every posted round must have nonnull scores for all players. Drafts can be incomplete or fully entered and are excluded from all standings. Posting is explicit. Correcting/deleting a posted round requires reopening it first; reopening preserves its data and removes its contribution.

Totals sum only posted deltas. Rank is one plus the number of players with a strictly better total under the chosen direction. Ties preserve roster order and share rank. With no posted rounds, ranks are null and there are no leaders. These are current standings, not an inferred final winner.

The edit layer prevents changing the player count after a round is added. Same-count renames retain IDs/column positions. Project imports represent a whole new ledger and are validated independently.

Receipt exports use `roundslate-receipt-v1`, containing the entire editable project plus a fresh summary. Per-round details include entered/required counts; draft aggregate totals are null. Receipt, HTML, CSV and SVG files are not editable imports.

Browser storage uses key `roundslate-project-v1` and saves the editable project. Form inputs and 25-action history remain session-only. A raw-copy comparison warns about changed browser state before writes, but is not an atomic cross-tab transaction. Explicit copy selection and project loads can replace the stored copy. Failed storage writes report memory-only operation.

UTF-8 project files are bounded, validated atomically and discarded if a newer file, editor input, saved action or storage event supersedes the read. Successful imports enter undo history.

CSV retains every round and includes a posted-only totals row. Empty score cells are null; numeric zero is written explicitly. Potential formula-like text labels/notes are apostrophe-prefixed only in CSV; JSON/HTML preserve original text. All HTML/SVG text is escaped rather than rendered as user markup.
