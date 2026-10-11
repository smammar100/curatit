# Creative Intelligence: rating rubric (2.1)

Curatit's analysis has to beat what anyone gets by uploading the same image to a chat assistant.
`npm run creative:compare` puts the two side by side for each post in `eval-set.json`, labelled A
and B in an order fixed per post. Raters see the post and the two texts, never which is which
(`key.json` holds that), and score each side in `ratings.csv`. An AI model is not a rater here:
the deterministic counts in `metrics.json` are a sanity check, not a verdict.

## How to rate

Open the post on Instagram (or in Curatit), look at every slide, then read A and B. Score each
from 1 (poor) to 5 (excellent), except the two marked otherwise. Five to ten raters who work as
designers or marketers is enough to see a difference; one rater is not.

| Column | What to judge | 1 | 5 |
|---|---|---|---|
| `observation_accuracy` | Is what it says about the images true? | Several wrong details | Every detail checks out |
| `specificity` | Could the text only be about this post? | Fits any post ("clean typography") | Names the exact execution |
| `evidence_validity` | Do the slides and quotes it points to show what it claims? | References missing or wrong | Every claim traceable to a slide or the caption |
| `novelty` | Did it show you something you hadn't noticed at a glance? | Nothing new | At least one real insight |
| `usefulness` | Could you use it on your next brief? | No | Directly |
| `transferable_principles` | Are the rules it draws general, accurate and not copying the brand? | Vague or a copy of the post | A rule you'd reuse |
| `limitations_accuracy` | Does it say what can't be concluded, and flag real risks (data, claims, legibility)? | Overclaims or misses risks | Honest and complete |
| `redundancy` | How much repeats itself? (5 = none) | Mostly repetition | Nothing repeated |
| `hallucinations` | Count of invented details (a number, not a score) | | |
| `seconds_to_understand` | Seconds until you could say what the creative idea is (a number) | | |

Add anything else in `notes`: a wrong slide number, a recommendation you'd never follow, advice
that would distort data or hide a disclosure.

## Reading the results

Unblind with `key.json` only after every rating is in. Compare the medians per column, and read
the notes: a single invented figure or a recommendation to play down a disclaimer matters more
than a point of specificity. Repeat after any prompt change (`versions.json`), on the same set.
