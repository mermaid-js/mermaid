---
'mermaid': minor
---

feat(usecase): use case diagrams now take colour by role — actors, use cases and system boundaries each get their own colour from the new `usecaseActorBkg`/`usecaseActorBorder`, `usecaseBkg`/`usecaseBorder` and `usecaseBoundaryBkg`/`usecaseBoundaryBorder` theme variables, with `usecaseIncludeLine`/`usecaseExtendLine` separating the two dashed relationship kinds by hue. `redux-color` and `redux-dark-color` set them; every other theme is unchanged. Colour is keyed to the kind of element, so editing a diagram never recolours the elements around the edit. Set `usecase.colorScheme: 'rotate'` for the per-element palette cycle instead, and `classDef`/`style` still wins over both.
