import { imgSnapshotTest } from '../../../helpers/util.ts';

describe('Timeline - Look and Themes', () => {
  const spaceExplorationTimeline = `timeline
    title Space Exploration Milestones
    section Early Era
      1957 : Sputnik 1 launched
           : First artificial satellite
      1961 : Yuri Gagarin in space
           : First human in orbit
    section Moon Era
      1969 : Apollo 11 moon landing
           : Neil Armstrong's first steps
      1972 : Last Apollo mission
    section Modern Era
      2012 : Curiosity rover on Mars
      2020 : SpaceX Crew Dragon
           : Commercial spaceflight
      2021 : James Webb Space Telescope
           : Perseverance rover on Mars`;

  const themes = ['neo', 'neo-dark', 'redux', 'redux-dark', 'redux-color', 'redux-dark-color'];
  const looks = ['neo', 'classic'];

  // Test all theme and look combinations
  themes.forEach((theme) => {
    looks.forEach((look) => {
      describe(`${theme} theme with ${look} look`, () => {
        it(`should render Space Exploration timeline with ${theme} theme and ${look} look`, () => {
          imgSnapshotTest(spaceExplorationTimeline, { theme, look });
        });
      });
    });
  });

  // Additional test: Neo look with classic themes for comparison
  describe('Neo look with classic themes', () => {
    ['default', 'dark', 'forest', 'neutral'].forEach((theme) => {
      it(`should render Space Exploration timeline with ${theme} theme and neo look`, () => {
        imgSnapshotTest(spaceExplorationTimeline, { theme, look: 'neo' });
      });
    });
  });

  // Additional test: Classic look with new themes for comparison
  describe('Classic look with new themes', () => {
    themes.forEach((theme) => {
      it(`should render Space Exploration timeline with ${theme} theme and classic look`, () => {
        imgSnapshotTest(spaceExplorationTimeline, { theme, look: 'classic' });
      });
    });
  });
});
