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
    {
      title: 'Class Styling',
      code: `classDiagram
    class Controller {
      +handleRequest()
    }
    class Service {
      -List~String~ items
      +process()
    }
    class Repository {
      +save()
      +find()
    }
    Controller --> Service
    Service --> Repository
    style Controller fill:#f9f,font-family:Arial,font-size:14px
    style Service fill:rgb(200 230 255),opacity:0.9,font-weight:bold
    style Repository fill:#dfd,stroke:#393,stroke-width:2px`,
    },
  ],
} satisfies DiagramMetadata;
