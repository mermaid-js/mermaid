// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

// The SSIM comparison method can be used if the pixelmatch is throwing lots of false positives.
// SSIM actually does not catch minute changes in the image, so it is not as accurate as pixelmatch.
// addMatchImageSnapshotCommand({
//   comparisonMethod: 'ssim',
//   failureThreshold: 0.01,
//   failureThresholdType: 'percent',
//   customDiffConfig: {
//     ssim: 'fast',
//   },
//   blur: 1,
// });

addMatchImageSnapshotCommand();
