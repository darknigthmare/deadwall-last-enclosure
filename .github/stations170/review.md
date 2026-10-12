# Reviewed main reconciliation

The first merged validation completed 71 contracts: 70 passed, one failed. Its sole failure was tests/campaign-records161.test.cjs requiring a newly started campaign ID to end in :g4. Main 1.57.2 deliberately removed that mutation, retaining initial IDs from the first autosave onward.

The assertion now requires the initial run identity without :g4. All record counts, scenario details, pause/save/restore comparisons, second-campaign uniqueness, rejected starts and initializer-error checks remain. The newer main tests independently verify every initial autosave uses the same ID and historical G4/G8 suffixed saves preserve their IDs and archives.

No gameplay controller was changed for this correction. Source hashes for the four reviewed merge conflicts are unchanged. The entire source/browser/audit gate must run again before publication.
