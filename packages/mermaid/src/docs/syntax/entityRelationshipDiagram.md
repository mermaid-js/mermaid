classDiagram
    ClienteParticular --|> ConsultarCatálogoDeProductos : usa
    ClienteParticular --|> RealizarPedido : usa
    ClienteParticular --|> RealizarPago : usa
    EmpresaCliente --|> ConsultarCatálogoDeProductos : usa
    EmpresaCliente --|> RealizarPedido : usa
    EmpresaCliente --|> RealizarPago : usa
    EmpresaSuministradora --|> GestionarÓrdenesDePedido : usa
    EmpresaDeMensajeríaExterna --|> CoordinarEnvío : usa
    GestionarÓrdenesDePedido <|-- ComplementarÓrdenesDePedido : se relaciona con
    GestionarÓrdenesDePedido <|-- MantenerHistorialDeÓrdenes : se relaciona con
    CoordinarEnvío <|-- RegistrarInformaciónDeEntrega : se relaciona con


| Selector                   | Description                                           |
| :------------------------- | :---------------------------------------------------- |
| `.er.attributeBoxEven`     | The box containing attributes on even-numbered rows   |
| `.er.attributeBoxOdd`      | The box containing attributes on odd-numbered rows    |
| `.er.entityBox`            | The box representing an entity                        |
| `.er.entityLabel`          | The label for an entity                               |
| `.er.relationshipLabel`    | The label for a relationship                          |
| `.er.relationshipLabelBox` | The box surrounding a relationship label              |
| `.er.relationshipLine`     | The line representing a relationship between entities |
