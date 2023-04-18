# User Journey Diagram

> User journeys describe at a high level of detail exactly what steps different users take to complete a specific task within a system, application or website. This technique shows the current (as-is) user workflow, and reveals areas of improvement for the to-be workflow. (Wikipedia)

Mermaid can render user journey diagrams:

```mermaid-example
graph TD
    A[User] -- Choose Module --> B(Camera)
    B -- Initialize --> C[Image Segmentation Module]
    B -- Initialize --> D[Image Classification Module]
    B -- Initialize --> E[Object Detection Module]
    B -- Initialize --> F[Pose Estimation Module]
    B -- Initialize --> G[OCR Module]
    C -- Perform Image Segmentation --> H[Module Function]
    D -- Perform Image Classification --> I[Module Function]
    E -- Perform Object Detection --> J[Module Function]
    F -- Perform Pose Estimation --> K[Module Function]
    G -- Perform OCR --> L[Module Function]
    style A fill:#98FB98,stroke:#000000,stroke-width:2px,shape:square
    style B fill:#ADD8E6,stroke:#000000,stroke-width:2px,shape:square
    style C fill:#FFFFE0,stroke:#000000,stroke-width:2px,shape:square
    style D fill:#FFFFE0,stroke:#000000,stroke-width:2px,shape:square
    style E fill:#FFFFE0,stroke:#000000,stroke-width:2px,shape:square
    style F fill:#FFFFE0,stroke:#000000,stroke-width:2px,shape:square
    style G fill:#FFFFE0,stroke:#000000,stroke-width:2px,shape:square
    style H fill:#FFD700,stroke:#000000,stroke-width:2px,shape:square
    style I fill:#FFD700,stroke:#000000,stroke-width:2px,shape:square
    style J fill:#FFD700,stroke:#000000,stroke-width:2px,shape:square
    style K fill:#FFD700,stroke:#000000,stroke-width:2px,shape:square
    style L fill:#FFD700,stroke:#000000,stroke-width:2px,shape:square

```

Each user journey is split into sections, these describe the part of the task
the user is trying to complete.

Tasks syntax is `Task name: <score>: <comma separated list of actors>`
