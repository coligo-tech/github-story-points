# Coligo Github Story Points

An extension made to accumulate the estimates of the issues in our projects.

### Supported Units 
- H : An hour.
- D : 8 hours.

### Supported Formats 
 - Brackets : [5H]
 - Tags : <1.5D>

### Supported Browsers
Chrome and firefox.
  
 ### Future Updates
 To add new units simply update `src/story-points.ts`, the regexps expressions on line 25 should be updated with the new unit in the end.
 And update the `pointsTransformations` object to add a transformation function for the new unit to transform it to the smallest unit available (which is currently hours).

 ### Disclaimer 
 This repo is originally forked from [this repo](https://github.com/banyan/github-story-points) 