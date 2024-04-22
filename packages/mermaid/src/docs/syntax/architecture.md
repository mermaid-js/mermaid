# Architecture Diagrams Documentation (v<MERMAID_RELEASE_VERSION>+)

> In the context of mermaid-js, the architecture diagram is used to show the relationship between services and resources commonly found within the Cloud or CI/CD deployments. In an architecture diagram, services (nodes) are connected by edges. Related services can be placed within groups to better illustrate how they are organized.

## Example

```mermaid-example
architecture
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(server)[Server] in api

    db L--R server
    disk1 T--B server
    disk2 T--B db
```

## Syntax

The building blocks of an architecture are `groups`, `services`, and `edges`. 

For supporting components, icons are declared by surrounding the icon name with `()`, while labels are declared by surrounding the text with `[]`.

To begin an architecture diagram, use the keyword `architecture`, followed by your groups, services, and edges. While each of the 3 building blocks can be declared in any order, care must be taken to ensure the identifier was previously declared by another component.

### Groups

The syntax for declaring a group is:
```
group {group id}({icon name})[{title}] (in {parent id})?
```

Put together:

```
group public_api(cloud)[Public API]
```

creates a group identified as `public_api`, uses the icon `cloud`, and has the label `Public API`.

Additionally, groups can be placed within a group using the optional `in` keyword

```
group private_api(cloud)[Private API] in public_api
```

### Services
The syntax for declaring a group is:
```
service {service id}({icon name})[{title}] (in {parent id})?
```

Put together:
```
service database(db)[Database]
```

creates the service identified as `database`, using the icon `db`, with the label `Database`.

If the service belongs to a group, it can be placed inside it through the optional `in` keyword

```
service database(db)[Database] in private_api
```

### Edges
TODO

## Configuration