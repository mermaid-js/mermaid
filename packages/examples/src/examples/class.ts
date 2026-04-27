import type { DiagramMetadata } from '../types.js';

export default {
  id: 'classDiagram',
  name: 'Class Diagram',
  description: 'Visualize class structures and relationships in object-oriented programming',
  examples: [
    {
      title: 'Basic Class Inheritance',
      isDefault: true,
      code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }`,
    },
  ],
} satisfies DiagramMetadata;
