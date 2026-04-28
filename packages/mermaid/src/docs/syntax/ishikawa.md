# Ishikawa diagram (v11.12.3+)

Ishikawa diagrams are used to represent causes of a specific event (or a problem).
They are also known as fishbone diagrams, herringbone diagrams or cause-and-effect diagrams.
The diagram resembles a fish skeleton, with the main problem at the head and the causes branching off from the spine.

```warning
This is a new diagram type in Mermaid. Its syntax may evolve in future versions.
```

## Syntax

```mermaid
ishikawa-beta
   OSA
    Man
        Customer cancels orders / refuses delivery
    Machine
        Forecasting tools
        Customer stock data
        Routing tools
    Material
        Insufficient product availability
        Insufficient transportation capacity
        Incorrect system stock records
    Method
        Data Collection - KPI Measurement
            Incomplete data
            No clear KPI defined
        Inaccurate suggestion logic
            Insufficient input data
        Product quota limitation
        Non-optimized load consol.
        Transportation design
            Delivery frequency
            Volume per trip
    Measurement
        No clear KPI for OSA 
        No tracking of forecast accuracy
        No monitoring of replenishment performance
    Mother Nature
        Demand fluctuation
        Traffic causing delivery delays
        Fuel price changes

```

- The first line is the event (problem) of the diagram.
- Subsequent lines are causes of the event.
- "Fishbone" structure is indicated by indentation.
