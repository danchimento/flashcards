// The U.S. states campaign: ~20 themed levels (Option C).
//
// Each level has a `focus` (the states it introduces / centers on). The playable
// pool for a level is every state introduced up to and including it (cumulative),
// so earlier states keep coming back for review. Levels with an empty focus are
// pure review / mastery levels. Ordered easy → hard, ending on New England, then
// all-50 mastery. `focus` uses state names (they match the content pack items).
export const usStatesCampaign = [
  { title: 'West Coast', blurb: 'The Pacific edge + the islands', focus: ['Washington', 'Oregon', 'California', 'Alaska', 'Hawaii'] },
  { title: 'Four Corners', blurb: 'The Southwest, where four states meet', focus: ['Arizona', 'New Mexico', 'Utah', 'Colorado', 'Nevada'] },
  { title: 'Northern Rockies', blurb: 'Up the spine of the mountains', focus: ['Idaho', 'Montana', 'Wyoming'] },
  { title: 'Review: The West', blurb: 'Mix of everything so far', focus: [] },
  { title: 'The Great Plains Stack', blurb: 'The straight line down the middle', focus: ['North Dakota', 'South Dakota', 'Nebraska', 'Kansas', 'Oklahoma'] },
  { title: 'Lone Star & the Delta', blurb: 'Texas and the lower Mississippi', focus: ['Texas', 'Arkansas', 'Louisiana'] },
  { title: 'Review: Plains & South-Central', blurb: 'Keep them sharp', focus: [] },
  { title: 'MIMAL & the Upper Midwest', blurb: 'The Mississippi column', focus: ['Minnesota', 'Iowa', 'Missouri', 'Wisconsin'] },
  { title: 'The Great Lakes', blurb: 'Around the lakes', focus: ['Illinois', 'Indiana', 'Michigan', 'Ohio'] },
  { title: 'Review: The Midwest', blurb: 'Cumulative check-in', focus: [] },
  { title: 'Appalachia', blurb: 'The upland South', focus: ['Kentucky', 'Tennessee', 'West Virginia', 'Virginia'] },
  { title: 'The Deep South', blurb: 'Along the Gulf', focus: ['Mississippi', 'Alabama', 'Georgia'] },
  { title: 'The Southeast Coast', blurb: 'Down to the peninsula', focus: ['North Carolina', 'South Carolina', 'Florida'] },
  { title: 'Review: The South', blurb: 'All of it now', focus: [] },
  { title: 'Mid-Atlantic (I-95)', blurb: 'The busy corridor', focus: ['New York', 'New Jersey', 'Pennsylvania', 'Delaware', 'Maryland'] },
  { title: 'New England', blurb: 'The final boss — six tiny states', focus: ['Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut'] },
  { title: 'Review: The East Coast', blurb: 'Seaboard sweep', focus: [] },
  { title: 'Challenge: Twins & Rectangles', blurb: 'The look-alikes', focus: [] },
  { title: 'Review: All 50', blurb: 'Everything, mixed', focus: [] },
  { title: 'Mastery: All 50', blurb: 'Type them all', focus: [] },
];
