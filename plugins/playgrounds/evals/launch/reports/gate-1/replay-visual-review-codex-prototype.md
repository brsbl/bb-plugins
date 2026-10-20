# Codex prototype independent visual review

Completed all20 replay cases and 24 manual control decisions; 5 true inventory omissions retain index=null. 15/20 cards have all controls proven live after manual evidence. Generation timings unchanged.

Source/scorer revisions and exact result/source/request/frame SHA256 hashes are in the adjacent JSON. Only real input actions drove manual checks; eval observed state. Every newly passing prior-fail and remaining failing control was visually inspected. Runtime errors are never waived. Unchanged prior-pass controls retain their saved proof.

Confirmed failures: thermos all3 selects; spray-bottle all3 controls; Git scenario; DNS cache route; CDN phase/Next/Edge C. CDN stage has a real initial transition but remains unproven for its advertised full journey.

WebSocket and load-balancer disclosures already have v3 index3; they are not supplemental duplicates. Five true missing summaries (CDN, umbrella, door-lock, DNS, Git) are individually proven by actual expansion frames.

| Prompt | All controls live | Blocking controls |
|---|---|---|
| washing-machine | True |  |
| bicycle-pump | True |  |
| zipper | True |  |
| toilet | True |  |
| thermos | False | 0:dead, 1:dead, 2:dead |
| door-lock | True |  |
| refrigerator | True |  |
| stapler | True |  |
| spray-bottle | False | 0:dead, 1:dead, 2:dead |
| seat-belt | True |  |
| toaster | True |  |
| umbrella | True |  |
| cdn | False | 0:unproven, 1:dead, 2:dead, 5:dead |
| notification-settings | True |  |
| narrow-toggle | True |  |
| dns | False | 1:dead |
| database-index | True |  |
| git-merge | False | 0:dead |
| load-balancer | True |  |
| websocket | True |  |

| Prompt / width / index | Verdict | Reason |
|---|---|---|
| bicycle-pump / 710 / 0 | live | Actual ArrowRight frames show piston moving down, compressed air chamber, inlet closure and a new compression paragraph/readout. Saved handler explicitly supports ArrowRight and selects phase 1 without autonomous settling. |
| bicycle-pump / 710 / 1 | live | Precondition Next enables Previous; click returns compression to fill, raises piston, opens inlet and replaces explanation. |
| cdn / 710 / 0 | unproven | Only partial behavior is proved: ArrowRight advances Before purge to Purge accepted (0 to 1), but the saved phase definition omits numeric bounds and the frozen bridge defaults to 0..1. The full advertised 0..4 journey cannot be inferred from that single visible transition. Planned repeated-key/manual bounds evidence is needed; this must not become a whole-card pass. |
| cdn / 710 / 1 | dead | Actual subsequent range drag reaches DOM value4 while diagram and explanation remain phase1/Purge accepted. The input thumb moves but bridge phase clamps to1; visible later stages do not work. |
| cdn / 710 / 3 | live | The actual browser-cache checkbox changes the readout from Edge HIT to Local browser HIT and replaces the viewer explanation with the browser retaining its fresh v1 copy. This is independent visible output beyond checkbox styling. |
| cdn / 710 / 5 | dead | Next advances initial0 to1, then further real Next remains phase1/Purge accepted. Three advertised later phases are inaccessible because bridge default max1 clamps phase. |
| database-index / 710 / 0 | live | Actual ArrowRight frames move the emphasized table row from ID 1 to ID 2 and update the query/route ID. The saved handler explicitly changes target and renders; source geometry is static otherwise. The very pale external text is a readability limitation, not a dead input. |
| database-index / 710 / 1 | live | Actual Access path change from B-tree to full scan emphasizes every table row and changes the route/count to checking 12 rows. This meaningful output is visible outside the selector, though the pale text contrast is poor. |
| database-index / 710 / 2 | live | Actual full-resolution frames show SELECT WHERE id = 1 changing to id = 2 and route text return ID 1 changing to ID 2 while in scan mode. All rows correctly remain emphasized for a full scan. The text is very pale but visibly changes; the saved target handler matches this output. |
| dns / 710 / 0 | live | Actual supported End frames change local-cache check to Connect to the website, highlighting the device/web-server link and changing the caption. Source explicitly supports End and sets the last sequence step; no autonomous animation exists. |
| dns / 710 / 1 | dead | Native Home/Enter to End/Enter shows No cache then On your device, while dns.state.cache stays numeric0 and max stays3. Next twice clears selection and visits resolver/cache instead of device-cached route. Actual images confirm wrong route. Earlier automatic proof merely reset lookup step and did not prove cache selection. |
| git-merge / 710 / 0 | dead | Real select changes Clean merge to Fast-forward, but actual diagram, merge explanation and history remain Clean merge; params stays {}. String-array options do not match frozen option.value contract. |
| load-balancer / 710 / 0 | live | Drag changes requests 3 to 11, routes C to B, server counts 1/1/1 to 4/4/3 and route readout; meaningful output corroborates supported range input. |
| load-balancer / 710 / 3 | live | Actual summary click expands the previously hidden explanatory paragraphs; read-only details.open changes false to true and actual PNGs show the new text. |
| notification-settings / 598 / 0 | live | After opening preview, Email click removes its example while keeping Push; meaningful external text change. |
| notification-settings / 598 / 1 | live | With preview visible, Push click changes the Push example to All notifications are off. |
| notification-settings / 598 / 2 | live | Daily digest click exposes the schedule select and changes external preview to Daily digest at 9 AM. |
| notification-settings / 598 / 3 | live | Click Preview notifications reveals the external preview panel with Email and Push examples. |
| notification-settings / 598 / 4 | live | After enabling Daily digest and preview, real Home/Enter then End/Enter changes 7 AM to 6 PM in both select and external preview. |
| refrigerator / 710 / 0 | live | Actual ArrowRight frames move the refrigerant marker from evaporator to compressor and replace the explanation and readout with compression. The source explicitly increments phase for ArrowRight; no autonomous motion can explain this state change. |
| seat-belt / 710 / 0 | live | The actual supported ArrowRight pair changes Normal to Sudden braking, moves the pendulum/link and engages the catch, with a matching payout-blocked readout. Saved handler updates local mode and draws synchronously; no incidental animation is involved. |
| spray-bottle / 710 / 0 | dead | Actual supported-input frames retain the release state, open inlet, closed outlet and unchanged explanation. The generated source defines stroke as type string with value squeeze; the frozen bridge only handles text/toggle specially and otherwise numeric-normalizes with default 0. Both squeeze/release strings therefore stay 0 and cannot trigger the intended state change. This is a parameter-contract defect, not a missing visual threshold. |
| spray-bottle / 710 / 1 | dead | Actual supported-input frames retain the release state, open inlet, closed outlet and unchanged explanation. The generated source defines stroke as type string with value squeeze; the frozen bridge only handles text/toggle specially and otherwise numeric-normalizes with default 0. Both squeeze/release strings therefore stay 0 and cannot trigger the intended state change. This is a parameter-contract defect, not a missing visual threshold. |
| spray-bottle / 710 / 2 | dead | Actual supported-input frames retain the release state, open inlet, closed outlet and unchanged explanation. The generated source defines stroke as type string with value squeeze; the frozen bridge only handles text/toggle specially and otherwise numeric-normalizes with default 0. Both squeeze/release strings therefore stay 0 and cannot trigger the intended state change. This is a parameter-contract defect, not a missing visual threshold. |
| stapler / 710 / 0 | live | The actual ArrowRight pair changes Ready to Press: handle and magazine lower, driver moves, and the explanation changes. Source explicitly increments step on ArrowRight; no autonomous animation exists. |
| stapler / 710 / 1 | live | Next enables Back; click returns Press to Ready, lifts driver/staple and changes explanation. |
| thermos / 710 / 0 | dead | Real native Home/Enter to End/Enter changes displayed selection, but actual diagram and explanation remain unchanged. Read-only thermosState.params remains {}. Source supplies string-array options; frozen bridge expects option.value and rejects every intended choice. |
| thermos / 710 / 1 | dead | Real native Home/Enter to End/Enter changes displayed selection, but actual diagram and explanation remain unchanged. Read-only thermosState.params remains {}. Source supplies string-array options; frozen bridge expects option.value and rejects every intended choice. |
| thermos / 710 / 2 | dead | Real native Home/Enter to End/Enter changes displayed selection, but actual diagram and explanation remain unchanged. Read-only thermosState.params remains {}. Source supplies string-array options; frozen bridge expects option.value and rejects every intended choice. |
| toaster / 710 / 0 | live | The actual End pair changes Ready to Released/heaters off and replaces the explanation with timer-end, latch release and spring-lift text. Source explicitly maps End to cycle 100; similar endpoint geometry does not negate the visible state/readout change. |
| toilet / 710 / 1 | live | Next enables Back; click returns Flush to Ready, restores tank level, closes flapper and changes explanation. |
| umbrella / 710 / 0 | live | The actual ArrowRight pair raises the runner, spreads ribs and fabric and changes Closed to the moving-ribs explanation. The source explicitly adjusts the target on ArrowRight; its easing animation follows that input rather than changing autonomously. |
| washing-machine / 710 / 0 | live | The actual selector pair changes Wash to Drain, lowers the water, colors the drain route and changes both readout and explanation. The source subscription changes stage only on input; the distinct drain output is not incidental drum animation. |
| washing-machine / 710 / 1 | live | Actual click frames show the full simplification text present before and hidden after the summary click. This is a working native disclosure collapse, despite the automatic aligned-region proof failing when text disappears; the source uses details/summary. |
| websocket / 710 / 1 | live | Next enables Back; click returns Send to Connection opened, moves packet back to sender and updates explanation. |
| websocket / 710 / 3 | live | Actual summary click expands the previously hidden explanatory paragraphs; read-only details.open changes false to true and actual PNGs show the new text. |
| zipper / 710 / 0 | live | The actual End pair moves the slider from the bottom to the top and joins the tooth rows below it. The source explicitly supports End and sets position 100; no autonomous motion exists. |
| cdn / 710 / 2 | dead | Partial control: real native Home/Enter then End/Enter should select last option Edge C but settles at Edge B, confirmed in actual PNG and params.region1. Missing valid string schema/bounds clamps intended region2 to1. A→B response is real, but advertised Edge C never works. |
| cdn / 710 / None | live | Actual summary click expands the previously hidden explanatory paragraphs; read-only details.open changes false to true and actual PNGs show the new text. |
| umbrella / 710 / None | live | Actual summary click expands the previously hidden explanatory paragraphs; read-only details.open changes false to true and actual PNGs show the new text. |
| door-lock / 710 / None | live | Actual summary click expands the previously hidden explanatory paragraphs; read-only details.open changes false to true and actual PNGs show the new text. |
| dns / 710 / None | live | Actual summary click expands the previously hidden explanatory paragraphs; read-only details.open changes false to true and actual PNGs show the new text. |
| git-merge / 710 / None | live | Actual summary click expands the previously hidden explanatory paragraphs; read-only details.open changes false to true and actual PNGs show the new text. |

Manual evidence was inspected as before2/after0 pairs under `prototype-manual-review/pairs/`, with additional actual DNS Next1/Next2 and CDN range-end0 frames. Complete original PNGs remain unchanged. Each paired original and contact sheet is hashed in JSON.
